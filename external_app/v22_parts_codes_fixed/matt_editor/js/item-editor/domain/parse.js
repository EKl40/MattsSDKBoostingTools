
        // Parse item code
        async function parseItemCode(sourceElementId = 'itemCodeInput') {
            const sourceElement = document.getElementById(sourceElementId);
            if (!sourceElement) {
                console.error('Source element not found:', sourceElementId);
                return;
            }
            
            let code = sourceElement.value ? sourceElement.value.trim() : sourceElement.textContent.trim();
            // Remove any leading/trailing whitespace and normalize line breaks
            code = code.replace(/\s+/g, ' ').trim();
            if (!code) {
                console.error('Validation error: Item code is required');
                showStatus('outputStatus', '⚠️ Please enter an item code', 'error');
                return;
            }

            // Check if input is a Base85 serial code (starts with @ and doesn't match item code format)
            const isBase85 = code.startsWith('@') && !code.match(/^\d+,\s*\d+,\s*\d+,\s*\d+\|/);
            if (isBase85) {
                console.log('Detected Base85 serial code, deserializing...');
                showStatus('outputStatus', '⏳ Deserializing Base85 code...', 'success');
                
                try {
                    const response = await fetch('https://save-editor.be/nicnl/api.php', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({
                            serial_b85: code
                        })
                    });

                    if (!response.ok) {
                        throw new Error(`HTTP error! status: ${response.status}`);
                    }

                    const data = await response.json();
                    
                    if (data.error) {
                        throw new Error(data.error);
                    }

                    if (data.deserialized) {
                        code = data.deserialized;
                        // Update the input field with the deserialized code
                        document.getElementById('itemCodeInput').value = code;
                        console.log('Deserialized code:', code);
                    } else {
                        throw new Error('No deserialized data in response');
                    }
                } catch (error) {
                    console.error('Error deserializing Base85 code:', error);
                    showStatus('outputStatus', `❌ Error deserializing: ${error.message}`, 'error');
                    return;
                }
            }

            try {
                // More flexible regex to handle various formats
                // Allow for optional firmware lock section "9, 1|" and buyback flag section "| 10, 1|"
                // and optional seed section "| 2, seed|"
                // Also handle cases where parts might be on multiple lines or have extra whitespace
                // Also handle optional skin customization at the end: | "c", 70|
                
                let typeId, level, seed, partsStr, firmwareLock = false;
                let buybackFlag = false; // Track if | 10, 1| buyback flag is present
                let skinCustomizationChar = '';
                let skinCustomizationValue = '';
                
                // Extract skin customization from the end if present: | "c", 70| or | "c", "Cosmetics_Weapon_Mat43_Snowfall"|
                // This appears after the parts section: {parts}| "c", value|
                // Try to match string value first: | "c", "Cosmetics_Weapon_Mat43_Snowfall"|
                let skinMatch = code.match(/\|\s*"([^"]+)",\s*"([^"]+)"\|\s*$/);
                if (skinMatch) {
                    skinCustomizationChar = skinMatch[1];
                    skinCustomizationValue = skinMatch[2]; // This is a string
                    // Remove skin customization from code for parsing
                    code = code.replace(/\|\s*"[^"]+",\s*"[^"]+"\|\s*$/, '|').trim();
                } else {
                    // Try to match numeric value: | "c", 70|
                    skinMatch = code.match(/\|\s*"([^"]+)",\s*(\d+)\|\s*$/);
                    if (skinMatch) {
                        skinCustomizationChar = skinMatch[1];
                        skinCustomizationValue = skinMatch[2]; // This is a number
                        // Remove skin customization from code for parsing
                        code = code.replace(/\|\s*"[^"]+",\s*\d+\|\s*$/, '|').trim();
                    }
                }
                
                let normalizedCode = code.replace(/\s+/g, ' ').trim();
                
                // Check for stringified format: "VLA_AR", 0, 1, 50| 2, 903|| {parts}|
                // Or: "VLA_AR", 0, 1, 50|| {parts}|
                let stringifiedMatch = normalizedCode.match(/^"([^"]+)",\s*(\d+),\s*(\d+),\s*(\d+)\|\s*2,\s*(\d+)\|\|\s*(.*?)\|?\s*$/);
                let stringifiedNoSeed = false;
                if (!stringifiedMatch) {
                    // Try without seed section
                    stringifiedMatch = normalizedCode.match(/^"([^"]+)",\s*(\d+),\s*(\d+),\s*(\d+)\|\|\s*(.*?)\|?\s*$/);
                    stringifiedNoSeed = true;
                }
                
                if (stringifiedMatch) {
                    const weaponTypeString = stringifiedMatch[1]; // e.g., "VLA_AR"
                    level = parseInt(stringifiedMatch[4]);
                    seed = stringifiedNoSeed ? 0 : parseInt(stringifiedMatch[5]);
                    partsStr = stringifiedNoSeed ? (stringifiedMatch[5] || '').trim() : (stringifiedMatch[6] || '').trim();
                    
                    // Look up typeId from weapon type string using ITEMS_DATABASE if available
                    // e.g., "VLA_AR" = Vladof Assault Rifle
                    let foundTypeId = null;
                    
                    // First, try to find the item in ITEMS_DATABASE
                    if (typeof ITEMS_DATABASE !== 'undefined' && ITEMS_DATABASE) {
                        const allItems = [
                            ...(ITEMS_DATABASE.weapons || []),
                            ...(ITEMS_DATABASE.shields || []),
                            ...(ITEMS_DATABASE.class_mods || []),
                            ...(ITEMS_DATABASE.grenades || []),
                            ...(ITEMS_DATABASE.enhancements || []),
                            ...(ITEMS_DATABASE.repkits || [])
                        ];
                        
                        const item = allItems.find(it => it && it.id && (it.id === weaponTypeString || it.id === weaponTypeString.toUpperCase() || it.id === weaponTypeString.toLowerCase()));
                        
                        if (item && item.id) {
                            // We found the item in ITEMS_DATABASE, now find its typeId
                            const manufacturer = item.manufacturer || '';
                            const weaponType = item.weaponType || '';
                            const itemType = item.type || '';
                            
                            // Map weapon type codes to full names for matching
                            const weaponTypeMap = {
                                'ar': 'assault rifle',
                                'smg': 'smg',
                                'ps': 'pistol',
                                'sr': 'sniper rifle',
                                'sg': 'shotgun',
                                'hw': 'heavy weapon'
                            };
                            
                            // Map manufacturer codes to full names
                            const manufacturerMap = {
                                'VLA': 'vladof', 'VLAD': 'vladof',
                                'JAK': 'jakobs', 'JAKOB': 'jakobs',
                                'MAL': 'maliwan',
                                'TED': 'tediore', 'TEDIOR': 'tediore',
                                'TOR': 'torgue', 'TORG': 'torgue',
                                'HYP': 'hyperion', 'HYPR': 'hyperion',
                                'DAD': 'daedalus', 'DAED': 'daedalus',
                                'ORD': 'order',
                                'RIP': 'ripper', 'BOR': 'ripper',
                                'DAL': 'dahl', 'DAH': 'dahl',
                                'ATL': 'atlas', 'ATLS': 'atlas',
                                'COA': 'coastal', 'COAST': 'coastal',
                                'PAN': 'pandoran', 'PAND': 'pandoran'
                            };
                            
                            const normalizedManufacturer = manufacturerMap[manufacturer.toUpperCase()] || manufacturer.toLowerCase();
                            const normalizedWeaponType = weaponTypeMap[weaponType.toLowerCase()] || weaponType.toLowerCase();
                            
                            // Search through typeIdMap to find matching typeId
                            for (const [tid, typeInfo] of typeIdMap.entries()) {
                                const typeCategory = (typeInfo.category || '').toLowerCase();
                                const typeManufacturer = (typeInfo.manufacturer || '').toLowerCase();
                                const typeName = (typeInfo.name || '').toLowerCase();
                                
                                // Match based on item type
                                if (itemType === 'weapon') {
                                    if (typeCategory.includes('weapon') || typeCategory.includes('heavy weapon')) {
                                        // Check manufacturer match
                                        if (typeManufacturer === normalizedManufacturer || 
                                            normalizedManufacturer === typeManufacturer ||
                                            (manufacturer && typeManufacturer.includes(manufacturer.toLowerCase())) ||
                                            (manufacturer && manufacturer.toLowerCase().includes(typeManufacturer))) {
                                            // Check weapon type match
                                            if (weaponType && (typeName.includes(normalizedWeaponType) || 
                                                               normalizedWeaponType.includes(typeName.split(' ')[0]) ||
                                                               typeName.includes(weaponType.toLowerCase()))) {
                                                foundTypeId = tid;
                                                break;
                                            }
                                        }
                                    }
                                } else if (itemType === 'shield') {
                                    if (typeCategory.includes('shield')) {
                                        if (typeManufacturer === normalizedManufacturer || 
                                            normalizedManufacturer === typeManufacturer ||
                                            (manufacturer && typeManufacturer.includes(manufacturer.toLowerCase())) ||
                                            (manufacturer && manufacturer.toLowerCase().includes(typeManufacturer))) {
                                            foundTypeId = tid;
                                            break;
                                        }
                                    }
                                } else if (itemType === 'class_mod') {
                                    if (typeCategory.includes('class mod') || (tid >= 254 && tid <= 259)) {
                                        // For class mods, match by item ID pattern (e.g., classmod_dark_siren -> 254)
                                        const classModMap = {
                                            'classmod_dark_siren': 254,
                                            'classmod_exo_soldier': 256,
                                            'classmod_gravitar': 259,
                                            'classmod_paladin': 255
                                        };
                                        if (item && item.id && classModMap[item.id.toLowerCase()]) {
                                            foundTypeId = classModMap[item.id.toLowerCase()];
                                            break;
                                        } else if (typeName.includes('class mod') || typeCategory.includes('class mod')) {
                                            foundTypeId = tid;
                                            break;
                                        }
                                    }
                                } else if (itemType === 'grenade') {
                                    if (typeCategory.includes('grenade') || typeCategory.includes('ordnance')) {
                                        if (typeManufacturer === normalizedManufacturer || 
                                            normalizedManufacturer === typeManufacturer ||
                                            (manufacturer && typeManufacturer.includes(manufacturer.toLowerCase())) ||
                                            (manufacturer && manufacturer.toLowerCase().includes(typeManufacturer))) {
                                            foundTypeId = tid;
                                            break;
                                        }
                                    }
                                } else if (itemType === 'enhancement') {
                                    if (typeCategory.includes('enhancement')) {
                                        if (typeManufacturer === normalizedManufacturer || 
                                            normalizedManufacturer === typeManufacturer ||
                                            (manufacturer && typeManufacturer.includes(manufacturer.toLowerCase())) ||
                                            (manufacturer && manufacturer.toLowerCase().includes(typeManufacturer))) {
                                            foundTypeId = tid;
                                            break;
                                        }
                                    }
                                } else if (itemType === 'repkit') {
                                    if (typeCategory.includes('repkit') || typeCategory.includes('rep kit')) {
                                        if (typeManufacturer === normalizedManufacturer || 
                                            normalizedManufacturer === typeManufacturer ||
                                            (manufacturer && typeManufacturer.includes(manufacturer.toLowerCase())) ||
                                            (manufacturer && manufacturer.toLowerCase().includes(typeManufacturer))) {
                                            foundTypeId = tid;
                                            break;
                                        }
                                    }
                                }
                            }
                        }
                    }
                    
                    // Fallback: If not found in ITEMS_DATABASE, try the original method
                    if (!foundTypeId) {
                        const parts = weaponTypeString.split('_');
                        if (parts.length >= 2) {
                            const manufacturerPrefix = parts[0].toUpperCase(); // VLA, JAK, etc.
                            const weaponTypeCode = parts.slice(1).join('_').toUpperCase(); // AR, SG, etc.
                            
                            // Map manufacturer prefixes to full names
                            const manufacturerMap = {
                                'VLA': 'Vladof', 'VLAD': 'Vladof',
                                'JAK': 'Jakobs', 'JAKOB': 'Jakobs',
                                'MAL': 'Maliwan',
                                'TED': 'Tediore', 'TEDIOR': 'Tediore',
                                'TOR': 'Torgue', 'TORG': 'Torgue',
                                'HYP': 'Hyperion', 'HYPR': 'Hyperion',
                                'DAD': 'Daedalus', 'DAED': 'Daedalus',
                                'ORD': 'Order',
                                'RIP': 'Ripper',
                                'DAL': 'Dahl', 'DAH': 'Dahl',
                                'ATL': 'Atlas', 'ATLS': 'Atlas',
                                'COA': 'Coastal', 'COAST': 'Coastal',
                                'PAN': 'Pandoran', 'PAND': 'Pandoran'
                            };
                            
                            // Map weapon type codes to full names
                            const weaponTypeMap = {
                                'AR': 'Assault Rifle',
                                'SG': 'SMG',
                                'PS': 'Pistol',
                                'SR': 'Sniper Rifle',
                                'SH': 'Shotgun',
                                'HW': 'Heavy Weapon',
                                'GR': 'Grenade',
                                'SHIELD': 'Shield',
                                'RK': 'Repkit'
                            };
                            
                            const manufacturer = manufacturerMap[manufacturerPrefix] || manufacturerPrefix;
                            const weaponType = weaponTypeMap[weaponTypeCode] || weaponTypeCode;
                            
                            // Search through typeIdMap to find matching typeId
                            for (const [tid, typeInfo] of typeIdMap.entries()) {
                                if (typeInfo.category === 'Weapon' && 
                                    typeInfo.manufacturer && 
                                    typeInfo.manufacturer.toLowerCase() === manufacturer.toLowerCase() &&
                                    typeInfo.name && 
                                    (typeInfo.name.toLowerCase().includes(weaponType.toLowerCase()) ||
                                     weaponType.toLowerCase().includes(typeInfo.name.toLowerCase()))) {
                                    foundTypeId = tid;
                                    break;
                                }
                            }
                        }
                    }
                    
                    if (foundTypeId) {
                        typeId = foundTypeId;
                        firmwareLock = false;
                        // Continue with normal processing - skip to parts parsing
                    } else {
                        throw new Error(`Could not find typeId for weapon type string: "${weaponTypeString}". Make sure ITEMS_DATABASE is loaded and the item exists.`);
                    }
                }
                
                if (!stringifiedMatch) {
                    // General parser for optional flag/seed sections:
                    // "typeId, 0, 1, level| 9, 1| 10, 1| 2, seed|| {parts}|"
                    // "typeId, 0, 1, level| 10, 1|| {parts}|"
                    // "typeId, 0, 1, level|| {parts}|"
                    const match = normalizedCode.match(/^(\d+),\s*(\d+),\s*(\d+),\s*(\d+)\|\s*(.*?)\|\|\s*(.*?)\|?\s*$/);
                    if (match) {
                        typeId = parseInt(match[1]);
                        level = parseInt(match[4]);
                        seed = 0;
                        partsStr = (match[6] || '').trim();
                        firmwareLock = false;
                        buybackFlag = false;

                        const flagsSegment = (match[5] || '').trim();
                        if (flagsSegment) {
                            const segments = flagsSegment.split('|').map(seg => seg.trim()).filter(Boolean);
                            segments.forEach(segment => {
                                const segmentMatch = segment.match(/^(\d+),\s*(\d+)$/);
                                if (!segmentMatch) {
                                    return;
                                }
                                const sectionId = parseInt(segmentMatch[1]);
                                const sectionValue = parseInt(segmentMatch[2]);
                                if (sectionId === 9 && sectionValue === 1) {
                                    firmwareLock = true;
                                } else if (sectionId === 10 && sectionValue === 1) {
                                    buybackFlag = true;
                                } else if (sectionId === 2) {
                                    seed = isNaN(sectionValue) ? 0 : sectionValue;
                                }
                            });
                        }
                    } else {
                        console.error('Failed to match item code format.');
                        console.error('Original code:', code);
                        console.error('Normalized code:', normalizedCode);
                        console.error('Code length:', code.length);
                        console.error('First 100 chars:', code.substring(0, 100));
                        // Try to provide more helpful error message
                        if (!normalizedCode.includes('||')) {
                            throw new Error(`Invalid item code format: Missing "||" separator. Expected format: "typeId, 0, 1, level| 2, seed|| {parts}|" or "typeId, 0, 1, level|| {parts}|"`);
                        } else if (!normalizedCode.includes('|')) {
                            throw new Error(`Invalid item code format: Missing "|" separator. Expected format: "typeId, 0, 1, level| 2, seed|| {parts}|" or "typeId, 0, 1, level|| {parts}|"`);
                        } else {
                            throw new Error(`Invalid item code format. Expected format: "typeId, 0, 1, level| 2, seed|| {parts}|" or "typeId, 0, 1, level|| {parts}|"`);
                        }
                    }
                }

                // Set manufacturer first based on type ID
                if (typeIdMap.has(typeId)) {
                    const typeInfo = typeIdMap.get(typeId);
                    const isClassMod = typeId >= 254 && typeId <= 259;
                    
                    // For class mods, always use "Class Mods" as manufacturer (characters are grouped)
                    let manufacturer = typeInfo.manufacturer || 'Class Mods';
                    if (isClassMod) {
                        manufacturer = 'Class Mods';
                    }
                    
                    const manufacturerSelect = document.getElementById('manufacturer');
                    const typeIdSelect = document.getElementById('typeId');
                    
                    // Set manufacturer value
                    manufacturerSelect.value = manufacturer;
                    
                    // Update dropdown to show typeIds for this manufacturer
                    if (window.updateTypeIdDropdown) {
                        window.updateTypeIdDropdown();
                    }
                    
                    // Set the typeId value - ensure it's a string to match option values
                    const typeIdStr = String(typeId);
                    typeIdSelect.value = typeIdStr;
                    
                    // Verify the value was set correctly - if not, the option might not exist
                    if (typeIdSelect.value !== typeIdStr) {
                        // Check if option exists in dropdown
                        const optionExists = Array.from(typeIdSelect.options).some(opt => opt.value === typeIdStr);
                        if (!optionExists) {
                            console.error(`TypeId ${typeId} not found in dropdown for manufacturer "${manufacturer}". Available options:`, 
                                Array.from(typeIdSelect.options).map(opt => `${opt.value} - ${opt.textContent}`));
                            console.error(`TypeIdsByManufacturer for "${manufacturer}":`, 
                                (window.typeIdsByManufacturer && window.typeIdsByManufacturer.get(manufacturer)) || 'Not found');
                        } else {
                            // Option exists but value didn't set - try setting again
                            typeIdSelect.value = typeIdStr;
                        }
                    }
                    
                    // Update guidelines based on category
                    updateGuidelines(typeInfo.category, typeId);
                }
                
                // Store the parsed Type ID for warning purposes
                parsedTypeId = typeId;
                
                // Store current values for change detection
                const typeIdSelect = document.getElementById('typeId');
                const manufacturerSelect = document.getElementById('manufacturer');
                typeIdSelect.dataset.previousValue = typeId;
                manufacturerSelect.dataset.previousValue = manufacturerSelect.value;
                document.getElementById('level').value = level;
                // Clamp seed to valid range (1-4096)
                let seedToUse = Math.max(1, Math.min(4096, seed || 1));
                
                // Check if replace seed on load is enabled
                const replaceSeedOnLoad = localStorage.getItem('replaceSeedOnLoad') === 'true';
                if (replaceSeedOnLoad) {
                    const permanentSeed = localStorage.getItem('permanentSeed');
                    if (permanentSeed) {
                        const permanentSeedValue = parseInt(permanentSeed);
                        if (!isNaN(permanentSeedValue) && permanentSeedValue >= 1 && permanentSeedValue <= 4096) {
                            seedToUse = permanentSeedValue;
                        }
                    }
                }
                
                document.getElementById('seed').value = seedToUse;
                const firmwareLockElement = document.getElementById('firmwareLock');
                firmwareLockElement.checked = firmwareLock;
                const buybackFlagElement = document.getElementById('buybackFlag');
                if (buybackFlagElement) {
                    buybackFlagElement.checked = buybackFlag;
                }
                // Set skin customization value - check if it's a string (skin name) or number
                const skinDropdown = document.getElementById('skinCustomizationDropdown');
                if (skinCustomizationValue) {
                    // Check if it's a known skin string (starts with "Cosmetics_Weapon_Mat" or "Cosmetics_Weapon_Shiny")
                    if (typeof skinCustomizationValue === 'string' && 
                        (skinCustomizationValue.startsWith('Cosmetics_Weapon_Mat') || 
                         skinCustomizationValue.startsWith('Cosmetics_Weapon_Shiny'))) {
                        // Set dropdown to the matching option
                        if (skinDropdown) {
                            skinDropdown.value = skinCustomizationValue;
                            document.getElementById('skinCustomizationValue').value = '';
                        }
                    } else {
                        // It's a numeric value, set the numeric input and clear dropdown
                        document.getElementById('skinCustomizationValue').value = skinCustomizationValue;
                        if (skinDropdown) {
                            skinDropdown.value = '';
                        }
                    }
                } else {
                    // Clear both
                    document.getElementById('skinCustomizationValue').value = '';
                    if (skinDropdown) {
                        skinDropdown.value = '';
                    }
                }

                currentParts = [];
                
                // Extract both {parts} and "string" parts, preserving original order
                // Need to handle nested brackets like {234:[31 3]} correctly
                const allMatches = [];
                
                // First, extract array parts (they contain brackets inside): {234:[31 3]}
                // This regex matches {typeId:[values]} where values can contain spaces
                const arrayPartRegex = /\{(\d+):\[([^\]]+)\]\}/g;
                let arrayMatch;
                const processedIndices = new Set();
                
                while ((arrayMatch = arrayPartRegex.exec(partsStr)) !== null) {
                    allMatches.push({
                        type: 'part',
                        content: arrayMatch[1] + ':[' + arrayMatch[2] + ']',
                        index: arrayMatch.index
                    });
                    // Mark this range as processed
                    for (let i = arrayMatch.index; i < arrayMatch.index + arrayMatch[0].length; i++) {
                        processedIndices.add(i);
                    }
                }
                
                // Then extract simple and typed parts: {222}, {9:55}
                // But skip positions we already processed (array parts)
                const simpleTypedRegex = /\{([^}]+)\}/g;
                let simpleTypedMatch;
                while ((simpleTypedMatch = simpleTypedRegex.exec(partsStr)) !== null) {
                    // Skip if this position was already processed as an array part
                    if (processedIndices.has(simpleTypedMatch.index)) {
                        continue;
                    }
                    // Check if it's an array part (has brackets) - should have been caught above, but double-check
                    if (simpleTypedMatch[1].includes('[') && simpleTypedMatch[1].includes(']')) {
                        continue; // Skip, already processed
                    }
                    allMatches.push({
                        type: 'part',
                        content: simpleTypedMatch[1],
                        index: simpleTypedMatch.index
                    });
                }
                
                // Finally, extract string parts: "string"
                const stringRegex = /"([^"]+)"/g;
                let stringMatch;
                while ((stringMatch = stringRegex.exec(partsStr)) !== null) {
                    allMatches.push({
                        type: 'string',
                        content: stringMatch[1],
                        index: stringMatch.index
                    });
                }
                
                // Sort by index to maintain order
                allMatches.sort((a, b) => a.index - b.index);
                
                // Rebuild currentParts in correct order
                currentParts = [];
                allMatches.forEach(m => {
                    if (m.type === 'part') {
                        currentParts.push(parsePart(m.content));
                    } else {
                        currentParts.push({
                            type: 'string',
                            value: m.content
                        });
                    }
                });

                renderParts(); // This will auto-generate code
                // Update guidelines after parts are parsed and rendered
                if (typeIdMap.has(typeId)) {
                    const typeInfo = typeIdMap.get(typeId);
                    updateGuidelines(typeInfo.category, typeId);
                }
                // Ensure serialization happens after code is fully generated
                setTimeout(() => {
                    const outputCode = getOutputCode().trim();
                    if (outputCode && outputCode !== 'Please select a Type ID first' && outputCode !== 'Generated code will appear here...') {
                        serializeCode(true);
                    }
                }, 300);
                showStatus('outputStatus', '✅ Item code parsed successfully!', 'success');
                // Clear any Type ID change warnings when parsing a new code
                const warningEl = document.getElementById('typeIdWarning');
                if (warningEl) {
                    warningEl.style.display = 'none';
                }
                
                // Update itemCodeInput to match if parsing from outputCode
                if (sourceElementId === 'outputCode') {
                    document.getElementById('itemCodeInput').value = code;
                }
            } catch (error) {
                console.error('Error parsing item code:', error);
                showStatus('outputStatus', '❌ Error parsing code: ' + error.message, 'error');
            } finally {
                // Reset the flag after parsing
                isUpdatingFromCode = false;
            }
        }
        
        // Set up auto-update listener for outputCode textarea
        function setupOutputCodeAutoUpdate() {
            const outputCodeEl = document.getElementById('outputCode');
            if (!outputCodeEl) return;
            
            // Only set up if it's a textarea
            if (outputCodeEl.tagName === 'TEXTAREA') {
                // Debounced input handler
                outputCodeEl.addEventListener('input', function() {
                    // Clear existing timeout
                    if (outputCodeUpdateTimeout) {
                        clearTimeout(outputCodeUpdateTimeout);
                    }
                    
                    // Set flag to prevent circular updates
                    isUpdatingFromCode = true;
                    
                    // Debounce the parsing (wait 500ms after user stops typing)
                    outputCodeUpdateTimeout = setTimeout(() => {
                        const code = getOutputCode().trim();
                        // Only parse if code is not empty and not placeholder text
                        if (code && 
                            code !== 'Generated code will appear here...' && 
                            code !== 'Please select a Type ID first' &&
                            code.length > 10) { // Minimum reasonable code length
                            parseItemCode('outputCode');
                        } else {
                            isUpdatingFromCode = false;
                        }
                    }, 500);
                });
                
                // Also handle paste events
                outputCodeEl.addEventListener('paste', function() {
                    // Clear existing timeout
                    if (outputCodeUpdateTimeout) {
                        clearTimeout(outputCodeUpdateTimeout);
                    }
                    
                    // Wait a bit for paste to complete
                    setTimeout(() => {
                        const code = getOutputCode().trim();
                        if (code && 
                            code !== 'Generated code will appear here...' && 
                            code !== 'Please select a Type ID first' &&
                            code.length > 10) {
                            isUpdatingFromCode = true;
                            parseItemCode('outputCode');
                        }
                    }, 100);
                });
            }
        }
        
        // Initialize auto-update when DOM is ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', setupOutputCodeAutoUpdate);
        } else {
            // DOM is already loaded
            setupOutputCodeAutoUpdate();
        }

        function parsePart(partStr) {
            const arrayMatch = partStr.match(/^(\d+):\[(.+)\]$/);
            if (arrayMatch) {
                return {
                    type: 'array',
                    typeId: parseInt(arrayMatch[1]),
                    values: arrayMatch[2].split(/\s+/).map(v => parseInt(v))
                };
            }

            const typeNumMatch = partStr.match(/^(\d+):(\d+)$/);
            if (typeNumMatch) {
                return {
                    type: 'typed',
                    typeId: parseInt(typeNumMatch[1]),
                    value: parseInt(typeNumMatch[2])
                };
            }

            return {
                type: 'simple',
                value: parseInt(partStr)
            };
        }

        // Store selected skill info for points selection
        let selectedSkillInfo = null;

        // Update part builder UI based on selected type
        // Quick Add Tab Switching
        function switchQuickAddTab(tab) {
            // Hide all content
            document.querySelectorAll('.quick-add-content').forEach(content => {
                content.classList.remove('active');
            });
            
            // Remove active from all tabs
            document.querySelectorAll('.quick-tab-btn').forEach(btn => {
                btn.classList.remove('active');
            });
            
            // Show selected content
            const content = document.getElementById(`quickAdd${tab.charAt(0).toUpperCase() + tab.slice(1)}`);
            const tabBtn = document.getElementById(`quickTab${tab.charAt(0).toUpperCase() + tab.slice(1)}`);
            
            if (content) {
                content.classList.add('active');
            }
            if (tabBtn) {
                tabBtn.classList.add('active');
            }
        }
        
        function updatePartBuilder() {
            const partTypeEl = document.getElementById('newPartType');
            if (!partTypeEl) return;

            const partType = partTypeEl.value;
            const typeIdRow = document.getElementById('newPartTypeIdRow');
            const valueRow = document.getElementById('newPartValueRow');
            const arrayRow = document.getElementById('newPartArrayRow');
            const skillPointsRow = document.getElementById('newPartSkillPointsRow');
            const valueLabel = document.getElementById('newPartValueLabel');
            const browseBtn = document.getElementById('newPartBrowseBtn');

            // Check if we have a selected skill
            const hasSelectedSkill = selectedSkillInfo && selectedSkillInfo.skillIds && Object.keys(selectedSkillInfo.skillIds).length > 0;
            
            if (partType === 'simple') {
                if (typeIdRow) typeIdRow.style.display = 'none';
                if (valueRow) valueRow.style.display = hasSelectedSkill ? 'none' : 'flex';
                if (arrayRow) arrayRow.style.display = 'none';
                if (skillPointsRow) skillPointsRow.style.display = hasSelectedSkill ? 'flex' : 'none';
                if (valueLabel) valueLabel.textContent = 'Part ID:';
                if (browseBtn) browseBtn.style.display = 'inline-flex';
                
                // If skill is selected, update value based on points
                if (hasSelectedSkill) {
                    const spEl = document.getElementById('newPartSkillPoints');
                    const points = spEl ? (parseInt(spEl.value, 10) || 1) : 1;
                    const tierKey = `tier_${points}`;
                    const tierData = selectedSkillInfo.skillIds[tierKey];
                    const valEl = document.getElementById('newPartValue');
                    if (tierData && tierData.id && valEl) {
                        valEl.value = tierData.id;
                    }
                }
            } else if (partType === 'typed') {
                if (typeIdRow) typeIdRow.style.display = 'flex';
                if (valueRow) valueRow.style.display = hasSelectedSkill ? 'none' : 'flex';
                if (arrayRow) arrayRow.style.display = 'none';
                if (skillPointsRow) skillPointsRow.style.display = hasSelectedSkill ? 'flex' : 'none';
                if (valueLabel) valueLabel.textContent = 'Part Number:';
                if (browseBtn) browseBtn.style.display = 'inline-flex';
                
                // If skill is selected, update value based on points
                if (hasSelectedSkill) {
                    const spEl = document.getElementById('newPartSkillPoints');
                    const points = spEl ? (parseInt(spEl.value, 10) || 1) : 1;
                    const tierKey = `tier_${points}`;
                    const tierData = selectedSkillInfo.skillIds[tierKey];
                    const valEl = document.getElementById('newPartValue');
                    if (tierData && tierData.id && valEl) {
                        valEl.value = tierData.id;
                    }
                }
            } else if (partType === 'array') {
                if (typeIdRow) typeIdRow.style.display = 'flex';
                if (valueRow) valueRow.style.display = 'none';
                if (arrayRow) arrayRow.style.display = 'flex';
                if (skillPointsRow) skillPointsRow.style.display = 'none';
                if (browseBtn) browseBtn.style.display = 'none';
            }
            
            // Clear selected skill when part type changes
            if (!hasSelectedSkill) {
                selectedSkillInfo = null;
            }

            updatePartBuilderPreview();
        }
