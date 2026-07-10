        function updateDataStatusIndicator(message, type) {
            const indicator = document.getElementById('dataStatusIndicator');
            if (!indicator) return;
            
            // Remove all status classes
            indicator.classList.remove('loading', 'success', 'error', 'warning', 'not-loaded');
            
            const text = message != null && String(message).trim() !== '' ? String(message) : '';
            // Add appropriate class and update content
            if (type === 'success') {
                indicator.classList.add('success');
                indicator.innerHTML = `<span>✅</span> <span>${text || 'Data loaded'}</span>`;
            } else if (type === 'error') {
                indicator.classList.add('error');
                indicator.innerHTML = `<span>❌</span> <span>${text || 'Error'}</span>`;
            } else if (type === 'warning') {
                indicator.classList.add('warning');
                indicator.innerHTML = `<span>⚠️</span> <span>${text || 'Warning'}</span>`;
            } else if (type === 'loading') {
                indicator.classList.add('loading');
                indicator.innerHTML = `<span>⏳</span> <span>${text || 'Loading…'}</span>`;
            } else if (text && /loading/i.test(text)) {
                indicator.classList.add('loading');
                indicator.innerHTML = `<span>⏳</span> <span>${text}</span>`;
            } else if (text) {
                indicator.classList.add('not-loaded');
                indicator.innerHTML = `<span>⏳</span> <span>${text}</span>`;
            } else {
                indicator.classList.add('not-loaded');
                indicator.innerHTML = `<span>⏳</span> <span>Data not loaded</span>`;
            }
        }
        window.updateDataStatusIndicator = updateDataStatusIndicator;

        /** Parse JSON in a worker when possible to avoid blocking the main thread; fallback to main-thread parse. */
        function parseJsonOffMainThread(text) {
            return new Promise(function (resolve, reject) {
                if (typeof Worker === 'undefined') {
                    try {
                        resolve(JSON.parse(text));
                    } catch (e) {
                        reject(e);
                    }
                    return;
                }
                try {
                    const workerUrl = new URL('js/parse-worker.js', document.baseURI || window.location.href).href;
                    const worker = new Worker(workerUrl);
                    worker.onmessage = function (e) {
                        worker.terminate();
                        if (e.data.error) reject(new Error(e.data.error));
                        else resolve(e.data.data);
                    };
                    worker.onerror = function (err) {
                        worker.terminate();
                        try {
                            resolve(JSON.parse(text));
                        } catch (parseErr) {
                            reject(parseErr);
                        }
                    };
                    worker.postMessage({ text: text });
                } catch (err) {
                    try {
                        resolve(JSON.parse(text));
                    } catch (parseErr) {
                        reject(parseErr);
                    }
                }
            });
        }

        function showStatus(elementId, message, type) {
            // Also update data status indicator if it's a fileStatus message
            if (elementId === 'fileStatus') {
                updateDataStatusIndicator(message, type);
            }
            const statusEl = document.getElementById(elementId);
            if (!statusEl) {
                // Element doesn't exist (e.g., fileStatus was removed), just return
                return;
            }
            statusEl.textContent = message;
            statusEl.className = `status ${type}`;
            statusEl.style.display = 'flex';
            setTimeout(() => {
                statusEl.style.display = 'none';
            }, 4000);
        }

        function showTypeIdChangeWarning(changedField = 'typeId') {
            const warningEl = document.getElementById('typeIdWarning');
            if (!warningEl) return;
            let message = '';
            if (changedField === 'manufacturer') {
                message = '⚠️ <strong>Warning:</strong> Changing the manufacturer has reset the Type ID. Simple part IDs are context-dependent based on the Type ID, so you will need to select a new Type ID that matches your parts.';
            } else {
                message = '⚠️ <strong>Warning:</strong> Changing the item type will change what each simple part code refers to. Simple part IDs are context-dependent based on the Type ID.';
            }
            warningEl.innerHTML = message;
            warningEl.className = 'status warning';
            warningEl.style.display = 'block';
            warningEl.style.backgroundColor = '#fff3cd';
            warningEl.style.borderColor = '#ffc107';
            warningEl.style.color = '#856404';
            warningEl.style.padding = '10px';
            warningEl.style.borderRadius = '4px';
            warningEl.style.marginTop = '10px';
            
            // Don't auto-hide this warning - let user dismiss it or it will hide when they parse a new code
        }

        function bindIfPresent(id, event, handler) {
            const el = document.getElementById(id);
            if (el) el.addEventListener(event, handler);
        }

        bindIfPresent('typeId', 'change', generateCode);
        bindIfPresent('level', 'input', function () {
            generateCode();
            const typeId = document.getElementById('typeId');
            const typeIdVal = typeId ? typeId.value : '';
            if (typeIdVal && typeIdMap.has(parseInt(typeIdVal, 10))) {
                const typeInfo = typeIdMap.get(parseInt(typeIdVal, 10));
                updateGuidelines(typeInfo.category, parseInt(typeIdVal, 10));
            }
        });
        bindIfPresent('seed', 'input', generateCode);
        bindIfPresent('firmwareLock', 'change', generateCode);
        bindIfPresent('buybackFlag', 'change', generateCode);
        bindIfPresent('skinCustomizationValue', 'input', function () {
            const skinDropdown = document.getElementById('skinCustomizationDropdown');
            if (skinDropdown && this.value.trim()) {
                skinDropdown.value = '';
            }
            generateCode();
        });
        const skinDropdown = document.getElementById('skinCustomizationDropdown');
        if (skinDropdown) {
            skinDropdown.addEventListener('change', function() {
                // Clear numeric input when dropdown is used
                const skinValueInput = document.getElementById('skinCustomizationValue');
                if (skinValueInput && this.value) {
                    skinValueInput.value = '';
                }
                generateCode();
            });
        }
        
        // Refresh guidelines when manufacturer changes
        const manufacturerSelect = document.getElementById('manufacturer');
        if (manufacturerSelect && !manufacturerSelect.dataset.guidelinesListener) {
            manufacturerSelect.addEventListener('change', function() {
                const typeId = document.getElementById('typeId').value;
                if (typeId && typeIdMap.has(parseInt(typeId))) {
                    const typeInfo = typeIdMap.get(parseInt(typeId));
                    updateGuidelines(typeInfo.category, parseInt(typeId));
                }
            });
            manufacturerSelect.dataset.guidelinesListener = 'true';
        }

        // Part builder event listeners
        bindIfPresent('newPartType', 'change', function () {
            selectedSkillInfo = null; // Clear selected skill when part type changes
            updatePartBuilder();
        });
        bindIfPresent('newPartSkillPoints', 'change', function () {
            updatePartBuilder(); // Update value when points change
        });
        bindIfPresent('newPartTypeId', 'change', function () {
            updatePartBuilder();
            const tempBrowser = document.getElementById('tempPartBrowser');
            if (tempBrowser && tempBrowser.classList.contains('active')) {
                const newPartTypeEl = document.getElementById('newPartType');
                const partType = newPartTypeEl ? newPartTypeEl.value : '';
                const typeId = partType === 'typed' ? parseInt(this.value, 10) : null;

                const searchInput = tempBrowser.querySelector('.search-box input');
                const searchTerm = searchInput ? searchInput.value : '';

                populatePartBrowser(tempBrowser, partType, typeId, searchTerm, -1);

                const searchBox = tempBrowser.querySelector('.search-box');
                if (searchBox) {
                    const searchInputField = searchBox.querySelector('input');
                    if (searchInputField) {
                        searchInputField.oninput = (e) => {
                            const activeRarity = tempBrowser.querySelector('.rarity-filter-btn.active');
                            const currentRarity = activeRarity ? activeRarity.dataset.rarity || 'all' : 'all';
                            const activePartType = tempBrowser.querySelector('.part-type-filter-btn.active');
                            const currentPartType = activePartType ? activePartType.dataset.partType || 'all' : 'all';
                            filterParts(tempBrowser, e.target.value, partType, typeId, -1, currentRarity, currentPartType);
                        };
                    }
                }
            }
        });
        bindIfPresent('newPartValue', 'input', updatePartBuilder);
        bindIfPresent('newPartArrayValues', 'input', updatePartBuilder);

        // Legacy game_data_export loading has been retired; Nexus JSON now owns the app-level readiness state.
        async function tryAutoLoadData() {
            return false;
        }

        // ===== ANALYTICS TRACKING MODULE =====
