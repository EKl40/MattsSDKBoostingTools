# Matt Editor Integration Audit

This audit looks at the current Mattmab editor integration, how it sends generated items to the game, and what it means for future item-building work.

## Current Integration

External app files:

- `external_app/v22_parts_codes_fixed/matts_external_app_v22.py`
- `external_app/v22_parts_codes_fixed/matt_editor_host.py`
- `external_app/v22_parts_codes_fixed/matt_editor_adapter.js`
- `external_app/v22_parts_codes_fixed/matt_editor/`

The external app currently adds a Mattmab Item Editor entry point inside the Legit Builder area. The host starts a local HTTP server for the editor files and tries to open the editor with pywebview. If pywebview is unavailable, it falls back to the browser.

The editor remains standalone web logic. It does not import the SDK mod or game modules.

## Delivery Path

The editor adapter injects an MSBT delivery panel into the web editor.

Current serial lookup order:

- `finalOutputBase85`
- `mi_finalOutputBase85`
- `serializedOutput`
- `bulkSerialOutput`

The adapter reads the first `@U` serial it finds and sends it to:

- `/msbt/deliver`

The host maps that to the SDK bridge:

- selected -> `give_serial_selected`
- all -> `give_serial_all`
- nonhost -> `give_serial_nonhost`

Payload shape:

```json
{
  "serial_text": "@U...",
  "serial_override_level": false,
  "serial_level": 60
}
```

This is the correct architecture boundary: the editor builds the item locally, and the SDK bridge only delivers the final serial to the live game.

## Current Risks

The editor delivery path works in concept, but it needs hardening before it should be treated as the main production item builder.

Risks:

- The adapter chooses the first visible `@U` output it finds, which can be stale if multiple builder outputs exist.
- There is no explicit "this is the serial that will be sent" preview in the MSBT delivery panel.
- The embedded panel does not expose the current MSBT target selector. It relies on the main app or bridge target state.
- The payload sends `serial_level` but does not enable level override. That is fine if the editor already generated the serial at the intended level, but the UI should make that clear.
- pywebview must be packaged into the EXE for true embedded behavior. Otherwise the editor opens outside the app.

## Item-Building Logic Comparison

The Python external Legit Builder is a conservative adapter around the SDK mod rules:

- `external_app/v22_parts_codes_fixed/external_legit_builder.py`
- `external_app/v22_parts_codes_fixed/resources/legit_rules_flat.json`
- `external_app/v22_parts_codes_fixed/resources/observed_working_part_options.json`

It supports root selection, slots, search, validation, human serial output, and Base85 output. In unlocked/modded mode it mostly relaxes validation.

The Matt editor contains a fuller web-native item-building system:

- `matt_editor/js/item-editor/domain/parts.js`
- `matt_editor/js/legit-builder/legit-builder.js`

Important differences:

- The Matt editor has richer modded item UI logic.
- It preserves deserialized token order for modded rebuilds.
- It distinguishes legit validation from modded relaxed validation.
- It handles unknown and cross-root parts more intentionally.
- It has a broader item editor workflow than the current Python slot-card builder.

Conclusion: for serious modded item making, the Matt editor should become the preferred editor surface. The Python Legit Builder can remain as a quick/legacy builder, but we should stop trying to make it the only advanced modded builder.

## What Should Stay Local

Local to the external app/editor:

- Item search and selection
- Part selection
- Modded/legit builder state
- Validation
- Serial generation
- Base85 conversion
- Output preview
- Copy behavior
- Favorites/bookmarks if added to editor workflow

## What Should Stay in the SDK Bridge

Bridge/live game only:

- `give_serial_selected`
- `give_serial_all`
- `give_serial_nonhost`
- target/player status
- any live inventory/player/world operation

The editor should never import SDK modules directly.

## Electron Consideration

Electron is a strong long-term candidate because the Matt editor is already a web app. It would make embedding the editor cleaner than Tkinter plus pywebview.

However, a full Electron rewrite is risky right now because many MSBT tabs already work in the Tk external app.

Recommended approach:

1. Keep the Tk app as the stable beta shell.
2. Harden the embedded Matt editor delivery path.
3. Build an Electron proof of concept with only:
   - Bridge status
   - Matt editor
   - delivery selected/all/nonhost
4. Only migrate the full suite if the proof of concept is clearly better.

## Installer Consideration

An installer could help later:

- place the SDK mod and external folder correctly
- create shortcuts
- preserve user data on update
- reduce manual zip mistakes

Risks:

- unsigned installer warnings
- update complexity
- accidental overwrite of user bookmarks/resources

Recommendation: keep portable zip as the primary beta format for now. Add an optional installer after the folder layout and editor embedding stabilize.

## Safest Next Implementation Step

Do not rewrite the whole app around the editor yet.

Next small step:

1. Add a clear send preview inside `matt_editor_adapter.js`.
2. Require the user to explicitly choose the detected `@U` output before sending if multiple outputs are present.
3. Add a target/status refresh panel or clear text explaining that delivery uses the MSBT selected target.
4. Keep delivery routed through the existing bridge actions.

After that, compare Matt editor generated serials against the Python Legit Builder output for the same simple item and document the differences.

