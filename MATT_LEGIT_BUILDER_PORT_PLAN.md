# Mattmab Item Editor Integration Blueprint

## Decision

The previous "keep improving the Tkinter Legit Builder" plan is too small. Mattmab's editor is already the stronger item-building product. MSBT should use that editor model directly instead of loosely rebuilding it again.

The new goal is:

- keep MSBT's Python/Tkinter external app for bridge, boosting, delivery, movement, BL4 catalog, and live-game tools
- add Mattmab's item editor as a local editor module inside the MSBT external package
- use Mattmab's intended web/Electron workflow for item building where practical
- wire generated serial output back into MSBT delivery/bookmarks
- keep all live game actions through the existing MSBT SDK bridge

This should be treated as a real editor integration, not another partial Tkinter recreation.

## What Mattmab's Repo Actually Is

Mattmab's `legit-builder` repo is an Electron/web app.

Important pieces:

- `index.html`: full editor UI
- `styles.css`: full editor styling
- `game_data_export.json`: exported game item/part data
- `LegitItems/`: local item/root/rule JSON resources
- `uiresources/`: images/icons/resources
- `js/`: browser-side editor logic
- `Application/main.js`: Electron shell
- `Application/local-api-server.js`: local Node API server
- `Application/node-api/`: BL4 serial/save encode/decode helpers

The Electron app does three important things MSBT must account for:

1. It opens the web UI locally.
2. It starts a local API server on `127.0.0.1`.
3. It rewrites old online API calls to the local API server for serial serialization/deserialization and local resource loading.

So the successful MSBT integration is not "convert all this to Tkinter." It is "host this web editor locally and bridge the generated item serials into MSBT."

## Target User Experience

In MSBT external app:

1. User opens the existing external EXE.
2. User goes to an editor tab or button:
   - `Item Editor`
   - `Mattmab Editor`
   - or a rebuilt `Legit Builder` tab that launches the local editor module
3. The Mattmab-style editor opens locally.
4. User builds an item using Matt's intended UI:
   - strict Legit Item Builder
   - relaxed Modded Item Builder
   - richer part browsing
   - cross-root/cross-manufacturer part options where supported
   - generated human serial and Base85 output
5. User can:
   - copy generated serial
   - send generated serial to selected player
   - send generated serial to all players
   - send generated serial to non-host players
   - import generated serial to MSBT Serial Bookmarks

The bridge still only handles live delivery. The editor owns item building.

## Architecture Options

### Option A: MSBT Hosts Matt's Web Editor With A Python Local Server

This is the best first implementation.

MSBT adds a local Python server inside the packaged EXE that:

- serves Mattmab editor assets from `MattsSDKBoostingTools_external/editor/mattmab/`
- serves `index.html`, `styles.css`, `js/`, `LegitItems/`, `uiresources/`, `game_data_export.json`
- implements Matt-compatible serial endpoints like `/api.php`
- implements the `nexus_data_proxy.php` resource route for local `LegitItems`
- exposes MSBT endpoints like `/msbt/deliver_selected`, `/msbt/deliver_all`, `/msbt/deliver_nonhost`, and `/msbt/bookmark`
- opens the editor in the user's browser or, later, an embedded webview

Pros:

- one MSBT external EXE can run it
- no Node/Electron runtime required for beta users
- keeps current MSBT packaging model
- preserves much more of Matt's actual editor UI/logic than Tkinter rewrites
- lets us start by focusing on item editor tabs instead of save editing

Cons:

- we must add a compatibility shim for Matt's API calls
- some Electron-only save-file features may need to be hidden or disabled in MSBT mode
- browser opens as a separate window unless we later add an embedded webview

### Option B: Bundle Matt's Electron App As A Sidecar

MSBT package includes a second editor EXE built from Matt's `Application/`.

Pros:

- closest to Matt's intended runtime
- lowest risk of breaking editor JavaScript
- excellent for proof-of-concept

Cons:

- larger package
- two app windows/exes
- needs Node/Electron build workflow
- more release/licensing/attribution work
- harder to pipe generated serials into MSBT delivery unless we add IPC/local HTTP integration

### Option C: Rewrite Matt's Editor Into Tkinter

This is no longer recommended.

Pros:

- visually consistent with current MSBT app
- one Python codebase

Cons:

- repeats the mistake of approximating a working editor
- high risk of missing edge cases
- slowest way to reach experienced-item-maker quality
- hard to match Matt's rich part browser and modded flow

## Recommendation

Use Option A first.

That means: add a local web-editor module hosted by the MSBT external EXE, using Mattmab's actual editor assets and behavior as much as possible.

Keep Option B as a backup proof-of-concept if the Python-hosted web editor hits a browser/runtime wall.

Do not continue trying to make the existing Tkinter Legit Builder carry the entire advanced item-editor burden.

## Integration Boundary

### Local Web Editor Owns

- item/build UI
- strict legit builder
- relaxed modded builder
- part search
- part grouping
- cross-root/cross-type/cross-manufacturer editor behavior
- serial parsing
- human serial generation
- Base85 generation
- editor-side validation
- editor-side previews

### MSBT External App Owns

- opening/hosting the editor
- bridge status/player targeting
- Serial Bookmarks persistence
- BL4 Codes catalog/bookmarks/delivery
- existing non-editor tabs
- forwarding delivery requests to the SDK bridge

### SDK Bridge Owns

- live serial delivery selected/all/non-host
- live game actions only

## Important Safety Choices

- Do not import SDK modules into the web editor.
- Do not make the web editor call `unrealsdk`.
- Do not make MSBT depend on BLImGui.
- Hide or clearly separate save-file editing features until we deliberately support them.
- Keep the existing Tkinter Legit Builder as `Classic Builder` or fallback until the Matt editor path is verified.
- Do not remove current delivery behavior while building this.

## Data And API Compatibility

Matt's Electron shell currently provides:

- `/api.php` for serial deserialize/serialize
- `/blcrypt/api.php` for save encryption/decryption
- `/LegitItems/nexus_data_proxy.php?file=...` for local resource JSON

MSBT Python can implement the item-editor subset:

- deserialize Base85 to human using MSBT `external_serial_tools`
- serialize human to Base85 using MSBT `external_serial_tools`
- serve `LegitItems` JSON from local editor resources
- return a clear unsupported message for save encryption/decryption until intentionally supported

This lets the editor work offline without needing Matt's Node local API server in the first pass.

## Proposed File Layout

Inside the MSBT external app package:

```text
external_app/v22_parts_codes_fixed/
  matt_editor_host.py
  matt_editor_adapter.js
  matt_editor/
    index.html
    styles.css
    game_data_export.json
    js/
    LegitItems/
    uiresources/
```

Packaged beta layout:

```text
MattsSDKBoostingTools_external/
  MattsBoostingToolsExternal.exe
  resources/
  matt_editor/
    index.html
    styles.css
    game_data_export.json
    js/
    LegitItems/
    uiresources/
```

## Proposed MSBT UI

Add or replace the current editor area with:

- `Mattmab Item Editor` section
- `Open Item Editor` button
- `Open Classic Builder` or `Classic Builder` collapsible fallback
- bridge target controls remain in MSBT, not hidden inside the editor
- delivery buttons can exist in editor only after the local MSBT adapter is wired

Initial editor launch can open in the user's default browser. Later we can evaluate an embedded webview.

## Adapter JavaScript Responsibilities

`matt_editor_adapter.js` should be loaded after Matt's scripts and should:

- mark the app as running in MSBT mode
- point old API calls to the MSBT Python local editor server
- hide or disable unsupported save-file sections if needed
- add MSBT buttons near generated serial output:
  - Copy to MSBT Serial Input
  - Add to Bookmarks
  - Give Selected
  - Give All
  - Give Non-Host
- never auto-deliver
- show clear status messages

## Staged Implementation

### MATT-0: License / Attribution / Permission Check

- Confirm Mattmab repo license and intended reuse terms.
- Add attribution in MSBT README and app credits.
- Since you have collaborator access, still keep a clean note of what was vendored.

Output:

- `THIRD_PARTY_NOTICES.md` update or equivalent.

### MATT-1: Vendor Assets, No UI Integration Yet

- Add a script to copy/sync Matt's editor assets into `external_app/v22_parts_codes_fixed/matt_editor/`.
- Do not edit Matt's original files by hand; use an adapter file where possible.
- Exclude repo junk and build artifacts.

Validation:

- verify `index.html`, `styles.css`, `js/`, `LegitItems/`, `uiresources/`, `game_data_export.json` exist in MSBT.

### MATT-2: Python Editor Host

- Add `matt_editor_host.py`.
- Serve static assets on `127.0.0.1:<dynamic port>`.
- Implement item-serial endpoints:
  - `/api.php`
  - `/nicnl/api.php`
  - `/LegitItems/nexus_data_proxy.php`
- Use existing Python serial conversion helpers.
- Return unsupported messages for save-file encryption endpoints.

Validation:

- start host
- open local editor URL
- serial conversion endpoint works
- local `LegitItems` loads

### MATT-3: Launch From MSBT External App

- Add an `Open Mattmab Item Editor` button/tab in MSBT.
- Start the local editor host on demand.
- Open browser to the local editor URL.
- Do not change bridge behavior.

Validation:

- packaged EXE opens editor without Python installed
- editor loads offline
- no internet dependency

### MATT-4: MSBT Adapter And Delivery Bridge

- Add `matt_editor_adapter.js`.
- Add Python host endpoints for:
  - current bridge status
  - selected target info
  - give generated serial selected/all/non-host
  - add generated serial to Serial Bookmarks
- Adapter adds small MSBT-specific buttons near generated Base85 output.

Validation:

- generate item in editor
- copy/import generated serial to MSBT
- deliver selected/all/non-host through existing bridge

### MATT-5: Restrict Unsupported Save Editing

- Decide whether save-file editing belongs in MSBT beta.
- If not, hide save editor tabs in MSBT mode or put them behind a warning/disabled message.
- Keep item building fully available.

### MATT-6: Packaging

- Update build/package scripts to include `matt_editor/`.
- Verify package does not include `.git`, `node_modules`, or build junk.
- Rebuild beta zip.

## Why This Is Better Than More Tkinter Patches

- Matt's editor already has the desired mental model.
- Experienced item makers need a real part browser and relaxed modded workflow, not a simplified listbox.
- The Python app can still own live-game safety.
- We can keep current beta stable while building the editor path behind a new entry point.
- This gives us a path toward "best item maker UI" instead of "good enough companion panel."

## Immediate Next Step

Start with MATT-1 and MATT-2 on this branch:

1. vendor Matt editor assets into MSBT under a dedicated folder
2. add a Python local editor host
3. prove `index.html` loads from MSBT's local server
4. prove serial serialize/deserialize endpoints work locally
5. do not touch delivery, movement, BL4 Codes, or current builder behavior yet

Once that proof works, wire an `Open Mattmab Item Editor` button into MSBT.
