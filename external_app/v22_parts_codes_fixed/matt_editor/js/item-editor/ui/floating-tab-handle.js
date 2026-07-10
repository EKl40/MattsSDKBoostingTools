(function () {
    var STORAGE_KEY = 'floatingTabHandlePrefs';
    var DEFAULT_STARTUP_TAB_KEY = 'defaultStartupTab';
    var DRAG_THRESHOLD_SQ = 64;
    var DRAG_THRESHOLD_TOUCH_SQ = 20;
    var DEFAULT_TAB_ID = 'save-editor-tab';
    var STARTUP_TAB_OPTIONS = [
        { id: 'item-editor-tab', label: 'Item Editor' },
        { id: 'legit-builder-tab', label: 'Legit Builder' },
        { id: 'profile-editor-tab', label: 'Profile Editor' },
        { id: 'save-editor-tab', label: 'Save Editor' }
    ];
    var STARTUP_TAB_LABELS = STARTUP_TAB_OPTIONS.reduce(function (acc, option) {
        acc[option.id] = option.label;
        return acc;
    }, {});
    var STARTUP_TAB_SHORT_LABELS = {
        'item-editor-tab': 'Items',
        'legit-builder-tab': 'Legit',
        'profile-editor-tab': 'Profile',
        'save-editor-tab': 'Save'
    };

    function isFloatingHandleCompactViewport() {
        return !!(window.matchMedia && window.matchMedia('(max-width: 768px)').matches);
    }

    function updateStartupStatusDisplay(handle) {
        var status = handle && handle.querySelector('.floating-tab-handle-startup-status');
        if (!status) return;
        var compact = isFloatingHandleCompactViewport();
        var tabId = readStoredStartupTab();
        var label = STARTUP_TAB_LABELS[tabId] || STARTUP_TAB_LABELS[DEFAULT_TAB_ID];
        var shortL =
            STARTUP_TAB_SHORT_LABELS[tabId] || STARTUP_TAB_SHORT_LABELS[DEFAULT_TAB_ID];
        status.textContent = compact ? shortL : 'Current: ' + label;
    }

    function refreshFloatingTabCompactUI(handle) {
        if (!handle) return;
        var compact = isFloatingHandleCompactViewport();
        handle.classList.toggle('floating-tab-handle--compact-mobile', compact);

        var grip = handle.querySelector('.floating-tab-handle-move-grip');
        if (grip) grip.textContent = compact ? '⠿ Move' : '⠿ Move panel';

        var drag = handle.querySelector('.floating-tab-handle-drag-label');
        if (drag) {
            drag.textContent = compact ? 'Drag to move' : 'Drag here or top strip to move';
        }

        var rt = handle.querySelector('.floating-tab-handle-return-top');
        if (rt) rt.textContent = compact ? '^ Top' : '^ Return to Top';

        var jm = handle.querySelector('.floating-tab-handle-jump-middle');
        if (jm) jm.textContent = compact ? 'Middle' : 'Jump to Middle';

        var jb = handle.querySelector('.floating-tab-handle-jump-bottom');
        if (jb) jb.textContent = compact ? 'Bottom' : 'Jump to Bottom';

        var cl = handle.querySelector('.floating-tab-handle-clear-tab');
        if (cl) cl.textContent = compact ? 'Clear tab' : 'Clear current tab';

        var hide = handle.querySelector('.floating-tab-handle-hide');
        if (hide) {
            hide.textContent = 'Minimize ↓';
            hide.setAttribute('aria-label', compact ? 'Minimize quick tab switcher' : 'Minimize tab switcher');
        }

        var suH = handle.querySelector('.floating-tab-handle-startup-heading');
        if (suH) suH.textContent = compact ? 'Startup' : 'Default startup page';

        var suS = handle.querySelector('.floating-tab-handle-startup-set');
        if (suS) suS.textContent = compact ? 'Set' : 'Set current tab';

        var sigH = document.getElementById('floating-tab-signature-heading');
        if (sigH) {
            sigH.textContent = compact ? 'Seed' : 'Signature (Random Seed)';
        }

        var inp = document.getElementById('floating-tab-loot-signature');
        if (inp) {
            inp.placeholder = compact ? '1–4096' : '(Enter value 1-4096)';
        }

        updateStartupStatusDisplay(handle);
    }

    function loadPrefs() {
        try {
            var raw = localStorage.getItem(STORAGE_KEY);
            if (!raw) return null;
            return JSON.parse(raw);
        } catch (e) {
            return null;
        }
    }

    function savePrefs(shell, handle) {
        var prefs = { hidden: shell.classList.contains('is-hidden') };
        if (handle.classList.contains('floating-tab-handle--custom-pos')) {
            prefs.left = parseFloat(handle.style.left);
            prefs.top = parseFloat(handle.style.top);
        }
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
        } catch (e) {}
    }

    function isValidStartupTab(tabId) {
        return !!STARTUP_TAB_LABELS[tabId];
    }

    function getCurrentActiveTabId() {
        var active = document.querySelector('.tab-content.active');
        var id = active && active.id;
        return isValidStartupTab(id) ? id : DEFAULT_TAB_ID;
    }

    function readStoredStartupTab() {
        try {
            var raw = localStorage.getItem(DEFAULT_STARTUP_TAB_KEY);
            return isValidStartupTab(raw) ? raw : DEFAULT_TAB_ID;
        } catch (e) {
            return DEFAULT_TAB_ID;
        }
    }

    function saveStoredStartupTab(tabId) {
        if (!isValidStartupTab(tabId)) return;
        try {
            localStorage.setItem(DEFAULT_STARTUP_TAB_KEY, tabId);
        } catch (e) {}
    }

    function clampHandlePosition(handle) {
        var m = 8;
        var w = handle.offsetWidth;
        var h = handle.offsetHeight;
        var vw = window.innerWidth;
        var vh = window.innerHeight;
        var left = parseFloat(handle.style.left);
        var top = parseFloat(handle.style.top);
        if (isNaN(left) || isNaN(top)) return;
        left = Math.min(Math.max(left, m), vw - w - m);
        top = Math.min(Math.max(top, m), vh - h - m);
        handle.style.left = left + 'px';
        handle.style.top = top + 'px';
    }

    function applyCustomPosition(handle, left, top) {
        handle.style.left = left + 'px';
        handle.style.top = top + 'px';
        handle.style.right = 'auto';
        handle.style.bottom = 'auto';
        handle.classList.add('floating-tab-handle--custom-pos');
        clampHandlePosition(handle);
    }

    var LOOT_SIG_MIN = 1;
    var LOOT_SIG_MAX = 4096;

    function readStoredLootSignature() {
        try {
            var raw = localStorage.getItem('permanentSeed');
            if (raw == null || raw === '') return '';
            var n = parseInt(raw, 10);
            if (isNaN(n)) return '';
            return String(Math.max(LOOT_SIG_MIN, Math.min(LOOT_SIG_MAX, n)));
        } catch (e) {
            return '';
        }
    }

    function commitFloatingLootSignature() {
        var el = document.getElementById('floating-tab-loot-signature');
        if (!el) return;
        var raw = String(el.value == null ? '' : el.value).trim();
        if (raw === '') {
            if (typeof window.applyPermanentSeedToEditors === 'function') {
                window.applyPermanentSeedToEditors(null);
            } else {
                try {
                    localStorage.removeItem('permanentSeed');
                } catch (e) {}
                el.value = '';
            }
            el.value = '';
            return;
        }
        var n = parseInt(raw, 10);
        if (isNaN(n) || n < LOOT_SIG_MIN || n > LOOT_SIG_MAX) {
            el.value = readStoredLootSignature();
            return;
        }
        localStorage.setItem('permanentSeed', String(n));
        if (typeof window.applyPermanentSeedToEditors === 'function') {
            window.applyPermanentSeedToEditors(n);
        } else {
            var s = document.getElementById('seed');
            var o = document.getElementById('outputSeed');
            var miS = document.getElementById('mi_outputSeed');
            if (s) s.value = String(n);
            if (o) o.value = String(n);
            if (miS) miS.value = String(n);
        }
    }

    function getPageScrollTopMax() {
        var doc = document.documentElement;
        var body = document.body;
        var scrollHeight = Math.max(
            doc ? doc.scrollHeight : 0,
            body ? body.scrollHeight : 0,
            doc ? doc.offsetHeight : 0,
            body ? body.offsetHeight : 0
        );
        return Math.max(0, scrollHeight - window.innerHeight);
    }

    function scrollMainViewportTo(targetTop) {
        var maxTop = getPageScrollTopMax();
        var nextTop = Math.max(0, Math.min(maxTop, targetTop));
        try {
            window.scrollTo({ top: nextTop, left: 0, behavior: 'smooth' });
        } catch (e) {
            window.scrollTo(0, nextTop);
        }
        try {
            document.documentElement.scrollTop = nextTop;
            document.body.scrollTop = nextTop;
        } catch (e2) {}
    }

    function initReturnToTopButton(handle) {
        var stack = handle.querySelector('.floating-tab-handle-stack');
        var dragLabel = handle.querySelector('.floating-tab-handle-drag-label');
        if (!stack || !dragLabel || stack.querySelector('.floating-tab-handle-return-top')) return;
        var btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'floating-tab-handle-scroll-btn floating-tab-handle-return-top';
        btn.textContent = '^ Return to Top';
        btn.setAttribute('title', 'Return to top of page');
        btn.setAttribute('aria-label', 'Return to top of page');
        btn.addEventListener('click', function () {
            if (typeof window.scrollMainViewportToTop === 'function') {
                window.scrollMainViewportToTop();
                return;
            }
            scrollMainViewportTo(0);
        });
        stack.insertBefore(btn, dragLabel);
    }

    function initJumpToMiddleButton(handle) {
        var stack = handle.querySelector('.floating-tab-handle-stack');
        var dragLabel = handle.querySelector('.floating-tab-handle-drag-label');
        if (!stack || !dragLabel || stack.querySelector('.floating-tab-handle-jump-middle')) return;
        var btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'floating-tab-handle-scroll-btn floating-tab-handle-jump-middle';
        btn.textContent = 'Jump to Middle';
        btn.setAttribute('title', 'Jump to middle of page');
        btn.setAttribute('aria-label', 'Jump to middle of page');
        btn.addEventListener('click', function () {
            scrollMainViewportTo(getPageScrollTopMax() / 2);
        });
        stack.insertBefore(btn, dragLabel);
    }

    function initJumpToBottomButton(handle) {
        var stack = handle.querySelector('.floating-tab-handle-stack');
        var dragLabel = handle.querySelector('.floating-tab-handle-drag-label');
        if (!stack || !dragLabel || stack.querySelector('.floating-tab-handle-jump-bottom')) return;
        var btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'floating-tab-handle-scroll-btn floating-tab-handle-jump-bottom';
        btn.textContent = 'Jump to Bottom';
        btn.setAttribute('title', 'Jump to bottom of page');
        btn.setAttribute('aria-label', 'Jump to bottom of page');
        btn.addEventListener('click', function () {
            scrollMainViewportTo(getPageScrollTopMax());
        });
        stack.insertBefore(btn, dragLabel);
    }

    function initClearCurrentTabButton(handle) {
        var stack = handle.querySelector('.floating-tab-handle-stack');
        var dragLabel = handle.querySelector('.floating-tab-handle-drag-label');
        if (!stack || !dragLabel || stack.querySelector('.floating-tab-handle-clear-tab')) return;
        var btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'floating-tab-handle-clear-tab';
        btn.textContent = 'Clear current tab';
        btn.setAttribute('title', 'Clear all content in the active main tab (with confirmation)');
        btn.setAttribute('aria-label', 'Clear current tab');
        btn.addEventListener('click', function (e) {
            e.stopPropagation();
            if (typeof window.promptClearCurrentTab === 'function') {
                window.promptClearCurrentTab();
            }
        });
        stack.insertBefore(btn, dragLabel);
    }

    function initStartupTabControl(handle) {
        var stack = handle.querySelector('.floating-tab-handle-stack');
        var dragLabel = handle.querySelector('.floating-tab-handle-drag-label');
        if (!stack || !dragLabel || stack.querySelector('.floating-tab-handle-startup-wrap')) return;

        var wrap = document.createElement('div');
        wrap.className = 'floating-tab-handle-startup-wrap';
        wrap.setAttribute('title', 'Choose which page opens first on next load');

        var heading = document.createElement('div');
        heading.className = 'floating-tab-handle-startup-heading';
        heading.textContent = 'Default startup page';
        wrap.appendChild(heading);

        var status = document.createElement('p');
        status.className = 'floating-tab-handle-startup-status';
        wrap.appendChild(status);

        var btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'floating-tab-handle-startup-set';
        btn.textContent = 'Set current tab';
        btn.setAttribute('aria-label', 'Set current tab as default startup page');
        wrap.appendChild(btn);

        function renderStatus() {
            updateStartupStatusDisplay(handle);
        }

        btn.addEventListener('click', function (e) {
            e.stopPropagation();
            var activeTabId = getCurrentActiveTabId();
            saveStoredStartupTab(activeTabId);
            renderStatus();
        });

        renderStatus();
        stack.insertBefore(wrap, dragLabel);
    }

    function applyDefaultStartupTab() {
        var tabId = readStoredStartupTab();
        if (!isValidStartupTab(tabId)) return;
        if (typeof window.switchTab === 'function') {
            window.switchTab(tabId);
        }
    }

    window.promptClearCurrentTab = function promptClearCurrentTab() {
        var active = document.querySelector('.tab-content.active');
        var id = active && active.id;
        if (!id) {
            alert('No tab is active.');
            return;
        }
        if (!window.confirm('Clear all content for the current tab? This cannot be undone.')) {
            return;
        }
        if (id === 'item-editor-tab') {
            if (typeof clearItemEditor === 'function') {
                clearItemEditor();
            }
            return;
        }
        if (id === 'legit-builder-tab') {
            if (typeof window.clearLegitBuilderTab === 'function') {
                window.clearLegitBuilderTab();
            }
            return;
        }
        if (id === 'save-editor-tab') {
            if (typeof window.clearSaveEditorWorkspace === 'function') {
                var p = window.clearSaveEditorWorkspace();
                if (p && typeof p.then === 'function') {
                    p.catch(function (err) {
                        console.error('clearSaveEditorWorkspace', err);
                    });
                }
            }
            return;
        }
        if (id === 'profile-editor-tab') {
            if (typeof window.clearProfileEditorWorkspace === 'function') {
                window.clearProfileEditorWorkspace();
            }
            return;
        }
        alert('This tab does not support quick clear.');
    };

    function initMoveGrip(handle) {
        var stack = handle.querySelector('.floating-tab-handle-stack');
        if (!stack || stack.querySelector('.floating-tab-handle-move-grip')) return;
        var grip = document.createElement('div');
        grip.className = 'floating-tab-handle-move-grip';
        grip.setAttribute('role', 'button');
        grip.setAttribute('aria-label', 'Drag to move this panel');
        grip.setAttribute('title', 'Drag to move');
        grip.textContent = '⠿ Move panel';
        stack.insertBefore(grip, stack.firstChild);
    }

    function initLootSignatureInput() {
        var el = document.getElementById('floating-tab-loot-signature');
        if (!el) return;
        el.value = String(readStoredLootSignature());
        el.addEventListener('change', commitFloatingLootSignature);
        el.addEventListener('blur', commitFloatingLootSignature);
        el.addEventListener('keydown', function (e) {
            if (e.key === 'Enter') {
                e.preventDefault();
                el.blur();
            }
        });
    }

    function init() {
        var shell = document.getElementById('floating-tab-handle-shell');
        var handle = document.getElementById('floating-tab-handle');
        var hideBtn = handle && handle.querySelector('.floating-tab-handle-hide');
        var restoreBtn = shell && shell.querySelector('.floating-tab-handle-restore');
        if (!shell || !handle) return;

        initLootSignatureInput();
        initMoveGrip(handle);
        initReturnToTopButton(handle);
        initJumpToMiddleButton(handle);
        initJumpToBottomButton(handle);
        initClearCurrentTabButton(handle);
        initStartupTabControl(handle);
        applyDefaultStartupTab();

        var prefs = loadPrefs();
        if (prefs && typeof prefs.left === 'number' && typeof prefs.top === 'number') {
            applyCustomPosition(handle, prefs.left, prefs.top);
        }
        if (prefs && prefs.hidden) {
            shell.classList.add('is-hidden');
        }

        var suppressNextClick = false;

        handle.addEventListener(
            'click',
            function (e) {
                if (!suppressNextClick) return;
                suppressNextClick = false;
                e.preventDefault();
                e.stopImmediatePropagation();
            },
            true
        );

        if (hideBtn) {
            hideBtn.addEventListener('click', function () {
                shell.classList.add('is-hidden');
                savePrefs(shell, handle);
            });
        }

        if (restoreBtn) {
            restoreBtn.addEventListener('click', function () {
                shell.classList.remove('is-hidden');
                savePrefs(shell, handle);
            });
        }

        var dragState = null;

        function endDrag(e) {
            if (!dragState) return;
            if (e && e.pointerId !== dragState.pointerId) return;
            if (dragState.pointerId != null) {
                try {
                    if (handle.hasPointerCapture(dragState.pointerId)) {
                        handle.releasePointerCapture(dragState.pointerId);
                    }
                } catch (err) {}
            }
            if (dragState.dragging) {
                if (dragState.startedOnTab) {
                    suppressNextClick = true;
                }
                savePrefs(shell, handle);
            }
            handle.classList.remove('floating-tab-handle--dragging');
            dragState = null;
        }

        handle.addEventListener('pointerdown', function (e) {
            if (e.pointerType !== 'touch' && e.button !== 0) return;
            if (e.target.closest('.floating-tab-handle-hide')) return;
            if (e.target.closest('.floating-tab-handle-return-top')) return;
            if (e.target.closest('.floating-tab-handle-jump-middle')) return;
            if (e.target.closest('.floating-tab-handle-jump-bottom')) return;
            if (e.target.closest('.floating-tab-handle-clear-tab')) return;
            if (e.target.closest('.floating-tab-handle-startup-wrap')) return;
            if (e.target.closest('.floating-tab-handle-signature-wrap')) return;

            // Avoid eating a real click after a drag that never fired a synthetic click.
            suppressNextClick = false;

            var startedOnTab = !!e.target.closest('.floating-tab-btn');
            var fromDragStrip =
                !!e.target.closest('.floating-tab-handle-drag-label') ||
                !!e.target.closest('.floating-tab-handle-move-grip');

            dragState = {
                pointerId: e.pointerId,
                pointerType: e.pointerType || '',
                sx: e.clientX,
                sy: e.clientY,
                dragging: false,
                startedOnTab: startedOnTab,
                startLeft: 0,
                startTop: 0,
                anchorX: 0,
                anchorY: 0
            };

            // Grab pointer immediately on the drag strip so moves still fire if the cursor leaves the box
            // before the drag threshold (capture on tabs is deferred — it would break tab onclick).
            if (fromDragStrip) {
                try {
                    handle.setPointerCapture(e.pointerId);
                } catch (err) {}
            }
        });

        handle.addEventListener('pointermove', function (e) {
            if (!dragState || e.pointerId !== dragState.pointerId) return;

            var dx = e.clientX - dragState.sx;
            var dy = e.clientY - dragState.sy;

            if (!dragState.dragging) {
                var th =
                    dragState.pointerType === 'touch'
                        ? DRAG_THRESHOLD_TOUCH_SQ
                        : DRAG_THRESHOLD_SQ;
                if (dx * dx + dy * dy < th) return;
                dragState.dragging = true;

                if (!handle.classList.contains('floating-tab-handle--custom-pos')) {
                    var r = handle.getBoundingClientRect();
                    handle.style.left = r.left + 'px';
                    handle.style.top = r.top + 'px';
                    handle.style.right = 'auto';
                    handle.style.bottom = 'auto';
                    handle.classList.add('floating-tab-handle--custom-pos');
                }

                var r2 = handle.getBoundingClientRect();
                dragState.startLeft = r2.left;
                dragState.startTop = r2.top;
                dragState.anchorX = e.clientX;
                dragState.anchorY = e.clientY;
                handle.classList.add('floating-tab-handle--dragging');
                try {
                    handle.setPointerCapture(dragState.pointerId);
                } catch (err) {}
            }

            var left = dragState.startLeft + (e.clientX - dragState.anchorX);
            var top = dragState.startTop + (e.clientY - dragState.anchorY);
            handle.style.left = left + 'px';
            handle.style.top = top + 'px';
            clampHandlePosition(handle);
        });

        handle.addEventListener('pointerup', endDrag);
        handle.addEventListener('pointercancel', endDrag);

        window.addEventListener('resize', function () {
            refreshFloatingTabCompactUI(handle);
            if (!handle.classList.contains('floating-tab-handle--custom-pos')) return;
            clampHandlePosition(handle);
            savePrefs(shell, handle);
        });

        var compactMq = window.matchMedia && window.matchMedia('(max-width: 768px)');
        if (compactMq && compactMq.addEventListener) {
            compactMq.addEventListener('change', function () {
                refreshFloatingTabCompactUI(handle);
            });
        } else if (compactMq && compactMq.addListener) {
            compactMq.addListener(function () {
                refreshFloatingTabCompactUI(handle);
            });
        }

        refreshFloatingTabCompactUI(handle);
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
