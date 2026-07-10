(function scopeLegitInlineCss() {
            const styleEl = document.getElementById('legitInlineStyle');
            if (!styleEl) return;
            let css = styleEl.textContent || '';
            css = css.replace(/:root/g, '.legit-inline-app')
                     .replace(/\bhtml\b/g, '.legit-inline-app')
                     .replace(/\bbody\b/g, '.legit-inline-app');
            css = css.replace(/(^|})([^@}{][^{]*){/g, (match, sep, selectorText) => {
                const selectors = selectorText.split(',').map(s => s.trim()).filter(Boolean);
                const scoped = selectors.map(selector => {
                    if (!selector || selector.includes('.legit-inline-app')) {
                        return selector;
                    }
                    return `.legit-inline-app ${selector}`;
                });
                return `${sep}${scoped.join(', ')}{`;
            });
            styleEl.textContent = css;
        })();
