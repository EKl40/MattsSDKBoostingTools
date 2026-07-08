# Dev Spawner UI Audit

## Goal

Compare the current MSBT Dev Spawner tab against ActorScriptDeployer and SDK Debug Menu, then define a safer user-facing external-app workflow.

The current bridge commands are working. The remaining problem is UX: the tab exposes useful commands, but it still feels like a developer console form. The next pass should keep the working bridge path and replace the rough workflow with grouped, safer controls.

## Reference Tools

### ActorScriptDeployer

Installed reference inspected:

`C:\Program Files (x86)\Steam\steamapps\common\Borderlands 4\sdk_mods\ActorScriptDeployer\__init__.py`

Commands exposed by ActorScriptDeployer:

- `ASD_status`
- `ASD_targets <name> [--class ClassName] [--limit N] [--include-non-generated]`
- `ASD_spawn <name> [--class ClassName] [--distance N] [--z-offset N] [--scale N] [--count N] [--spacing N] [--enable states] [--disable states] [--no-activate] [--include-non-generated]`
- `ASD_lostloot`
- `ASD_spawnai <actor-def-name> [--distance N] [--zoffset N] [--scale N] [--count N] [--spacing N] [--load path] [--direct-only]`
- `ASD_probeai <actor-def-name> [--load path]`
- `ASD_cache <name> [--class ClassName] [--index N] [--limit N]`
- `ASD_cache_status`
- `ASD_spawnerdiag [--limit N] [--distance N]`
- `ASD_spawnoverdrive [multiplier]`
- `ASD_barrellogo [text] [--actor name] [--distance N] [--height N] [--spacing N] [--scale N] [--include-non-generated]`
- `ASD_logo_options`
- `ASD_clear`
- `ASD_activate_last [--enable states] [--disable states]`
- `ASD_scriptdump`

Built-in actor aliases:

- `lostloot`, `lostlootmachine`, `lost_loot`
- `golden`, `goldenchest`, `golden_chest`
- `firmware`
- `bank`, `playerbank`, `player_bank`
- `barrel`, `barrels`

Default actor scan classes:

- `OakLostLootMachine`
- `OakInteractiveObject`
- `OakInteractableObject`
- `OakUsableActor`
- `OakUseableActor`
- `OakMissionScriptedActor`
- `OakLootable`
- `OakLootableContainer`
- `OakChest`
- `OakActor`
- `Actor`

### SDK Debug Menu

Installed reference inspected:

`C:\Program Files (x86)\Steam\steamapps\common\Borderlands 4\sdk_mods\SDK_Debug_Menu\display.py`

Relevant user-facing patterns:

- AI spawner tab with category buttons, search, page navigation, favorites, and one-click Spawn.
- Spawn controls grouped as distance, +Z, count, spacing, and scale.
- Barrel Logo generator with actor, distance, editable line rows, add/remove line buttons, and a clear Run button.
- Debug sections are separated from normal spawn workflows.

The SDK Debug Menu is still developer-facing, but it has the right shape for regular users: choose from lists, filter/search, then click a clear action button.

## Current MSBT Dev Spawner Exposure

Current external app actions:

- `dev_spawner_status` -> `ASD_status`
- `dev_spawner_targets` -> `ASD_targets`
- `dev_spawner_spawn` -> `ASD_spawn`
- `dev_spawner_spawnai` -> `ASD_spawnai`
- `dev_spawner_probeai` -> `ASD_probeai`
- `dev_spawner_cache` -> `ASD_cache`
- `dev_spawner_cache_status` -> `ASD_cache_status`
- `dev_spawner_clear` -> `ASD_clear`
- `dev_spawner_activate_last` -> `ASD_activate_last`
- `dev_spawner_scriptdump` -> `ASD_scriptdump`
- `dev_spawner_barrel_logo` -> `ASD_barrellogo`

The bridge now runs these through `backend_actions.run_dev_spawner_action`. It first tries the ActorScriptDeployer command object directly, then falls back to console execution if direct access is unavailable.

Current UI sections:

- Experimental warning/info
- Actor Templates / Deployables
- AI Actor-Def Spawning
- Barrel Logo / Debug Text

The current tab has a session warning gate before actions run, which should stay.

## Missing Commands

Useful missing commands:

- `ASD_lostloot`: should become a one-click safe preset under Actor Spawning.
- `ASD_spawnerdiag`: useful for troubleshooting, but should be read-only/diagnostic.
- `ASD_logo_options`: useful for checking barrel logo rows/options, read-only/status.

Advanced or risky missing commands:

- `ASD_spawnoverdrive`: overlaps spawn multiplier work and can affect many loaded spawner components. Keep hidden or advanced-only until that feature is intentionally designed.
- `ASD_spawn --enable`, `--disable`, `--no-activate`: powerful script-state controls. These should not be part of the default UI.
- `ASD_activate_last --enable`, `--disable`: same reason; useful, but advanced-only.

## Commands That Work But Need Better UI

`ASD_targets`

- Current UI has name/class/limit fields.
- Better UI should show presets first, then optional advanced class and include-non-generated controls.

`ASD_spawn`

- Current UI supports name/class/count/distance/spacing/scale/z/include-non-generated.
- Better UI should use a friendly actor preset/search row, with common presets such as Lost Loot, Golden Chest, Bank, Firmware, Barrel, and custom exact actor name.

`ASD_spawnai`

- Current UI supports actor-def name/load/count/distance/spacing/scale/z/direct-only.
- Better UI should use known actor-def choices, search, cache status, probe, and spawn as a single workflow.

`ASD_cache`

- Current UI is useful but too raw. It should be framed as "Cache nearby matching AI" with candidate index and limit hidden under advanced options.

`ASD_barrellogo`

- Current UI can run the command, but should mirror SDK Debug Menu more closely: separate line fields, add/remove line buttons, actor preset, distance/height/spacing/scale controls.

`ASD_clear`

- Works, but is destructive to spawned actors. Keep a clear label and keep it in Cleanup, not next to setup/status buttons.

## Risk Classification

Safe / normal-user suitable:

- Status
- Cache Status
- Targets
- Probe AI
- Spawn known actor preset with modest count
- Spawn AI with modest count
- Activate Last
- One-click Lost Loot

Medium:

- Cache Actors
- Include non-generated templates
- Barrel Logo
- Script Dump
- Custom actor/class input
- Direct-only AI spawn

Advanced / dangerous:

- Clear Spawned Actors
- Large spawn counts
- Spawn Overdrive
- Custom script-state enable/disable
- No-activate script-state experiments
- Broad non-generated actor scans

## Recommended User-Friendly Layout

### 1. Status / Setup

Controls:

- ASD Status
- Cache Status
- Cache Actors
- Targets
- Probe AI

Purpose:

Let the user confirm ActorScriptDeployer is installed, see cache state, and inspect whether a target/preset is available before spawning.

### 2. Actor Spawning

Controls:

- Actor preset dropdown
- Search/custom actor box
- Optional class dropdown
- Spawn count
- Distance
- Z offset
- Spacing
- Scale
- Include non-generated toggle under advanced
- Spawn Actor
- Spawn Lost Loot preset button

Purpose:

Spawn common deployables without requiring command knowledge.

### 3. AI Spawning

Controls:

- AI preset/search dropdown
- Optional load path dropdown/text
- Cache nearby source
- Probe AI
- Spawn count
- Distance
- Z offset
- Spacing
- Scale
- Direct-only toggle under advanced
- Spawn AI

Purpose:

Make `ASD_spawnai` usable without requiring users to remember actor-def names.

### 4. Last Spawned / Cleanup

Controls:

- Activate Last
- Script Dump Last
- Clear Spawned Actors

Purpose:

Keep object lifecycle actions together. Clear should remain clearly labeled.

### 5. Script / Debug

Controls:

- Barrel Logo builder
- Logo Options
- Spawner Diagnostics

Purpose:

Useful debug/fun tools that should not crowd the main spawn flow.

### 6. Advanced / Dangerous

Controls:

- Spawn Overdrive
- Custom script enable/disable states
- No Activate
- Include non-generated scans
- Large count warnings

Purpose:

Keep powerful behavior available for testers without presenting it as normal workflow.

## What Should Stay Hidden Or Advanced

- `ASD_spawnoverdrive`: leave out of normal Dev Spawner UI for now because it overlaps spawn multiplier and changes loaded spawner components broadly.
- Custom script-state toggles: expose only after the user opens Advanced.
- Large spawn counts: add warnings or soft caps before making this easy.
- Include non-generated scans: useful when templates are hard to find, but not safe as a default.

## Safe Next Implementation Step

Do not rewrite the tab yet.

The safest next pass is:

1. Keep all current working bridge actions.
2. Add missing low-risk actions:
   - `dev_spawner_lostloot`
   - `dev_spawner_spawnerdiag`
   - `dev_spawner_logo_options`
3. Split the current tab visually into:
   - Setup / Diagnostics
   - Actor Spawning
   - AI Spawning
   - Last Spawned / Cleanup
   - Barrel Logo
   - Advanced
4. Move dangerous toggles and raw command-like fields under Advanced.
5. Add a small result/status panel that tells the user what command was sent and where to check details.

This preserves the working command path while making the feature friendlier and safer.

## Files Touched In Current Integration

- `mod_extracted/MattsSDKBoostingTools/backend_actions.py`
- `mod_extracted/MattsSDKBoostingTools/external_bridge.py`
- `external_app/v22_parts_codes_fixed/matts_external_app_v22.py`
- `external_app/v22_parts_codes_fixed/matts_external_core_v20.py`
- `external_app/v22_parts_codes_fixed/resources/ui_layout.json`

## Validation Notes

Current integration has already been checked with:

- Python compile checks for the external app files.
- Python compile checks for the SDK bridge/backend files.
- JSON validation for `ui_layout.json`.
- SDK mod rebuild.
- Installed SDK mod check showing direct ActorScriptDeployer helper text exists in the packaged `.sdkmod`.

The external EXE was not rebuilt in this pass because the available bundled Python runtime does not include a working Tkinter build environment for PyInstaller. The beta package reuses the existing working EXE and updates the external resources plus SDK mod.
