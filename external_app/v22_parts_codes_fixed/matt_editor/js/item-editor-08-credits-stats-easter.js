
        /** Visitor counter lives in item-editor-08 (same script as fetch/display) so state is never split across files. */
        const VISITOR_COUNTER_URL = 'https://save-editor.be/counter_ItemEditor.php';
        let visitorStatsLoaded = false;
        let visitorStatsData = null;
        let visitorStatsFetchInFlight = false;

        // Initialize when DOM is ready (ensures item editor widgets exist)
        function runItemEditorInit() {
            try {
                currentParts = [];
                renderParts();
                updatePartBuilder();
            } finally {
                setTimeout(loadVisitorStats, 200);
            }
        }
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', runItemEditorInit);
        } else {
            runItemEditorInit();
        }

        // Credits Modal Functions
        function showCredits() {
            const modal = document.getElementById('creditsModal');
            if (modal) {
                modal.classList.add('active');
                document.body.style.overflow = 'hidden';
                loadVisitorStats();
                if (visitorStatsData) {
                    displayVisitorStats(visitorStatsData);
                }
            }
        }

        // Load Visitor Stats (only loads once per page session to prevent counter increment)
        function loadVisitorStats() {
            // If stats already loaded, just display cached data
            if (visitorStatsLoaded && visitorStatsData) {
                displayVisitorStats(visitorStatsData);
                return;
            }
            
            // Determine the API endpoint to use
            // Check for Electron app - multiple ways to detect it
            const isElectron = window.IS_ELECTRON_APP === true || 
                              (typeof window.electronAPI !== 'undefined' && window.electronAPI !== null) ||
                              (typeof process !== 'undefined' && process.versions && process.versions.electron);
            const isLocalFile = window.location.protocol === 'file:';
            
            // If we might be in Electron but IS_ELECTRON_APP isn't set yet, wait a bit and retry
            if (!isElectron && !isLocalFile && window.location.protocol !== 'http:' && window.location.protocol !== 'https:') {
                setTimeout(() => {
                    if (!visitorStatsLoaded) {
                        loadVisitorStats();
                    }
                }, 500);
                return;
            }
            
            // Always hit the live counter URL (CORS *). Relative counter_ItemEditor.php breaks on subpaths and static hosts.
            const statsUrl = VISITOR_COUNTER_URL;
            if (isElectron) {
                console.log("📊 Electron app - visitor stats:", statsUrl);
            } else if (isLocalFile) {
                console.log("📊 file:// - visitor stats:", statsUrl);
            } else {
                console.log("📊 Web - visitor stats:", statsUrl);
            }
            
            if (visitorStatsLoaded || visitorStatsFetchInFlight) {
                return;
            }
            
            // For Electron, check online status first (optional - fetch will fail if offline anyway)
            if (isElectron && !navigator.onLine) {
                // Offline in Electron - show N/A
                const totalEl = document.getElementById("visitor-total");
                const uniqueEl = document.getElementById("visitor-unique");
                const visits7dEl = document.getElementById("visitor-7d-visits");
                const avgVisits7dEl = document.getElementById("visitor-7d-avg-visits");
                const uniques7dEl = document.getElementById("visitor-7d-uniques");
                const avgUniques7dEl = document.getElementById("visitor-7d-avg-uniques");
                const visits14dEl = document.getElementById("visitor-14d-visits");
                const avgVisits14dEl = document.getElementById("visitor-14d-avg-visits");
                const uniques14dEl = document.getElementById("visitor-14d-uniques");
                const avgUniques14dEl = document.getElementById("visitor-14d-avg-uniques");
                const visits30dEl = document.getElementById("visitor-30d-visits");
                const avgVisits30dEl = document.getElementById("visitor-30d-avg-visits");
                const uniques30dEl = document.getElementById("visitor-30d-uniques");
                const avgUniques30dEl = document.getElementById("visitor-30d-avg-uniques");
                const returnEl = document.getElementById("visitor-return");
                const returnPctEl = document.getElementById("visitor-return-pct");
                const avgPerEl = document.getElementById("visitor-avg-per");
                const wowVisitsEl = document.getElementById("visitor-wow-visits");
                const wowUniquesEl = document.getElementById("visitor-wow-uniques");
                
                if (totalEl) totalEl.textContent = "N/A";
                if (uniqueEl) uniqueEl.textContent = "N/A";
                if (visits7dEl) visits7dEl.textContent = "N/A";
                if (avgVisits7dEl) avgVisits7dEl.textContent = "N/A";
                if (uniques7dEl) uniques7dEl.textContent = "N/A";
                if (avgUniques7dEl) avgUniques7dEl.textContent = "N/A";
                if (visits14dEl) visits14dEl.textContent = "N/A";
                if (avgVisits14dEl) avgVisits14dEl.textContent = "N/A";
                if (uniques14dEl) uniques14dEl.textContent = "N/A";
                if (avgUniques14dEl) avgUniques14dEl.textContent = "N/A";
                if (visits30dEl) visits30dEl.textContent = "N/A";
                if (avgVisits30dEl) avgVisits30dEl.textContent = "N/A";
                if (uniques30dEl) uniques30dEl.textContent = "N/A";
                if (avgUniques30dEl) avgUniques30dEl.textContent = "N/A";
                if (returnEl) returnEl.textContent = "N/A";
                if (returnPctEl) returnPctEl.textContent = "N/A";
                if (avgPerEl) avgPerEl.textContent = "N/A";
                if (wowVisitsEl) wowVisitsEl.textContent = "N/A";
                if (wowUniquesEl) wowUniquesEl.textContent = "N/A";
                
                console.info("Visitor stats unavailable - offline mode in Electron app.");
                visitorStatsLoaded = true; // Mark as loaded to prevent retries
                return;
            }
            
            console.log("📊 Fetching visitor stats from:", statsUrl);
            
            visitorStatsFetchInFlight = true;
            const timeoutPromise = new Promise((_, reject) => 
                setTimeout(() => reject(new Error('Request timeout')), 5000)
            );
            
            Promise.race([
                fetch(statsUrl),
                timeoutPromise
            ])
                .then((res) => {
                    if (!res.ok) {
                        throw new Error(`HTTP error! status: ${res.status}`);
                    }
                    return res.text();
                })
                .then((text) => {
                    const trimmed = text.replace(/^\uFEFF/, '').trim();
                    let data;
                    try {
                        data = JSON.parse(trimmed);
                    } catch (parseErr) {
                        throw new Error('Invalid JSON from counter: ' + parseErr.message);
                    }
                    if (data && typeof data === "object" && !Array.isArray(data)) {
                        console.log("✅ Visitor stats loaded:", data);
                        visitorStatsData = data;
                        visitorStatsLoaded = true;
                        displayVisitorStats(data);
                    } else {
                        console.warn("⚠️ Invalid visitor stats data format:", data);
                    }
                })
                .catch((err) => {
                    console.warn("❌ Visitor counter fetch failed:", err);
                    // For Electron offline, show N/A instead of Error
                    const isOfflineError = isElectron && (!navigator.onLine || err.message.includes('fetch') || err.message.includes('Failed'));
                    
                    // Set all stats to "Error" or "N/A" if fetch fails
                    const totalEl = document.getElementById("visitor-total");
                    const uniqueEl = document.getElementById("visitor-unique");
                    const visits7dEl = document.getElementById("visitor-7d-visits");
                    const avgVisits7dEl = document.getElementById("visitor-7d-avg-visits");
                    const uniques7dEl = document.getElementById("visitor-7d-uniques");
                    const avgUniques7dEl = document.getElementById("visitor-7d-avg-uniques");
                    const visits14dEl = document.getElementById("visitor-14d-visits");
                    const avgVisits14dEl = document.getElementById("visitor-14d-avg-visits");
                    const uniques14dEl = document.getElementById("visitor-14d-uniques");
                    const avgUniques14dEl = document.getElementById("visitor-14d-avg-uniques");
                    const visits30dEl = document.getElementById("visitor-30d-visits");
                    const avgVisits30dEl = document.getElementById("visitor-30d-avg-visits");
                    const uniques30dEl = document.getElementById("visitor-30d-uniques");
                    const avgUniques30dEl = document.getElementById("visitor-30d-avg-uniques");
                    const returnEl = document.getElementById("visitor-return");
                    const returnPctEl = document.getElementById("visitor-return-pct");
                    const avgPerEl = document.getElementById("visitor-avg-per");
                    const wowVisitsEl = document.getElementById("visitor-wow-visits");
                    const wowUniquesEl = document.getElementById("visitor-wow-uniques");
                    
                    const errorText = isOfflineError ? "N/A" : "Error";
                    if (totalEl) totalEl.textContent = errorText;
                    if (uniqueEl) uniqueEl.textContent = errorText;
                    if (visits7dEl) visits7dEl.textContent = errorText;
                    if (avgVisits7dEl) avgVisits7dEl.textContent = errorText;
                    if (uniques7dEl) uniques7dEl.textContent = errorText;
                    if (avgUniques7dEl) avgUniques7dEl.textContent = errorText;
                    if (visits14dEl) visits14dEl.textContent = errorText;
                    if (avgVisits14dEl) avgVisits14dEl.textContent = errorText;
                    if (uniques14dEl) uniques14dEl.textContent = errorText;
                    if (avgUniques14dEl) avgUniques14dEl.textContent = errorText;
                    if (visits30dEl) visits30dEl.textContent = errorText;
                    if (avgVisits30dEl) avgVisits30dEl.textContent = errorText;
                    if (uniques30dEl) uniques30dEl.textContent = errorText;
                    if (avgUniques30dEl) avgUniques30dEl.textContent = errorText;
                    if (returnEl) returnEl.textContent = errorText;
                    if (returnPctEl) returnPctEl.textContent = errorText;
                    if (avgPerEl) avgPerEl.textContent = errorText;
                    if (wowVisitsEl) wowVisitsEl.textContent = errorText;
                    if (wowUniquesEl) wowUniquesEl.textContent = errorText;
                    
                    visitorStatsLoaded = true; // Mark as loaded to prevent retries
                })
                .finally(() => {
                    visitorStatsFetchInFlight = false;
                });
        }

        // Switch stats tab
        function switchStatsTab(tabId) {
            // Hide all tab contents
            document.querySelectorAll('.stats-tab-content').forEach(content => {
                content.style.display = 'none';
            });
            // Remove active class from all tabs
            document.querySelectorAll('.stats-tab-btn').forEach(btn => {
                btn.classList.remove('active');
                btn.style.background = 'transparent';
                btn.style.borderBottom = '2px solid transparent';
                btn.style.color = '#b0d4e6';
            });
            // Show selected tab content
            const content = document.getElementById(tabId + '-content');
            if (content) {
                content.style.display = 'block';
            }
            // Add active class to selected tab
            const tabBtn = document.getElementById('stats-tab-' + tabId.replace('stats-', ''));
            if (tabBtn) {
                tabBtn.classList.add('active');
                tabBtn.style.background = 'rgba(79, 195, 247, 0.2)';
                tabBtn.style.borderBottom = '2px solid #4fc3f7';
                tabBtn.style.color = '#4fc3f7';
            }
            if (typeof window.scrollMainViewportToTop === 'function') {
                window.scrollMainViewportToTop();
            }
        }

        // Display visitor stats (helper function to avoid code duplication)
        function displayVisitorStats(data) {
            // Lifetime totals (backward compatible)
            const totalEl = document.getElementById("visitor-total");
            const uniqueEl = document.getElementById("visitor-unique");
            
            const total = parseInt(data.total ?? "0");
            const unique = parseInt(data.unique ?? "0");
            
            if (totalEl) totalEl.textContent = total.toLocaleString();
            if (uniqueEl) uniqueEl.textContent = unique.toLocaleString();
            
            // Check if rolling metrics are available (new API format)
            if (data.rolling) {
                const rolling7d = data.rolling['7d'] || {};
                const rolling14d = data.rolling['14d'] || {};
                const rolling30d = data.rolling['30d'] || {};
                const wow = data.rolling.wow || {};
                
                // 7-day rolling metrics
                const visits7dEl = document.getElementById("visitor-7d-visits");
                const avgVisits7dEl = document.getElementById("visitor-7d-avg-visits");
                const uniques7dEl = document.getElementById("visitor-7d-uniques");
                const avgUniques7dEl = document.getElementById("visitor-7d-avg-uniques");
                
                if (visits7dEl) visits7dEl.textContent = (rolling7d.visits_sum || 0).toLocaleString();
                if (avgVisits7dEl) avgVisits7dEl.textContent = (rolling7d.visits_avg || 0).toFixed(1);
                if (uniques7dEl) uniques7dEl.textContent = (rolling7d.uniques_sum || 0).toLocaleString();
                if (avgUniques7dEl) avgUniques7dEl.textContent = (rolling7d.uniques_avg || 0).toFixed(1);
                
                // 14-day rolling metrics
                const visits14dEl = document.getElementById("visitor-14d-visits");
                const avgVisits14dEl = document.getElementById("visitor-14d-avg-visits");
                const uniques14dEl = document.getElementById("visitor-14d-uniques");
                const avgUniques14dEl = document.getElementById("visitor-14d-avg-uniques");
                
                if (visits14dEl) visits14dEl.textContent = (rolling14d.visits_sum || 0).toLocaleString();
                if (avgVisits14dEl) avgVisits14dEl.textContent = (rolling14d.visits_avg || 0).toFixed(1);
                if (uniques14dEl) uniques14dEl.textContent = (rolling14d.uniques_sum || 0).toLocaleString();
                if (avgUniques14dEl) avgUniques14dEl.textContent = (rolling14d.uniques_avg || 0).toFixed(1);
                
                // 30-day rolling metrics
                const visits30dEl = document.getElementById("visitor-30d-visits");
                const avgVisits30dEl = document.getElementById("visitor-30d-avg-visits");
                const uniques30dEl = document.getElementById("visitor-30d-uniques");
                const avgUniques30dEl = document.getElementById("visitor-30d-avg-uniques");
                
                if (visits30dEl) visits30dEl.textContent = (rolling30d.visits_sum || 0).toLocaleString();
                if (avgVisits30dEl) avgVisits30dEl.textContent = (rolling30d.visits_avg || 0).toFixed(1);
                if (uniques30dEl) uniques30dEl.textContent = (rolling30d.uniques_sum || 0).toLocaleString();
                if (avgUniques30dEl) avgUniques30dEl.textContent = (rolling30d.uniques_avg || 0).toFixed(1);
                
                // Engagement metrics (30-day)
                const returnEl = document.getElementById("visitor-return");
                const returnPctEl = document.getElementById("visitor-return-pct");
                const avgPerEl = document.getElementById("visitor-avg-per");
                
                if (returnEl) returnEl.textContent = (rolling30d.returning_sum || 0).toLocaleString();
                if (returnPctEl) returnPctEl.textContent = (rolling30d.return_rate || 0).toFixed(1) + "%";
                if (avgPerEl) avgPerEl.textContent = (rolling30d.avg_visits_per_unique || 0).toFixed(2);
                
                // Week-over-week deltas
                const wowVisitsEl = document.getElementById("visitor-wow-visits");
                const wowUniquesEl = document.getElementById("visitor-wow-uniques");
                
                if (wowVisitsEl) {
                    if (wow.delta_visits_pct !== null && wow.delta_visits_pct !== undefined) {
                        const sign = wow.delta_visits_pct >= 0 ? "+" : "";
                        wowVisitsEl.textContent = sign + wow.delta_visits_pct.toFixed(1) + "%";
                        wowVisitsEl.style.color = wow.delta_visits_pct >= 0 ? "#4caf50" : "#f44336";
                    } else {
                        wowVisitsEl.textContent = "—";
                        wowVisitsEl.style.color = "#4fc3f7";
                    }
                }
                
                if (wowUniquesEl) {
                    if (wow.delta_uniques_pct !== null && wow.delta_uniques_pct !== undefined) {
                        const sign = wow.delta_uniques_pct >= 0 ? "+" : "";
                        wowUniquesEl.textContent = sign + wow.delta_uniques_pct.toFixed(1) + "%";
                        wowUniquesEl.style.color = wow.delta_uniques_pct >= 0 ? "#4caf50" : "#f44336";
                    } else {
                        wowUniquesEl.textContent = "—";
                        wowUniquesEl.style.color = "#4fc3f7";
                    }
                }
            } else {
                // Fallback to old calculation method (backward compatibility)
                const visits7dEl = document.getElementById("visitor-7d-visits");
                const avgVisits7dEl = document.getElementById("visitor-7d-avg-visits");
                const uniques7dEl = document.getElementById("visitor-7d-uniques");
                const avgUniques7dEl = document.getElementById("visitor-7d-avg-uniques");
                const visits14dEl = document.getElementById("visitor-14d-visits");
                const avgVisits14dEl = document.getElementById("visitor-14d-avg-visits");
                const uniques14dEl = document.getElementById("visitor-14d-uniques");
                const avgUniques14dEl = document.getElementById("visitor-14d-avg-uniques");
                const visits30dEl = document.getElementById("visitor-30d-visits");
                const avgVisits30dEl = document.getElementById("visitor-30d-avg-visits");
                const uniques30dEl = document.getElementById("visitor-30d-uniques");
                const avgUniques30dEl = document.getElementById("visitor-30d-avg-uniques");
                const returnEl = document.getElementById("visitor-return");
                const returnPctEl = document.getElementById("visitor-return-pct");
                const avgPerEl = document.getElementById("visitor-avg-per");
                const wowVisitsEl = document.getElementById("visitor-wow-visits");
                const wowUniquesEl = document.getElementById("visitor-wow-uniques");
                
                const averages = calculateAverages(total, unique);
                // Use old averages for 30d as fallback
                if (avgVisits30dEl) avgVisits30dEl.textContent = averages.avgTotal;
                if (avgUniques30dEl) avgUniques30dEl.textContent = averages.avgUnique;
                
                const engagement = calculateEngagement(total, unique);
                if (returnEl) returnEl.textContent = engagement.returnVisits.toLocaleString();
                if (returnPctEl) returnPctEl.textContent = engagement.returnPct + "%";
                if (avgPerEl) avgPerEl.textContent = engagement.avgPerVisitor;
                
                // Show N/A for new metrics when using old API
                if (visits7dEl) visits7dEl.textContent = "N/A";
                if (avgVisits7dEl) avgVisits7dEl.textContent = "N/A";
                if (uniques7dEl) uniques7dEl.textContent = "N/A";
                if (avgUniques7dEl) avgUniques7dEl.textContent = "N/A";
                if (visits14dEl) visits14dEl.textContent = "N/A";
                if (avgVisits14dEl) avgVisits14dEl.textContent = "N/A";
                if (uniques14dEl) uniques14dEl.textContent = "N/A";
                if (avgUniques14dEl) avgUniques14dEl.textContent = "N/A";
                if (visits30dEl) visits30dEl.textContent = "N/A";
                if (uniques30dEl) uniques30dEl.textContent = "N/A";
                if (wowVisitsEl) {
                    wowVisitsEl.textContent = "N/A";
                    wowVisitsEl.style.color = "#4fc3f7";
                }
                if (wowUniquesEl) {
                    wowUniquesEl.textContent = "N/A";
                    wowUniquesEl.style.color = "#4fc3f7";
                }
            }
        }

        function hideCredits() {
            const modal = document.getElementById('creditsModal');
            if (modal) {
                modal.classList.remove('active');
                document.body.style.overflow = '';
            }
        }

        // Skippy easter egg - click counter
        let skippyClickCount = 0;
        let skippyClickTimeout = null;
        let skippyBackgroundActive = false;

        function handleSkippyClick() {
            // If background is already active, toggle it off
            if (skippyBackgroundActive) {
                disableSkippyBackground();
                return;
            }
            
            skippyClickCount++;
            
            // Clear any existing timeout
            if (skippyClickTimeout) {
                clearTimeout(skippyClickTimeout);
            }
            
            // Reset counter after 3 seconds of no clicks
            skippyClickTimeout = setTimeout(() => {
                skippyClickCount = 0;
            }, 3000);
            
            // If clicked 3 times, activate GIF background
            if (skippyClickCount >= 3 && skippyClickCount < 5) {
                enableSkippyBackground();
                
                // Don't reset counter yet - allow it to continue to 5 for theme unlock
            }
            
            // If clicked 5 times, unlock the theme (in addition to GIF background)
            if (skippyClickCount >= 5) {
                // Check if theme is already unlocked
                const isAlreadyUnlocked = localStorage.getItem('theme-skippy-unlocked') === 'true';
                
                if (!isAlreadyUnlocked) {
                    // Unlock the theme
                    localStorage.setItem('theme-skippy-unlocked', 'true');
                    
                    // Add theme to selector if not already present
                    const selector = document.getElementById('themeSelector');
                    if (selector) {
                        // Check if option already exists
                        const existingOption = selector.querySelector('option[value="theme-skippy"]');
                        if (!existingOption) {
                            const option = document.createElement('option');
                            option.value = 'theme-skippy';
                            option.textContent = '🔥💀 Skullmasher';
                            selector.appendChild(option);
                        }
                    }
                    
                    // Automatically switch to the new theme immediately
                    changeTheme('theme-skippy');
                    
                    // Show popup notification after a brief delay to ensure theme is applied
                    setTimeout(() => {
                        showThemeUnlockPopup('🔥💀 Skullmasher');
                    }, 100);
                } else {
                    // Theme already unlocked, just show "already unlocked" popup
                    showThemeAlreadyUnlockedPopup();
                }
                
                // Reset counter
                skippyClickCount = 0;
                if (skippyClickTimeout) {
                    clearTimeout(skippyClickTimeout);
                }
            }
        }

        function enableSkippyBackground() {
            // Disable other easter eggs if active
            if (hobamjBackgroundActive) {
                disableHobamjBackground();
            }
            if (mattmabBackgroundActive) {
                disableMattmabBackground();
            }
            if (venomBackgroundActive) {
                disableVenomBackground();
            }
            if (sinBackgroundActive) {
                disableSinBackground();
            }
            if (ynotBackgroundActive) {
                disableYnotBackground();
            }
            if (dunkieBackgroundActive) {
                disableDunkieBackground();
            }
            if (mrUserBackgroundActive) {
                disableMrUserBackground();
            }
            if (lShiftBackgroundActive) {
                disableLShiftBackground();
            }
            if (nicnlBackgroundActive) {
                disableNicnlBackground();
            }
            if (girthquakeBackgroundActive) {
                disableGirthquakeBackground();
            }
            
            skippyBackgroundActive = true;
            
            // Save to localStorage
            localStorage.setItem('skippy-background-active', 'true');
            
            // Set body background to Skippy GIF
            document.body.style.backgroundImage = 'url(https://save-editor.be/Skippy.gif)';
            document.body.style.backgroundSize = 'cover';
            document.body.style.backgroundPosition = 'center';
            document.body.style.backgroundRepeat = 'no-repeat';
            document.body.style.backgroundAttachment = 'fixed';
            
            // Hide backdrop effect to see the GIF background
            const backdropEffect = document.getElementById('backdropEffect');
            if (backdropEffect) {
                backdropEffect.style.display = 'none';
            }
            
            // Create and show close button
            createSkippyCloseButton();
        }

        function disableSkippyBackground() {
            skippyBackgroundActive = false;
            
            // Remove from localStorage
            localStorage.removeItem('skippy-background-active');
            
            // Reset body background to default (let theme handle it)
            document.body.style.backgroundImage = '';
            document.body.style.backgroundSize = '';
            document.body.style.backgroundPosition = '';
            document.body.style.backgroundRepeat = '';
            document.body.style.backgroundAttachment = '';
            
            // Show backdrop effect again
            const backdropEffect = document.getElementById('backdropEffect');
            if (backdropEffect) {
                backdropEffect.style.display = '';
            }
            
            // Remove close button
            const closeBtn = document.getElementById('skippy-close-btn');
            if (closeBtn) {
                closeBtn.remove();
            }
        }

        function createSkippyCloseButton() {
            // Remove existing button if any
            const existingBtn = document.getElementById('skippy-close-btn');
            if (existingBtn) {
                existingBtn.remove();
            }
            
            // Create close button
            const closeBtn = document.createElement('div');
            closeBtn.id = 'skippy-close-btn';
            closeBtn.innerHTML = '✕';
            closeBtn.title = 'Click to disable secret background';
            closeBtn.style.cssText = `
                position: fixed;
                top: var(--page-pad);
                right: var(--page-pad);
                width: 34px;
                height: 34px;
                background: rgba(244, 67, 54, 0.8);
                border: 2px solid rgba(244, 67, 54, 1);
                border-radius: 50%;
                color: white;
                font-size: 18px;
                font-weight: bold;
                display: flex;
                align-items: center;
                justify-content: center;
                cursor: pointer;
                z-index: 10001;
                box-shadow: 0 4px 15px rgba(0, 0, 0, 0.5);
                transition: all 0.3s ease;
            `;
            closeBtn.onmouseover = function() {
                this.style.background = 'rgba(244, 67, 54, 1)';
                this.style.transform = 'scale(1.1)';
            };
            closeBtn.onmouseout = function() {
                this.style.background = 'rgba(244, 67, 54, 0.8)';
                this.style.transform = 'scale(1)';
            };
            closeBtn.onclick = function(e) {
                e.stopPropagation();
                disableSkippyBackground();
            };
            
            document.body.appendChild(closeBtn);
        }

        // Hobamj easter egg - click counter
        let hobamjClickCount = 0;
        let hobamjClickTimeout = null;
        let hobamjBackgroundActive = false;

        function handleHobamjClick() {
            // If background is already active, toggle it off
            if (hobamjBackgroundActive) {
                disableHobamjBackground();
                return;
            }
            
            hobamjClickCount++;
            
            // Clear any existing timeout
            if (hobamjClickTimeout) {
                clearTimeout(hobamjClickTimeout);
            }
            
            // Reset counter after 3 seconds of no clicks
            hobamjClickTimeout = setTimeout(() => {
                hobamjClickCount = 0;
            }, 3000);
            
            // If clicked 3 times, activate easter egg
            if (hobamjClickCount >= 3) {
                enableHobamjBackground();
                
                // Reset counter
                hobamjClickCount = 0;
                if (hobamjClickTimeout) {
                    clearTimeout(hobamjClickTimeout);
                }
            }
        }

        function enableHobamjBackground() {
            // Disable other easter eggs if active
            if (skippyBackgroundActive) {
                disableSkippyBackground();
            }
            if (mattmabBackgroundActive) {
                disableMattmabBackground();
            }
            if (venomBackgroundActive) {
                disableVenomBackground();
            }
            if (sinBackgroundActive) {
                disableSinBackground();
            }
            if (ynotBackgroundActive) {
                disableYnotBackground();
            }
            if (dunkieBackgroundActive) {
                disableDunkieBackground();
            }
            if (mrUserBackgroundActive) {
                disableMrUserBackground();
            }
            if (lShiftBackgroundActive) {
                disableLShiftBackground();
            }
            if (nicnlBackgroundActive) {
                disableNicnlBackground();
            }
            if (girthquakeBackgroundActive) {
                disableGirthquakeBackground();
            }
            
            hobamjBackgroundActive = true;
            
            // Save to localStorage
            localStorage.setItem('hobamj-background-active', 'true');
            
            // Set body background to Hobamj GIF
            document.body.style.backgroundImage = 'url(https://save-editor.be/Hobamj.gif)';
            document.body.style.backgroundSize = 'cover';
            document.body.style.backgroundPosition = 'center';
            document.body.style.backgroundRepeat = 'no-repeat';
            document.body.style.backgroundAttachment = 'fixed';
            
            // Hide backdrop effect to see the GIF background
            const backdropEffect = document.getElementById('backdropEffect');
            if (backdropEffect) {
                backdropEffect.style.display = 'none';
            }
            
            // Create close button
            createHobamjCloseButton();
        }

        function disableHobamjBackground() {
            hobamjBackgroundActive = false;
            
            // Remove from localStorage
            localStorage.removeItem('hobamj-background-active');
            
            // Reset body background to default (let theme handle it)
            document.body.style.backgroundImage = '';
            document.body.style.backgroundSize = '';
            document.body.style.backgroundPosition = '';
            document.body.style.backgroundRepeat = '';
            document.body.style.backgroundAttachment = '';
            
            // Show backdrop effect again
            const backdropEffect = document.getElementById('backdropEffect');
            if (backdropEffect) {
                backdropEffect.style.display = '';
            }
            
            // Remove close button
            const closeBtn = document.getElementById('hobamj-close-btn');
            if (closeBtn) {
                closeBtn.remove();
            }
        }

        function createHobamjCloseButton() {
            // Remove existing button if any
            const existingBtn = document.getElementById('hobamj-close-btn');
            if (existingBtn) {
                existingBtn.remove();
            }
            
            // Create close button
            const closeBtn = document.createElement('div');
            closeBtn.id = 'hobamj-close-btn';
            closeBtn.innerHTML = '✕';
            closeBtn.title = 'Click to disable secret background';
            closeBtn.style.cssText = `
                position: fixed;
                top: var(--page-pad);
                right: var(--page-pad);
                width: 34px;
                height: 34px;
                background: rgba(244, 67, 54, 0.8);
                border: 2px solid rgba(244, 67, 54, 1);
                border-radius: 50%;
                color: white;
                font-size: 18px;
                font-weight: bold;
                display: flex;
                align-items: center;
                justify-content: center;
                cursor: pointer;
                z-index: 10000;
                transition: all 0.2s;
                box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
            `;
            
            closeBtn.onmouseover = function() {
                this.style.background = 'rgba(244, 67, 54, 1)';
                this.style.transform = 'scale(1.1)';
            };
            
            closeBtn.onmouseout = function() {
                this.style.background = 'rgba(244, 67, 54, 0.8)';
                this.style.transform = 'scale(1)';
            };
            
            closeBtn.onclick = function() {
                disableHobamjBackground();
            };
            
            document.body.appendChild(closeBtn);
        }

        // Sin easter egg - click counter
        let sinClickCount = 0;
        let sinClickTimeout = null;
        let sinBackgroundActive = false;

        function handleSinClick() {
            // If background is already active, toggle it off
            if (sinBackgroundActive) {
                disableSinBackground();
                return;
            }
            
            sinClickCount++;
            
            // Clear any existing timeout
            if (sinClickTimeout) {
                clearTimeout(sinClickTimeout);
            }
            
            // Reset counter after 3 seconds of no clicks
            sinClickTimeout = setTimeout(() => {
                sinClickCount = 0;
            }, 3000);
            
            // If clicked 3 times, activate easter egg
            if (sinClickCount >= 3) {
                enableSinBackground();
                
                // Reset counter
                sinClickCount = 0;
                if (sinClickTimeout) {
                    clearTimeout(sinClickTimeout);
                }
            }
        }

        function enableSinBackground() {
            // Disable other easter eggs if active
            if (skippyBackgroundActive) {
                disableSkippyBackground();
            }
            if (hobamjBackgroundActive) {
                disableHobamjBackground();
            }
            if (mattmabBackgroundActive) {
                disableMattmabBackground();
            }
            if (venomBackgroundActive) {
                disableVenomBackground();
            }
            if (ynotBackgroundActive) {
                disableYnotBackground();
            }
            if (dunkieBackgroundActive) {
                disableDunkieBackground();
            }
            if (mrUserBackgroundActive) {
                disableMrUserBackground();
            }
            if (lShiftBackgroundActive) {
                disableLShiftBackground();
            }
            if (nicnlBackgroundActive) {
                disableNicnlBackground();
            }
            if (girthquakeBackgroundActive) {
                disableGirthquakeBackground();
            }
            
            sinBackgroundActive = true;
            
            // Save to localStorage
            localStorage.setItem('sin-background-active', 'true');
            
            // Set body background to Sin GIF
            document.body.style.backgroundImage = 'url(https://save-editor.be/Sin.gif)';
            document.body.style.backgroundSize = 'cover';
            document.body.style.backgroundPosition = 'center';
            document.body.style.backgroundRepeat = 'no-repeat';
            document.body.style.backgroundAttachment = 'fixed';
            
            // Hide backdrop effect to see the GIF background
            const backdropEffect = document.getElementById('backdropEffect');
            if (backdropEffect) {
                backdropEffect.style.display = 'none';
            }
            
            // Create and show close button
            createSinCloseButton();
        }

        function disableSinBackground() {
            sinBackgroundActive = false;
            
            // Remove from localStorage
            localStorage.removeItem('sin-background-active');
            
            // Reset body background to default (let theme handle it)
            document.body.style.backgroundImage = '';
            document.body.style.backgroundSize = '';
            document.body.style.backgroundPosition = '';
            document.body.style.backgroundRepeat = '';
            document.body.style.backgroundAttachment = '';
            
            // Show backdrop effect again
            const backdropEffect = document.getElementById('backdropEffect');
            if (backdropEffect) {
                backdropEffect.style.display = '';
            }
            
            // Remove close button
            const closeBtn = document.getElementById('sin-close-btn');
            if (closeBtn) {
                closeBtn.remove();
            }
        }

        function createSinCloseButton() {
            // Remove existing button if any
            const existingBtn = document.getElementById('sin-close-btn');
            if (existingBtn) {
                existingBtn.remove();
            }
            
            // Create close button
            const closeBtn = document.createElement('div');
            closeBtn.id = 'sin-close-btn';
            closeBtn.innerHTML = '✕';
            closeBtn.title = 'Click to disable secret background';
            closeBtn.style.cssText = `
                position: fixed;
                top: var(--page-pad);
                right: var(--page-pad);
                width: 34px;
                height: 34px;
                background: rgba(244, 67, 54, 0.8);
                border: 2px solid rgba(244, 67, 54, 1);
                border-radius: 50%;
                color: white;
                font-size: 18px;
                font-weight: bold;
                display: flex;
                align-items: center;
                justify-content: center;
                cursor: pointer;
                z-index: 10001;
                box-shadow: 0 4px 15px rgba(0, 0, 0, 0.5);
                transition: all 0.3s ease;
            `;
            closeBtn.onmouseover = function() {
                this.style.background = 'rgba(244, 67, 54, 1)';
                this.style.transform = 'scale(1.1)';
            };
            closeBtn.onmouseout = function() {
                this.style.background = 'rgba(244, 67, 54, 0.8)';
                this.style.transform = 'scale(1)';
            };
            closeBtn.onclick = function(e) {
                e.stopPropagation();
                disableSinBackground();
            };
            
            document.body.appendChild(closeBtn);
        }

        // Ynot easter egg - click counter
        let ynotClickCount = 0;
        let ynotClickTimeout = null;
        let ynotBackgroundActive = false;

        function handleYnotClick() {
            // If background is already active, toggle it off
            if (ynotBackgroundActive) {
                disableYnotBackground();
                return;
            }
            
            ynotClickCount++;
            
            // Clear any existing timeout
            if (ynotClickTimeout) {
                clearTimeout(ynotClickTimeout);
            }
            
            // Reset counter after 3 seconds of no clicks
            ynotClickTimeout = setTimeout(() => {
                ynotClickCount = 0;
            }, 3000);
            
            // If clicked 3 times, activate easter egg
            if (ynotClickCount >= 3) {
                enableYnotBackground();
                
                // Reset counter
                ynotClickCount = 0;
                if (ynotClickTimeout) {
                    clearTimeout(ynotClickTimeout);
                }
            }
        }

        function enableYnotBackground() {
            // Disable other easter eggs if active
            if (skippyBackgroundActive) {
                disableSkippyBackground();
            }
            if (hobamjBackgroundActive) {
                disableHobamjBackground();
            }
            if (mattmabBackgroundActive) {
                disableMattmabBackground();
            }
            if (venomBackgroundActive) {
                disableVenomBackground();
            }
            if (sinBackgroundActive) {
                disableSinBackground();
            }
            if (dunkieBackgroundActive) {
                disableDunkieBackground();
            }
            if (mrUserBackgroundActive) {
                disableMrUserBackground();
            }
            if (lShiftBackgroundActive) {
                disableLShiftBackground();
            }
            if (nicnlBackgroundActive) {
                disableNicnlBackground();
            }
            if (girthquakeBackgroundActive) {
                disableGirthquakeBackground();
            }
            
            ynotBackgroundActive = true;
            
            // Save to localStorage
            localStorage.setItem('ynot-background-active', 'true');
            
            // Set body background to Ynot JPG
            document.body.style.backgroundImage = 'url(https://save-editor.be/Ynot.jpg)';
            document.body.style.backgroundSize = 'cover';
            document.body.style.backgroundPosition = 'center';
            document.body.style.backgroundRepeat = 'no-repeat';
            document.body.style.backgroundAttachment = 'fixed';
            
            // Hide backdrop effect to see the JPG background
            const backdropEffect = document.getElementById('backdropEffect');
            if (backdropEffect) {
                backdropEffect.style.display = 'none';
            }
            
            // Create and show close button
            createYnotCloseButton();
        }

        function disableYnotBackground() {
            ynotBackgroundActive = false;
            
            // Remove from localStorage
            localStorage.removeItem('ynot-background-active');
            
            // Reset body background to default (let theme handle it)
            document.body.style.backgroundImage = '';
            document.body.style.backgroundSize = '';
            document.body.style.backgroundPosition = '';
            document.body.style.backgroundRepeat = '';
            document.body.style.backgroundAttachment = '';
            
            // Show backdrop effect again
            const backdropEffect = document.getElementById('backdropEffect');
            if (backdropEffect) {
                backdropEffect.style.display = '';
            }
            
            // Remove close button
            const closeBtn = document.getElementById('ynot-close-btn');
            if (closeBtn) {
                closeBtn.remove();
            }
        }

        function createYnotCloseButton() {
            // Remove existing button if any
            const existingBtn = document.getElementById('ynot-close-btn');
            if (existingBtn) {
                existingBtn.remove();
            }
            
            // Create close button
            const closeBtn = document.createElement('div');
            closeBtn.id = 'ynot-close-btn';
            closeBtn.innerHTML = '✕';
            closeBtn.title = 'Click to disable secret background';
            closeBtn.style.cssText = `
                position: fixed;
                top: var(--page-pad);
                right: var(--page-pad);
                width: 34px;
                height: 34px;
                background: rgba(244, 67, 54, 0.8);
                border: 2px solid rgba(244, 67, 54, 1);
                border-radius: 50%;
                color: white;
                font-size: 18px;
                font-weight: bold;
                display: flex;
                align-items: center;
                justify-content: center;
                cursor: pointer;
                z-index: 10001;
                box-shadow: 0 4px 15px rgba(0, 0, 0, 0.5);
                transition: all 0.3s ease;
            `;
            closeBtn.onmouseover = function() {
                this.style.background = 'rgba(244, 67, 54, 1)';
                this.style.transform = 'scale(1.1)';
            };
            closeBtn.onmouseout = function() {
                this.style.background = 'rgba(244, 67, 54, 0.8)';
                this.style.transform = 'scale(1)';
            };
            closeBtn.onclick = function(e) {
                e.stopPropagation();
                disableYnotBackground();
            };
            
            document.body.appendChild(closeBtn);
        }

        // DunkieButt1985 easter egg - click counter
        let dunkieClickCount = 0;
        let dunkieClickTimeout = null;
        let dunkieBackgroundActive = false;

        // MrUser easter egg - click counter for GIF background
        let mrUserClickCount = 0;
        let mrUserClickTimeout = null;
        let mrUserBackgroundActive = false;

        // LShift easter egg - click counter for background
        let lShiftClickCount = 0;
        let lShiftClickTimeout = null;
        let lShiftBackgroundActive = false;

        // Nicnl easter egg - click counter for background video
        let nicnlClickCount = 0;
        let nicnlClickTimeout = null;
        let nicnlBackgroundActive = false;

        // GIRTHQUAKE easter egg - click counter for background video
        let girthquakeClickCount = 0;
        let girthquakeClickTimeout = null;
        let girthquakeBackgroundActive = false;

        function handleDunkieClick() {
            // If background is already active, toggle it off
            if (dunkieBackgroundActive) {
                disableDunkieBackground();
                return;
            }
            
            dunkieClickCount++;
            
            // Clear any existing timeout
            if (dunkieClickTimeout) {
                clearTimeout(dunkieClickTimeout);
            }
            
            // Reset counter after 3 seconds of no clicks
            dunkieClickTimeout = setTimeout(() => {
                dunkieClickCount = 0;
            }, 3000);
            
            // If clicked 3 times, activate GIF background
            if (dunkieClickCount >= 3 && dunkieClickCount < 5) {
                enableDunkieBackground();
                
                // Don't reset counter yet - allow it to continue to 5 for theme unlock
            }
            
            // If clicked 5 times, unlock the theme (in addition to GIF background)
            if (dunkieClickCount >= 5) {
                // Check if theme is already unlocked
                const isAlreadyUnlocked = localStorage.getItem('theme-dunkie-unlocked') === 'true';
                
                if (!isAlreadyUnlocked) {
                    // Unlock the theme
                    localStorage.setItem('theme-dunkie-unlocked', 'true');
                    
                    // Add theme to selector if not already present
                    const selector = document.getElementById('themeSelector');
                    if (selector) {
                        // Check if option already exists
                        const existingOption = selector.querySelector('option[value="theme-dunkie"]');
                        if (!existingOption) {
                            const option = document.createElement('option');
                            option.value = 'theme-dunkie';
                            option.textContent = '💖 Lootlobby Queen';
                            selector.appendChild(option);
                        }
                    }
                    
                    // Automatically switch to the new theme immediately
                    changeTheme('theme-dunkie');
                    
                    // Show popup notification after a brief delay to ensure theme is applied
                    setTimeout(() => {
                        showThemeUnlockPopup('💖 Lootlobby Queen');
                    }, 100);
                } else {
                    // Theme already unlocked, just show "already unlocked" popup
                    showThemeAlreadyUnlockedPopup();
                }
                
                // Reset counter
                dunkieClickCount = 0;
                if (dunkieClickTimeout) {
                    clearTimeout(dunkieClickTimeout);
                }
            }
        }

        function enableDunkieBackground() {
            // Disable other easter eggs if active
            if (skippyBackgroundActive) {
                disableSkippyBackground();
            }
            if (hobamjBackgroundActive) {
                disableHobamjBackground();
            }
            if (mattmabBackgroundActive) {
                disableMattmabBackground();
            }
            if (venomBackgroundActive) {
                disableVenomBackground();
            }
            if (sinBackgroundActive) {
                disableSinBackground();
            }
            if (ynotBackgroundActive) {
                disableYnotBackground();
            }
            if (mrUserBackgroundActive) {
                disableMrUserBackground();
            }
            if (lShiftBackgroundActive) {
                disableLShiftBackground();
            }
            if (nicnlBackgroundActive) {
                disableNicnlBackground();
            }
            if (girthquakeBackgroundActive) {
                disableGirthquakeBackground();
            }
            
            dunkieBackgroundActive = true;
            
            // Save to localStorage
            localStorage.setItem('dunkie-background-active', 'true');
            
            // Set body background to Dunkie image (use image URL if available)
            // If image doesn't exist, this will fail gracefully and theme background will show
            document.body.style.backgroundImage = 'url(https://save-editor.be/Dunkie.jpg)';
            document.body.style.backgroundSize = 'cover';
            document.body.style.backgroundPosition = 'center';
            document.body.style.backgroundRepeat = 'no-repeat';
            document.body.style.backgroundAttachment = 'fixed';
            
            // Hide backdrop effect to see the background
            const backdropEffect = document.getElementById('backdropEffect');
            if (backdropEffect) {
                backdropEffect.style.display = 'none';
            }
            
            // Create and show close button
            createDunkieCloseButton();
        }

        function disableDunkieBackground() {
            dunkieBackgroundActive = false;
            
            // Remove from localStorage
            localStorage.removeItem('dunkie-background-active');
            
            // Reset body background to default (let theme handle it)
            document.body.style.backgroundImage = '';
            document.body.style.backgroundSize = '';
            document.body.style.backgroundPosition = '';
            document.body.style.backgroundRepeat = '';
            document.body.style.backgroundAttachment = '';
            
            // Show backdrop effect again
            const backdropEffect = document.getElementById('backdropEffect');
            if (backdropEffect) {
                backdropEffect.style.display = '';
            }
            
            // Remove close button
            const closeBtn = document.getElementById('dunkie-close-btn');
            if (closeBtn) {
                closeBtn.remove();
            }
        }

        function createDunkieCloseButton() {
            // Remove existing button if any
            const existingBtn = document.getElementById('dunkie-close-btn');
            if (existingBtn) {
                existingBtn.remove();
            }
            
            // Create close button with pink theme
            const closeBtn = document.createElement('div');
            closeBtn.id = 'dunkie-close-btn';
            closeBtn.innerHTML = '✕';
            closeBtn.title = 'Click to disable secret background';
            closeBtn.style.cssText = `
                position: fixed;
                top: var(--page-pad);
                right: var(--page-pad);
                width: 34px;
                height: 34px;
                background: rgba(255, 105, 180, 0.8);
                border: 2px solid rgba(255, 105, 180, 1);
                border-radius: 50%;
                color: white;
                font-size: 18px;
                font-weight: bold;
                display: flex;
                align-items: center;
                justify-content: center;
                cursor: pointer;
                z-index: 10001;
                box-shadow: 0 4px 15px rgba(255, 105, 180, 0.5);
                transition: all 0.3s ease;
            `;
            closeBtn.onmouseover = function() {
                this.style.background = 'rgba(255, 105, 180, 1)';
                this.style.transform = 'scale(1.1)';
            };
            closeBtn.onmouseout = function() {
                this.style.background = 'rgba(255, 105, 180, 0.8)';
                this.style.transform = 'scale(1)';
            };
            closeBtn.onclick = function(e) {
                e.stopPropagation();
                disableDunkieBackground();
            };
            
            document.body.appendChild(closeBtn);
        }

        // MrUser easter egg - GIF background
        function handleMrUserClick() {
            // If background is already active, toggle it off
            if (mrUserBackgroundActive) {
                disableMrUserBackground();
                return;
            }
            
            mrUserClickCount++;
            
            // Clear any existing timeout
            if (mrUserClickTimeout) {
                clearTimeout(mrUserClickTimeout);
            }
            
            // Reset counter after 3 seconds of no clicks
            mrUserClickTimeout = setTimeout(() => {
                mrUserClickCount = 0;
            }, 3000);
            
            // If clicked 3 times, activate GIF background
            if (mrUserClickCount >= 3) {
                enableMrUserBackground();
                
                // Reset counter
                mrUserClickCount = 0;
                if (mrUserClickTimeout) {
                    clearTimeout(mrUserClickTimeout);
                }
            }
        }

        function enableMrUserBackground() {
            // Disable other easter eggs if active
            if (skippyBackgroundActive) {
                disableSkippyBackground();
            }
            if (hobamjBackgroundActive) {
                disableHobamjBackground();
            }
            if (mattmabBackgroundActive) {
                disableMattmabBackground();
            }
            if (venomBackgroundActive) {
                disableVenomBackground();
            }
            if (sinBackgroundActive) {
                disableSinBackground();
            }
            if (ynotBackgroundActive) {
                disableYnotBackground();
            }
            if (dunkieBackgroundActive) {
                disableDunkieBackground();
            }
            if (lShiftBackgroundActive) {
                disableLShiftBackground();
            }
            if (nicnlBackgroundActive) {
                disableNicnlBackground();
            }
            if (girthquakeBackgroundActive) {
                disableGirthquakeBackground();
            }
            
            mrUserBackgroundActive = true;
            
            // Save to localStorage
            localStorage.setItem('mruser-background-active', 'true');
            
            // Set body background to MrUser GIF
            document.body.style.backgroundImage = 'url(https://save-editor.be/MrUser.gif)';
            document.body.style.backgroundSize = 'cover';
            document.body.style.backgroundPosition = 'center';
            document.body.style.backgroundRepeat = 'no-repeat';
            document.body.style.backgroundAttachment = 'fixed';
            
            // Hide backdrop effect to see the background
            const backdropEffect = document.getElementById('backdropEffect');
            if (backdropEffect) {
                backdropEffect.style.display = 'none';
            }
            
            // Create and show close button
            createMrUserCloseButton();
        }

        function disableMrUserBackground() {
            mrUserBackgroundActive = false;
            
            // Remove from localStorage
            localStorage.removeItem('mruser-background-active');
            
            // Reset body background to default (let theme handle it)
            document.body.style.backgroundImage = '';
            document.body.style.backgroundSize = '';
            document.body.style.backgroundPosition = '';
            document.body.style.backgroundRepeat = '';
            document.body.style.backgroundAttachment = '';
            
            // Show backdrop effect again
            const backdropEffect = document.getElementById('backdropEffect');
            if (backdropEffect) {
                backdropEffect.style.display = '';
            }
            
            // Remove close button
            const closeBtn = document.getElementById('mruser-close-btn');
            if (closeBtn) {
                closeBtn.remove();
            }
        }

        function createMrUserCloseButton() {
            // Remove existing button if any
            const existingBtn = document.getElementById('mruser-close-btn');
            if (existingBtn) {
                existingBtn.remove();
            }
            
            // Create close button
            const closeBtn = document.createElement('div');
            closeBtn.id = 'mruser-close-btn';
            closeBtn.innerHTML = '✕';
            closeBtn.title = 'Click to disable secret background';
            closeBtn.style.cssText = `
                position: fixed;
                top: var(--page-pad);
                right: var(--page-pad);
                width: 34px;
                height: 34px;
                background: rgba(79, 195, 247, 0.8);
                border: 2px solid rgba(79, 195, 247, 1);
                border-radius: 50%;
                color: white;
                font-size: 18px;
                font-weight: bold;
                display: flex;
                align-items: center;
                justify-content: center;
                cursor: pointer;
                z-index: 10000;
                transition: all 0.2s;
                box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
            `;
            
            closeBtn.onmouseover = function() {
                this.style.background = 'rgba(79, 195, 247, 1)';
                this.style.transform = 'scale(1.1)';
            };
            
            closeBtn.onmouseout = function() {
                this.style.background = 'rgba(79, 195, 247, 0.8)';
                this.style.transform = 'scale(1)';
            };
            
            closeBtn.onclick = function() {
                disableMrUserBackground();
            };
            
            document.body.appendChild(closeBtn);
        }

        // LShift easter egg - background
        function handleLShiftClick() {
            // If background is already active, toggle it off
            if (lShiftBackgroundActive) {
                disableLShiftBackground();
                return;
            }
            
            lShiftClickCount++;
            
            // Clear any existing timeout
            if (lShiftClickTimeout) {
                clearTimeout(lShiftClickTimeout);
            }
            
            // Reset counter after 3 seconds of no clicks
            lShiftClickTimeout = setTimeout(() => {
                lShiftClickCount = 0;
            }, 3000);
            
            // If clicked 3 times, activate background
            if (lShiftClickCount >= 3) {
                enableLShiftBackground();
                
                // Reset counter
                lShiftClickCount = 0;
                if (lShiftClickTimeout) {
                    clearTimeout(lShiftClickTimeout);
                }
            }
        }

        function enableLShiftBackground() {
            // Disable other easter eggs if active
            if (skippyBackgroundActive) {
                disableSkippyBackground();
            }
            if (hobamjBackgroundActive) {
                disableHobamjBackground();
            }
            if (mattmabBackgroundActive) {
                disableMattmabBackground();
            }
            if (venomBackgroundActive) {
                disableVenomBackground();
            }
            if (sinBackgroundActive) {
                disableSinBackground();
            }
            if (ynotBackgroundActive) {
                disableYnotBackground();
            }
            if (dunkieBackgroundActive) {
                disableDunkieBackground();
            }
            if (mrUserBackgroundActive) {
                disableMrUserBackground();
            }
            if (nicnlBackgroundActive) {
                disableNicnlBackground();
            }
            if (girthquakeBackgroundActive) {
                disableGirthquakeBackground();
            }
            
            lShiftBackgroundActive = true;
            
            // Save to localStorage
            localStorage.setItem('lshift-background-active', 'true');
            
            // Set body background to LShift image
            document.body.style.backgroundImage = 'url(https://save-editor.be/Lshift.jpg)';
            document.body.style.backgroundSize = 'cover';
            document.body.style.backgroundPosition = 'center';
            document.body.style.backgroundRepeat = 'no-repeat';
            document.body.style.backgroundAttachment = 'fixed';
            
            // Hide backdrop effect to see the background
            const backdropEffect = document.getElementById('backdropEffect');
            if (backdropEffect) {
                backdropEffect.style.display = 'none';
            }
            
            // Create and show close button
            createLShiftCloseButton();
        }

        function disableLShiftBackground() {
            lShiftBackgroundActive = false;
            
            // Remove from localStorage
            localStorage.removeItem('lshift-background-active');
            
            // Reset body background to default (let theme handle it)
            document.body.style.backgroundImage = '';
            document.body.style.backgroundSize = '';
            document.body.style.backgroundPosition = '';
            document.body.style.backgroundRepeat = '';
            document.body.style.backgroundAttachment = '';
            
            // Show backdrop effect again
            const backdropEffect = document.getElementById('backdropEffect');
            if (backdropEffect) {
                backdropEffect.style.display = '';
            }
            
            // Remove close button
            const closeBtn = document.getElementById('lshift-close-btn');
            if (closeBtn) {
                closeBtn.remove();
            }
        }

        function createLShiftCloseButton() {
            // Remove existing button if any
            const existingBtn = document.getElementById('lshift-close-btn');
            if (existingBtn) {
                existingBtn.remove();
            }
            
            // Create close button
            const closeBtn = document.createElement('div');
            closeBtn.id = 'lshift-close-btn';
            closeBtn.innerHTML = '✕';
            closeBtn.title = 'Click to disable secret background';
            closeBtn.style.cssText = `
                position: fixed;
                top: var(--page-pad);
                right: var(--page-pad);
                width: 34px;
                height: 34px;
                background: rgba(79, 195, 247, 0.8);
                border: 2px solid rgba(79, 195, 247, 1);
                border-radius: 50%;
                color: white;
                font-size: 18px;
                font-weight: bold;
                display: flex;
                align-items: center;
                justify-content: center;
                cursor: pointer;
                z-index: 10000;
                transition: all 0.2s;
                box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
            `;
            
            closeBtn.onmouseover = function() {
                this.style.background = 'rgba(79, 195, 247, 1)';
                this.style.transform = 'scale(1.1)';
            };
            
            closeBtn.onmouseout = function() {
                this.style.background = 'rgba(79, 195, 247, 0.8)';
                this.style.transform = 'scale(1)';
            };
            
            closeBtn.onclick = function() {
                disableLShiftBackground();
            };
            
            document.body.appendChild(closeBtn);
        }

        // Nicnl easter egg - background video
        function handleNicnlClick() {
            // If background is already active, toggle it off
            if (nicnlBackgroundActive) {
                disableNicnlBackground();
                return;
            }

            nicnlClickCount++;

            // Clear any existing timeout
            if (nicnlClickTimeout) {
                clearTimeout(nicnlClickTimeout);
            }

            // Reset counter after 3 seconds of no clicks
            nicnlClickTimeout = setTimeout(() => {
                nicnlClickCount = 0;
            }, 3000);

            // If clicked 3 times, activate video background
            if (nicnlClickCount >= 3) {
                enableNicnlBackground();

                // Reset counter
                nicnlClickCount = 0;
                if (nicnlClickTimeout) {
                    clearTimeout(nicnlClickTimeout);
                }
            }
        }

        function enableNicnlBackground() {
            // Disable other easter eggs if active
            if (skippyBackgroundActive) {
                disableSkippyBackground();
            }
            if (hobamjBackgroundActive) {
                disableHobamjBackground();
            }
            if (mattmabBackgroundActive) {
                disableMattmabBackground();
            }
            if (venomBackgroundActive) {
                disableVenomBackground();
            }
            if (sinBackgroundActive) {
                disableSinBackground();
            }
            if (ynotBackgroundActive) {
                disableYnotBackground();
            }
            if (dunkieBackgroundActive) {
                disableDunkieBackground();
            }
            if (mrUserBackgroundActive) {
                disableMrUserBackground();
            }
            if (lShiftBackgroundActive) {
                disableLShiftBackground();
            }
            if (girthquakeBackgroundActive) {
                disableGirthquakeBackground();
            }

            nicnlBackgroundActive = true;

            // Save to localStorage
            localStorage.setItem('nicnl-background-active', 'true');

            // Reset body background image because this egg uses a video layer
            document.body.style.backgroundImage = '';
            document.body.style.backgroundSize = '';
            document.body.style.backgroundPosition = '';
            document.body.style.backgroundRepeat = '';
            document.body.style.backgroundAttachment = '';

            // Ensure there is only one video background element
            const existingVideo = document.getElementById('nicnl-video-bg');
            if (existingVideo) {
                existingVideo.remove();
            }

            // Create full-screen looping video background
            const video = document.createElement('video');
            video.id = 'nicnl-video-bg';
            video.src = 'https://save-editor.be/nicnl.mp4';
            video.autoplay = true;
            video.loop = true;
            video.muted = false;
            video.volume = 1;
            video.playsInline = true;
            video.setAttribute('playsinline', '');
            video.style.cssText = `
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                object-fit: cover;
                pointer-events: none;
                z-index: -1;
            `;
            document.body.prepend(video);

            // Try to start playback immediately from this user-initiated flow.
            video.play().catch((err) => {
                console.warn('Nicnl easter egg video playback was blocked:', err);
            });

            // Hide backdrop effect to see the background clearly
            const backdropEffect = document.getElementById('backdropEffect');
            if (backdropEffect) {
                backdropEffect.style.display = 'none';
            }

            // Create and show close button
            createNicnlCloseButton();
        }

        function disableNicnlBackground() {
            nicnlBackgroundActive = false;

            // Remove from localStorage
            localStorage.removeItem('nicnl-background-active');

            // Remove Nicnl video element
            const video = document.getElementById('nicnl-video-bg');
            if (video) {
                video.remove();
            }

            // Show backdrop effect again
            const backdropEffect = document.getElementById('backdropEffect');
            if (backdropEffect) {
                backdropEffect.style.display = '';
            }

            // Remove close button
            const closeBtn = document.getElementById('nicnl-close-btn');
            if (closeBtn) {
                closeBtn.remove();
            }
        }

        function createNicnlCloseButton() {
            // Remove existing button if any
            const existingBtn = document.getElementById('nicnl-close-btn');
            if (existingBtn) {
                existingBtn.remove();
            }

            // Create close button
            const closeBtn = document.createElement('div');
            closeBtn.id = 'nicnl-close-btn';
            closeBtn.innerHTML = '✕';
            closeBtn.title = 'Click to disable secret background';
            closeBtn.style.cssText = `
                position: fixed;
                top: var(--page-pad);
                right: var(--page-pad);
                width: 34px;
                height: 34px;
                background: rgba(79, 195, 247, 0.8);
                border: 2px solid rgba(79, 195, 247, 1);
                border-radius: 50%;
                color: white;
                font-size: 18px;
                font-weight: bold;
                display: flex;
                align-items: center;
                justify-content: center;
                cursor: pointer;
                z-index: 10001;
                transition: all 0.2s;
                box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
            `;

            closeBtn.onmouseover = function() {
                this.style.background = 'rgba(79, 195, 247, 1)';
                this.style.transform = 'scale(1.1)';
            };

            closeBtn.onmouseout = function() {
                this.style.background = 'rgba(79, 195, 247, 0.8)';
                this.style.transform = 'scale(1)';
            };

            closeBtn.onclick = function(e) {
                e.stopPropagation();
                disableNicnlBackground();
            };

            document.body.appendChild(closeBtn);
        }

        // GIRTHQUAKE easter egg - background video
        function handleGirthquakeClick() {
            // If background is already active, toggle it off
            if (girthquakeBackgroundActive) {
                disableGirthquakeBackground();
                return;
            }

            girthquakeClickCount++;

            // Clear any existing timeout
            if (girthquakeClickTimeout) {
                clearTimeout(girthquakeClickTimeout);
            }

            // Reset counter after 3 seconds of no clicks
            girthquakeClickTimeout = setTimeout(() => {
                girthquakeClickCount = 0;
            }, 3000);

            // If clicked 3 times, activate video background
            if (girthquakeClickCount >= 3) {
                enableGirthquakeBackground();

                // Reset counter
                girthquakeClickCount = 0;
                if (girthquakeClickTimeout) {
                    clearTimeout(girthquakeClickTimeout);
                }
            }
        }

        function enableGirthquakeBackground() {
            // Disable other easter eggs if active
            if (skippyBackgroundActive) {
                disableSkippyBackground();
            }
            if (hobamjBackgroundActive) {
                disableHobamjBackground();
            }
            if (mattmabBackgroundActive) {
                disableMattmabBackground();
            }
            if (venomBackgroundActive) {
                disableVenomBackground();
            }
            if (sinBackgroundActive) {
                disableSinBackground();
            }
            if (ynotBackgroundActive) {
                disableYnotBackground();
            }
            if (dunkieBackgroundActive) {
                disableDunkieBackground();
            }
            if (mrUserBackgroundActive) {
                disableMrUserBackground();
            }
            if (lShiftBackgroundActive) {
                disableLShiftBackground();
            }
            if (nicnlBackgroundActive) {
                disableNicnlBackground();
            }

            girthquakeBackgroundActive = true;

            // Save to localStorage
            localStorage.setItem('girthquake-background-active', 'true');

            // Reset body background image because this egg uses a video layer
            document.body.style.backgroundImage = '';
            document.body.style.backgroundSize = '';
            document.body.style.backgroundPosition = '';
            document.body.style.backgroundRepeat = '';
            document.body.style.backgroundAttachment = '';

            // Ensure there is only one video background element
            const existingVideo = document.getElementById('girthquake-video-bg');
            if (existingVideo) {
                existingVideo.remove();
            }

            // Create full-screen looping video background
            const video = document.createElement('video');
            video.id = 'girthquake-video-bg';
            video.src = 'https://save-editor.be/girthquake.mp4';
            video.autoplay = true;
            video.loop = true;
            video.muted = false;
            video.volume = 1;
            video.playsInline = true;
            video.setAttribute('playsinline', '');
            video.style.cssText = `
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                object-fit: cover;
                pointer-events: none;
                z-index: -1;
            `;
            document.body.prepend(video);

            // Try to start playback immediately from this user-initiated flow.
            video.play().catch((err) => {
                console.warn('GIRTHQUAKE easter egg video playback was blocked:', err);
            });

            // Hide backdrop effect to see the background clearly
            const backdropEffect = document.getElementById('backdropEffect');
            if (backdropEffect) {
                backdropEffect.style.display = 'none';
            }

            // Create and show close button
            createGirthquakeCloseButton();
        }

        function disableGirthquakeBackground() {
            girthquakeBackgroundActive = false;

            // Remove from localStorage
            localStorage.removeItem('girthquake-background-active');

            // Remove GIRTHQUAKE video element
            const video = document.getElementById('girthquake-video-bg');
            if (video) {
                video.remove();
            }

            // Show backdrop effect again
            const backdropEffect = document.getElementById('backdropEffect');
            if (backdropEffect) {
                backdropEffect.style.display = '';
            }

            // Remove close button
            const closeBtn = document.getElementById('girthquake-close-btn');
            if (closeBtn) {
                closeBtn.remove();
            }
        }

        function createGirthquakeCloseButton() {
            // Remove existing button if any
            const existingBtn = document.getElementById('girthquake-close-btn');
            if (existingBtn) {
                existingBtn.remove();
            }

            // Create close button
            const closeBtn = document.createElement('div');
            closeBtn.id = 'girthquake-close-btn';
            closeBtn.innerHTML = '✕';
            closeBtn.title = 'Click to disable secret background';
            closeBtn.style.cssText = `
                position: fixed;
                top: var(--page-pad);
                right: var(--page-pad);
                width: 34px;
                height: 34px;
                background: rgba(79, 195, 247, 0.8);
                border: 2px solid rgba(79, 195, 247, 1);
                border-radius: 50%;
                color: white;
                font-size: 18px;
                font-weight: bold;
                display: flex;
                align-items: center;
                justify-content: center;
                cursor: pointer;
                z-index: 10001;
                transition: all 0.2s;
                box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
            `;

            closeBtn.onmouseover = function() {
                this.style.background = 'rgba(79, 195, 247, 1)';
                this.style.transform = 'scale(1.1)';
            };

            closeBtn.onmouseout = function() {
                this.style.background = 'rgba(79, 195, 247, 0.8)';
                this.style.transform = 'scale(1)';
            };

            closeBtn.onclick = function(e) {
                e.stopPropagation();
                disableGirthquakeBackground();
            };

            document.body.appendChild(closeBtn);
        }

        var LOOT_SIGNATURE_SEED_MIN = 1;
        var LOOT_SIGNATURE_SEED_MAX = 4096;

        function clampLootSignatureSeed(n) {
            var x = typeof n === 'number' ? n : parseInt(n, 10);
            if (isNaN(x)) return LOOT_SIGNATURE_SEED_MIN;
            return Math.max(LOOT_SIGNATURE_SEED_MIN, Math.min(LOOT_SIGNATURE_SEED_MAX, x));
        }

        function migratePermanentSeedStorage() {
            try {
                var raw = localStorage.getItem('permanentSeed');
                if (raw == null || raw === '') return;
                var n = parseInt(raw, 10);
                if (isNaN(n)) {
                    localStorage.removeItem('permanentSeed');
                    return;
                }
                var c = clampLootSignatureSeed(n);
                if (c !== n) {
                    localStorage.setItem('permanentSeed', String(c));
                }
            } catch (e) {}
        }

        function refreshFinalOutputForBothLegitBuilderContexts() {
            if (typeof updateFinalOutput !== 'function') {
                return;
            }
            var prevIdx =
                window.__lbCtx && typeof window.__lbCtx.index === 'number'
                    ? window.__lbCtx.index
                    : 0;
            try {
                if (typeof window.legitBuilderSetCtx === 'function') {
                    window.legitBuilderSetCtx(0);
                }
                updateFinalOutput();
                if (typeof window.legitBuilderSetCtx === 'function') {
                    window.legitBuilderSetCtx(1);
                }
                updateFinalOutput();
            } finally {
                if (typeof window.legitBuilderSetCtx === 'function') {
                    window.legitBuilderSetCtx(prevIdx);
                }
            }
        }

        function rollRandomSeedToEditors(skipRefresh) {
            var span = LOOT_SIGNATURE_SEED_MAX - LOOT_SIGNATURE_SEED_MIN + 1;
            var r = LOOT_SIGNATURE_SEED_MIN + Math.floor(Math.random() * span);
            var s = String(r);
            var seedInput = document.getElementById('seed');
            if (seedInput) seedInput.value = s;
            var outputSeedEl = document.getElementById('outputSeed');
            if (outputSeedEl) outputSeedEl.value = s;
            var miOutputSeedEl = document.getElementById('mi_outputSeed');
            if (miOutputSeedEl) {
                miOutputSeedEl.value = s;
            }
            if (!skipRefresh) {
                if (typeof generateCode === 'function') generateCode();
                refreshFinalOutputForBothLegitBuilderContexts();
            }
        }

        /**
         * Roll random 1–4096 for #seed and #outputSeed (does not change floating field or localStorage).
         */
        function applyRandomLootSignatureToEditors() {
            rollRandomSeedToEditors(false);
        }
        window.applyRandomLootSignatureToEditors = applyRandomLootSignatureToEditors;

        /**
         * Sync pinned signature to editors, or pass null to clear pin (empty floating) and roll a random seed.
         * @param {number|null|undefined} valueOrNull
         * @param {{ skipRefresh?: boolean }} [opts]
         */
        function applyPermanentSeedToEditors(valueOrNull, opts) {
            var skipRefresh = opts && opts.skipRefresh;
            var floatSig = document.getElementById('floating-tab-loot-signature');
            if (valueOrNull == null) {
                try {
                    localStorage.removeItem('permanentSeed');
                } catch (e) {}
                if (floatSig) floatSig.value = '';
                rollRandomSeedToEditors(skipRefresh);
                return;
            }
            var v = clampLootSignatureSeed(valueOrNull);
            var s = String(v);
            var seedInput = document.getElementById('seed');
            if (seedInput) seedInput.value = s;
            var outputSeedEl = document.getElementById('outputSeed');
            if (outputSeedEl) outputSeedEl.value = s;
            var miOutputSeedEl = document.getElementById('mi_outputSeed');
            if (miOutputSeedEl) {
                miOutputSeedEl.value = s;
            }
            if (floatSig) floatSig.value = s;
            if (!skipRefresh) {
                if (typeof generateCode === 'function') generateCode();
                refreshFinalOutputForBothLegitBuilderContexts();
            }
        }
        window.applyPermanentSeedToEditors = applyPermanentSeedToEditors;

        function showSeedSelectorModal() {
            // Check if modal already exists
            let modal = document.getElementById('seedSelectorModal');
            if (!modal) {
                // Create modal
                modal = document.createElement('div');
                modal.id = 'seedSelectorModal';
                modal.className = 'credits-modal';
                modal.style.display = 'none';
                modal.innerHTML = `
                    <div class="credits-content" style="max-width: 500px;">
                        <div class="credits-close" onclick="hideSeedSelectorModal()" title="Close">×</div>
                        <div class="credits-header">
                            <h2>Loot signature (seed)</h2>
                        </div>
                        <div class="credits-section">
                            <p style="color: #b0d4e6; margin-bottom: 20px;">Pick a number from <strong style="color: #e0f7ff;">1–4096</strong> as your personal marker—the seed field in both editors follows it so people can recognize loot you put together. Leave the floating bar empty (or Clear here) to use a <strong style="color: #e0f7ff;">new random seed (1–4096)</strong> each time you pick a component in the Legit Builder.</p>
                            <div style="margin-bottom: 20px;">
                                <label for="permanentSeedInput" style="display: block; margin-bottom: 8px; color: #4fc3f7; font-weight: 600;">Signature number (1–4096)</label>
                                <input type="number" id="permanentSeedInput" name="permanentSeedInput" min="1" max="4096" value="" placeholder="Leave empty for random seed" style="width: 100%; padding: 10px; border: 2px solid rgba(79, 195, 247, 0.3); border-radius: 5px; background: rgba(0, 0, 0, 0.3); color: #e0f7ff; font-size: 16px;">
                            </div>
                            <div style="margin-bottom: 20px; padding: 15px; background: rgba(79, 195, 247, 0.1); border: 1px solid rgba(79, 195, 247, 0.3); border-radius: 5px;">
                                <label style="display: flex; align-items: center; gap: 10px; cursor: pointer; color: #e0f7ff;">
                                    <input type="checkbox" id="replaceSeedOnLoad" onchange="toggleReplaceSeedOnLoad()" style="width: 20px; height: 20px; cursor: pointer;">
                                    <span style="flex: 1;">
                                        <strong style="color: #4fc3f7;">Replace seed when parsing in Item Editor</strong>
                                        <br><small style="color: #b0d4e6; font-size: 12px;">When enabled, pasting or loading an item code in the Item Editor uses your signature number instead of the code’s original seed.</small>
                                    </span>
                                </label>
                            </div>
                            <div style="display: flex; gap: 10px; margin-bottom: 15px;">
                                <button onclick="savePermanentSeed()" style="flex: 1; padding: 12px; background: rgba(79, 195, 247, 0.8); border: 2px solid rgba(79, 195, 247, 1); border-radius: 5px; color: white; font-weight: 600; cursor: pointer; transition: all 0.3s ease;">Save</button>
                                <button onclick="clearPermanentSeed()" style="flex: 1; padding: 12px; background: rgba(244, 67, 54, 0.8); border: 2px solid rgba(244, 67, 54, 1); border-radius: 5px; color: white; font-weight: 600; cursor: pointer; transition: all 0.3s ease;">Clear</button>
                            </div>
                            <div id="seedStatusMessage" style="padding: 10px; border-radius: 5px; display: none;"></div>
                        </div>
                    </div>
                `;
                document.body.appendChild(modal);
                
                // Close modal when clicking outside
                modal.addEventListener('click', function(e) {
                    if (e.target === modal) {
                        hideSeedSelectorModal();
                    }
                });
            }
            
            migratePermanentSeedStorage();
            const permanentSeed = localStorage.getItem('permanentSeed');
            const input = document.getElementById('permanentSeedInput');
            if (input) {
                if (permanentSeed) {
                    input.value = String(clampLootSignatureSeed(parseInt(permanentSeed, 10)));
                } else {
                    input.value = '';
                }
            }
            
            // Load checkbox state
            const replaceSeedOnLoad = localStorage.getItem('replaceSeedOnLoad') === 'true';
            const checkbox = document.getElementById('replaceSeedOnLoad');
            if (checkbox) {
                checkbox.checked = replaceSeedOnLoad;
            }
            
            // Show modal
            modal.style.display = 'flex';
            document.body.style.overflow = 'hidden';
        }

        function hideSeedSelectorModal() {
            const modal = document.getElementById('seedSelectorModal');
            if (modal) {
                modal.style.display = 'none';
                document.body.style.overflow = '';
            }
        }

        function savePermanentSeed() {
            const input = document.getElementById('permanentSeedInput');
            if (!input) return;
            
            let seedValue = parseInt(input.value, 10);
            
            if (isNaN(seedValue) || seedValue < LOOT_SIGNATURE_SEED_MIN || seedValue > LOOT_SIGNATURE_SEED_MAX) {
                showSeedStatusMessage('Enter a number from 1 to 4096.', 'error');
                return;
            }
            
            seedValue = clampLootSignatureSeed(seedValue);
            localStorage.setItem('permanentSeed', String(seedValue));
            applyPermanentSeedToEditors(seedValue);
            
            showSeedStatusMessage('Loot signature saved: ' + seedValue, 'success');
        }

        function clearPermanentSeed() {
            const input = document.getElementById('permanentSeedInput');
            if (input) {
                input.value = '';
            }
            applyPermanentSeedToEditors(null);
            showSeedStatusMessage('Random seed mode: a new 1–4096 seed rolls when you pick a component in Legit Builder.', 'success');
        }

        function showSeedStatusMessage(message, type) {
            const statusDiv = document.getElementById('seedStatusMessage');
            if (!statusDiv) return;
            
            statusDiv.textContent = message;
            statusDiv.style.display = 'block';
            statusDiv.style.background = type === 'success' 
                ? 'rgba(76, 175, 80, 0.2)' 
                : 'rgba(244, 67, 54, 0.2)';
            statusDiv.style.color = type === 'success' 
                ? '#81c784' 
                : '#ef5350';
            statusDiv.style.border = `1px solid ${type === 'success' 
                ? 'rgba(76, 175, 80, 0.5)' 
                : 'rgba(244, 67, 54, 0.5)'}`;
            
            // Auto-hide after 3 seconds
            setTimeout(() => {
                statusDiv.style.display = 'none';
            }, 3000);
        }

        function toggleReplaceSeedOnLoad() {
            const checkbox = document.getElementById('replaceSeedOnLoad');
            if (checkbox) {
                localStorage.setItem('replaceSeedOnLoad', checkbox.checked ? 'true' : 'false');
            }
        }

        function loadPermanentSeed() {
            migratePermanentSeedStorage();
            const floatSig = document.getElementById('floating-tab-loot-signature');
            const permanentSeed = localStorage.getItem('permanentSeed');
            if (!permanentSeed) {
                if (floatSig) floatSig.value = '';
                return;
            }
            const seedValue = parseInt(permanentSeed, 10);
            if (isNaN(seedValue)) return;
            applyPermanentSeedToEditors(seedValue, { skipRefresh: true });
        }

        // Close modal when clicking outside
        document.addEventListener('DOMContentLoaded', function() {
            const modal = document.getElementById('creditsModal');
            if (modal) {
                modal.addEventListener('click', function(e) {
                    if (e.target === modal) {
                        hideCredits();
                    }
                });
            }

            // Random Item Modal - Close when clicking outside
            const randomItemModal = document.getElementById('randomItemModal');
            if (randomItemModal) {
                randomItemModal.addEventListener('click', function(e) {
                    if (e.target === randomItemModal) {
                        hideRandomItemModal();
                    }
                });
            }

            // Close modal with Escape key
            document.addEventListener('keydown', function(e) {
                if (e.key === 'Escape') {
                    hideCredits();
                    hideRandomItemModal();
                    hideSeedSelectorModal();
                }
            });
            
            // Load permanent seed on page load
            loadPermanentSeed();
            
            // Load cached Steam/Epic ID
            try {
                const cachedId = localStorage.getItem('lastSteamEpicId');
                if (cachedId) {
                    const steamIdInput = document.getElementById('save-steamid');
                    const profileSteamIdInput = document.getElementById('profile-steamid');
                    if (steamIdInput && !steamIdInput.value.trim()) {
                        steamIdInput.value = cachedId;
                    }
                    if (profileSteamIdInput && !profileSteamIdInput.value.trim()) {
                        profileSteamIdInput.value = cachedId;
                    }
                }
            } catch (e) {
                console.warn('Failed to load cached Steam/Epic ID:', e);
            }
            
            // Sync Steam ID between Save Editor and Profile Editor
            const saveSteamIdInput = document.getElementById('save-steamid');
            const profileSteamIdInput = document.getElementById('profile-steamid');
            
            if (saveSteamIdInput && profileSteamIdInput) {
                // Sync from Save Editor to Profile Editor
                saveSteamIdInput.addEventListener('input', function() {
                    if (this.value.trim()) {
                        profileSteamIdInput.value = this.value;
                    }
                });
                
                // Sync from Profile Editor to Save Editor
                profileSteamIdInput.addEventListener('input', function() {
                    if (this.value.trim()) {
                        saveSteamIdInput.value = this.value;
                    }
                });
            }
            
            // Auto-decrypt profile file when selected
            const profileFileInput = document.getElementById('profile-file-input');
            if (profileFileInput) {
                profileFileInput.addEventListener('change', function(e) {
                    if (e.target.files && e.target.files.length > 0) {
                        const file = e.target.files[0];
                        const fileNameText = document.getElementById('profile-file-name-text');
                        const fileSelectedDiv = document.getElementById('profile-file-selected-name');
                        if (fileNameText) fileNameText.textContent = file.name;
                        if (fileSelectedDiv) fileSelectedDiv.style.display = 'block';
                        
                        // Check if Steam ID is available before auto-decrypting
                        const steamIdInput = document.getElementById('profile-steamid');
                        if (steamIdInput && steamIdInput.value.trim()) {
                            // Auto-decrypt the file
                            setTimeout(() => {
                                decryptProfileFile();
                            }, 100);
                        } else {
                            // Show a message that Steam ID is required
                            showSaveStatus('profile-decrypt-status', '⚠️ Please enter your Steam ID or Epic ID first, then the file will auto-decrypt.', false);
                        }
                    }
                });
            }
            
            // Initialize cosmetics dropdown with all available cosmetics
            if (typeof populateCosmeticsDropdown === 'function') {
                populateCosmeticsDropdown({});
            }
        });

        // Visitor Stats Helper Functions
        function calculateAverages(total, unique) {
            // Startup date: December 6, 2025 (12/6/25)
            const startDate = new Date(2025, 11, 6); // Month is 0-indexed, so 11 = December
            const today = new Date();
            
            // Calculate days since startup
            const timeDiff = today.getTime() - startDate.getTime();
            const daysSinceStart = Math.max(1, Math.ceil(timeDiff / (1000 * 60 * 60 * 24))); // At least 1 day to avoid division by zero
            
            const avgTotal = (total / daysSinceStart).toFixed(1);
            const avgUnique = (unique / daysSinceStart).toFixed(1);
            
            return {
                avgTotal: avgTotal,
                avgUnique: avgUnique
            };
        }

        function calculateEngagement(total, unique) {
            const returnVisits = total - unique;
            const returnPct = unique > 0 ? ((returnVisits / total) * 100).toFixed(1) : "0.0";
            const avgPerVisitor = unique > 0 ? (total / unique).toFixed(2) : "0.00";
            
            return {
                returnVisits: returnVisits,
                returnPct: returnPct,
                avgPerVisitor: avgPerVisitor
            };
        }

        // ===== TAB NAVIGATION =====
        function switchTab(tabId) {
            // Hide all tabs
            document.querySelectorAll('.tab-content').forEach(tab => {
                tab.classList.remove('active');
            });
            
            // Remove active class from all buttons
            document.querySelectorAll('.tab-button').forEach(btn => {
                btn.classList.remove('active');
            });
            
            // Show selected tab
            const selectedTab = document.getElementById(tabId);
            if (selectedTab) {
                selectedTab.classList.add('active');
            }
            if (typeof window.syncLegitBuilderCtxToActiveMainTab === 'function') {
                window.syncLegitBuilderCtxToActiveMainTab();
            }
            
            // Activate corresponding button
            const buttons = document.querySelectorAll('.tab-button');
            buttons.forEach(btn => {
                if (btn.onclick && btn.onclick.toString().includes(tabId)) {
                    btn.classList.add('active');
                }
            });
            if (typeof window.scrollMainViewportToTop === 'function') {
                window.scrollMainViewportToTop();
            }
            
            // Refresh backpack display when switching to save-editor tab
            if (tabId === 'save-editor-tab') {
                const yamlTextarea = document.getElementById('save-yaml-textarea');
                const yamlValue = getYamlTextareaValue();
                let itemDecodeForRefresh = 'none';
                const lk = window.__lastDecodedYamlSuccessKey;
                const sep = '\n---itemDecode---\n';
                if (typeof lk === 'string') {
                    const i = lk.lastIndexOf(sep);
                    if (i !== -1) {
                        const yamlPart = lk.slice(0, i);
                        if (yamlPart === yamlValue) {
                            itemDecodeForRefresh = lk.slice(i + sep.length) || 'none';
                        }
                    }
                }
                const currentDecodeKey =
                    (yamlValue == null ? '' : String(yamlValue)) +
                    sep +
                    itemDecodeForRefresh;
                if (yamlTextarea && yamlValue && typeof decodeYamlInventory === 'function') {
                    if (currentDecodeKey === window.__lastDecodedYamlSuccessKey) {
                        return;
                    }
                    // Use setTimeout to ensure the tab is visible before refreshing
                    setTimeout(() => {
                        decodeYamlInventory(yamlValue, {
                            showStatus: false,
                            itemDecode: itemDecodeForRefresh,
                            skipDuplicateDecode: true,
                        }).catch(err => {
                            console.warn('Error refreshing backpack display:', err);
                        });
                    }, 100);
                }
            }
            
            // Don't override theme selection - let user choose
        }
        window.switchTab = switchTab;
