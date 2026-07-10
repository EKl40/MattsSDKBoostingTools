# JS modules (load order matters)

Scripts are loaded in this order by `index.html`. No bundler; open `index.html` to run.

| File | Purpose |
|------|--------|
| **vendor/** | Third-party libraries |
| `vendor/js-yaml-4.1.1.js` | js-yaml 4.1.1 – exposes global `jsyaml` |
| **item-editor/** | Item editor logic, split by responsibility |
| `item-editor/ui/tabs.js` | `window.switchTab` for tab buttons |
| `legit-scope.js` | Scopes Legit Item Builder CSS to `.legit-inline-app` |
| `item-editor/domain/helpers.js` | State vars, DEBUG, getSkillImageUrl, rarityColors, getOutputCode, clearItemEditor, data file listener |
| `item-editor/domain/process-data.js` | `processGameData()` |
| `item-editor/domain/parse.js` | `parseItemCode`, setupOutputCodeAutoUpdate, parsePart, updatePartBuilder |
| `item-editor/domain/parts.js` | Part builder UI: getPartInfo, renderParts, showPartBrowser, generateCode, serializeCode, updateGuidelines |
| `item-editor/ui/guidelines-ui.js` | updateGuidelinesChecklist, part render helpers |
| `item-editor/domain/data-loading.js` | updateDataStatusIndicator, showStatus |
| `item-editor-07-analytics.js` | Analytics IIFE (`trackEvent`) |
| `item-editor-08-credits-stats-easter.js` | runItemEditorInit, showCredits, loadVisitorStats, first Easter eggs |
| **legit-builder/** | *(from Legit Item Builder Project / inventory_data_viewer.html)* |
| `legit-builder/legit-builder.js` | Roots/tables UI, file/URL loading, serial decoder, bulk validator, simple/advanced mode |
| `item-editor/ui/legit-theme.js` | changeTheme, theme Easter eggs, save editor state |
| `item-editor-10-yaml-save.js` | setSuppressYamlAnimations, setYamlDataToTextarea, save/YAML decode, serialization |
| `item-editor-11-bulk-init.js` | ensureTrailingPipe, serializeDeserialized, bulk add, random item modal, init |
| `extracted-data.js` | `EXTRACTED_DATA` (weapons, items from game data) |
| `part-selection-data.js` | `PART_SELECTION_DATA` + part selection helpers |
| **data/** | *(Reserved for large constant data; legendary-items.js and part-id-mapping.js removed with item roll generator.)* |
| `main.js` | showNotification, copyToClipboard (Item Editor output), updateAutoAddToBackpackCheckbox, updateAddToBackpackButton, Monaco YAML editor, DOMContentLoaded init |

Dependencies flow left to right; later scripts may use globals set by earlier ones (e.g. `window.typeIdsByManufacturer`, `window.updateTypeIdDropdown`, `window.parseItemCode`).
