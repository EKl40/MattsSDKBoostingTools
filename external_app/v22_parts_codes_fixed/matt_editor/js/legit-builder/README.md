# Legit Item Builder subsection

Code that originated from **Legit Item Builder Project / inventory_data_viewer.html** (BL4 Inventory Data Viewer). Kept in its own subsection for easier maintenance and to track the source.

**Contents:**
- **legit-builder.js** – Roots/tables UI, file/URL loading, serial decoder, bulk validator, simple/advanced mode, `#legit-builder-tab .legit-inline-app` behavior. Depends on the main item-editor globals (e.g. `window` / shared state from earlier scripts). Loaded after item-editor-08, before item-editor-09 (theme/save editor).

**Source:** `inventory_data_viewer.html` (Legit Item Builder Project). The CSS for this block is scoped by `legit-scope.js` (runs earlier) and the inline `<style id="legitInlineStyle">` in the HTML.
