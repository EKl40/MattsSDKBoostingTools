# Dev Spawner UI Audit

This audit compares the current MSBT Dev Spawner tab against ActorScriptDeployer and SDK Debug Menu reference behavior. The current bridge path works, but the UI is still a raw command panel instead of a user-friendly browser.

## Current MSBT Implementation

External app files:

- `external_app/v22_parts_codes_fixed/matts_external_app_v22.py`
- `external_app/v22_parts_codes_fixed/resources/ui_layout.json`

Bridge files:

- `mod_extracted/MattsSDKBoostingTools/backend_actions.py`
- `mod_extracted/MattsSDKBoostingTools/external_bridge.py`

Current external actions:

- `dev_spawner_status`
- `dev_spawner_targets`
- `dev_spawner_spawn`
- `dev_spawner_spawnai`
- `dev_spawner_probeai`
- `dev_spawner_cache`
- `dev_spawner_cache_status`
- `dev_spawner_clear`
- `dev_spawner_activate_last`
- `dev_spawner_scriptdump`
- `dev_spawner_barrel_logo`

Current behavior is mostly a direct wrapper around ActorScriptDeployer console commands. That is good for proving the bridge path, but it leaves users guessing which aliases work, which areas have actors loaded, and which buttons are risky.

## ActorScriptDeployer Reference

ActorScriptDeployer exposes these command families:

- `ASD_status`
- `ASD_cache_status`
- `ASD_targets`
- `ASD_spawn`
- `ASD_probeai`
- `ASD_cache`
- `ASD_spawnai`
- `ASD_clear`
- `ASD_activate_last`
- `ASD_scriptdump`
- `ASD_barrellogo`
- `ASD_lostloot`
- `ASD_logo_options`
- `ASD_spawnerdiag`
- `ASD_spawnoverdrive`

Built-in actor aliases include:

- `lostloot`, `lostlootmachine`, `lost_loot`
- `golden`, `goldenchest`, `golden_chest`
- `firmware`
- `bank`, `playerbank`, `player_bank`
- `barrel`, `barrels`

`ASD_spawn` supports options not currently surfaced by MSBT:

- `--delay`
- `--enable`
- `--disable`
- `--no-activate`
- `--include-non-generated`
- `--count`
- `--spacing`
- `--distance`
- `--z-offset`
- `--scale`
- `--class`

The missing activation and delay options are likely part of why some spawned objects appear inconsistent or invisible to users.

## SDK Debug Menu Reference

SDK Debug Menu provides a much richer browser over actor categories and inventory compositions.

Useful reference pieces:

- `actor_lists.py`
  - 22 actor categories
  - category/search workflow
  - favorites model
- `data/inventory_compositions.json`
  - 132 inventory composition groups
- favorites load/save behavior
- paginated actor list UI
- actor category filter
- search filter
- spawn count, distance, Z offset, spacing, scale

SDK Debug Menu itself depends on BLImGui and should not become an MSBT dependency. The useful part is the data/workflow shape, not the UI dependency.

## What MSBT Already Exposes

MSBT already exposes these working command paths:

- Status and cache status
- Target listing
- Actor template spawn
- AI probe/cache/spawn
- Activate last spawned actor
- Clear ActorScriptDeployer spawns
- Script dump
- Barrel logo

The bridge no longer needs BLImGui for these actions when the current SDK mod is installed.

## What Is Missing

Missing user-friendly behavior:

- Category browser for actors
- Searchable actor preset list
- Favorites
- Clear distinction between actor templates and AI actor defs
- Friendly aliases with the real ASD value hidden
- Help for 0-result target scans
- Missing `ASD_spawn` options: delay, enable, disable, no-activate
- Direct `ASD_lostloot` helper
- `ASD_logo_options`
- `ASD_spawnerdiag`

Missing or deferred advanced behavior:

- `ASD_spawnoverdrive`
- Inventory composition spawning from SDK Debug Menu data
- Full script/object inspection workflows

## Risk Classification

Easy and safe:

- Add friendly actor alias dropdown.
- Add local actor category/search data from SDK Debug Menu.
- Add empty-result hints.
- Add `ASD_spawnerdiag`.
- Add `ASD_logo_options`.
- Add direct `ASD_lostloot`.
- Add missing `ASD_spawn` options.

Medium:

- AI actor category browser.
- Actor favorites.
- Script dump result display.
- Activate last and clear spawned actors placement.

Risky or advanced:

- `ASD_spawnoverdrive`.
- Inventory composition spawning.
- Barrel logo spam tools.
- Free-form class override.
- Any destructive or persistent world-state action.

## Recommended UI Shape

Keep the warning gate before any Dev Spawner command.

Suggested sections:

1. Status / Setup
   - ASD Status
   - Cache Status
   - Cache Actors
   - Targets
   - Probe AI
   - Spawner Diagnostics

2. Actor Spawning
   - Category dropdown
   - Search field
   - Actor preset/list
   - Friendly aliases: Lost Loot, Golden Chest, Bank, Barrel
   - Count
   - Distance
   - Spacing
   - Z Offset
   - Scale
   - Include Non-Generated
   - Delay
   - Activate after spawn
   - Spawn Actor

3. AI Spawning
   - AI search/list
   - Cache source class
   - Extra load path
   - Count
   - Distance
   - Spacing
   - Z Offset
   - Scale
   - Direct Only
   - Probe AI
   - Cache Live Actor
   - Spawn AI Actor Def

4. Last Spawned / Cleanup
   - Activate Last
   - Clear ASD Spawns

5. Advanced / Script Tools
   - Script Dump Last
   - Barrel Logo
   - Logo Options
   - Advanced warnings

## Safest Next Implementation Step

Do a small Dev Spawner UX pass:

1. Keep the existing bridge commands unchanged.
2. Add a local actor alias list with friendly labels and real ASD values.
3. Change the default from `goldenchest` to `lostloot` or no forced default.
4. Add better 0-result messaging.
5. Add the missing `ASD_spawn` option fields without changing other tabs.

After that works, vendor SDK Debug Menu actor categories as standalone JSON for a real category/search browser.

