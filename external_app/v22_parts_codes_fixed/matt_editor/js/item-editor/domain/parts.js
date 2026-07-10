        // Update preview of what will be added
        function updatePartBuilderPreview() {
            const partTypeEl = document.getElementById('newPartType');
            const preview = document.getElementById('newPartPreview');
            if (!partTypeEl || !preview) return;

            const partType = partTypeEl.value;
            let previewText = '';
            
            // Check if we have a selected skill
            const hasSelectedSkill = selectedSkillInfo && selectedSkillInfo.skillIds && Object.keys(selectedSkillInfo.skillIds).length > 0;
            
            if (partType === 'simple') {
                if (hasSelectedSkill) {
                    const spEl = document.getElementById('newPartSkillPoints');
                    const points = spEl ? (parseInt(spEl.value, 10) || 1) : 1;
                    const tierKey = `tier_${points}`;
                    const tierData = selectedSkillInfo.skillIds[tierKey];
                    if (tierData && tierData.id) {
                        const value = tierData.id;
                        previewText = `Will add: <strong>{${value}}</strong>`;
                        previewText += `<br><small>${selectedSkillInfo.name} - ${points} Point${points > 1 ? 's' : ''} (${tierData.branch || ''})</small>`;
                    }
                } else {
                    const valEl = document.getElementById('newPartValue');
                    const value = valEl ? valEl.value : '';
                    previewText = `Will add: <strong>{${value || 0}}</strong>`;
                    const partInfo = getPartInfo({ type: 'simple', value: parseInt(value, 10) || 0 });
                    if (partInfo) {
                        previewText += `<br><small>${partInfo.name} - ${partInfo.stats || 'No stats'}</small>`;
                    }
                }
            } else if (partType === 'typed') {
                if (hasSelectedSkill) {
                    const tidEl = document.getElementById('newPartTypeId');
                    const spEl = document.getElementById('newPartSkillPoints');
                    const typeId = tidEl ? tidEl.value : '';
                    const points = spEl ? (parseInt(spEl.value, 10) || 1) : 1;
                    const tierKey = `tier_${points}`;
                    const tierData = selectedSkillInfo.skillIds[tierKey];
                    if (tierData && tierData.id && typeId && typeId !== '0') {
                        const value = tierData.id;
                        previewText = `Will add: <strong>{${typeId}:${value}}</strong>`;
                        previewText += `<br><small>${selectedSkillInfo.name} - ${points} Point${points > 1 ? 's' : ''} (${tierData.branch || ''})</small>`;
                    }
                } else {
                    const tidEl = document.getElementById('newPartTypeId');
                    const valEl = document.getElementById('newPartValue');
                    const typeId = tidEl ? tidEl.value : '';
                    const value = valEl ? valEl.value : '';
                    if (typeId && typeId !== '0') {
                        previewText = `Will add: <strong>{${typeId}:${value || 0}}</strong>`;
                        const partInfo = getPartInfo({ type: 'typed', typeId: parseInt(typeId, 10), value: parseInt(value, 10) || 0 });
                        if (partInfo) {
                            previewText += `<br><small>${partInfo.name} - ${partInfo.stats || 'No stats'}</small>`;
                        }
                    } else {
                        previewText = `Will add: <strong>{TypeID:${value || 0}}</strong> (select Type ID first)`;
                    }
                }
            } else if (partType === 'array') {
                const tidEl = document.getElementById('newPartTypeId');
                const arrEl = document.getElementById('newPartArrayValues');
                const typeId = tidEl ? tidEl.value : '';
                const values = arrEl ? arrEl.value : '';
                if (typeId && typeId !== '0' && values) {
                    const valueArray = values.split(/\s+/).filter(v => v);
                    previewText = `Will add: <strong>{${typeId}:[${valueArray.join(' ')}]}</strong>`;
                    previewText += `<br><small>Array with ${valueArray.length} values</small>`;
                } else {
                    previewText = `Will add: <strong>{TypeID:[values]}</strong> (configure Type ID and values)`;
                }
            }

            if (previewText) {
                preview.innerHTML = previewText;
                preview.style.display = 'block';
            } else {
                preview.style.display = 'none';
            }
        }

        // Show browser for new part
        function showNewPartBrowser() {
            const partType = document.getElementById('newPartType').value;
            let typeId = null;
            
            if (partType === 'typed') {
                // For typed parts, use the Type ID from the part builder
                const builderTypeId = parseInt(document.getElementById('newPartTypeId').value);
                if (builderTypeId && builderTypeId !== 0) {
                    typeId = builderTypeId;
                }
            } else if (partType === 'simple') {
                // For simple parts, use the main form's Type ID as context
                const mainTypeId = parseInt(document.getElementById('typeId').value);
                if (mainTypeId) {
                    typeId = mainTypeId;
                }
            }
            
            // Create a temporary browser element
            const tempIndex = -1; // Use -1 as a special index for the builder
            showPartBrowser(tempIndex, partType, typeId);
        }

        // Add the configured part
        function addConfiguredPart() {
            const partType = document.getElementById('newPartType').value;
            const hasSelectedSkill = selectedSkillInfo && selectedSkillInfo.skillIds && Object.keys(selectedSkillInfo.skillIds).length > 0;
            
            // If a skill is selected, add all tier parts from 1 to selected points
            if (hasSelectedSkill) {
                const points = parseInt(document.getElementById('newPartSkillPoints').value) || 1;
                const partType = document.getElementById('newPartType').value;
                
                // Add parts for each tier from 1 to selected points
                for (let i = 1; i <= points; i++) {
                    const tierKey = `tier_${i}`;
                    const tierData = selectedSkillInfo.skillIds[tierKey];
                    if (tierData && tierData.id) {
                        // Extract numeric part ID if tierData.id contains a colon (e.g., "234:123" -> 123)
                        let skillPartId = tierData.id;
                        if (typeof skillPartId === 'string' && skillPartId.includes(':')) {
                            const parts = skillPartId.split(':');
                            skillPartId = parseInt(parts[parts.length - 1]); // Get the last part after colon
                        } else {
                            skillPartId = parseInt(skillPartId);
                        }
                        
                        if (isNaN(skillPartId) || skillPartId === 0) {
                            console.error('Invalid skill part ID:', tierData.id);
                            continue;
                        }
                        
                        if (partType === 'simple') {
                            const newPart = { type: 'simple', value: skillPartId };
                            currentParts.push(newPart);
                        } else if (partType === 'typed') {
                            const typeId = parseInt(document.getElementById('newPartTypeId').value) || selectedSkillInfo.typeId;
                            if (typeId && typeId !== 0) {
                                const newPart = { type: 'typed', typeId: typeId, value: skillPartId };
                                currentParts.push(newPart);
                            }
                        }
                    }
                }
                
                // Clear selected skill after adding
                selectedSkillInfo = null;
                document.getElementById('newPartSkillPointsRow').style.display = 'none';
                document.getElementById('newPartValueRow').style.display = 'flex';
                
                // Reset form
                document.getElementById('newPartValue').value = '0';
                if (partType === 'typed') {
                    document.getElementById('newPartTypeId').value = '0';
                }
                
                renderParts();
                updatePartBuilder();
                showStatus('partBuilderStatus', `✅ Added ${points} skill point${points > 1 ? 's' : ''}`, 'success');
                return;
            }
            
            let newPart = {};

            if (partType === 'simple') {
                const value = parseInt(document.getElementById('newPartValue').value);
                if (!value || value === 0) {
                    console.error('Validation error: Part value cannot be 0');
                    showStatus('partBuilderStatus', '⚠️ Part value cannot be 0', 'error');
                    return;
                }
                newPart = { type: 'simple', value: value };
            } else if (partType === 'typed') {
                const typeId = parseInt(document.getElementById('newPartTypeId').value);
                const value = parseInt(document.getElementById('newPartValue').value);
                if (!typeId || typeId === 0) {
                    console.error('Validation error: Type ID required for {#:#} parts');
                    showStatus('partBuilderStatus', '⚠️ Please select a Type ID for {#:#} - Cross-Manufacturer Part', 'error');
                    return;
                }
                if (!value || value === 0) {
                    console.error('Validation error: Part value cannot be 0');
                    showStatus('partBuilderStatus', '⚠️ Part value cannot be 0', 'error');
                    return;
                }
                newPart = { type: 'typed', typeId: typeId, value: value };
            } else if (partType === 'array') {
                const typeId = parseInt(document.getElementById('newPartTypeId').value);
                const valuesStr = document.getElementById('newPartArrayValues').value;
                if (!typeId || typeId === 0) {
                    console.error('Validation error: Type ID required for {#:[# # #]} parts');
                    showStatus('partBuilderStatus', '⚠️ Please select a Type ID for {#:[# # #]} - Array of Parts', 'error');
                    return;
                }
                if (!valuesStr.trim()) {
                    console.error('Validation error: Array values required');
                    showStatus('partBuilderStatus', '⚠️ Please enter array values', 'error');
                    return;
                }
                const values = valuesStr.split(/\s+/).map(v => parseInt(v)).filter(v => !isNaN(v) && v !== 0);
                if (values.length === 0) {
                    console.error('Validation error: Array must contain at least one non-zero value');
                    showStatus('partBuilderStatus', '⚠️ Array must contain at least one non-zero value', 'error');
                    return;
                }
                newPart = { type: 'array', typeId: typeId, values: values };
            }
            
            // Clear any previous errors when successfully adding
            const partBuilderStatus = document.getElementById('partBuilderStatus');
            if (partBuilderStatus) {
                partBuilderStatus.style.display = 'none';
            }

            // Check if this is a rarity part - if so, remove all existing rarity parts first
            const isRarity = isRarityPart(newPart);
            if (isRarity) {
                // Remove all existing rarity parts
                currentParts = currentParts.filter(p => !isRarityPart(p));
            }

            // For enhancements, rarity should be the first {#} in the serial
            const currentTypeId = parseInt(document.getElementById('typeId').value);
            if (isRarity && isEnhancementTypeId(currentTypeId)) {
                // Add rarity at the beginning for enhancements
                currentParts.unshift(newPart);
            } else {
                // Add other parts at the end (normal behavior)
                currentParts.push(newPart);
            }
            renderParts();
            updateGuidelinesChecklist(); // Update checklist when part is added
            
            // Reset builder
            document.getElementById('newPartType').value = 'simple';
            document.getElementById('newPartValue').value = '0';
            document.getElementById('newPartTypeId').value = '0';
            document.getElementById('newPartArrayValues').value = '';
            updatePartBuilder();
            
            // Scroll to the newly added part
            setTimeout(() => {
                // For enhancements with rarity, part is at index 0, otherwise at the end
                const newPartIndex = (isRarity && isEnhancementTypeId(currentTypeId)) ? 0 : currentParts.length - 1;
                const newPartElement = document.querySelector(`[data-part-index="${newPartIndex}"]`);
                if (newPartElement) {
                    // If in grouped view, expand the group if collapsed
                    if (viewMode === 'grouped') {
                        const group = newPartElement.closest('.part-group');
                        if (group) {
                            const groupContent = group.querySelector('.part-group-content');
                            const groupHeader = group.querySelector('.part-group-header');
                            if (groupContent && groupContent.classList.contains('collapsed')) {
                                // Expand the group
                                groupContent.classList.remove('collapsed');
                                const arrow = groupHeader.querySelector('span:last-child');
                                if (arrow) arrow.textContent = '▼';
                            }
                        }
                    }
                    
                    // Scroll to the part
                    newPartElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    
                    // Highlight it briefly
                    newPartElement.style.borderColor = 'rgba(79, 195, 247, 0.8)';
                    newPartElement.style.boxShadow = '0 0 20px rgba(79, 195, 247, 0.5)';
                    setTimeout(() => {
                        newPartElement.style.borderColor = '';
                        newPartElement.style.boxShadow = '';
                    }, 2000);
                }
            }, 100);
        }

        function addManualParts() {
            const codesText = document.getElementById('manualPartCodes').value.trim();
            if (!codesText) {
                showStatus('manualPartsStatus', '⚠️ Please enter part codes', 'error');
                return;
            }

            // Extract all part codes from the text
            // Match patterns: {#}, {#:#}, {#:[# # #]}
            const partCodeRegex = /\{([^}]+)\}/g;
            const matches = [];
            let match;
            
            while ((match = partCodeRegex.exec(codesText)) !== null) {
                matches.push(match[1]); // Extract content inside braces
            }

            if (matches.length === 0) {
                showStatus('manualPartsStatus', '⚠️ No valid part codes found. Use format: {#}, {#:#}, or {#:[# # #]}', 'error');
                return;
            }

            const addedParts = [];
            const errors = [];

            // Parse each code and add to currentParts
            for (let i = 0; i < matches.length; i++) {
                const partStr = matches[i].trim();
                if (!partStr) continue;

                try {
                    const parsedPart = parsePart(partStr);
                    
                    // Validate the parsed part
                    if (parsedPart.type === 'simple') {
                        if (!parsedPart.value || parsedPart.value === 0) {
                            errors.push(`Code {${partStr}}: Part value cannot be 0`);
                            continue;
                        }
                    } else if (parsedPart.type === 'typed') {
                        if (!parsedPart.typeId || parsedPart.typeId === 0) {
                            errors.push(`Code {${partStr}}: Type ID cannot be 0`);
                            continue;
                        }
                        if (!parsedPart.value || parsedPart.value === 0) {
                            errors.push(`Code {${partStr}}: Part value cannot be 0`);
                            continue;
                        }
                    } else if (parsedPart.type === 'array') {
                        if (!parsedPart.typeId || parsedPart.typeId === 0) {
                            errors.push(`Code {${partStr}}: Type ID cannot be 0`);
                            continue;
                        }
                        if (!parsedPart.values || parsedPart.values.length === 0) {
                            errors.push(`Code {${partStr}}: Array must contain at least one value`);
                            continue;
                        }
                        // Filter out zero values
                        parsedPart.values = parsedPart.values.filter(v => v !== 0 && !isNaN(v));
                        if (parsedPart.values.length === 0) {
                            errors.push(`Code {${partStr}}: Array must contain at least one non-zero value`);
                            continue;
                        }
                    }

                    currentParts.push(parsedPart);
                    addedParts.push(`{${partStr}}`);
                } catch (error) {
                    errors.push(`Code {${partStr}}: ${error.message}`);
                }
            }

            // Show results
            if (addedParts.length > 0) {
                renderParts();
                updateGuidelinesChecklist();
                generateCode();
                
                // Clear the input
                document.getElementById('manualPartCodes').value = '';
                
                // Show success message
                let message = `✅ Added ${addedParts.length} part${addedParts.length > 1 ? 's' : ''}`;
                if (errors.length > 0) {
                    message += ` (${errors.length} error${errors.length > 1 ? 's' : ''})`;
                }
                showStatus('manualPartsStatus', message, errors.length > 0 ? 'warning' : 'success');
                
                // If there are errors, log them
                if (errors.length > 0 && DEBUG) {
                    console.warn('Errors adding manual parts:', errors);
                }
            } else {
                // All codes failed
                showStatus('manualPartsStatus', `❌ Failed to add parts. ${errors.join('; ')}`, 'error');
            }
        }

        function removePart(index) {
            currentParts.splice(index, 1);
            renderParts();
            updateGuidelinesChecklist(); // Update checklist when part is removed
        }

        function updatePart(index, field, value) {
            const part = currentParts[index];
            if (field === 'type') {
                part.type = value;
                if (value === 'array') {
                    part.typeId = 0;
                    part.values = [0];
                } else if (value === 'typed') {
                    part.typeId = 0;
                    part.value = 0;
                } else if (value === 'string') {
                    part.value = '';
                } else {
                    part.value = 0;
                }
            } else if (field === 'typeId') {
                part.typeId = parseInt(value) || 0;
            } else if (field === 'value') {
                if (part.type === 'string') {
                    part.value = String(value || '');
                } else {
                    part.value = parseInt(value) || 0;
                }
            } else if (field === 'arrayValues') {
                part.values = value.split(/\s+/).map(v => parseInt(v) || 0).filter(v => !isNaN(v));
            }
            renderParts(); // This will auto-generate code
        }

        // Helper function to check if a typeId is an enhancement
        function isEnhancementTypeId(typeId) {
            // All enhancement typeIds: 247 (Universal), 264 (Hyperion), 268 (Jakobs), 271 (Maliwan),
            // 281 (Order), 284 (Atlas), 286 (CoV), 292 (Tediore), 296 (Ripper), 299 (Daedalus),
            // 303 (Torgue), 310 (Vladof)
            const enhancementTypeIds = [247, 264, 268, 271, 281, 284, 286, 292, 296, 299, 303, 310];
            return enhancementTypeIds.includes(typeId);
        }

        // Helper function to enhance part info if it's a manufacturer perk for enhancements
        function enhanceManufacturerPerk(partInfo, partId, currentTypeId) {
            if (!partInfo || !isEnhancementTypeId(currentTypeId)) return partInfo;
            
            const legendaryPerkValue = parseInt(partId);
            if (isNaN(legendaryPerkValue) || (legendaryPerkValue !== 1 && legendaryPerkValue !== 2 && legendaryPerkValue !== 3 && legendaryPerkValue !== 9)) {
                return partInfo;
            }
            
            const partString = String(partInfo.string || '').toLowerCase();
            const partName = String(partInfo.name || '').toLowerCase();
            const partSpawnCode = String(partInfo.spawnCode || '').toLowerCase();
            
            if (partString.includes('part_core') || partName.includes('part_core') || String(partSpawnCode).includes('part_core')) {
                return {
                    ...partInfo,
                    partType: partInfo.partType || 'Manufacturer Perk',
                    name: partInfo.name || `Manufacturer Perk: ${partId}`
                };
            }
            
            return partInfo;
        }

        function getPartInfo(part, partIndex = null) {
            if (part.type === 'typed') {
                // For typed parts, use the part's own typeId, not the current item's typeId
                const partId = String(part.value);
                const partTypeId = part.typeId;
                const fullId = `${partTypeId}:${partId}`;
                const currentTypeId = parseInt(document.getElementById('typeId').value);
                
                // Special handling for Enhancement Manufacturer Perks
                // For enhancements, typed parts like {enhancementID:1}, {enhancementID:2}, {enhancementID:3}, {enhancementID:9} are Manufacturer Perks
                // These correspond to part_core parts in the database
                if (isEnhancementTypeId(currentTypeId) && partTypeId === currentTypeId) {
                    const legendaryPerkValue = parseInt(partId);
                    if (!isNaN(legendaryPerkValue) && (legendaryPerkValue === 1 || legendaryPerkValue === 2 || legendaryPerkValue === 3 || legendaryPerkValue === 9)) {
                        // Try to find the actual part info first - search for parts with part_core in their string/name
                        let found = partsMap.get(fullId);
                        if (found && found.typeId === partTypeId) {
                            // Check if this part has part_core in its identifier
                            const hasPartCore = (found.string && String(found.string).includes('part_core')) || 
                                               (found.name && found.name.includes('part_core'));
                            if (hasPartCore) {
                                return {
                                    ...found,
                                    partType: found.partType || 'Manufacturer Perk',
                                    name: found.name || `Manufacturer Perk: ${partId}`
                                };
                            }
                        }
                        
                        // Search in partsByTypeId for parts with part_core that match this partId
                        const typeParts = partsByTypeId.get(partTypeId) || [];
                        for (const partInfo of typeParts) {
                            const infoId = String(partInfo.id);
                            const infoFullId = String(partInfo.fullId || '');
                            const partString = String(partInfo.string || '').toLowerCase();
                            const partName = String(partInfo.name || '').toLowerCase();
                            
                            // Check if this part matches the ID and has part_core
                            if ((infoId === partId || infoFullId === fullId || 
                                 (infoFullId.includes(':') && infoFullId.split(':')[1] === partId)) &&
                                (partString.includes('part_core') || partName.includes('part_core'))) {
                                return {
                                    ...partInfo,
                                    partType: partInfo.partType || 'Manufacturer Perk',
                                    name: partInfo.name || `Manufacturer Perk: ${partId}`
                                };
                            }
                        }
                        
                        // If not found, return synthetic part info for Manufacturer Perk
                        return {
                            id: partId,
                            fullId: fullId,
                            name: `Manufacturer Perk: ${partId}`,
                            typeId: partTypeId,
                            partType: 'Manufacturer Perk',
                            type: 'Manufacturer Perk'
                        };
                    }
                }
                
                // Try exact fullId match first
                let found = partsMap.get(fullId);
                if (found && found.typeId === partTypeId) {
                    return enhanceManufacturerPerk(found, partId, currentTypeId);
                }
                
                // Also try looking up by just the numeric partId
                found = partsMap.get(partId);
                if (found && found.typeId === partTypeId) {
                    return enhanceManufacturerPerk(found, partId, currentTypeId);
                }
                
                // Try numeric lookup
                const numericPartId = parseInt(partId);
                if (!isNaN(numericPartId)) {
                    found = partsMap.get(numericPartId);
                    if (found && found.typeId === partTypeId) {
                        return enhanceManufacturerPerk(found, partId, currentTypeId);
                    }
                }
                
                // If not found in partsMap, try using id_index for optimized lookup
                if (globalIdIndex && gameData) {
                    const indexedPart = getPartFromIndex(partTypeId, partId, globalIdIndex, gameData);
                    if (indexedPart && indexedPart.part) {
                        // Extract part info from the indexed part
                        const extractedInfo = extractPartInfo(
                            indexedPart.part, 
                            partTypeId, 
                            '', 
                            '', 
                            '', 
                            '', 
                            ''
                        );
                        if (extractedInfo) {
                            extractedInfo.path = indexedPart.path; // Add path from index
                            partsMap.set(fullId, extractedInfo); // Cache it for future lookups
                            partsMap.set(partId, extractedInfo);
                            if (extractedInfo.spawnCode) {
                                partsMap.set(extractedInfo.spawnCode, extractedInfo);
                            }
                            return enhanceManufacturerPerk(extractedInfo, partId, currentTypeId);
                        }
                    }
                }
                
                // Search in partsByTypeId for this specific type
                const typeParts = partsByTypeId.get(partTypeId) || [];
                for (const partInfo of typeParts) {
                    const infoId = String(partInfo.id);
                    const infoFullId = String(partInfo.fullId || '');
                    
                    // Match if:
                    // 1. fullId exactly matches (e.g., "234:1")
                    // 2. fullId ends with :partId and starts with typeId: (e.g., "234:1" for partId "1")
                    // 3. id matches AND typeId matches (for parts where id is just the number)
                    const fullIdMatches = infoFullId === fullId;
                    const fullIdEndsWithPartId = infoFullId.includes(':') && 
                                                infoFullId.startsWith(`${partTypeId}:`) && 
                                                infoFullId.split(':')[1] === partId;
                    const idMatches = infoId === partId && partInfo.typeId === partTypeId;
                    const idIsFullId = infoId === fullId;
                    const idEndsWithPartId = infoId.includes(':') && 
                                            infoId.startsWith(`${partTypeId}:`) && 
                                            infoId.split(':')[1] === partId;
                    
                    if (fullIdMatches || fullIdEndsWithPartId || idMatches || idIsFullId || idEndsWithPartId) {
                        return enhanceManufacturerPerk(partInfo, partId, currentTypeId);
                    }
                }
                
                // For typeId 234, also try searching by extracting the numeric part from fullId
                // (This is a fallback if the above search didn't find it)
                if (partTypeId === 234) {
                    const typeParts234 = partsByTypeId.get(234) || [];
                    for (const partInfo of typeParts234) {
                        const infoFullId = String(partInfo.fullId || '');
                        // Check if fullId is in format "typeId:value" and value matches
                        if (infoFullId.includes(':')) {
                            const [infoTypeId, infoValue] = infoFullId.split(':');
                            if (parseInt(infoTypeId) === 234 && infoValue === partId) {
                                return enhanceManufacturerPerk(partInfo, partId, currentTypeId);
                            }
                        }
                        // Also check if id is in format "typeId:value"
                        const infoId = String(partInfo.id || '');
                        if (infoId.includes(':')) {
                            const [infoTypeId, infoValue] = infoId.split(':');
                            if (parseInt(infoTypeId) === 234 && infoValue === partId) {
                                return enhanceManufacturerPerk(partInfo, partId, currentTypeId);
                            }
                        }
                    }
                }
                
                // Return null if not found (will be handled by fallback logic)
                return null;
            }
            
            if (part.type === 'simple') {
                const partId = String(part.value);
                const currentTypeId = parseInt(document.getElementById('typeId').value);
                
                // Special handling for Enhancement rarity
                // For all enhancements, the first simple part (4-8) represents the enhancement rarity
                if (isEnhancementTypeId(currentTypeId)) {
                    const rarityValue = parseInt(part.value);
                    if (!isNaN(rarityValue) && rarityValue >= 4 && rarityValue <= 8) {
                        // Find the first simple part in the parts list
                        const firstSimplePartIndex = currentParts.findIndex(p => p.type === 'simple');
                        // Check if this part is the first simple part
                        // Use partIndex if provided, otherwise find by comparing the part object
                        let currentPartIndex = partIndex;
                        if (currentPartIndex === null || currentPartIndex === undefined) {
                            // Try to find by reference first
                            currentPartIndex = currentParts.indexOf(part);
                            // If not found by reference, try to find by value match
                            if (currentPartIndex === -1) {
                                currentPartIndex = currentParts.findIndex(p => 
                                    p.type === part.type && 
                                    p.value === part.value &&
                                    (part.type !== 'typed' || (p.typeId === part.typeId)) &&
                                    (part.type !== 'array' || (p.typeId === part.typeId && JSON.stringify(p.values) === JSON.stringify(part.values)))
                                );
                            }
                        }
                        
                        // If this is the first simple part, return rarity info
                        if (firstSimplePartIndex >= 0 && currentPartIndex === firstSimplePartIndex) {
                            // Map rarity value to rarity name (4-8 for enhancements)
                            const rarityMap = {
                                4: 'Common',
                                5: 'Uncommon',
                                6: 'Rare',
                                7: 'Epic',
                                8: 'Legendary'
                            };
                            const rarityName = rarityMap[rarityValue];
                            if (rarityName) {
                                // Return synthetic part info for enhancement rarity
                                return {
                                    id: partId,
                                    fullId: `${currentTypeId}:${partId}`,
                                    name: `Enhancement Rarity: ${rarityName}`,
                                    typeId: currentTypeId,
                                    rarity: rarityName,
                                    partType: 'Rarity',
                                    type: 'Rarity Level'
                                };
                            }
                        }
                    }
                    
                    // Special handling for Enhancement Manufacturer Perks
                    // For enhancements, parts {1}, {2}, {3}, {9} (or {enhancementID:1}, etc.) are Manufacturer Perks
                    // These correspond to part_core parts in the database
                    const legendaryPerkValue = parseInt(part.value);
                    if (!isNaN(legendaryPerkValue) && (legendaryPerkValue === 1 || legendaryPerkValue === 2 || legendaryPerkValue === 3 || legendaryPerkValue === 9)) {
                        // Search in partsByTypeId for parts with part_core that match this partId
                        const typeParts = partsByTypeId.get(currentTypeId) || [];
                        for (const partInfo of typeParts) {
                            const infoId = String(partInfo.id);
                            const infoFullId = String(partInfo.fullId || '');
                            const partString = String(partInfo.string || '').toLowerCase();
                            const partName = String(partInfo.name || '').toLowerCase();
                            const partSpawnCode = String(partInfo.spawnCode || '').toLowerCase();
                            
                            // Extract numeric ID from various formats
                            let numericPartId = null;
                            if (infoId.includes(':')) {
                                const parts = infoId.split(':');
                                if (parts.length === 2) {
                                    numericPartId = parts[1];
                                }
                            } else {
                                numericPartId = infoId;
                            }
                            
                            // Check if this part matches the ID and has part_core in any field
                            const matchesId = (infoId === partId || infoFullId === `${currentTypeId}:${partId}` || 
                                             numericPartId === partId ||
                                             (infoFullId.includes(':') && infoFullId.split(':')[1] === partId));
                            const hasPartCore = partString.includes('part_core') || 
                                              partName.includes('part_core') ||
                                              String(partSpawnCode).includes('part_core');
                            
                            if (matchesId && hasPartCore) {
                                return {
                                    ...partInfo,
                                    partType: partInfo.partType || 'Manufacturer Perk',
                                    name: partInfo.name || `Manufacturer Perk: ${partId}`
                                };
                            }
                        }
                        
                        // Also try direct lookup in partsMap
                        const fullId = `${currentTypeId}:${partId}`;
                        let found = partsMap.get(fullId);
                        if (found && found.typeId === currentTypeId) {
                            const partString = String(found.string || '').toLowerCase();
                            const partName = String(found.name || '').toLowerCase();
                            const partSpawnCode = String(found.spawnCode || '').toLowerCase();
                            if (partString.includes('part_core') || partName.includes('part_core') || String(partSpawnCode).includes('part_core')) {
                                return {
                                    ...found,
                                    partType: found.partType || 'Manufacturer Perk',
                                    name: found.name || `Manufacturer Perk: ${partId}`
                                };
                            }
                        }
                        
                        // Try numeric lookup
                        const numericPartId = parseInt(partId);
                        if (!isNaN(numericPartId)) {
                            found = partsMap.get(numericPartId);
                            if (found && found.typeId === currentTypeId) {
                                const partString = String(found.string || '').toLowerCase();
                                const partName = String(found.name || '').toLowerCase();
                                const partSpawnCode = String(found.spawnCode || '').toLowerCase();
                                if (partString.includes('part_core') || partName.includes('part_core') || String(partSpawnCode).includes('part_core')) {
                                    return {
                                        ...found,
                                        partType: found.partType || 'Manufacturer Perk',
                                        name: found.name || `Manufacturer Perk: ${partId}`
                                    };
                                }
                            }
                        }
                        
                        // Note: Don't return synthetic part info here - let normal lookup continue
                        // The normal lookup below will handle finding the part, and we'll mark it as Manufacturer Perk if found
                    }
                }
                
                // Special handling for Class Mod skills
                // Skills can be stored with typeId 254 or 255, and tier IDs are stored directly by numeric ID
                // IMPORTANT: Always prioritize the current item's typeId first!
                if (currentTypeId === 255 || currentTypeId === 254) {
                    // Priority 1: Try with current typeId first (most specific match)
                    const currentSkillFullId = `${currentTypeId}:${partId}`;
                    let found = partsMap.get(currentSkillFullId);
                    if (found && found.typeId === currentTypeId) {
                        return found; // Return immediately if found for current typeId
                    }
                    
                    // Priority 2: Search in partsByTypeId for current typeId first
                    const currentSkillParts = partsByTypeId.get(currentTypeId) || [];
                    for (const skillInfo of currentSkillParts) {
                        const skillId = String(skillInfo.id);
                        const skillFullIdStr = String(skillInfo.fullId || '');
                        // Check if this part matches by ID
                        if (skillId === partId || skillFullIdStr === currentSkillFullId || 
                            skillFullIdStr.endsWith(`:${partId}`) || 
                            (skillFullIdStr.includes(':') && skillFullIdStr.split(':')[1] === partId)) {
                            return skillInfo; // Return immediately if found for current typeId
                        }
                    }
                    
                    // Priority 3: Only if not found in current typeId, try the other typeId
                    const otherTypeId = (currentTypeId === 254) ? 255 : 254;
                    const otherSkillFullId = `${otherTypeId}:${partId}`;
                    found = partsMap.get(otherSkillFullId);
                    if (found && found.typeId === otherTypeId) {
                        return found;
                    }
                    
                    // Priority 4: Search in partsByTypeId for the other typeId
                    const otherSkillParts = partsByTypeId.get(otherTypeId) || [];
                    for (const skillInfo of otherSkillParts) {
                        const skillId = String(skillInfo.id);
                        const skillFullIdStr = String(skillInfo.fullId || '');
                        // Check if this is a skill tier part (stored by numeric ID)
                        if (skillId === partId || skillFullIdStr === otherSkillFullId || 
                            skillFullIdStr.endsWith(`:${partId}`) || 
                            (skillFullIdStr.includes(':') && skillFullIdStr.split(':')[1] === partId)) {
                            return skillInfo;
                        }
                    }
                    
                    // Priority 5: Fallback - try direct lookup by numeric ID (only if not found above)
                    found = partsMap.get(partId);
                    if (found && (found.typeId === 254 || found.typeId === 255)) {
                        // Prefer current typeId if both exist
                        if (found.typeId === currentTypeId) {
                            return found;
                        }
                    }
                    // Also try numeric lookup
                    const numericPartId = parseInt(partId);
                    if (!isNaN(numericPartId)) {
                        found = partsMap.get(numericPartId);
                        if (found && (found.typeId === 254 || found.typeId === 255)) {
                            // Prefer current typeId if both exist
                            if (found.typeId === currentTypeId) {
                                return found;
                            }
                        }
                    }
                }
                
                // Priority 1: Try with current typeId first (most specific)
                if (currentTypeId) {
                    const fullId = `${currentTypeId}:${partId}`;
                    // First try exact fullId match
                    let found = partsMap.get(fullId);
                    if (found && found.typeId === currentTypeId) {
                        return found;
                    }
                    
                    // Also try looking up by just the numeric partId (for parts stored as "13:73" but looked up as "73")
                    found = partsMap.get(partId);
                    if (found && found.typeId === currentTypeId) {
                        // Verify this part belongs to the current typeId by checking its fullId or id
                        const foundId = String(found.id || '');
                        const foundFullId = String(found.fullId || '');
                        if (foundFullId === fullId || foundId === fullId || 
                            (foundFullId.includes(':') && foundFullId.startsWith(`${currentTypeId}:`)) ||
                            (foundId.includes(':') && foundId.startsWith(`${currentTypeId}:`))) {
                            return found;
                        }
                    }
                    
                    // Also try numeric lookup
                    const numericPartId = parseInt(partId);
                    if (!isNaN(numericPartId)) {
                        found = partsMap.get(numericPartId);
                        if (found && found.typeId === currentTypeId) {
                            // Verify this part belongs to the current typeId
                            const foundId = String(found.id || '');
                            const foundFullId = String(found.fullId || '');
                            if (foundFullId === fullId || foundId === fullId || 
                                (foundFullId.includes(':') && foundFullId.startsWith(`${currentTypeId}:`)) ||
                                (foundId.includes(':') && foundId.startsWith(`${currentTypeId}:`))) {
                                return found;
                            }
                        }
                    }
                    
                    // Search in partsByTypeId for this specific type - prioritize exact matches
                    const typeParts = partsByTypeId.get(currentTypeId) || [];
                    let exactMatch = null;
                    let partialMatch = null;
                    
                    for (const partInfo of typeParts) {
                        // Check if this part matches the numeric ID exactly
                        const infoId = String(partInfo.id);
                        const infoFullId = String(partInfo.fullId || '');
                        
                        // Extract numeric part ID from various formats
                        let numericPartId = null;
                        let fullIdPartId = null;
                        
                        // Check if id is in format "typeId:partId" and extract just the partId
                        if (infoId.includes(':')) {
                            const parts = infoId.split(':');
                            if (parts.length === 2) {
                                const idTypeId = parseInt(parts[0]);
                                numericPartId = parts[1];
                                // Only use this if the typeId matches
                                if (idTypeId !== currentTypeId) {
                                    numericPartId = null; // Don't use it if typeId doesn't match
                                }
                            }
                        } else {
                            numericPartId = infoId;
                        }
                        
                        // Also check fullId
                        if (infoFullId.includes(':')) {
                            const fullIdParts = infoFullId.split(':');
                            if (fullIdParts.length === 2) {
                                const fullIdTypeId = parseInt(fullIdParts[0]);
                                fullIdPartId = fullIdParts[1];
                                // Only use this if the typeId matches
                                if (fullIdTypeId !== currentTypeId) {
                                    fullIdPartId = null;
                                }
                            }
                        }
                        
                        // Check for matches: exact id, extracted numeric part, or fullId match
                        // For part 73 lookup: check if partId "73" matches part with id "13:73"
                        let idMatches = infoId === partId || 
                                       numericPartId === partId ||
                                       (fullIdPartId && fullIdPartId === partId);
                        
                        // Special case: if we're looking for part "73" and this part has id "13:73", it should match
                        if (!idMatches && partId === '73' && currentTypeId === 13) {
                            if ((infoId === '13:73' || infoFullId === '13:73') && partInfo.typeId === 13) {
                                idMatches = true;
                            }
                        }
                        
                        const fullIdMatches = infoFullId === fullId;
                        
                        if (idMatches || fullIdMatches) {
                            // Exact ID match - return immediately if typeId matches
                            if (partInfo.typeId === currentTypeId) {
                                // Debug log for part 7 and 73 lookup
                                if ((partId === '7' && currentTypeId === 267) || (partId === '73' && currentTypeId === 13)) {
                                    console.log(`  ✓ Found part ${partId} for typeId ${currentTypeId} by exact ID match: ${partInfo.name} (id: ${partInfo.id}, fullId: ${partInfo.fullId}, typeId: ${partInfo.typeId}, spawnCode: ${partInfo.spawnCode}, numericPartId: ${numericPartId}, fullIdPartId: ${fullIdPartId})`);
                                }
                                return partInfo;
                            }
                            if (!exactMatch && partInfo.typeId === currentTypeId) exactMatch = partInfo;
                        }
                        // Check if fullId matches exactly
                        if (partInfo.fullId === fullId) {
                            if (partInfo.typeId === currentTypeId) {
                                return partInfo;
                            }
                            if (!exactMatch && partInfo.typeId === currentTypeId) exactMatch = partInfo;
                        }
                        // Check if fullId is in format "typeId:partId" and matches
                        if (partInfo.fullId && partInfo.fullId.includes(':')) {
                            const fullIdParts = partInfo.fullId.split(':');
                            if (fullIdParts.length === 2) {
                                const fullIdTypeId = parseInt(fullIdParts[0]);
                                const fullIdPartId = fullIdParts[1];
                                // Match if typeId matches and partId matches (either exact or numeric)
                                if (fullIdTypeId === currentTypeId && (fullIdPartId === partId || fullIdPartId === String(part.value))) {
                                    if (partInfo.typeId === currentTypeId) {
                                        // Debug log for part 73
                                        if (partId === '73' && currentTypeId === 13) {
                                            console.log(`  ✓ Found part 73 for typeId 13 by fullId match: ${partInfo.name} (id: ${partInfo.id}, fullId: ${partInfo.fullId}, typeId: ${partInfo.typeId}, spawnCode: ${partInfo.spawnCode})`);
                                        }
                                        return partInfo;
                                    }
                                    if (!exactMatch && partInfo.typeId === currentTypeId) exactMatch = partInfo;
                                }
                            }
                        }
                        
                        // Also check if the id field itself is in "typeId:partId" format
                        if (partInfo.id && String(partInfo.id).includes(':')) {
                            const idParts = String(partInfo.id).split(':');
                            if (idParts.length === 2) {
                                const idTypeId = parseInt(idParts[0]);
                                const idPartId = idParts[1];
                                if (idTypeId === currentTypeId && idPartId === partId) {
                                    if (partInfo.typeId === currentTypeId) {
                                        // Debug log for part 73
                                        if (partId === '73' && currentTypeId === 13) {
                                            console.log(`  ✓ Found part 73 for typeId 13 by id format match: ${partInfo.name} (id: ${partInfo.id}, fullId: ${partInfo.fullId}, typeId: ${partInfo.typeId}, spawnCode: ${partInfo.spawnCode})`);
                                        }
                                        return partInfo;
                                    }
                                    if (!exactMatch && partInfo.typeId === currentTypeId) exactMatch = partInfo;
                                }
                            }
                        }
                        // Check if fullId ends with this ID (e.g., "19:56" ends with ":56")
                        if (partInfo.fullId && partInfo.fullId.includes(':') && partInfo.fullId.endsWith(`:${partId}`)) {
                            // Verify the typeId in the fullId matches currentTypeId
                            const fullIdParts = partInfo.fullId.split(':');
                            if (fullIdParts.length === 2) {
                                const fullIdTypeId = parseInt(fullIdParts[0]);
                                if (fullIdTypeId === currentTypeId && partInfo.typeId === currentTypeId) {
                                    return partInfo;
                                }
                                if (!partialMatch && fullIdTypeId === currentTypeId && partInfo.typeId === currentTypeId) {
                                    partialMatch = partInfo;
                                }
                            }
                        }
                    }
                    
                    // Debug: Log if we didn't find the part (for common debugging cases)
                    if ((partId === '7' && currentTypeId === 267) || (partId === '73' && currentTypeId === 13)) {
                        console.log(`  ⚠️ Part ${partId} not found in partsByTypeId.get(${currentTypeId}). Total parts in collection: ${typeParts.length}`);
                        if (typeParts.length > 0) {
                            console.log(`  Sample parts in collection:`, typeParts.slice(0, 10).map(p => ({id: p.id, fullId: p.fullId, name: p.name, typeId: p.typeId, spawnCode: p.spawnCode})));
                        }
                        // Also check if part exists with different ID format
                        const partVariants = typeParts.filter(p => {
                            const pId = String(p.id);
                            const pFullId = String(p.fullId || '');
                            return pId === partId || 
                                   pId === `${currentTypeId}:${partId}` ||
                                   pFullId === `${currentTypeId}:${partId}` ||
                                   pFullId.endsWith(`:${partId}`);
                        });
                        if (partVariants.length > 0) {
                            console.log(`  Found ${partVariants.length} variant(s) of part ${partId}:`, partVariants.map(p => ({id: p.id, fullId: p.fullId, name: p.name, typeId: p.typeId, spawnCode: p.spawnCode})));
                        } else {
                            // Try searching in partsMap
                            const mapKey = `${currentTypeId}:${partId}`;
                            const mapPart = partsMap.get(mapKey);
                            if (mapPart) {
                                console.log(`  Found part ${partId} in partsMap with key ${mapKey}:`, {id: mapPart.id, fullId: mapPart.fullId, name: mapPart.name, typeId: mapPart.typeId});
                            }
                        }
                    }
                    
                    // Return exact match if found, otherwise partial match
                    if (exactMatch) return enhanceManufacturerPerk(exactMatch, partId, currentTypeId);
                    if (partialMatch) return enhanceManufacturerPerk(partialMatch, partId, currentTypeId);
                }
                
                // Priority 2: Try exact numeric match, but ONLY if we have a typeId match
                // Skip this if we have a currentTypeId - we already searched partsByTypeId above
                if (!currentTypeId) {
                    let found = partsMap.get(partId);
                    if (found) {
                        return enhanceManufacturerPerk(found, partId, currentTypeId);
                    }
                }
                
                // Priority 3: Search all parts, but ONLY return if typeId matches (if we have one)
                let bestMatch = null;
                for (const [key, partInfo] of partsMap.entries()) {
                    const infoId = String(partInfo.id);
                    // Check for exact ID match
                    if (infoId === partId || infoId === String(part.value)) {
                        // If we have a typeId, ONLY return if it matches
                        if (currentTypeId) {
                            if (partInfo.typeId === currentTypeId) {
                                return enhanceManufacturerPerk(partInfo, partId, currentTypeId); // Exact match with correct typeId
                            }
                            // Don't save as fallback if we have a typeId - we want exact match only
                        } else {
                            // No typeId specified, return first match
                            if (!bestMatch) {
                                bestMatch = partInfo;
                            }
                        }
                    }
                    // Check if fullId ends with this ID
                    if (partInfo.fullId && partInfo.fullId.includes(':')) {
                        const fullIdParts = partInfo.fullId.split(':');
                        if (fullIdParts.length === 2 && fullIdParts[1] === partId) {
                            if (currentTypeId) {
                                if (partInfo.typeId === currentTypeId) {
                                    return partInfo; // Exact match with correct typeId
                                }
                                // Don't save as fallback if we have a typeId
                            } else {
                                if (!bestMatch) {
                                    bestMatch = partInfo;
                                }
                            }
                        }
                    }
                }
                
                // Only return bestMatch if we don't have a typeId (otherwise we want exact match only)
                return currentTypeId ? null : enhanceManufacturerPerk(bestMatch, partId, currentTypeId);
            } else if (part.type === 'typed') {
                const partValue = String(part.value);
                const fullId = `${part.typeId}:${partValue}`;
                
                // Try fullId first (exact match)
                let found = partsMap.get(fullId);
                if (found) {
                    // Verify the typeId matches - if not, continue searching
                    if (found.typeId === part.typeId) {
                        return found;
                    }
                }
                
                // Try just the value
                found = partsMap.get(partValue);
                if (found && found.typeId === part.typeId) {
                    return found;
                }
                
                // Search for matching part by typeId and value
                let bestMatch = null;
                for (const [key, partInfo] of partsMap.entries()) {
                    // Check if this part matches our typeId and value
                    if (partInfo.typeId === part.typeId) {
                        // Check if the ID matches (could be "35" or "14:35")
                        const infoId = String(partInfo.id);
                        if (infoId === partValue || infoId === fullId) {
                            return partInfo; // Exact match, return immediately
                        }
                        // Check if fullId matches
                        if (partInfo.fullId === fullId) {
                            return partInfo; // Exact match, return immediately
                        }
                        // Check if the part ID ends with our value (e.g., "14:35" ends with ":35")
                        if (infoId.includes(':') && infoId.endsWith(`:${partValue}`)) {
                            if (!bestMatch) bestMatch = partInfo;
                        }
                    }
                }
                
                // If we found a match by typeId and value, return it
                if (bestMatch) return enhanceManufacturerPerk(bestMatch, partId, currentTypeId);
                
                // Last resort: try to find by value only (but prefer typeId match)
                for (const [key, partInfo] of partsMap.entries()) {
                    const infoId = String(partInfo.id);
                    if (infoId === partValue || infoId === fullId) {
                        // Prefer parts that match the typeId
                        if (partInfo.typeId === part.typeId) {
                            return partInfo;
                        }
                        if (!bestMatch) bestMatch = partInfo;
                    }
                }
                
                return bestMatch;
            } else if (part.type === 'array') {
                return {
                    name: `Type ${part.typeId} Array`,
                    stats: `Array with ${part.values.length} values`,
                    effects: part.values.join(', ')
                };
            } else if (part.type === 'string') {
                // Look up string parts by spawn_code
                const stringValue = part.value || '';
                if (!stringValue) return null;
                
                // Search all parts for matching spawn_code
                for (const [key, partInfo] of partsMap.entries()) {
                    if (partInfo.spawnCode === stringValue) {
                        return partInfo;
                    }
                }
                
                // Also try searching by string field
                for (const [key, partInfo] of partsMap.entries()) {
                    if (partInfo.string === stringValue) {
                        return partInfo;
                    }
                }
                
                return null;
            }
            return null;
        }

        let viewMode = 'grouped'; // 'grouped', 'list', 'compact'

        function setViewMode(mode) {
            viewMode = mode;
            document.querySelectorAll('.view-toggle-btn').forEach(btn => btn.classList.remove('active'));
            document.getElementById(`view${mode.charAt(0).toUpperCase() + mode.slice(1)}`).classList.add('active');
            renderParts();
        }

        function renderParts() {
            const container = document.getElementById('partsContainer');
            const header = document.getElementById('partsHeader');
            const summary = document.getElementById('partsSummary');

            if (!container) return;

            container.innerHTML = '';

            if (currentParts.length === 0) {
                container.innerHTML = '<div class="empty-state">No parts added yet. Configure a part above and click "Add Part" to get started.</div>';
                if (header) header.style.display = 'none';
                generateCode(); // Update code even when empty
                return;
            }

            // Show header and update summary
            if (header) header.style.display = 'flex';
            const simpleCount = currentParts.filter(p => p.type === 'simple').length;
            const typedCount = currentParts.filter(p => p.type === 'typed').length;
            const arrayCount = currentParts.filter(p => p.type === 'array').length;
            const stringCount = currentParts.filter(p => p.type === 'string').length;
            const partCounts = [];
            if (simpleCount > 0) partCounts.push(`${simpleCount} Local Manufacturer`);
            if (typedCount > 0) partCounts.push(`${typedCount} Manufacturer#:Part#`);
            if (arrayCount > 0) partCounts.push(`${arrayCount} Manufacturer#:Array of Part#`);
            if (stringCount > 0) partCounts.push(`${stringCount} String${stringCount > 1 ? 's' : ''}`);
            if (summary) {
                summary.textContent = `${currentParts.length} parts total${partCounts.length > 0 ? ' (' + partCounts.join(', ') + ')' : ''}`;
            }

            if (viewMode === 'grouped') {
                renderGroupedParts(container);
            } else {
                renderListParts(container);
            }
            
            // Auto-generate code after rendering
            generateCode();
            updateGuidelinesChecklist(); // Update checklist when parts are rendered
        }

        function renderGroupedParts(container) {
            // Group parts by type
            const groups = {
                'Local Manufacturer': currentParts.map((p, i) => ({ part: p, index: i })).filter(item => item.part.type === 'simple'),
                'Manufacturer#:Part#': currentParts.map((p, i) => ({ part: p, index: i })).filter(item => item.part.type === 'typed'),
                'Manufacturer#:Array of Part#': currentParts.map((p, i) => ({ part: p, index: i })).filter(item => item.part.type === 'array'),
                'Strings': currentParts.map((p, i) => ({ part: p, index: i })).filter(item => item.part.type === 'string')
            };

            Object.entries(groups).forEach(([groupName, items]) => {
                if (items.length === 0) return;

                const groupDiv = document.createElement('div');
                groupDiv.className = 'part-group';

                const groupHeader = document.createElement('div');
                groupHeader.className = 'part-group-header';
                
                const titleDiv = document.createElement('div');
                titleDiv.className = 'part-group-title';
                titleDiv.innerHTML = `
                    <span>${groupName}</span>
                    <span class="part-group-count">${items.length}</span>
                `;
                
                const arrowSpan = document.createElement('span');
                arrowSpan.className = 'group-arrow';
                arrowSpan.textContent = '▶';
                
                groupHeader.appendChild(titleDiv);
                groupHeader.appendChild(arrowSpan);
                
                groupHeader.onclick = () => {
                    const content = groupDiv.querySelector('.part-group-content');
                    content.classList.toggle('collapsed');
                    arrowSpan.textContent = content.classList.contains('collapsed') ? '▶' : '▼';
                };

                const groupContent = document.createElement('div');
                groupContent.className = 'part-group-content collapsed';

                items.forEach(({ part, index }) => {
                    const partDiv = renderSinglePart(part, index);
                    groupContent.appendChild(partDiv);
                });

                groupDiv.appendChild(groupHeader);
                groupDiv.appendChild(groupContent);
                container.appendChild(groupDiv);
            });
        }

        function renderListParts(container) {
            currentParts.forEach((part, index) => {
                const partDiv = renderSinglePart(part, index);
                container.appendChild(partDiv);
            });
        }

        function renderSinglePart(part, index) {
                const partDiv = document.createElement('div');
                partDiv.className = `part-item ${viewMode === 'compact' ? 'compact' : ''}`;
                partDiv.setAttribute('data-part-index', index);

                const partInfo = getPartInfo(part, index);
                
                // Detect and apply rarity styling
                const rarity = detectRarity(partInfo);
                if (rarity) {
                    partDiv.setAttribute('data-rarity', rarity);
                    const rarityStyle = getRarityStyle(rarity);
                    partDiv.style.borderColor = rarityStyle.borderColor;
                    partDiv.style.background = rarityStyle.bgColor;
                }

                const headerDiv = document.createElement('div');
                headerDiv.className = 'part-item-header';

                const typeSelect = document.createElement('select');
                typeSelect.className = 'part-type-selector';
                typeSelect.innerHTML = `
                    <option value="simple" ${part.type === 'simple' ? 'selected' : ''}>Local Manufacturer</option>
                    <option value="typed" ${part.type === 'typed' ? 'selected' : ''}>Manufacturer#:Part#</option>
                    <option value="array" ${part.type === 'array' ? 'selected' : ''}>Manufacturer#:Array of Part#</option>
                    <option value="string" ${part.type === 'string' ? 'selected' : ''}>String</option>
                `;
                typeSelect.onchange = (e) => updatePart(index, 'type', e.target.value);
                headerDiv.appendChild(typeSelect);

                if (part.type === 'typed' || part.type === 'array') {
                    const typeIdSelect = document.createElement('select');
                    typeIdSelect.innerHTML = '<option value="0">Select Type ID...</option>';
                    
                    // Populate with all available TypeIDs
                    const sortedTypeIds = Array.from(typeIdMap.values()).sort((a, b) => a.id - b.id);
                    sortedTypeIds.forEach(type => {
                        const option = document.createElement('option');
                        option.value = type.id;
                        const label = type.manufacturer ? 
                            `${type.id} - ${type.manufacturer} ${type.name}` : 
                            `${type.id} - ${type.name}`;
                        option.textContent = label;
                        if (part.typeId === type.id) {
                            option.selected = true;
                        }
                        typeIdSelect.appendChild(option);
                    });
                    
                    // Also add current form typeId if not in list
                    const currentFormTypeId = parseInt(document.getElementById('typeId').value);
                    if (currentFormTypeId && !sortedTypeIds.find(t => t.id === currentFormTypeId)) {
                        const option = document.createElement('option');
                        option.value = currentFormTypeId;
                        option.textContent = `${currentFormTypeId} - (Current Selection)`;
                        if (part.typeId === currentFormTypeId) {
                            option.selected = true;
                        }
                        typeIdSelect.appendChild(option);
                    }
                    
                    typeIdSelect.onchange = (e) => {
                        updatePart(index, 'typeId', e.target.value);
                        // Refresh browser if it's open
                        const browser = document.getElementById(`partBrowser${index}`);
                        if (browser && browser.classList.contains('active')) {
                            const newTypeId = parseInt(e.target.value) || parseInt(document.getElementById('typeId').value);
                            populatePartBrowser(browser, part.type, newTypeId);
                        }
                    };
                    headerDiv.appendChild(typeIdSelect);
                }

                if (part.type === 'simple') {
                    const valueInput = document.createElement('input');
                    valueInput.type = 'number';
                    valueInput.id = `part-${index}-value-input`;
                    valueInput.name = `part-${index}-value-input`;
                    valueInput.placeholder = 'Part ID';
                    valueInput.value = part.value || 0;
                    valueInput.onchange = (e) => updatePart(index, 'value', e.target.value);
                    headerDiv.appendChild(valueInput);
                    
                    const browseBtn = document.createElement('button');
                    browseBtn.className = 'btn btn-secondary btn-small';
                    browseBtn.innerHTML = '🔍 Browse';
                    browseBtn.onclick = () => showPartBrowser(index, 'simple');
                    headerDiv.appendChild(browseBtn);
                } else if (part.type === 'typed') {
                    const valueInput = document.createElement('input');
                    valueInput.type = 'number';
                    valueInput.id = `part-${index}-value-input`;
                    valueInput.name = `part-${index}-value-input`;
                    valueInput.placeholder = 'Part Number';
                    valueInput.value = part.value || 0;
                    valueInput.onchange = (e) => updatePart(index, 'value', e.target.value);
                    headerDiv.appendChild(valueInput);
                    
                    const browseBtn = document.createElement('button');
                    browseBtn.className = 'btn btn-secondary btn-small';
                    browseBtn.innerHTML = '🔍 Browse Parts';
                    browseBtn.title = 'Browse all parts for the Type ID specified above';
                    // Use part's typeId, or fall back to form's typeId
                    const browseTypeId = part.typeId || parseInt(document.getElementById('typeId').value) || null;
                    browseBtn.onclick = () => showPartBrowser(index, 'typed', browseTypeId);
                    headerDiv.appendChild(browseBtn);
                } else if (part.type === 'array') {
                    const arrayInput = document.createElement('input');
                    arrayInput.type = 'text';
                    arrayInput.id = `part-${index}-array-input`;
                    arrayInput.name = `part-${index}-array-input`;
                    arrayInput.placeholder = 'Numbers (space separated)';
                    arrayInput.value = part.values ? part.values.join(' ') : '';
                    arrayInput.onchange = (e) => updatePart(index, 'arrayValues', e.target.value);
                    headerDiv.appendChild(arrayInput);
                } else if (part.type === 'string') {
                    const stringInput = document.createElement('input');
                    stringInput.type = 'text';
                    stringInput.id = `part-${index}-string-input`;
                    stringInput.name = `part-${index}-string-input`;
                    stringInput.placeholder = 'String value';
                    stringInput.value = part.value || '';
                    stringInput.style.flex = '1';
                    stringInput.onchange = (e) => updatePart(index, 'value', e.target.value);
                    headerDiv.appendChild(stringInput);
                }

                const removeBtn = document.createElement('button');
                removeBtn.className = 'btn btn-danger btn-small';
                removeBtn.innerHTML = '🗑️';
                removeBtn.onclick = () => removePart(index);
                headerDiv.appendChild(removeBtn);

                partDiv.appendChild(headerDiv);

                if (part.type === 'string') {
                    const infoDiv = document.createElement('div');
                    infoDiv.className = 'part-info';
                    if (partInfo) {
                        // Found matching part info by spawn_code
                        let infoHtml = `<strong>${partInfo.name || 'String Part'}</strong>`;
                        infoHtml += `<div class="part-details-item part-details"><strong>String:</strong> <code>"${part.value || ''}"</code></div>`;
                        if (partInfo.spawnCode) {
                            infoHtml += `<div class="part-details-item part-details"><strong>Spawn Code:</strong> ${partInfo.spawnCode}</div>`;
                        }
                        if (partInfo.stats) {
                            infoHtml += `<div class="part-details-item part-details"><strong>Stats:</strong> ${partInfo.stats}</div>`;
                        }
                        if (partInfo.effects) {
                            infoHtml += `<div class="part-details-item part-details"><strong>Effects:</strong> ${partInfo.effects}</div>`;
                        }
                        if (partInfo.partType) {
                            infoHtml += `<div class="part-details-item part-details"><strong>Part Type:</strong> ${partInfo.partType}</div>`;
                        }
                        if (partInfo.manufacturer) {
                            infoHtml += `<div class="part-details-item part-details"><strong>Manufacturer:</strong> ${partInfo.manufacturer}</div>`;
                        }
                        infoDiv.innerHTML = infoHtml;
                    } else {
                        // No matching part found
                        infoDiv.innerHTML = `<strong>String:</strong> <code>"${part.value || ''}"</code><br><small style="color: #999;">No matching part found in database</small>`;
                    }
                    partDiv.appendChild(infoDiv);
                } else if (part.type === 'array') {
                    // Special handling for array parts - show compact summary with expandable details
                    const infoDiv = document.createElement('div');
                    infoDiv.className = 'part-info';
                    
                    const arrayCount = part.values ? part.values.length : 0;
                    const arrayValuesStr = part.values ? part.values.join(', ') : 'None';
                    
                    // Summary section
                    const summaryDiv = document.createElement('div');
                    summaryDiv.className = 'part-info-summary';
                    summaryDiv.innerHTML = `
                        <div style="flex: 1; min-width: 0;">
                            <strong>Type ${part.typeId} Array</strong>
                            <div style="font-size: 0.85em; color: #b0d4e6; margin-top: 2px;">
                                <code>${arrayCount} value${arrayCount !== 1 ? 's' : ''}</code>
                            </div>
                            <div style="font-size: 0.8em; color: #999; margin-top: 3px; opacity: 0.8;">
                                ${arrayValuesStr.length > 80 ? arrayValuesStr.substring(0, 80) + '...' : arrayValuesStr}
                            </div>
                        </div>
                        <button class="toggle-details-btn" onclick="this.parentElement.nextElementSibling.classList.toggle('expanded'); this.textContent = this.parentElement.nextElementSibling.classList.contains('expanded') ? '▼ Hide Details' : '▶ Show Details';">▶ Show Details</button>
                    `;
                    infoDiv.appendChild(summaryDiv);
                    
                    // Details section (collapsible)
                    const detailsDiv = document.createElement('div');
                    detailsDiv.className = 'part-info-details';
                    
                    let detailsHtml = `<div class="part-details-item"><strong>Array Values:</strong> ${arrayValuesStr}</div>`;
                    detailsHtml += `<div class="part-details-item"><strong>Count:</strong> ${arrayCount} value${arrayCount !== 1 ? 's' : ''}</div>`;
                    
                    // Look up each value in the array and show detailed information
                    if (part.values && Array.isArray(part.values) && part.values.length > 0) {
                        detailsHtml += `<div class="part-details-item" style="margin-top: var(--input-pad-y); padding-top: var(--input-pad-y); border-top: 1px solid rgba(79, 195, 247, 0.2);"><strong>Individual Parts:</strong></div>`;
                        
                        part.values.forEach((arrayValue, idx) => {
                            const partId = String(arrayValue);
                            const fullId = `${part.typeId}:${partId}`;
                            let foundInfo = null;
                            
                            // FIRST: Directly search partsByTypeId for this typeId (most reliable)
                            // This is the same approach that works in the guidelines
                            const typeParts = partsByTypeId.get(part.typeId) || [];
                            
                            // Debug for typeId 234
                            if (part.typeId === 234 && idx === 0 && DEBUG) {
                                console.log(`[ARRAY RENDER] Looking for {234:${partId}}`);
                                console.log(`[ARRAY RENDER] typeParts.length = ${typeParts.length}`);
                                if (typeParts.length > 0) {
                                    console.log(`[ARRAY RENDER] First 3 parts:`, typeParts.slice(0, 3).map(p => ({
                                        id: p.id,
                                        fullId: p.fullId,
                                        typeId: p.typeId,
                                        name: p.name,
                                        partType: p.partType
                                    })));
                                }
                            }
                            
                            for (const candidate of typeParts) {
                                const candidateId = String(candidate.id || '');
                                const candidateFullId = String(candidate.fullId || '');
                                
                                // Try multiple matching strategies (same as guidelines logic)
                                // 1. Exact fullId match: "234:1" === "234:1"
                                // 2. FullId ends with partId: "234:1" ends with ":1" and starts with "234:"
                                // 3. Id matches and typeId matches: id === "1" and typeId === 234
                                // 4. Id is the fullId: id === "234:1"
                                // 5. Extract from fullId: "234:1" splits to ["234", "1"] and "1" === partId
                                const exactFullIdMatch = candidateFullId === fullId;
                                const fullIdEndsWithPartId = candidateFullId.includes(':') && 
                                                             candidateFullId.startsWith(`${part.typeId}:`) && 
                                                             candidateFullId.split(':')[1] === partId;
                                const idMatches = candidateId === partId && candidate.typeId === part.typeId;
                                const idIsFullId = candidateId === fullId;
                                
                                // Also check if we can extract the partId from the fullId
                                let extractedPartId = null;
                                if (candidateFullId.includes(':')) {
                                    const parts = candidateFullId.split(':');
                                    if (parts.length >= 2 && parseInt(parts[0]) === part.typeId) {
                                        extractedPartId = parts[1];
                                    }
                                }
                                const extractedMatch = extractedPartId === partId;
                                
                                // Also try extracting from candidateId if it has a colon
                                let extractedFromId = null;
                                if (candidateId.includes(':')) {
                                    const parts = candidateId.split(':');
                                    if (parts.length >= 2 && parseInt(parts[0]) === part.typeId) {
                                        extractedFromId = parts[1];
                                    }
                                }
                                const extractedFromIdMatch = extractedFromId === partId;
                                
                                if (exactFullIdMatch || fullIdEndsWithPartId || idMatches || idIsFullId || extractedMatch || extractedFromIdMatch) {
                                    foundInfo = candidate;
                                    if (part.typeId === 234 && idx === 0 && DEBUG) {
                                        console.log(`[ARRAY RENDER] ✓ Found {234:${partId}}!`, {
                                            candidateId,
                                            candidateFullId,
                                            matchedBy: exactFullIdMatch ? 'exactFullId' : 
                                                       fullIdEndsWithPartId ? 'fullIdEndsWithPartId' :
                                                       idMatches ? 'idMatches' :
                                                       idIsFullId ? 'idIsFullId' :
                                                       extractedMatch ? 'extractedMatch' : 'extractedFromIdMatch'
                                        });
                                    }
                                    break;
                                }
                            }
                            
                            // SECOND: Try getPartInfo as fallback
                            if (!foundInfo) {
                                const virtualPart = {
                                    type: 'typed',
                                    typeId: part.typeId,
                                    value: arrayValue
                                };
                                foundInfo = getPartInfo(virtualPart, index);
                            }
                            
                            // Debug: Log if we're not finding parts for typeId 234
                            if (!foundInfo && part.typeId === 234 && DEBUG) {
                                console.log(`[DEBUG] Looking for {234:${arrayValue}}, foundInfo:`, foundInfo);
                                console.log(`[DEBUG] partsByTypeId.get(234) has ${(partsByTypeId.get(234) || []).length} parts`);
                                
                                // Check if the part exists in partsMap with fullId
                                const fullIdCheck = partsMap.get(`234:${arrayValue}`);
                                console.log(`[DEBUG] partsMap.get("234:${arrayValue}") =`, fullIdCheck);
                                
                                // Search partsMap for any part with fullId matching
                                let foundInMap = null;
                                for (const [key, value] of partsMap.entries()) {
                                    if (value && value.fullId === `234:${arrayValue}`) {
                                        foundInMap = {key, value};
                                        break;
                                    }
                                }
                                console.log(`[DEBUG] Found in partsMap by fullId search:`, foundInMap);
                                
                                // Check for parts with typeId 234 in partsMap
                                const partsWith234 = [];
                                let count = 0;
                                for (const [key, value] of partsMap.entries()) {
                                    if (value && value.typeId === 234 && count < 5) {
                                        partsWith234.push({key, id: value.id, fullId: value.fullId, name: value.name});
                                        count++;
                                    }
                                }
                                console.log(`[DEBUG] Sample parts with typeId 234 from partsMap:`, partsWith234);
                                
                                const sampleParts = (partsByTypeId.get(234) || []).slice(0, 3);
                                if (sampleParts.length > 0) {
                                    console.log(`[DEBUG] Sample parts from typeId 234:`, sampleParts.map(p => ({id: p.id, fullId: p.fullId, typeId: p.typeId, name: p.name})));
                                }
                            }
                            if (!foundInfo) {
                                const partId = String(arrayValue);
                                const fullId = `${part.typeId}:${partId}`;
                                
                                // First try fullId lookup (most specific) in partsMap
                                foundInfo = partsMap.get(fullId);
                                // Verify typeId matches if found
                                if (foundInfo && foundInfo.typeId !== part.typeId) {
                                    foundInfo = null;
                                }
                                
                                // Also try looking up by the fullId string directly in partsMap with different formats
                                if (!foundInfo) {
                                    // Try various key formats that might be stored
                                    foundInfo = partsMap.get(fullId) || 
                                               partsMap.get(`"${fullId}"`) || 
                                               partsMap.get(`'${fullId}'`);
                                    if (foundInfo && foundInfo.typeId !== part.typeId) {
                                        foundInfo = null;
                                    }
                                }
                                
                                // Search all of partsMap for matching fullId (in case it's stored with a different key)
                                if (!foundInfo) {
                                    for (const [key, value] of partsMap.entries()) {
                                        if (value && value.fullId === fullId && value.typeId === part.typeId) {
                                            foundInfo = value;
                                            break;
                                        }
                                        // Also check if the key itself is the fullId
                                        if (key === fullId && value && value.typeId === part.typeId) {
                                            foundInfo = value;
                                            break;
                                        }
                                    }
                                }
                                
                                // If not found, search ONLY within this typeId's parts
                                if (!foundInfo) {
                                    const typeParts = partsByTypeId.get(part.typeId) || [];
                                    for (const info of typeParts) {
                                        // Check if this part matches the value we're looking for
                                        const infoId = String(info.id);
                                        const infoFullId = String(info.fullId || '');
                                        
                                        // Match if:
                                        // 1. The part's fullId exactly matches (e.g., "234:1")
                                        // 2. The part's fullId ends with :partId and starts with typeId: (e.g., "234:1" for partId "1")
                                        // 3. The part's ID matches AND typeId matches (for parts where id is just the number)
                                        const fullIdMatches = infoFullId === fullId;
                                        const fullIdEndsWithPartId = infoFullId.includes(':') && 
                                                                    infoFullId.startsWith(`${part.typeId}:`) && 
                                                                    infoFullId.split(':')[1] === partId;
                                        const idMatches = infoId === partId && info.typeId === part.typeId;
                                        const idIsFullId = infoId === fullId;
                                        
                                        if (fullIdMatches || fullIdEndsWithPartId || idMatches || idIsFullId) {
                                            foundInfo = info;
                                            break;
                                        }
                                    }
                                }
                                
                                // Also try searching by extracting the numeric part from fullId
                                if (!foundInfo) {
                                    const typeParts = partsByTypeId.get(part.typeId) || [];
                                    for (const info of typeParts) {
                                        const infoFullId = String(info.fullId || '');
                                        // Check if fullId is in format "typeId:value" and value matches
                                        if (infoFullId.includes(':')) {
                                            const [infoTypeId, infoValue] = infoFullId.split(':');
                                            if (parseInt(infoTypeId) === part.typeId && infoValue === partId) {
                                                foundInfo = info;
                                                break;
                                            }
                                        }
                                    }
                                }
                                
                                // Last resort: try numeric lookup BUT verify typeId matches
                                if (!foundInfo) {
                                    const numericPartId = parseInt(partId);
                                    if (!isNaN(numericPartId)) {
                                        const candidate = partsMap.get(numericPartId);
                                        // Only use if typeId matches
                                        if (candidate && candidate.typeId === part.typeId) {
                                            foundInfo = candidate;
                                        }
                                    }
                                }
                            }
                            
                            detailsHtml += `<div class="part-details-item" style="margin-left: 10px; margin-top: 4px; padding-left: 8px; border-left: 2px solid rgba(79, 195, 247, 0.3);">`;
                            detailsHtml += `<strong>{${part.typeId}:${arrayValue}}</strong>`;
                            
                            if (foundInfo) {
                                if (foundInfo.name) {
                                    detailsHtml += `<div style="margin-top: 2px; color: #b0d4e6; font-size: 0.85em;"><strong>Name:</strong> ${foundInfo.name}</div>`;
                                }
                                if (foundInfo.partType) {
                                    detailsHtml += `<div style="margin-top: 1px; color: #999; font-size: 0.8em;"><strong>Type:</strong> ${foundInfo.partType}</div>`;
                                }
                                if (foundInfo.stats) {
                                    const statsPreview = foundInfo.stats.length > 50 ? foundInfo.stats.substring(0, 50) + '...' : foundInfo.stats;
                                    detailsHtml += `<div style="margin-top: 1px; color: #999; font-size: 0.8em;"><strong>Stats:</strong> ${statsPreview}</div>`;
                                }
                            } else {
                                // Final fallback: search all parts with this typeId using more flexible matching
                                const partId = String(arrayValue);
                                const fullId = `${part.typeId}:${partId}`;
                                const allTypeParts = partsByTypeId.get(part.typeId) || [];
                                let finalFound = null;
                                
                                for (const candidate of allTypeParts) {
                                    const candidateId = String(candidate.id || '');
                                    const candidateFullId = String(candidate.fullId || '');
                                    
                                    // Try multiple matching strategies
                                    if (candidateFullId === fullId || 
                                        candidateId === fullId ||
                                        (candidateFullId.includes(':') && candidateFullId.split(':')[1] === partId) ||
                                        (candidateId.includes(':') && candidateId.split(':')[1] === partId) ||
                                        (candidateId === partId && candidate.typeId === part.typeId)) {
                                        finalFound = candidate;
                                        break;
                                    }
                                }
                                
                                if (finalFound) {
                                    if (finalFound.name) {
                                        detailsHtml += `<div style="margin-top: 2px; color: #b0d4e6; font-size: 0.85em;"><strong>Name:</strong> ${finalFound.name}</div>`;
                                    }
                                    if (finalFound.partType) {
                                        detailsHtml += `<div style="margin-top: 1px; color: #999; font-size: 0.8em;"><strong>Type:</strong> ${finalFound.partType}</div>`;
                                    }
                                    if (finalFound.stats) {
                                        const statsPreview = finalFound.stats.length > 50 ? finalFound.stats.substring(0, 50) + '...' : finalFound.stats;
                                        detailsHtml += `<div style="margin-top: 1px; color: #999; font-size: 0.8em;"><strong>Stats:</strong> ${statsPreview}</div>`;
                                    }
                                } else {
                                    // If still not found, try to find part by spawn_code pattern in partsMap
                                    // Parts with typeId 234 might be stored with spawn_code like "ClassMod.stat_*"
                                    if (part.typeId === 234) {
                                        const partValue = parseInt(partId);
                                        let syntheticInfo = null;
                                        
                                        // Try to find part by searching gameData directly
                                        // Parts with typeId 234 are stored in characters.class_mods.Substats.Perk or Substats.Firmware
                                        let foundBySpawnCode = null;
                                        
                                        // First, try partsMap lookup
                                        for (const [key, value] of partsMap.entries()) {
                                            if (value && typeof value === 'object' && value.typeId === 234) {
                                                const valueId = String(value.id || '');
                                                const valueFullId = String(value.fullId || '');
                                                // Match by numeric ID after colon, or exact match
                                                const valueNumericId = valueFullId.includes(':') ? valueFullId.split(':')[1] : 
                                                                       (valueId.includes(':') ? valueId.split(':')[1] : valueId);
                                                if (valueNumericId === partId || valueId === partId || valueFullId === fullId) {
                                                    foundBySpawnCode = value;
                                                    break;
                                                }
                                            }
                                        }
                                        
                                        // If not found in partsMap, search gameData directly
                                        if (!foundBySpawnCode && gameData && gameData.characters) {
                                            for (const [charName, charData] of Object.entries(gameData.characters)) {
                                                if (charData && charData.class_mods) {
                                                    // Check Substats.Perk
                                                    const substats = charData.class_mods.Substats || charData.class_mods.substats;
                                                    if (substats) {
                                                        const perkData = substats.Perk || substats.perk;
                                                        if (perkData && perkData.parts && Array.isArray(perkData.parts)) {
                                                            for (const rawPart of perkData.parts) {
                                                                const rawPartId = String(rawPart.id || '');
                                                                // Match if part.id is numeric and equals partId, or if it's "234:partId"
                                                                if (rawPartId === partId || rawPartId === fullId || 
                                                                    (rawPartId.includes(':') && rawPartId.split(':')[1] === partId)) {
                                                                    // Found the raw part! Extract info
                                                                    foundBySpawnCode = {
                                                                        id: fullId,
                                                                        fullId: fullId,
                                                                        typeId: 234,
                                                                        name: rawPart.model_name || rawPart.name || rawPart.string || `Perk Stat ${partValue}`,
                                                                        modelName: rawPart.model_name,
                                                                        partType: 'Perk',
                                                                        path: 'Substats.Perk',
                                                                        category: 'Class Mod',
                                                                        stats: rawPart.stats || '',
                                                                        spawnCode: rawPart.spawn_code || rawPart.spawnCode || '',
                                                                        string: rawPart.string || '',
                                                                        effects: rawPart.effects || ''
                                                                    };
                                                                    break;
                                                                }
                                                            }
                                                        }
                                                        
                                                        // Check Substats.Firmware
                                                        if (!foundBySpawnCode) {
                                                            const firmwareData = substats.Firmware || substats.firmware;
                                                            if (firmwareData && firmwareData.parts && Array.isArray(firmwareData.parts)) {
                                                                for (const rawPart of firmwareData.parts) {
                                                                    const rawPartId = String(rawPart.id || '');
                                                                    if (rawPartId === partId || rawPartId === fullId || 
                                                                        (rawPartId.includes(':') && rawPartId.split(':')[1] === partId)) {
                                                                        foundBySpawnCode = {
                                                                            id: fullId,
                                                                            fullId: fullId,
                                                                            typeId: 234,
                                                                            name: rawPart.model_name || rawPart.name || rawPart.string || `Firmware Stat ${partValue}`,
                                                                            modelName: rawPart.model_name,
                                                                            partType: 'Firmware',
                                                                            path: 'Substats.Firmware',
                                                                            category: 'Class Mod',
                                                                            stats: rawPart.stats || '',
                                                                            spawnCode: rawPart.spawn_code || rawPart.spawnCode || '',
                                                                            string: rawPart.string || '',
                                                                            effects: rawPart.effects || ''
                                                                        };
                                                                        break;
                                                                    }
                                                                }
                                                            }
                                                        }
                                                    }
                                                    
                                                    // Also check top-level Perk and Firmware
                                                    if (!foundBySpawnCode) {
                                                        const perkTop = charData.class_mods.Perk || charData.class_mods.perk;
                                                        if (perkTop && perkTop.parts && Array.isArray(perkTop.parts)) {
                                                            for (const rawPart of perkTop.parts) {
                                                                const rawPartId = String(rawPart.id || '');
                                                                if (rawPartId === partId || rawPartId === fullId || 
                                                                    (rawPartId.includes(':') && rawPartId.split(':')[1] === partId)) {
                                                                    foundBySpawnCode = {
                                                                        id: fullId,
                                                                        fullId: fullId,
                                                                        typeId: 234,
                                                                        name: rawPart.model_name || rawPart.name || rawPart.string || `Perk Stat ${partValue}`,
                                                                        modelName: rawPart.model_name,
                                                                        partType: 'Perk',
                                                                        path: 'Perk',
                                                                        category: 'Class Mod',
                                                                        stats: rawPart.stats || '',
                                                                        spawnCode: rawPart.spawn_code || rawPart.spawnCode || '',
                                                                        string: rawPart.string || '',
                                                                        effects: rawPart.effects || ''
                                                                    };
                                                                    break;
                                                                }
                                                            }
                                                        }
                                                        
                                                        const firmwareTop = charData.class_mods.Firmware || charData.class_mods.firmware;
                                                        if (!foundBySpawnCode && firmwareTop && firmwareTop.parts && Array.isArray(firmwareTop.parts)) {
                                                            for (const rawPart of firmwareTop.parts) {
                                                                const rawPartId = String(rawPart.id || '');
                                                                if (rawPartId === partId || rawPartId === fullId || 
                                                                    (rawPartId.includes(':') && rawPartId.split(':')[1] === partId)) {
                                                                    foundBySpawnCode = {
                                                                        id: fullId,
                                                                        fullId: fullId,
                                                                        typeId: 234,
                                                                        name: rawPart.model_name || rawPart.name || rawPart.string || `Firmware Stat ${partValue}`,
                                                                        modelName: rawPart.model_name,
                                                                        partType: 'Firmware',
                                                                        path: 'Firmware',
                                                                        category: 'Class Mod',
                                                                        stats: rawPart.stats || '',
                                                                        spawnCode: rawPart.spawn_code || rawPart.spawnCode || '',
                                                                        string: rawPart.string || '',
                                                                        effects: rawPart.effects || ''
                                                                    };
                                                                    break;
                                                                }
                                                            }
                                                        }
                                                    }
                                                    
                                                    if (foundBySpawnCode) break;
                                                }
                                            }
                                        }
                                        
                                        if (foundBySpawnCode) {
                                            // Use the found part info - show all available information
                                            if (foundBySpawnCode.name || foundBySpawnCode.modelName) {
                                                const displayName = foundBySpawnCode.modelName || foundBySpawnCode.name;
                                                detailsHtml += `<div style="margin-top: 2px; color: #b0d4e6; font-size: 0.85em;"><strong>Name:</strong> ${displayName}</div>`;
                                            }
                                            if (foundBySpawnCode.partType) {
                                                detailsHtml += `<div style="margin-top: 1px; color: #999; font-size: 0.8em;"><strong>Type:</strong> ${foundBySpawnCode.partType}</div>`;
                                            }
                                            if (foundBySpawnCode.stats) {
                                                detailsHtml += `<div style="margin-top: 1px; color: #4fc3f7; font-size: 0.85em;"><strong>Stats:</strong> ${foundBySpawnCode.stats}</div>`;
                                            }
                                            if (foundBySpawnCode.spawnCode) {
                                                detailsHtml += `<div style="margin-top: 1px; color: #999; font-size: 0.75em; font-family: monospace; opacity: 0.8;"><strong>Spawn Code:</strong> ${foundBySpawnCode.spawnCode}</div>`;
                                            }
                                            if (foundBySpawnCode.string && foundBySpawnCode.string !== foundBySpawnCode.spawnCode) {
                                                detailsHtml += `<div style="margin-top: 1px; color: #999; font-size: 0.75em; font-family: monospace; opacity: 0.8;"><strong>String:</strong> ${foundBySpawnCode.string}</div>`;
                                            }
                                            if (foundBySpawnCode.effects) {
                                                detailsHtml += `<div style="margin-top: 1px; color: #999; font-size: 0.8em;"><strong>Effects:</strong> ${foundBySpawnCode.effects}</div>`;
                                            }
                                            if (foundBySpawnCode.path) {
                                                detailsHtml += `<div style="margin-top: 1px; color: #666; font-size: 0.7em; opacity: 0.7;"><strong>Path:</strong> ${foundBySpawnCode.path}</div>`;
                                            }
                                        } else {
                                            // Create synthetic part info based on part ID ranges
                                            // Perk parts: 1-68, 95-102
                                            // Firmware parts: 74-94
                                            if ((partValue >= 1 && partValue <= 68) || (partValue >= 95 && partValue <= 102)) {
                                                syntheticInfo = {
                                                    id: fullId,
                                                    fullId: fullId,
                                                    typeId: 234,
                                                    name: `Perk Stat ${partValue}`,
                                                    partType: 'Perk',
                                                    path: 'Perk',
                                                    category: 'Class Mod',
                                                    stats: 'Class Mod Perk Stat',
                                                    effects: ''
                                                };
                                            } else if (partValue >= 74 && partValue <= 94) {
                                                syntheticInfo = {
                                                    id: fullId,
                                                    fullId: fullId,
                                                    typeId: 234,
                                                    name: `Firmware Stat ${partValue}`,
                                                    partType: 'Firmware',
                                                    path: 'Firmware',
                                                    category: 'Class Mod',
                                                    stats: 'Class Mod Firmware Stat',
                                                    effects: ''
                                                };
                                            }
                                            
                                            if (syntheticInfo) {
                                                detailsHtml += `<div style="margin-top: 2px; color: #b0d4e6; font-size: 0.85em;"><strong>Name:</strong> ${syntheticInfo.name}</div>`;
                                                detailsHtml += `<div style="margin-top: 1px; color: #999; font-size: 0.8em;"><strong>Type:</strong> ${syntheticInfo.partType}</div>`;
                                                detailsHtml += `<div style="margin-top: 1px; color: #999; font-size: 0.8em;"><strong>Stats:</strong> ${syntheticInfo.stats}</div>`;
                                            } else {
                                                // Debug output if DEBUG is enabled
                                                if (DEBUG) {
                                                    console.log(`[DEBUG] Still not found {234:${arrayValue}} after all searches`);
                                                    console.log(`[DEBUG] partsByTypeId.get(234) has ${allTypeParts.length} parts`);
                                                    if (allTypeParts.length > 0) {
                                                        console.log(`[DEBUG] Sample parts:`, allTypeParts.slice(0, 3).map(p => ({
                                                            id: p.id,
                                                            fullId: p.fullId,
                                                            typeId: p.typeId,
                                                            name: p.name
                                                        })));
                                                    }
                                                }
                                                detailsHtml += `<div style="margin-top: 2px; color: #999; font-size: 0.8em; font-style: italic;">No matching part found</div>`;
                                            }
                                        }
                                    } else {
                                        // Debug output if DEBUG is enabled
                                        if (DEBUG && part.typeId === 234) {
                                            console.log(`[DEBUG] Still not found {234:${arrayValue}} after all searches`);
                                            console.log(`[DEBUG] partsByTypeId.get(234) has ${allTypeParts.length} parts`);
                                            if (allTypeParts.length > 0) {
                                                console.log(`[DEBUG] Sample parts:`, allTypeParts.slice(0, 3).map(p => ({
                                                    id: p.id,
                                                    fullId: p.fullId,
                                                    typeId: p.typeId,
                                                    name: p.name
                                                })));
                                            }
                                        }
                                        detailsHtml += `<div style="margin-top: 2px; color: #999; font-size: 0.8em; font-style: italic;">No matching part found</div>`;
                                    }
                                }
                            }
                            detailsHtml += `</div>`;
                        });
                    }
                    
                    detailsDiv.innerHTML = detailsHtml;
                    infoDiv.appendChild(detailsDiv);
                    partDiv.appendChild(infoDiv);
                } else if (partInfo) {
                    const infoDiv = document.createElement('div');
                    infoDiv.className = 'part-info';
                    
                    // Add rarity badge to part name
                    const rarity = detectRarity(partInfo);
                    let rarityBadge = '';
                    if (rarity) {
                        const rarityStyle = getRarityStyle(rarity);
                        const badgeClass = `rarity-badge-${rarity.toLowerCase()}`;
                        rarityBadge = `<span class="rarity-badge ${badgeClass}">${rarityStyle.badge} ${rarityStyle.name}</span>`;
                    }
                    
                    // Check if this is a skill and get skill image
                    const isSkill = partInfo.partType === 'Skill' || partInfo.type === 'skill' || partInfo.skillName;
                    let skillImageHtml = '';
                    if (isSkill) {
                        // Use skillName, string, or name as fallback for skill name
                        const skillName = partInfo.skillName || partInfo.string || partInfo.name || '';
                        if (skillName) {
                            const characterName = partInfo.manufacturer || partInfo.context || '';
                            const skillImageUrl = getSkillImageUrl(skillName, characterName);
                            if (skillImageUrl) {
                                skillImageHtml = `<img src="${skillImageUrl}" class="skill-icon" alt="${skillName}" onerror="this.style.display='none'" style="width: 32px; height: 32px; margin: 0;">`;
                            }
                        }
                    }
                    
                    // Construct fullId for display
                    let displayFullId = partInfo.fullId;
                    if (part.type === 'simple') {
                        const currentItemTypeId = parseInt(document.getElementById('typeId').value);
                        if (currentItemTypeId && part.value) {
                            displayFullId = `${currentItemTypeId}:${part.value}`;
                        }
                    } else if (part.type === 'typed' && part.typeId && part.value) {
                        displayFullId = `${part.typeId}:${part.value}`;
                    }
                    
                    // Summary section (always visible)
                    const summaryDiv = document.createElement('div');
                    summaryDiv.className = 'part-info-summary';
                    
                    let summaryHtml = '';
                    if (skillImageHtml) {
                        summaryHtml += skillImageHtml;
                    }
                    
                    // For CoV/Torgue/Ripper magazines, show magazine TYPE instead of number of shots
                    let displayName = partInfo.name || 'Unknown Part';
                    if (partInfo.partType && partInfo.partType.toLowerCase() === 'magazine') {
                        const manufacturer = (partInfo.manufacturer || '').toLowerCase();
                        const isCoV = manufacturer.includes('cov') || manufacturer.includes('children of vault');
                        const isTorgue = manufacturer.includes('torgue');
                        const isRipper = manufacturer.includes('ripper');
                        
                        if ((isCoV || isTorgue || isRipper) && partInfo.stats) {
                            // Extract magazine type from stats (e.g., "Drum", "Box", "Clip", etc.)
                            const statsLower = partInfo.stats.toLowerCase();
                            const typeMatch = partInfo.stats.match(/(Drum|Box|Clip|Belt|Tube|Cylinder|Magazine Type)/i);
                            if (typeMatch) {
                                displayName = `${typeMatch[1]} Magazine`;
                            } else if (partInfo.effects) {
                                // Try to get type from effects
                                const effectsLower = partInfo.effects.toLowerCase();
                                const effectsTypeMatch = partInfo.effects.match(/(Drum|Box|Clip|Belt|Tube|Cylinder)/i);
                                if (effectsTypeMatch) {
                                    displayName = `${effectsTypeMatch[1]} Magazine`;
                                }
                            }
                        }
                    }
                    
                    summaryHtml += `<div style="flex: 1; min-width: 0;"><strong>${displayName}</strong>${rarityBadge}`;
                    
                    // Show essential info in summary
                    if (displayFullId && displayFullId !== partInfo.id) {
                        summaryHtml += `<div style="font-size: 0.85em; color: #b0d4e6; margin-top: 2px;"><code>${displayFullId}</code></div>`;
                    } else if (partInfo.id) {
                        summaryHtml += `<div style="font-size: 0.85em; color: #b0d4e6; margin-top: 2px;"><code>${partInfo.id}</code></div>`;
                    }
                    
                    // Show key stats if available
                    if (partInfo.stats) {
                        const statsPreview = partInfo.stats.length > 60 ? partInfo.stats.substring(0, 60) + '...' : partInfo.stats;
                        summaryHtml += `<div style="font-size: 0.8em; color: #999; margin-top: 3px; opacity: 0.8;">${statsPreview}</div>`;
                    }
                    summaryHtml += `</div>`;
                    
                    // Toggle button
                    summaryHtml += `<button class="toggle-details-btn" onclick="this.parentElement.nextElementSibling.classList.toggle('expanded'); this.textContent = this.parentElement.nextElementSibling.classList.contains('expanded') ? '▼ Hide Details' : '▶ Show Details';">▶ Show Details</button>`;
                    
                    summaryDiv.innerHTML = summaryHtml;
                    infoDiv.appendChild(summaryDiv);
                    
                    // Details section (collapsible)
                    const detailsDiv = document.createElement('div');
                    detailsDiv.className = 'part-info-details';
                    
                    let detailsHtml = '';
                    // Essential fields
                    if (partInfo.id && displayFullId !== partInfo.id) detailsHtml += `<div class="part-details-item"><strong>ID:</strong> ${partInfo.id}</div>`;
                    if (displayFullId && displayFullId !== partInfo.id) detailsHtml += `<div class="part-details-item"><strong>Full ID:</strong> ${displayFullId}</div>`;
                    
                    // Only show String OR Spawn Code if they're different (avoid redundancy)
                    const stringValue = partInfo.string || '';
                    const spawnCodeValue = partInfo.spawnCode || '';
                    if (stringValue && spawnCodeValue && stringValue !== spawnCodeValue) {
                        // Both exist and are different, show both
                        if (stringValue) detailsHtml += `<div class="part-details-item"><strong>String:</strong> ${stringValue}</div>`;
                        if (spawnCodeValue) detailsHtml += `<div class="part-details-item"><strong>Spawn Code:</strong> ${spawnCodeValue}</div>`;
                    } else if (stringValue || spawnCodeValue) {
                        // Only one exists or they're the same, show one
                        const displayValue = stringValue || spawnCodeValue;
                        detailsHtml += `<div class="part-details-item"><strong>String/Spawn Code:</strong> ${displayValue}</div>`;
                    }
                    
                    // Stats and effects (full text)
                    if (partInfo.stats) detailsHtml += `<div class="part-details-item"><strong>Stats:</strong> ${partInfo.stats}</div>`;
                    if (partInfo.effects) detailsHtml += `<div class="part-details-item"><strong>Effects:</strong> ${partInfo.effects}</div>`;
                    
                    // Additional metadata - hide redundant fields when browsing local parts
                    const isLocalPart = part.type === 'simple';
                    if (partInfo.partType) detailsHtml += `<div class="part-details-item"><strong>Part Type:</strong> ${partInfo.partType}</div>`;
                    // Hide Category, Context, Manufacturer, Weapon Type, Type ID for local parts (redundant info)
                    if (!isLocalPart) {
                        if (partInfo.category) detailsHtml += `<div class="part-details-item"><strong>Category:</strong> ${partInfo.category}</div>`;
                        if (partInfo.context) detailsHtml += `<div class="part-details-item"><strong>Context:</strong> ${partInfo.context}</div>`;
                        if (partInfo.manufacturer) detailsHtml += `<div class="part-details-item"><strong>Manufacturer:</strong> ${partInfo.manufacturer}</div>`;
                        if (partInfo.weaponType) detailsHtml += `<div class="part-details-item"><strong>Weapon Type:</strong> ${partInfo.weaponType}</div>`;
                        if (partInfo.typeId) detailsHtml += `<div class="part-details-item"><strong>Type ID:</strong> ${partInfo.typeId}</div>`;
                    }
                    if (partInfo.legendaryName) detailsHtml += `<div class="part-details-item"><strong>Legendary Name:</strong> ${partInfo.legendaryName}</div>`;
                    if (partInfo.perkName) detailsHtml += `<div class="part-details-item"><strong>Perk Name:</strong> ${partInfo.perkName}</div>`;
                    if (partInfo.rarity) detailsHtml += `<div class="part-details-item"><strong>Rarity:</strong> ${partInfo.rarity}</div>`;
                    if (partInfo.type) detailsHtml += `<div class="part-details-item"><strong>Type:</strong> ${partInfo.type}</div>`;
                    if (partInfo.compNumericId !== null && partInfo.compNumericId !== undefined) detailsHtml += `<div class="part-details-item"><strong>Comp Numeric ID:</strong> ${partInfo.compNumericId}</div>`;
                    if (partInfo.legendaryComp) detailsHtml += `<div class="part-details-item"><strong>Legendary Comp:</strong> ${partInfo.legendaryComp}</div>`;
                    
                    // Skill-specific fields
                    if (partInfo.skillName) detailsHtml += `<div class="part-details-item"><strong>Skill Name:</strong> ${partInfo.skillName}</div>`;
                    if (partInfo.treeName) detailsHtml += `<div class="part-details-item"><strong>Tree Name:</strong> ${partInfo.treeName}</div>`;
                    if (partInfo.description) detailsHtml += `<div class="part-details-item"><strong>Description:</strong> ${partInfo.description}</div>`;
                    if (partInfo.limiter) detailsHtml += `<div class="part-details-item"><strong>Limiter:</strong> ${partInfo.limiter}</div>`;
                    if (partInfo.colors) detailsHtml += `<div class="part-details-item"><strong>Colors:</strong> ${partInfo.colors}</div>`;
                    if (partInfo.skillIds) detailsHtml += `<div class="part-details-item"><strong>Skill IDs:</strong> Available (select points)</div>`;
                    
                    detailsDiv.innerHTML = detailsHtml;
                    infoDiv.appendChild(detailsDiv);
                    partDiv.appendChild(infoDiv);
                }

                const browserDiv = document.createElement('div');
                browserDiv.className = 'part-browser';
                browserDiv.id = `partBrowser${index}`;
                partDiv.appendChild(browserDiv);

                return partDiv;
            }

        function showPartBrowser(partIndex, partType, typeId = null) {
            // Handle special case for part builder (index -1)
            let browser;
            if (partIndex === -1) {
                // Create a temporary browser for the part builder
                let tempBrowser = document.getElementById('tempPartBrowser');
                if (!tempBrowser) {
                    tempBrowser = document.createElement('div');
                    tempBrowser.id = 'tempPartBrowser';
                    tempBrowser.className = 'part-browser';
                    // Try to find the part builder container (new or old structure)
                    const partBuilderContainer = document.querySelector('.part-builder-modern') || 
                                                  document.querySelector('.part-builder') ||
                                                  document.getElementById('quickAddBuilder');
                    if (partBuilderContainer) {
                        partBuilderContainer.appendChild(tempBrowser);
                    } else {
                        // Fallback: append to the parts section
                        const partsSection = document.querySelector('.parts-quick-add') || 
                                            document.querySelector('.part-builder');
                        if (partsSection) {
                            partsSection.appendChild(tempBrowser);
                        }
                    }
                }
                browser = tempBrowser;
            } else {
                browser = document.getElementById(`partBrowser${partIndex}`);
            }
            
            if (!browser) return;
            
            const isActive = browser.classList.contains('active');
            
            document.querySelectorAll('.part-browser').forEach(b => {
                b.classList.remove('active');
                b.innerHTML = '';
            });

            if (isActive && partIndex !== -1) return;

            browser.classList.add('active');

            const searchDiv = document.createElement('div');
            searchDiv.className = 'search-box';
            const searchInput = document.createElement('input');
            searchInput.type = 'text';
            searchInput.id = `part-browser-search-${partIndex !== null ? partIndex : 'global'}`;
            searchInput.name = `part-browser-search-${partIndex !== null ? partIndex : 'global'}`;
            searchInput.placeholder = '🔍 Search parts by name, stats, or effects...';
            searchInput.oninput = (e) => {
                const activeRarity = browser.querySelector('.rarity-filter-btn.active');
                const currentRarity = activeRarity ? activeRarity.dataset.rarity || 'all' : 'all';
                const activePartType = browser.querySelector('.part-type-filter-btn.active');
                const currentPartType = activePartType ? activePartType.dataset.partType || 'all' : 'all';
                filterParts(browser, e.target.value, partType, typeId, partIndex, currentRarity, currentPartType);
            };
            searchDiv.appendChild(searchInput);
            
            // Create filter section container
            const filterSection = document.createElement('div');
            filterSection.className = 'filter-section';
            
            // Add rarity filter
            const rarityFilterRow = document.createElement('div');
            rarityFilterRow.className = 'filter-row';
            
            const rarityFilterLabel = document.createElement('span');
            rarityFilterLabel.className = 'filter-label';
            rarityFilterLabel.textContent = 'Rarity:';
            rarityFilterRow.appendChild(rarityFilterLabel);
            
            const rarityFilterButtons = document.createElement('div');
            rarityFilterButtons.className = 'filter-buttons';
            
            const allBtn = document.createElement('button');
            allBtn.textContent = 'All';
            allBtn.className = 'rarity-filter-btn active';
            allBtn.style.cssText = 'padding: 4px 8px; border-radius: 4px; border: 1px solid rgba(79, 195, 247, 0.3); background: rgba(79, 195, 247, 0.2); color: #81d4fa; cursor: pointer; font-size: 0.8em; transition: all 0.2s;';
            allBtn.onclick = () => {
                document.querySelectorAll('.rarity-filter-btn').forEach(btn => btn.classList.remove('active'));
                allBtn.classList.add('active');
                const activePartType = browser.querySelector('.part-type-filter-btn.active');
                const currentPartType = activePartType ? activePartType.dataset.partType || 'all' : 'all';
                filterParts(browser, searchInput.value, partType, typeId, partIndex, 'all', currentPartType);
            };
            rarityFilterButtons.appendChild(allBtn);
            
            Object.keys(rarityColors).forEach(rarity => {
                const btn = document.createElement('button');
                const rarityData = rarityColors[rarity];
                btn.textContent = `${rarityData.badge} ${rarityData.shortName}`;
                btn.className = 'rarity-filter-btn';
                btn.style.cssText = `padding: 4px 8px; border-radius: 4px; border: 1px solid ${rarityData.borderColor}; background: ${rarityData.bgColor}; color: ${rarityData.textColor}; cursor: pointer; font-size: 0.8em; transition: all 0.2s;`;
                btn.onmouseover = () => {
                    btn.style.transform = 'scale(1.05)';
                    btn.style.boxShadow = `0 0 6px ${rarityData.borderColor}`;
                };
                btn.onmouseout = () => {
                    btn.style.transform = 'scale(1)';
                    btn.style.boxShadow = 'none';
                };
                btn.onclick = () => {
                    document.querySelectorAll('.rarity-filter-btn').forEach(b => b.classList.remove('active'));
                    btn.classList.add('active');
                    const activePartType = browser.querySelector('.part-type-filter-btn.active');
                    const currentPartType = activePartType ? activePartType.dataset.partType || 'all' : 'all';
                    filterParts(browser, searchInput.value, partType, typeId, partIndex, rarity, currentPartType);
                };
                rarityFilterButtons.appendChild(btn);
            });
            
            rarityFilterRow.appendChild(rarityFilterButtons);
            filterSection.appendChild(rarityFilterRow);
            
            // Create part type filter row - will be populated after we get the parts
            const partTypeFilterRow = document.createElement('div');
            partTypeFilterRow.className = 'filter-row part-type-filter';
            
            const partTypeFilterLabel = document.createElement('span');
            partTypeFilterLabel.className = 'filter-label';
            partTypeFilterLabel.textContent = 'Type:';
            partTypeFilterRow.appendChild(partTypeFilterLabel);
            
            filterSection.appendChild(partTypeFilterRow);
            searchDiv.appendChild(filterSection);
            browser.appendChild(searchDiv);

            // Populate part type filter and parts browser
            populatePartTypeFilter(browser, partType, typeId, partIndex, 'all');
            populatePartBrowser(browser, partType, typeId, '', partIndex, 'all', 'all');
        }

        function populatePartBrowser(browser, partType, typeId, searchTerm = '', partIndex = null, rarityFilter = 'all', partTypeFilter = 'all') {
            // Clear existing parts list (but keep search box if it exists)
            const partsListOld = browser.querySelector('.parts-list');
            if (partsListOld) {
                partsListOld.remove();
            }
            
            const partsList = document.createElement('div');
            partsList.className = 'parts-list';
            let partsToShow = [];

            if (partType === 'simple') {
                const currentTypeId = parseInt(document.getElementById('typeId').value);
                if (currentTypeId && partsByTypeId.has(currentTypeId)) {
                    partsToShow = partsByTypeId.get(currentTypeId);
                    
                    // Don't include typeId 6 comp parts for enhancements
                    // Type ID 6 is for weapons (rarity), not enhancements
                    
                    // Debug logging for part 73
                    if (currentTypeId === 13) {
                        const part73 = partsToShow.find(p => {
                            const id = String(p.id || '');
                            const fullId = String(p.fullId || '');
                            return id === '73' || id === '13:73' || fullId === '13:73' || fullId.endsWith(':73');
                        });
                        if (part73) {
                            console.log(`  ✓ Found part 73 in partsByTypeId for typeId 13:`, {
                                id: part73.id,
                                fullId: part73.fullId,
                                name: part73.name,
                                typeId: part73.typeId,
                                spawnCode: part73.spawnCode,
                                modelName: part73.modelName
                            });
                        } else {
                            console.log(`  ⚠️ Part 73 NOT found in partsByTypeId for typeId 13. Total parts: ${partsToShow.length}`);
                            // Check if it exists with different format
                            const all73s = partsToShow.filter(p => {
                                const id = String(p.id || '');
                                const fullId = String(p.fullId || '');
                                return id.includes('73') || fullId.includes('73');
                            });
                            if (all73s.length > 0) {
                                console.log(`  Found ${all73s.length} parts containing 73:`, all73s.map(p => ({
                                    id: p.id,
                                    fullId: p.fullId,
                                    name: p.name,
                                    typeId: p.typeId
                                })));
                            }
                        }
                    }
                    
                    // Debug logging
                    if (searchTerm && searchTerm.toLowerCase().includes('comp')) {
                        console.log(`  Debug: Searching for "comp" in typeId ${currentTypeId}, found ${partsToShow.length} total parts`);
                        const compParts = partsToShow.filter(p => 
                            (p.name && p.name.toLowerCase().includes('comp')) ||
                            (p.spawnCode && String(p.spawnCode).toLowerCase().includes('comp')) ||
                            (p.string && p.string.toLowerCase().includes('comp')) ||
                            (p.partType && p.partType.toLowerCase().includes('comp'))
                        );
                        console.log(`  Debug: Found ${compParts.length} parts with "comp" in name/spawnCode/string/partType`);
                        if (compParts.length > 0) {
                            console.log(`  Debug: Sample comp parts:`, compParts.slice(0, 5).map(p => ({
                                id: p.id,
                                fullId: p.fullId,
                                name: p.name,
                                spawnCode: p.spawnCode,
                                string: p.string,
                                partType: p.partType,
                                typeId: p.typeId,
                                category: p.category
                            })));
                        }
                        // Also check if typeId 247 has parts
                        if (partsByTypeId.has(247)) {
                            const type247Parts = partsByTypeId.get(247);
                            console.log(`  Debug: Type ID 247 has ${type247Parts.length} parts`);
                            const type247CompParts = type247Parts.filter(p => 
                                (p.string && p.string.toLowerCase().includes('comp')) ||
                                (p.spawnCode && String(p.spawnCode).toLowerCase().includes('comp'))
                            );
                            console.log(`  Debug: Type ID 247 has ${type247CompParts.length} comp parts`);
                            if (type247CompParts.length > 0) {
                                console.log(`  Debug: Sample Type ID 247 comp parts:`, type247CompParts.slice(0, 5).map(p => ({
                                    id: p.id,
                                    fullId: p.fullId,
                                    name: p.name,
                                    string: p.string,
                                    typeId: p.typeId,
                                    category: p.category
                                })));
                            }
                        }
                    }
                } else {
                    partsToShow = Array.from(partsMap.values());
                }
                // Filter out parts with value 0 (but allow string IDs like skills)
                // Also ensure we include parts where the typeId matches the current item's typeId
                // OR include comp/rarity parts that are associated with this item type
                partsToShow = partsToShow.filter(p => {
                    const partId = String(p.id || '');
                    const fullId = String(p.fullId || '');
                    const partType = String(p.partType || '').toLowerCase();
                    const partName = String(p.name || '').toLowerCase();
                    const spawnCode = String(p.spawnCode || '').toLowerCase();
                    const string = String(p.string || '').toLowerCase();
                    
                    // Check if it's a comp/rarity part (these should be included even if typeId doesn't match)
                    const isCompPart = partType.includes('comp') || partType.includes('rarity') || 
                                      partName.includes('comp') || partName.includes('rarity') ||
                                      String(spawnCode).includes('comp') || String(string).includes('comp');
                    
                    // First check: if part's typeId matches current item's typeId, include it
                    if (p.typeId === currentTypeId) {
                        // If it's a string ID (like skills), don't filter it out
                        if (isNaN(parseInt(partId)) && partId && !partId.includes(':')) {
                            return true; // Keep string IDs
                        }
                        
                        // Extract numeric part ID from various formats
                        let numericPartId = null;
                        
                        // Check fullId first (e.g., "13:73")
                        if (fullId && fullId.includes(':')) {
                            const fullIdParts = fullId.split(':');
                            if (fullIdParts.length === 2) {
                                const fullIdTypeId = parseInt(fullIdParts[0]);
                                const fullIdPartId = fullIdParts[1];
                                // If the typeId in fullId matches currentTypeId, extract the part ID
                                if (fullIdTypeId === currentTypeId) {
                                    numericPartId = parseInt(fullIdPartId);
                                    // Include if it's a valid number and not 0
                                    if (numericPartId !== 0 && !isNaN(numericPartId)) {
                                        return true;
                                    }
                                }
                            }
                        }
                        
                        // If we didn't get it from fullId, try partId
                        if (numericPartId === null || isNaN(numericPartId)) {
                            if (partId && partId.includes(':')) {
                                const idParts = partId.split(':');
                                if (idParts.length === 2) {
                                    const idTypeId = parseInt(idParts[0]);
                                    const idPartId = idParts[1];
                                    // If the typeId in id matches currentTypeId, extract the part ID
                                    if (idTypeId === currentTypeId) {
                                        numericPartId = parseInt(idPartId);
                                        // Include if it's a valid number and not 0
                                        if (numericPartId !== 0 && !isNaN(numericPartId)) {
                                            return true;
                                        }
                                    }
                                }
                            } else if (partId) {
                                numericPartId = parseInt(partId);
                            }
                        }
                        
                        // Include if it's a valid number and not 0
                        if (numericPartId !== 0 && !isNaN(numericPartId)) {
                            return true;
                        }
                        
                        return false;
                    }
                    
                    // If typeId doesn't match, but it's a comp/rarity part, include it ONLY if:
                    // 1. It's not from typeId 6 (weapons rarity, not for enhancements)
                    // 2. For enhancements, only include comp parts from enhancement typeIds
                    if (isCompPart && p.typeId !== 6) {
                        // For enhancements, only include comp parts from enhancement typeIds
                        if (isEnhancementTypeId(currentTypeId)) {
                            // Only include comp parts from enhancement typeIds (not typeId 6)
                            if (isEnhancementTypeId(p.typeId)) {
                                // Extract numeric part ID to ensure it's not 0
                                let numericPartId = null;
                                if (fullId && fullId.includes(':')) {
                                    const fullIdParts = fullId.split(':');
                                    if (fullIdParts.length === 2) {
                                        numericPartId = parseInt(fullIdParts[1]);
                                    }
                                } else if (partId && !partId.includes(':')) {
                                    numericPartId = parseInt(partId);
                                }
                                // Include comp parts if they have a valid numeric ID (not 0)
                                if (numericPartId !== null && numericPartId !== 0 && !isNaN(numericPartId)) {
                                    return true;
                                }
                            }
                        } else {
                            // For non-enhancements, include comp parts from any typeId (except 6)
                            // Extract numeric part ID to ensure it's not 0
                            let numericPartId = null;
                            if (fullId && fullId.includes(':')) {
                                const fullIdParts = fullId.split(':');
                                if (fullIdParts.length === 2) {
                                    numericPartId = parseInt(fullIdParts[1]);
                                }
                            } else if (partId && !partId.includes(':')) {
                                numericPartId = parseInt(partId);
                            }
                            // Include comp parts if they have a valid numeric ID (not 0)
                            if (numericPartId !== null && numericPartId !== 0 && !isNaN(numericPartId)) {
                                return true;
                            }
                        }
                    }
                    
                    // If typeId doesn't match and it's not a comp part, exclude it
                    return false;
                });
            } else if (partType === 'typed') {
                // For typed parts (Type:Num), show all parts for the specified typeId
                // For part builder (partIndex === -1), use the typeId parameter directly
                // For existing parts, use the typeId from the part field, or fall back to form's typeId
                let targetTypeId = typeId;
                
                if (partIndex === -1) {
                    // Part builder: use the typeId parameter (from newPartTypeId)
                    targetTypeId = typeId;
                } else if (partIndex !== null) {
                    // Existing part: get typeId from the part's data
                    const part = currentParts[partIndex];
                    if (part && part.typeId) {
                        targetTypeId = part.typeId;
                    } else {
                        targetTypeId = typeId || parseInt(document.getElementById('typeId').value);
                    }
                } else {
                    // Fallback to form's typeId
                    targetTypeId = typeId || parseInt(document.getElementById('typeId').value);
                }
                
                // If targetTypeId is 0, show ALL parts from all Type IDs (master search)
                if (targetTypeId === 0 || targetTypeId === null || targetTypeId === undefined) {
                    // Collect all parts from all Type IDs
                    partsToShow = [];
                    for (const [typeIdKey, partsArray] of partsByTypeId.entries()) {
                        partsToShow = partsToShow.concat(partsArray);
                    }
                    // Filter out parts with value 0 (but allow string IDs like skills)
                    partsToShow = partsToShow.filter(p => {
                        const partId = p.id || p.fullId || '';
                        // If it's a string ID (like skills), don't filter it out
                        if (isNaN(parseInt(partId))) {
                            return true; // Keep string IDs
                        }
                        if (partId.includes(':')) {
                            const value = parseInt(partId.split(':')[1]);
                            return value !== 0 && !isNaN(value);
                        }
                        const value = parseInt(partId);
                        return value !== 0 && !isNaN(value);
                    });
                } else if (targetTypeId && partsByTypeId.has(targetTypeId)) {
                    // Show ALL parts for this specific typeId (not just manufacturer parts)
                    partsToShow = partsByTypeId.get(targetTypeId);
                    
                    // Debug logging for typeID 1
                    if (targetTypeId === 1) {
                        console.log(`[DEBUG] TypeID 1: Found ${partsToShow.length} parts in partsByTypeId.get(1)`);
                        if (partsToShow.length > 0) {
                            console.log(`[DEBUG] TypeID 1 sample parts:`, partsToShow.slice(0, 3).map(p => ({
                                id: p.id,
                                fullId: p.fullId,
                                name: p.name,
                                typeId: p.typeId
                            })));
                        }
                    }
                    
                    // Filter out parts with value 0 (but allow string IDs like skills)
                    partsToShow = partsToShow.filter(p => {
                        const partId = p.id || p.fullId || '';
                        // If it's a string ID (like skills), don't filter it out
                        if (isNaN(parseInt(partId))) {
                            return true; // Keep string IDs
                        }
                        if (partId.includes(':')) {
                            const value = parseInt(partId.split(':')[1]);
                            return value !== 0 && !isNaN(value);
                        }
                        const value = parseInt(partId);
                        return value !== 0 && !isNaN(value);
                    });
                } else if (targetTypeId === 1) {
                    // Special handling: if typeId 1 is requested but not in partsByTypeId, try to find parts in partsMap
                    console.log(`[DEBUG] TypeID 1: Not in partsByTypeId, searching partsMap...`);
                    const type1Parts = Array.from(partsMap.values()).filter(p => p.typeId === 1);
                    console.log(`[DEBUG] TypeID 1: Found ${type1Parts.length} parts in partsMap with typeId === 1`);
                    if (type1Parts.length > 0) {
                        partsToShow = type1Parts;
                        // Also ensure typeId 1 is in partsByTypeId for future use
                        if (!partsByTypeId.has(1)) {
                            partsByTypeId.set(1, type1Parts);
                        }
                        console.log(`[DEBUG] TypeID 1: Added ${type1Parts.length} parts to partsByTypeId`);
                    } else {
                        console.warn(`[WARNING] TypeID 1: No parts found in partsMap either. Total partsMap size: ${partsMap.size}`);
                        // Try searching by fullId pattern "1:X"
                        const type1ByFullId = Array.from(partsMap.values()).filter(p => {
                            const fullId = String(p.fullId || '');
                            return fullId.startsWith('1:');
                        });
                        console.log(`[DEBUG] TypeID 1: Found ${type1ByFullId.length} parts with fullId starting with "1:"`);
                        if (type1ByFullId.length > 0) {
                            partsToShow = type1ByFullId;
                            if (!partsByTypeId.has(1)) {
                                partsByTypeId.set(1, type1ByFullId);
                            }
                        }
                    }
                } else if (targetTypeId) {
                    // TypeId specified but no parts found
                    partsToShow = [];
                } else {
                    // No typeId specified - show all parts (master search)
                    partsToShow = [];
                    for (const [typeIdKey, partsArray] of partsByTypeId.entries()) {
                        partsToShow = partsToShow.concat(partsArray);
                    }
                    partsToShow = partsToShow.filter(p => {
                        const partId = p.id || p.fullId || '';
                        if (isNaN(parseInt(partId))) {
                            return true;
                        }
                        if (partId.includes(':')) {
                            const value = parseInt(partId.split(':')[1]);
                            return value !== 0 && !isNaN(value);
                        }
                        const value = parseInt(partId);
                        return value !== 0 && !isNaN(value);
                    });
                }
            }

            // Apply rarity filter first
            if (rarityFilter && rarityFilter !== 'all') {
                partsToShow = partsToShow.filter(p => {
                    const partRarity = detectRarity(p);
                    return partRarity === rarityFilter;
                });
            }
            
            // Apply part type filter
            if (partTypeFilter && partTypeFilter !== 'all') {
                partsToShow = partsToShow.filter(p => {
                    return p.partType === partTypeFilter;
                });
            }
            
            if (searchTerm) {
                const term = searchTerm.toLowerCase().trim();
                // Split search term into words for multi-word matching
                const searchWords = term.split(/\s+/).filter(w => w.length > 0);
                
                partsToShow = partsToShow.filter(p => {
                    // If multiple words, all must match (AND logic)
                    if (searchWords.length > 1) {
                        return searchWords.every(word => {
                            return (
                                (p.name && p.name.toLowerCase().includes(word)) ||
                                (p.string && p.string.toLowerCase().includes(word)) ||
                                (p.spawnCode && String(p.spawnCode).toLowerCase().includes(word)) ||
                                (p.stats && p.stats.toLowerCase().includes(word)) ||
                                (p.effects && p.effects.toLowerCase().includes(word)) ||
                                (p.id && p.id.toLowerCase().includes(word)) ||
                                (p.fullId && p.fullId.toLowerCase().includes(word)) ||
                                (p.partType && p.partType.toLowerCase().includes(word)) ||
                                (p.manufacturer && p.manufacturer.toLowerCase().includes(word)) ||
                                (p.weaponType && p.weaponType.toLowerCase().includes(word)) ||
                                (p.legendaryName && p.legendaryName.toLowerCase().includes(word)) ||
                                (p.perkName && p.perkName.toLowerCase().includes(word)) ||
                                (p.rarity && p.rarity.toLowerCase().includes(word)) ||
                                (p.skillName && p.skillName.toLowerCase().includes(word)) ||
                                (p.treeName && p.treeName.toLowerCase().includes(word)) ||
                                (p.description && p.description.toLowerCase().includes(word)) ||
                                (p.colors && p.colors.toLowerCase().includes(word)) ||
                                (p.compNumericId !== null && p.compNumericId !== undefined && String(p.compNumericId).includes(word)) ||
                                (p.legendaryComp && p.legendaryComp.toLowerCase().includes(word)) ||
                                (p.modelName && p.modelName.toLowerCase().includes(word)) ||
                                (p.category && p.category.toLowerCase().includes(word)) ||
                                (p.context && p.context.toLowerCase().includes(word)) ||
                                (p.type && p.type.toLowerCase().includes(word))
                            );
                        });
                    } else {
                        // Single word search - match any field (OR logic)
                        return (
                            (p.name && p.name.toLowerCase().includes(term)) ||
                            (p.string && p.string.toLowerCase().includes(term)) ||
                            (p.spawnCode && String(p.spawnCode).toLowerCase().includes(term)) ||
                            (p.stats && p.stats.toLowerCase().includes(term)) ||
                            (p.effects && p.effects.toLowerCase().includes(term)) ||
                            (p.id && p.id.toLowerCase().includes(term)) ||
                            (p.fullId && p.fullId.toLowerCase().includes(term)) ||
                            (p.partType && p.partType.toLowerCase().includes(term)) ||
                            (p.manufacturer && p.manufacturer.toLowerCase().includes(term)) ||
                            (p.weaponType && p.weaponType.toLowerCase().includes(term)) ||
                            (p.legendaryName && p.legendaryName.toLowerCase().includes(term)) ||
                            (p.perkName && p.perkName.toLowerCase().includes(term)) ||
                            (p.rarity && p.rarity.toLowerCase().includes(term)) ||
                            (p.skillName && p.skillName.toLowerCase().includes(term)) ||
                            (p.treeName && p.treeName.toLowerCase().includes(term)) ||
                            (p.description && p.description.toLowerCase().includes(term)) ||
                            (p.colors && p.colors.toLowerCase().includes(term)) ||
                            (p.compNumericId !== null && p.compNumericId !== undefined && String(p.compNumericId).includes(term)) ||
                            (p.legendaryComp && p.legendaryComp.toLowerCase().includes(term)) ||
                            (p.modelName && p.modelName.toLowerCase().includes(term)) ||
                            (p.category && p.category.toLowerCase().includes(term)) ||
                            (p.context && p.context.toLowerCase().includes(term)) ||
                            (p.type && p.type.toLowerCase().includes(term))
                        );
                    }
                });
            }

            // Deduplicate parts based on typeId, id, and fullId
            const seenParts = new Map();
            partsToShow = partsToShow.filter(p => {
                // Create a unique key for each part
                const key = `${p.typeId || ''}:${p.id || ''}:${p.fullId || ''}`;
                if (seenParts.has(key)) {
                    return false; // Duplicate, filter it out
                }
                seenParts.set(key, true);
                return true; // Keep this part
            });

            // Limit results to prevent performance issues, but allow more for "All Parts" view
            const maxResults = (partType === 'typed' && (!typeId || typeId === 0)) ? 500 : 100;
            partsToShow = partsToShow.slice(0, maxResults);

            if (partsToShow.length === 0) {
                let message = 'No parts found.';
                if (partType === 'typed') {
                    const targetTypeId = typeId || parseInt(document.getElementById('typeId').value);
                    if (!targetTypeId || targetTypeId === 0) {
                        message = 'No parts found. Try a different search term or select a specific Type ID to filter.';
                    } else {
                        message = `No parts found for Type ID ${targetTypeId}. Try a different Type ID or search term.`;
                    }
                } else if (partType === 'simple') {
                    message = 'No parts found. Try a different search term.';
                } else {
                    message = 'No parts found. Try a different search term.';
                }
                partsList.innerHTML = `<div class="empty-state">${message}</div>`;
            } else {
                partsToShow.forEach(partInfo => {
                    const option = document.createElement('div');
                    option.className = 'part-option';
                    let detailsHtml = '';
                    
                    // Add all available fields
                    // For display, show a clean ID (extract just the part number if it's in format "typeId:partId")
                    let displayId = partInfo.id;
                    if (partInfo.id && partInfo.id.includes(':')) {
                        // Extract just the part number for cleaner display
                        const idParts = partInfo.id.split(':');
                        displayId = idParts[1]; // Show just the part number
                    }
                    // Organize details into logical groups for better readability
                    // Primary info
                    if (displayId) detailsHtml += `<div><strong>ID:</strong> <span style="color: #fff; font-family: monospace;">${displayId}</span></div>`;
                    if (partInfo.typeId) detailsHtml += `<div><strong>Type ID:</strong> <span style="color: #fff; font-weight: 600;">${partInfo.typeId}</span></div>`;
                    if (partInfo.partType) detailsHtml += `<div><strong>Part Type:</strong> <span style="color: #b0d4e6;">${partInfo.partType}</span></div>`;
                    
                    // Important details
                    if (partInfo.effects) detailsHtml += `<div><strong>Effects:</strong> <span style="color: #ffd700; font-weight: 600;">${partInfo.effects}</span></div>`;
                    if (partInfo.stats) detailsHtml += `<div><strong>Stats:</strong> <span style="color: #4fc3f7;">${partInfo.stats}</span></div>`;
                    if (partInfo.legendaryName) detailsHtml += `<div><strong>Legendary Name:</strong> <span style="color: #ff8c42; font-weight: 600;">${partInfo.legendaryName}</span></div>`;
                    if (partInfo.perkName) detailsHtml += `<div><strong>Perk Name:</strong> <span style="color: #ff8c42;">${partInfo.perkName}</span></div>`;
                    
                    // Category info
                    if (partInfo.manufacturer) detailsHtml += `<div><strong>Manufacturer:</strong> ${partInfo.manufacturer}</div>`;
                    if (partInfo.weaponType) detailsHtml += `<div><strong>Weapon Type:</strong> ${partInfo.weaponType}</div>`;
                    if (partInfo.category) detailsHtml += `<div><strong>Category:</strong> ${partInfo.category}</div>`;
                    if (partInfo.context) detailsHtml += `<div><strong>Context:</strong> ${partInfo.context}</div>`;
                    if (partInfo.rarity) detailsHtml += `<div><strong>Rarity:</strong> ${partInfo.rarity}</div>`;
                    
                    // Technical details (smaller, less prominent)
                    if (partInfo.fullId && partInfo.fullId !== partInfo.id) detailsHtml += `<div style="font-size: 0.85em; opacity: 0.8;"><strong>Full ID:</strong> <span style="font-family: monospace;">${partInfo.fullId}</span></div>`;
                    if (partInfo.string) detailsHtml += `<div style="font-size: 0.85em; opacity: 0.8;"><strong>String:</strong> <span style="font-family: monospace;">${partInfo.string}</span></div>`;
                    if (partInfo.spawnCode) detailsHtml += `<div style="font-size: 0.85em; opacity: 0.8;"><strong>Spawn Code:</strong> <span style="font-family: monospace;">${partInfo.spawnCode}</span></div>`;
                    if (partInfo.type) detailsHtml += `<div style="font-size: 0.85em; opacity: 0.8;"><strong>Type:</strong> ${partInfo.type}</div>`;
                    if (partInfo.compNumericId !== null && partInfo.compNumericId !== undefined) detailsHtml += `<div style="font-size: 0.85em; opacity: 0.8;"><strong>Comp Numeric ID:</strong> ${partInfo.compNumericId}</div>`;
                    if (partInfo.legendaryComp) detailsHtml += `<div style="font-size: 0.85em; opacity: 0.8;"><strong>Legendary Comp:</strong> ${partInfo.legendaryComp}</div>`;
                    
                    // Skill-specific fields
                    if (partInfo.skillName) detailsHtml += `<div><strong>Skill Name:</strong> <span style="color: #9b59b6;">${partInfo.skillName}</span></div>`;
                    if (partInfo.treeName) detailsHtml += `<div><strong>Tree Name:</strong> ${partInfo.treeName}</div>`;
                    if (partInfo.description) detailsHtml += `<div><strong>Description:</strong> <span style="font-style: italic;">${partInfo.description}</span></div>`;
                    if (partInfo.limiter) detailsHtml += `<div style="font-size: 0.85em; opacity: 0.8;"><strong>Limiter:</strong> ${partInfo.limiter}</div>`;
                    if (partInfo.colors) detailsHtml += `<div style="font-size: 0.85em; opacity: 0.8;"><strong>Colors:</strong> ${partInfo.colors}</div>`;
                    if (partInfo.skillIds && Object.keys(partInfo.skillIds).length > 0) {
                        const skillIdsStr = Object.entries(partInfo.skillIds).map(([tier, data]) => {
                            return `${tier}: ${data.id || ''} (${data.branch || ''})`;
                        }).join(', ');
                        detailsHtml += `<div><strong>Skill IDs:</strong> ${skillIdsStr}</div>`;
                    }
                    
                    // Add rarity badge to part name
                    const partRarity = detectRarity(partInfo);
                    let rarityBadgeHtml = '';
                    if (partRarity) {
                        const rarityStyle = getRarityStyle(partRarity);
                        const badgeClass = `rarity-badge-${partRarity.toLowerCase()}`;
                        rarityBadgeHtml = `<span class="rarity-badge ${badgeClass}" style="margin-left: 8px;">${rarityStyle.badge} ${rarityStyle.name}</span>`;
                    }
                    
                    // Check if this is a skill and get skill image
                    const isSkill = partInfo.partType === 'Skill' || partInfo.type === 'skill' || partInfo.skillName;
                    let skillImageHtml = '';
                    if (isSkill) {
                        // Use skillName, string, or name as fallback for skill name
                        const skillName = partInfo.skillName || partInfo.string || partInfo.name || '';
                        if (skillName) {
                            const characterName = partInfo.manufacturer || partInfo.context || '';
                            const skillImageUrl = getSkillImageUrl(skillName, characterName);
                            if (skillImageUrl) {
                                skillImageHtml = `<img src="${skillImageUrl}" class="skill-icon" alt="${skillName}" onerror="this.style.display='none'">`;
                            }
                        }
                    }
                    
                    // Apply rarity styling to the option
                    if (partRarity) {
                        const rarityStyle = getRarityStyle(partRarity);
                        option.style.borderLeft = `3px solid ${rarityStyle.color}`;
                        option.style.background = rarityStyle.bgColor;
                    }
                    
                    // Use flex layout if skill image exists
                    const nameContainerClass = isSkill && skillImageHtml ? 'part-option-skill-image' : '';
                    
                    option.innerHTML = `
                        <div class="part-option-name ${nameContainerClass}">
                            ${skillImageHtml}
                            <div>
                                <div>${partInfo.name || 'Unknown Part'}${rarityBadgeHtml}</div>
                                <div class="part-option-details" style="font-size: 0.9em; margin-top: 5px; line-height: 1.4;">
                                    ${detailsHtml}
                                </div>
                            </div>
                        </div>
                    `;
                    option.onclick = () => {
                        // Handle part builder (index -1)
                        if (partIndex === -1) {
                            // Update the part builder fields
                            if (partType === 'simple') {
                                // Check if this is a skill (has skillIds)
                                if (partInfo.skillIds && Object.keys(partInfo.skillIds).length > 0) {
                                    // Store skill info and show points selector
                                    selectedSkillInfo = partInfo;
                                    document.getElementById('newPartSkillPoints').value = '1'; // Default to 1 point
                                    updatePartBuilder(); // This will update the UI and set the tier ID
                                } else {
                                    // Regular part selection
                                    selectedSkillInfo = null;
                                    let numericId = partInfo.id;
                                    if (partInfo.fullId && partInfo.fullId.includes(':')) {
                                        const fullIdParts = partInfo.fullId.split(':');
                                        numericId = fullIdParts[1];
                                    } else if (partInfo.id.includes(':')) {
                                        const idParts = partInfo.id.split(':');
                                        numericId = idParts[1];
                                    }
                                    const partValue = parseInt(numericId);
                                    // Only set value if it's not 0 and is a valid number
                                    if (!isNaN(partValue) && partValue !== 0) {
                                        document.getElementById('newPartValue').value = partValue;
                                    } else if (isNaN(partValue)) {
                                        // String ID (like skills) - allow it but don't set value yet
                                        selectedSkillInfo = null;
                                    } else {
                                        showStatus('partBuilderStatus', '⚠️ Cannot select parts with value 0', 'error');
                                        return;
                                    }
                                }
                            } else if (partType === 'typed') {
                                // Check if this is a skill (has skillIds)
                                if (partInfo.skillIds && Object.keys(partInfo.skillIds).length > 0) {
                                    // Store skill info and show points selector
                                    selectedSkillInfo = partInfo;
                                    if (partInfo.typeId) {
                                        document.getElementById('newPartTypeId').value = partInfo.typeId;
                                    }
                                    document.getElementById('newPartSkillPoints').value = '1'; // Default to 1 point
                                    updatePartBuilder(); // This will update the UI and set the tier ID
                                } else {
                                    // Regular part selection
                                    selectedSkillInfo = null;
                                    let partValue = null;
                                    let extractedTypeId = null;
                                    
                                    // Extract typeId and part value from various formats
                                    if (partInfo.fullId && partInfo.fullId.includes(':')) {
                                        const fullIdParts = partInfo.fullId.split(':');
                                        extractedTypeId = parseInt(fullIdParts[0]);
                                        partValue = parseInt(fullIdParts[1]);
                                    } else if (partInfo.id && partInfo.id.includes(':')) {
                                        const idParts = partInfo.id.split(':');
                                        extractedTypeId = parseInt(idParts[0]);
                                        partValue = parseInt(idParts[1]);
                                    } else {
                                        partValue = parseInt(partInfo.id);
                                        // Use partInfo.typeId if available, otherwise try to extract from fullId
                                        if (partInfo.typeId) {
                                            extractedTypeId = partInfo.typeId;
                                        }
                                    }
                                    
                                    // Set the Type ID in the dropdown
                                    if (extractedTypeId && !isNaN(extractedTypeId)) {
                                        document.getElementById('newPartTypeId').value = extractedTypeId;
                                    }
                                    
                                    // Only set value if it's not 0
                                    if (partValue && partValue !== 0 && !isNaN(partValue)) {
                                        document.getElementById('newPartValue').value = partValue;
                                    } else {
                                        showStatus('partBuilderStatus', '⚠️ Cannot select parts with value 0', 'error');
                                        return;
                                    }
                                }
                            }
                            updatePartBuilder();
                            // Keep browser open for multiple selections
                            // Don't close browser - allow user to select multiple parts
                            return;
                        }
                        
                        // Only process if it's a real part index (not builder)
                        if (partIndex === -1) return;
                        
                        const index = parseInt(browser.id.replace('partBrowser', ''));
                        if (isNaN(index) || index < 0 || index >= currentParts.length) return;
                        
                        const part = currentParts[index];
                        if (part.type === 'simple') {
                            // For simple parts, we need to store the numeric ID
                            // But we also need to ensure we can look it up correctly
                            // Use the fullId if available to extract the numeric part
                            let numericId = partInfo.id;
                            
                            // If fullId exists and is different, use it to extract the numeric ID
                            if (partInfo.fullId && partInfo.fullId.includes(':')) {
                                const fullIdParts = partInfo.fullId.split(':');
                                numericId = fullIdParts[1]; // Get the numeric part after the colon
                            } else if (partInfo.id.includes(':')) {
                                // If id itself has colon format
                                const idParts = partInfo.id.split(':');
                                numericId = idParts[1];
                            }
                            
                            part.value = parseInt(numericId);
                            
                            // Store the typeId reference if available to help with lookup
                            if (partInfo.typeId) {
                                // We can't store it directly in simple parts, but we'll use it in lookup
                                // The lookup function will use the current typeId from the form
                            }
                        } else if (part.type === 'typed') {
                            // For typed parts, we need both typeId and value
                            if (partInfo.fullId && partInfo.fullId.includes(':')) {
                                const fullIdParts = partInfo.fullId.split(':');
                                part.typeId = parseInt(fullIdParts[0]);
                                part.value = parseInt(fullIdParts[1]);
                            } else if (partInfo.id.includes(':')) {
                                const idParts = partInfo.id.split(':');
                                part.typeId = parseInt(idParts[0]);
                                part.value = parseInt(idParts[1]);
                            } else {
                                // Use the partInfo's typeId if available
                                part.value = parseInt(partInfo.id);
                                if (partInfo.typeId) {
                                    part.typeId = partInfo.typeId;
                                } else {
                                    // Fallback to current form typeId
                                    const currentTypeId = parseInt(document.getElementById('typeId').value);
                                    if (currentTypeId) {
                                        part.typeId = currentTypeId;
                                    }
                                }
                            }
                        }
                        renderParts(); // This will auto-generate code
                        // Keep browser open for multiple selections - don't close it
                    };
                    partsList.appendChild(option);
                });
            }

            browser.appendChild(partsList);
        }

        function filterParts(browser, searchTerm, partType, typeId, partIndex = null, rarityFilter = 'all', partTypeFilter = 'all') {
            // Preserve the search input and filters to maintain state
            const searchBox = browser.querySelector('.search-box');
            const searchInput = searchBox ? searchBox.querySelector('input') : null;
            const rarityFilterDiv = browser.querySelector('.rarity-filter');
            const partTypeFilterDiv = browser.querySelector('.part-type-filter');
            
            // Only clear and recreate if search box doesn't exist
            if (!searchBox || !searchInput) {
                browser.innerHTML = '';
                const searchDiv = document.createElement('div');
                searchDiv.className = 'search-box';
                const newSearchInput = document.createElement('input');
                newSearchInput.type = 'text';
                newSearchInput.placeholder = '🔍 Search by name, ID, stats, effects, part type, spawn code, manufacturer, legendary name, perk, rarity, skill, description...';
                newSearchInput.value = searchTerm || '';
                newSearchInput.title = 'Search across all part fields: name, ID, stats, effects, part type, spawn code, manufacturer, weapon type, legendary name, perk name, rarity, skill name, tree name, description, colors, model name, and more';
                newSearchInput.oninput = (e) => {
                    const activeRarity = browser.querySelector('.rarity-filter-btn.active');
                    const currentRarity = activeRarity ? activeRarity.dataset.rarity || 'all' : 'all';
                    const activePartType = browser.querySelector('.part-type-filter-btn.active');
                    const currentPartType = activePartType ? activePartType.dataset.partType || 'all' : 'all';
                    filterParts(browser, e.target.value, partType, typeId, partIndex, currentRarity, currentPartType);
                };
                searchDiv.appendChild(newSearchInput);
                
                // Create filter section container
                const filterSection = document.createElement('div');
                filterSection.className = 'filter-section';
                
                // Recreate rarity filter
                const newRarityFilterRow = document.createElement('div');
                newRarityFilterRow.className = 'filter-row';
                
                const rarityFilterLabel = document.createElement('span');
                rarityFilterLabel.className = 'filter-label';
                rarityFilterLabel.textContent = 'Rarity:';
                newRarityFilterRow.appendChild(rarityFilterLabel);
                
                const rarityFilterButtons = document.createElement('div');
                rarityFilterButtons.className = 'filter-buttons';
                
                const allBtn = document.createElement('button');
                allBtn.textContent = 'All';
                allBtn.className = 'rarity-filter-btn active';
                allBtn.dataset.rarity = 'all';
                allBtn.style.cssText = 'padding: 4px 8px; border-radius: 4px; border: 1px solid rgba(79, 195, 247, 0.3); background: rgba(79, 195, 247, 0.2); color: #81d4fa; cursor: pointer; font-size: 0.8em; transition: all 0.2s;';
                allBtn.onclick = () => {
                    document.querySelectorAll('.rarity-filter-btn').forEach(btn => btn.classList.remove('active'));
                    allBtn.classList.add('active');
                    const activePartType = browser.querySelector('.part-type-filter-btn.active');
                    const currentPartType = activePartType ? activePartType.dataset.partType || 'all' : 'all';
                    filterParts(browser, searchInput.value, partType, typeId, partIndex, 'all', currentPartType);
                };
                rarityFilterButtons.appendChild(allBtn);
                
                Object.keys(rarityColors).forEach(rarity => {
                    const btn = document.createElement('button');
                    const rarityData = rarityColors[rarity];
                    btn.textContent = `${rarityData.badge} ${rarityData.shortName}`;
                    btn.className = 'rarity-filter-btn';
                    btn.dataset.rarity = rarity;
                    btn.style.cssText = `padding: 4px 8px; border-radius: 4px; border: 1px solid ${rarityData.borderColor}; background: ${rarityData.bgColor}; color: ${rarityData.textColor}; cursor: pointer; font-size: 0.8em; transition: all 0.2s;`;
                    btn.onmouseover = () => {
                        btn.style.transform = 'scale(1.05)';
                        btn.style.boxShadow = `0 0 6px ${rarityData.borderColor}`;
                    };
                    btn.onmouseout = () => {
                        btn.style.transform = 'scale(1)';
                        btn.style.boxShadow = 'none';
                    };
                    btn.onclick = () => {
                        document.querySelectorAll('.rarity-filter-btn').forEach(b => b.classList.remove('active'));
                        btn.classList.add('active');
                        const activePartType = browser.querySelector('.part-type-filter-btn.active');
                        const currentPartType = activePartType ? activePartType.dataset.partType || 'all' : 'all';
                        filterParts(browser, searchInput.value, partType, typeId, partIndex, rarity, currentPartType);
                    };
                    if (rarityFilter === rarity) {
                        btn.classList.add('active');
                    }
                    rarityFilterButtons.appendChild(btn);
                });
                
                newRarityFilterRow.appendChild(rarityFilterButtons);
                filterSection.appendChild(newRarityFilterRow);
                
                // Create part type filter row - will be populated after we get the parts
                const newPartTypeFilterRow = document.createElement('div');
                newPartTypeFilterRow.className = 'filter-row part-type-filter';
                
                const partTypeFilterLabel = document.createElement('span');
                partTypeFilterLabel.className = 'filter-label';
                partTypeFilterLabel.textContent = 'Type:';
                newPartTypeFilterRow.appendChild(partTypeFilterLabel);
                
                filterSection.appendChild(newPartTypeFilterRow);
                searchDiv.appendChild(filterSection);
                browser.appendChild(searchDiv);
                
                // Populate part type filter after getting parts
                populatePartTypeFilter(browser, partType, typeId, partIndex, partTypeFilter);
            } else {
                // Update the search input value if it changed (but don't trigger focus loss)
                if (searchInput.value !== searchTerm) {
                    searchInput.value = searchTerm;
                }
            }
            
            // Store current filters
            browser.dataset.rarityFilter = rarityFilter;
            browser.dataset.partTypeFilter = partTypeFilter;
            
            // Only update the parts list, preserving the search box and filters
            populatePartBrowser(browser, partType, typeId, searchTerm, partIndex, rarityFilter, partTypeFilter);
        }
        
        function populatePartTypeFilter(browser, partType, typeId, partIndex, currentPartTypeFilter) {
            const partTypeFilterRow = browser.querySelector('.part-type-filter');
            if (!partTypeFilterRow) return;
            
            // Get all parts that would be shown (without filters) to determine available part types
            let allParts = [];
            if (partType === 'simple') {
                const currentTypeId = parseInt(document.getElementById('typeId').value);
                if (currentTypeId && partsByTypeId.has(currentTypeId)) {
                    allParts = partsByTypeId.get(currentTypeId);
                } else {
                    allParts = Array.from(partsMap.values());
                }
            } else if (partType === 'typed') {
                let targetTypeId = typeId;
                if (partIndex === -1) {
                    // For part builder, use the selected typeId from dropdown
                    const selectedTypeId = parseInt(document.getElementById('newPartTypeId').value);
                    targetTypeId = selectedTypeId && selectedTypeId !== 0 ? selectedTypeId : typeId;
                } else if (partIndex !== null) {
                    const part = currentParts[partIndex];
                    if (part && part.typeId) {
                        targetTypeId = part.typeId;
                    } else {
                        targetTypeId = typeId || parseInt(document.getElementById('typeId').value);
                    }
                } else {
                    targetTypeId = typeId || parseInt(document.getElementById('typeId').value);
                }
                
                if (targetTypeId === 0 || targetTypeId === null || targetTypeId === undefined) {
                    // If no typeId specified, show all parts from all typeIds
                    for (const [typeIdKey, partsArray] of partsByTypeId.entries()) {
                        allParts = allParts.concat(partsArray);
                    }
                } else if (targetTypeId && partsByTypeId.has(targetTypeId)) {
                    // Show parts from the specified typeId (including typeId 1)
                    allParts = partsByTypeId.get(targetTypeId);
                } else if (targetTypeId === 1) {
                    // Special handling: if typeId 1 is requested but not in partsByTypeId, try to find Maliwan parts
                    // Check if there are any parts with typeId 1 in partsMap
                    const type1Parts = Array.from(partsMap.values()).filter(p => p.typeId === 1);
                    if (type1Parts.length > 0) {
                        allParts = type1Parts;
                        // Also ensure typeId 1 is in partsByTypeId for future use
                        if (!partsByTypeId.has(1)) {
                            partsByTypeId.set(1, type1Parts);
                        }
                    }
                }
            }
            
            // Get unique part types from the parts
            const uniquePartTypes = new Set();
            allParts.forEach(p => {
                if (p.partType && p.partType.trim()) {
                    uniquePartTypes.add(p.partType);
                }
            });
            
            // Clear existing buttons but keep the label
            const label = partTypeFilterRow.querySelector('.filter-label');
            partTypeFilterRow.innerHTML = '';
            if (label) {
                partTypeFilterRow.appendChild(label);
            } else {
                const partTypeFilterLabel = document.createElement('span');
                partTypeFilterLabel.className = 'filter-label';
                partTypeFilterLabel.textContent = 'Type:';
                partTypeFilterRow.appendChild(partTypeFilterLabel);
            }
            
            // Create filter buttons container
            const partTypeFilterButtons = document.createElement('div');
            partTypeFilterButtons.className = 'filter-buttons';
            
            const searchInput = browser.querySelector('.search-box input');
            
            // Add "All" button
            const allBtn = document.createElement('button');
            allBtn.textContent = 'All';
            allBtn.className = 'part-type-filter-btn';
            allBtn.dataset.partType = 'all';
            if (currentPartTypeFilter === 'all' || !currentPartTypeFilter) {
                allBtn.classList.add('active');
            }
            allBtn.style.cssText = 'padding: 4px 8px; border-radius: 4px; border: 1px solid rgba(79, 195, 247, 0.3); background: rgba(79, 195, 247, 0.2); color: #81d4fa; cursor: pointer; font-size: 0.8em; transition: all 0.2s;';
            allBtn.onmouseover = () => {
                allBtn.style.transform = 'scale(1.05)';
                allBtn.style.boxShadow = '0 0 6px rgba(79, 195, 247, 0.5)';
            };
            allBtn.onmouseout = () => {
                allBtn.style.transform = 'scale(1)';
                allBtn.style.boxShadow = 'none';
            };
            allBtn.onclick = () => {
                document.querySelectorAll('.part-type-filter-btn').forEach(btn => btn.classList.remove('active'));
                allBtn.classList.add('active');
                const activeRarity = browser.querySelector('.rarity-filter-btn.active');
                const currentRarity = activeRarity ? activeRarity.dataset.rarity || 'all' : 'all';
                filterParts(browser, searchInput ? searchInput.value : '', partType, typeId, partIndex, currentRarity, 'all');
            };
            partTypeFilterButtons.appendChild(allBtn);
            
            // Add buttons for each unique part type (sorted)
            const sortedPartTypes = Array.from(uniquePartTypes).sort();
            sortedPartTypes.forEach(pt => {
                const btn = document.createElement('button');
                // Replace "Comp" with "Rarity" for user-friendly display
                const displayText = pt === 'Comp' ? 'Rarity' : pt;
                btn.textContent = displayText;
                btn.className = 'part-type-filter-btn';
                btn.dataset.partType = pt;
                if (currentPartTypeFilter === pt) {
                    btn.classList.add('active');
                }
                btn.style.cssText = 'padding: 4px 8px; border-radius: 4px; border: 1px solid rgba(79, 195, 247, 0.3); background: rgba(10, 22, 40, 0.6); color: #81d4fa; cursor: pointer; font-size: 0.8em; transition: all 0.2s;';
                btn.onmouseover = () => {
                    btn.style.transform = 'scale(1.05)';
                    btn.style.boxShadow = '0 0 6px rgba(79, 195, 247, 0.5)';
                };
                btn.onmouseout = () => {
                    btn.style.transform = 'scale(1)';
                    btn.style.boxShadow = 'none';
                };
                btn.onclick = () => {
                    document.querySelectorAll('.part-type-filter-btn').forEach(b => b.classList.remove('active'));
                    btn.classList.add('active');
                    const activeRarity = browser.querySelector('.rarity-filter-btn.active');
                    const currentRarity = activeRarity ? activeRarity.dataset.rarity || 'all' : 'all';
                    filterParts(browser, searchInput ? searchInput.value : '', partType, typeId, partIndex, currentRarity, pt);
                };
                partTypeFilterButtons.appendChild(btn);
            });
            
            partTypeFilterRow.appendChild(partTypeFilterButtons);
        }

        // Helper function to check if a part is a rarity part
        function isRarityPart(part) {
            if (!part) return false;
            
            // Check part info if available
            let partInfo = null;
            if (part.type === 'simple') {
                const currentTypeId = parseInt(document.getElementById('typeId').value);
                partInfo = getPartInfo({ type: 'simple', value: part.value }, currentTypeId);
            } else if (part.type === 'typed') {
                partInfo = getPartInfo({ type: 'typed', typeId: part.typeId, value: part.value });
            }
            
            if (partInfo) {
                const partType = String(partInfo.partType || '').toLowerCase();
                const originalPartType = String(partInfo.originalPartType || '').toLowerCase();
                const partName = String(partInfo.name || '').toLowerCase();
                const spawnCode = String(partInfo.spawnCode || '').toLowerCase();
                const string = String(partInfo.string || '').toLowerCase();
                const path = String(partInfo.path || '').toLowerCase();
                
                // Exclude body parts - they should never be identified as rarity parts
                // Body parts have partType 'shield', spawnCode with 'part_body', or path includes 'shield'
                const isBodyPart = partType === 'shield' || originalPartType === 'shield' ||
                                  spawnCode.includes('part_body') || path.includes('shield');
                
                if (isBodyPart) {
                    return false; // Body parts are never rarity parts
                }
                
                // Check if it's a rarity/comp part
                return partType.includes('rarity') || partType.includes('comp') ||
                       partName.includes('rarity') || partName.includes('comp') ||
                       spawnCode.includes('comp_') || spawnCode.includes('rarity') ||
                       string.includes('comp_') || string.includes('rarity');
            }
            
            return false;
        }

        function generateCode() {
            const typeId = document.getElementById('typeId').value;
            const level = document.getElementById('level').value;
            const seed = document.getElementById('seed').value;

            if (!typeId) {
                setOutputCode('Please select a Type ID first');
                return;
            }

            // Filter and sort parts: rarity first, then others
            const filteredParts = currentParts.filter(part => {
                // Filter out parts with value 0
                if (part.type === 'simple') {
                    return part.value !== 0 && part.value !== undefined && part.value !== null;
                } else if (part.type === 'typed') {
                    return part.value !== 0 && part.value !== undefined && part.value !== null;
                } else if (part.type === 'array') {
                    // Filter out 0 values from array, exclude part if array becomes empty
                    const filteredValues = (part.values || []).filter(v => v !== 0 && v !== undefined && v !== null);
                    return filteredValues.length > 0;
                } else if (part.type === 'string') {
                    return part.value && part.value.trim().length > 0;
                }
                return true;
            });
            
            // Sort: rarity parts first, then others
            const sortedParts = filteredParts.sort((a, b) => {
                const aIsRarity = isRarityPart(a);
                const bIsRarity = isRarityPart(b);
                if (aIsRarity && !bIsRarity) return -1;
                if (!aIsRarity && bIsRarity) return 1;
                return 0; // Keep original order for non-rarity parts
            });

            // Consolidate duplicate typed parts into arrays
            const consolidatedParts = [];
            const processedIndices = new Set();
            
            // Process parts in order, consolidating duplicate typed parts
            for (let i = 0; i < sortedParts.length; i++) {
                if (processedIndices.has(i)) continue;
                
                const part = sortedParts[i];
                
                if (part.type === 'typed') {
                    // Count how many identical typed parts follow this one
                    const matchingParts = [part];
                    for (let j = i + 1; j < sortedParts.length; j++) {
                        if (processedIndices.has(j)) continue;
                        const nextPart = sortedParts[j];
                        if (nextPart.type === 'typed' && 
                            nextPart.typeId === part.typeId && 
                            nextPart.value === part.value) {
                            matchingParts.push(nextPart);
                            processedIndices.add(j);
                        }
                    }
                    
                    if (matchingParts.length > 1) {
                        // Convert to array format
                        consolidatedParts.push({
                            type: 'array',
                            typeId: part.typeId,
                            values: matchingParts.map(p => p.value)
                        });
                    } else {
                        // Single occurrence, keep as typed
                        consolidatedParts.push(part);
                    }
                    processedIndices.add(i);
                } else {
                    // Non-typed parts (simple, array, string) go through as-is
                    consolidatedParts.push(part);
                    processedIndices.add(i);
                }
            }

            const partsStr = consolidatedParts
                .map(part => {
                    if (part.type === 'simple') {
                        return `{${part.value}}`;
                    } else if (part.type === 'typed') {
                        return `{${part.typeId}:${part.value}}`;
                    } else if (part.type === 'array') {
                        // Filter out 0 values from array before generating
                        const filteredValues = (part.values || []).filter(v => v !== 0 && v !== undefined && v !== null);
                        return `{${part.typeId}:[${filteredValues.join(' ')}]}`;
                    } else if (part.type === 'string') {
                        return `"${part.value}"`;
                    }
                })
                .join(' ');

            // Build code with optional firmware lock/buyback sections
            const firmwareLockElement = document.getElementById('firmwareLock');
            const firmwareLock = firmwareLockElement.checked;
            const buybackFlagElement = document.getElementById('buybackFlag');
            const buybackFlag = buybackFlagElement ? buybackFlagElement.checked : false;
            let code = `${typeId}, 0, 1, ${level}|`;
            
            // Add firmware lock section if checked (comes before seed)
            if (firmwareLock) {
                code += ` 9, 1|`;
            }
            // Add buyback flag section if checked (| 10, 1|)
            if (buybackFlag) {
                code += ` 10, 1|`;
            }
            
            // Add seed section (always include if seed is non-zero, or if no lock flags are set)
            if (seed || (!firmwareLock && !buybackFlag)) {
                code += ` 2, ${seed}||`;
            } else {
                // If a lock flag is checked and seed is 0, skip seed section
                code += `|`;
            }
            
            code += ` ${partsStr}|`;
            
            // Add skin customization if set (character is always "c")
            const skinDropdown = document.getElementById('skinCustomizationDropdown');
            const skinValue = document.getElementById('skinCustomizationValue').value.trim();
            
            // Prefer dropdown value (string) over numeric input
            // If both are set, dropdown takes priority
            if (skinDropdown && skinDropdown.value) {
                // Use string value from dropdown with quotes
                code += ` "c", "${skinDropdown.value}"|`;
            } else if (skinValue) {
                // Fallback to numeric value if dropdown is empty
                code += ` "c", ${skinValue}|`;
            }
            
            // Only update if we're not currently updating from code (to prevent circular updates)
            if (!isUpdatingFromCode) {
                setOutputCode(code);
                
                // Track generate_item event
                if (typeof window.trackEvent === 'function') {
                    // Try to determine item_type from typeId
                    let itemType = 'unknown';
                    try {
                        const typeIdValue = typeId.toLowerCase();
                        if (typeIdValue.includes('weapon') || typeIdValue.includes('rifle') || typeIdValue.includes('pistol') || typeIdValue.includes('shotgun') || typeIdValue.includes('smg') || typeIdValue.includes('sniper')) {
                            itemType = 'weapon';
                        } else if (typeIdValue.includes('shield')) {
                            itemType = 'shield';
                        } else if (typeIdValue.includes('grenade')) {
                            itemType = 'grenade';
                        } else if (typeIdValue.includes('class_mod') || typeIdValue.includes('mod')) {
                            itemType = 'class_mod';
                        } else if (typeIdValue.includes('artifact')) {
                            itemType = 'artifact';
                        }
                    } catch (e) {
                        // Ignore errors
                    }
                    
                    window.trackEvent('generate_item', { 
                        item_type: itemType,
                        source: 'generator'
                    });
                }
            }
            
            // Auto-serialize the code if it's valid (silently, don't show errors)
            // Use setTimeout to ensure the DOM is updated and code is set before serializing
            setTimeout(() => {
                const finalCode = getOutputCode().trim();
                if (finalCode && finalCode !== 'Please select a Type ID first' && finalCode !== 'Generated code will appear here...') {
                    serializeCode(true); // Pass true for silent mode
                } else {
                    // Clear serialized output if code is invalid
                    document.getElementById('serializedOutput').textContent = 'Serialized code will appear here...';
                }
            }, 150);
        }

        function copyToClipboard() {
            const code = getOutputCode();
            if (code && code !== 'Generated code will appear here...' && code !== 'Please select a Type ID first') {
                navigator.clipboard.writeText(code).then(() => {
                    showStatus('outputStatus', '✅ Code copied to clipboard!', 'success');
                    // Track clipboard copy (no code content sent)
                    if (typeof window.trackEvent === 'function') {
                        window.trackEvent('copy_clipboard');
                    }
                }).catch((error) => {
                    console.error('Error copying to clipboard:', error);
                    showStatus('outputStatus', '❌ Failed to copy to clipboard', 'error');
                });
            }
        }

        // Serialize item code to Base85 format (auto-called, silent)
        // Rate limiting for API requests
        if (!window.serializeCodeQueue) {
            window.serializeCodeQueue = [];
            window.serializeCodeProcessing = false;
            window.serializeCodeLastRequest = 0;
            window.serializeCodeMinDelay = 500; // Minimum 500ms between requests
        }

        async function serializeCode(silent = true) {
            const code = getOutputCode().trim();
            if (!code || code === 'Generated code will appear here...' || code === 'Please select a Type ID first') {
                document.getElementById('serializedOutput').textContent = 'Serialized code will appear here...';
                return;
            }

            // Add to queue and process with rate limiting
            return new Promise((resolve) => {
                window.serializeCodeQueue.push({ code, silent, resolve });
                processSerializeCodeQueue();
            });
        }

        async function processSerializeCodeQueue() {
            if (window.serializeCodeProcessing || window.serializeCodeQueue.length === 0) {
                return;
            }

            window.serializeCodeProcessing = true;

            while (window.serializeCodeQueue.length > 0) {
                const { code, silent, resolve } = window.serializeCodeQueue.shift();
                
                // Rate limiting: wait if last request was too recent
                const timeSinceLastRequest = Date.now() - window.serializeCodeLastRequest;
                if (timeSinceLastRequest < window.serializeCodeMinDelay) {
                    await new Promise(r => setTimeout(r, window.serializeCodeMinDelay - timeSinceLastRequest));
                }

                let result = null;
                let retries = 3;
                let delay = 1000; // Start with 1 second delay

                while (retries > 0) {
                    try {
                        window.serializeCodeLastRequest = Date.now();
                        
                        const response = await fetch('https://save-editor.be/nicnl/api.php', {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json'
                            },
                            body: JSON.stringify({
                                deserialized: code
                            })
                        });

                        if (!response.ok) {
                            // If rate limited (429) or server error (5xx), retry with backoff
                            if (response.status === 429 || (response.status >= 500 && response.status < 600)) {
                                throw new Error(`HTTP error! status: ${response.status}`);
                            }
                            // For other errors, don't retry
                            throw new Error(`HTTP error! status: ${response.status}`);
                        }

                        const responseText = await response.text();
                        let data;
                        
                        try {
                            data = JSON.parse(responseText);
                        } catch (parseError) {
                            console.error('Failed to parse API response as JSON:', parseError);
                            console.error('Response text:', responseText);
                            throw new Error('Invalid response format from API');
                        }
                        
                        if (data.error) {
                            throw new Error(data.error);
                        }

                        if (data.serial_b85 && typeof data.serial_b85 === 'string') {
                            document.getElementById('serializedOutput').textContent = data.serial_b85;
                            // Update bank buttons when serial is generated
                            if (typeof updateBankButtons === 'function') {
                                updateBankButtons();
                            }
                            result = data.serial_b85;
                            break; // Success, exit retry loop
                        } else {
                            console.error('API response missing serial_b85 or invalid format:', data);
                            throw new Error('No serial_b85 in response');
                        }
                    } catch (error) {
                        retries--;
                        if (retries > 0) {
                            // Exponential backoff: wait longer before each retry
                            console.warn(`Serialization failed, retrying in ${delay}ms... (${retries} retries left)`);
                            await new Promise(r => setTimeout(r, delay));
                            delay *= 2; // Double the delay for next retry
                        } else {
                            console.error('Error serializing code:', error);
                            // Only display error message, never raw JSON or response data
                            document.getElementById('serializedOutput').textContent = 'Error serializing code';
                        }
                    }
                }

                resolve(result);
            }

            window.serializeCodeProcessing = false;
        }

        // Copy serialized code to clipboard
        function copySerializedToClipboard() {
            const serialized = document.getElementById('serializedOutput').textContent;
            if (serialized && serialized !== 'Serialized code will appear here...' && serialized !== 'Error serializing code') {
                navigator.clipboard.writeText(serialized).then(() => {
                    showStatus('outputStatus', '✅ Serial copied to clipboard!', 'success');
                    // Track clipboard copy (no serial content sent)
                    if (typeof window.trackEvent === 'function') {
                        window.trackEvent('copy_clipboard');
                    }
                }).catch((error) => {
                    console.error('Error copying serial to clipboard:', error);
                    showStatus('outputStatus', '❌ Failed to copy to clipboard', 'error');
                });
            } else {
                showStatus('outputStatus', '⚠️ No serialized code to copy', 'error');
            }
        }
