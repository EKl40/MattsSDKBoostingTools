if (typeof window.scrollMainViewportToTop !== 'function') {
                window.scrollMainViewportToTop = function scrollMainViewportToTop() {
                    if (window.__suppressScrollMainViewportToTopOnce) {
                        window.__suppressScrollMainViewportToTopOnce = false;
                        return;
                    }
                    try {
                        window.scrollTo({ top: 0, left: 0, behavior: 'smooth' });
                    } catch (e) {
                        window.scrollTo(0, 0);
                    }
                    try {
                        document.documentElement.scrollTop = 0;
                        document.body.scrollTop = 0;
                    } catch (e2) {}
                };
            }

            if (typeof window.switchTab !== 'function') {
                window.switchTab = function(tabId) {
                    // Update button state immediately (cheap) so user sees feedback
                    document.querySelectorAll('.tab-button').forEach(btn => {
                        btn.classList.toggle('active', !!(btn.onclick && btn.onclick.toString().includes(tabId)));
                    });
                    // Defer content switch to next frame to avoid INP spike from laying out a huge tab
                    requestAnimationFrame(function() {
                        document.querySelectorAll('.tab-content').forEach(tab => {
                            tab.classList.remove('active');
                        });
                        var selectedTab = document.getElementById(tabId);
                        if (selectedTab) {
                            selectedTab.classList.add('active');
                        }
                        if (typeof window.syncLegitBuilderCtxToActiveMainTab === 'function') {
                            window.syncLegitBuilderCtxToActiveMainTab();
                        }
                        if (typeof window.scrollMainViewportToTop === 'function') {
                            window.scrollMainViewportToTop();
                        }
                    });
                };
            }
