# Working Modded Item Pattern Audit

Date: 2026-07-07

## Scope

This pass treats the uploaded GZO code file as the known-working evidence set. A
validator failure in this report means the current local rules/parser could not
prove the item is legit. It does not mean the item is broken.

Stable Legit Builder behavior was not changed.

## Files Analyzed

| File | Purpose |
| --- | --- |
| `C:/Program Files (x86)/Steam/steamapps/common/Borderlands 4/sdk_mods/MattsSDKBoostingTools_gzo_codes.json` | Known-working BL4 item codes |
| `C:/Users/mwenn/Desktop/7 Chapter 5_ Item Serials - Borderlands 4 Reverse Engineering Guide.html` | Serial format reference |
| `external_app/v22_parts_codes_fixed/external_serial_tools.py` | Local Base85/human decoder and parts breakdown |
| `external_app/v22_parts_codes_fixed/external_legit_builder.py` | Local builder/rule adapter |
| `external_app/v22_parts_codes_fixed/resources/legit_rules_flat.json` | Current local legit rules |
| `external_app/v22_parts_codes_fixed/resources/gzo_parts_map.json` | Type/part map used for breakdown |

## Known-Working Summary

| Metric | Count |
| --- | ---: |
| Known-working entries analyzed | 2,324 |
| Decoded structurally | 2,323 |
| Decode failed but known working | 1 |
| Known roots found in local rules | 2,317 |
| Unknown/new roots | 6 |
| Passed current local legit rules | 1,921 |
| Known working but failed current local legit rules | 396 |

## Classification Summary

| Listing label in source | Count | Passed local rules | Failed local rules |
| --- | ---: | ---: | ---: |
| Legit | 1,741 | 1,665 | 75 |
| Modded | 320 | 6 | 308 |
| Lootlemon | 263 | 250 | 13 |

The source labels are useful catalog metadata, but the uploaded file itself is
the in-game working evidence set. Some `Legit` labels fail current local rules,
and some `Modded` labels pass them.

## Top Catalog Groups

| Type | Count |
| --- | ---: |
| Shield | 660 |
| Enhancement | 221 |
| Repkit | 208 |
| Classmod | 191 |
| SMG | 154 |
| Shotgun | 151 |
| Assault Rifle | 141 |
| Pistol | 105 |
| Weapons | 92 |
| Sniper | 90 |

| Creator | Count |
| --- | ---: |
| Loot Mama Lala | 1,068 |
| Tobgun1 | 459 |
| Lootlemon | 290 |
| Ccecil6 | 188 |
| MiA_-PiTTBuLL | 72 |
| Terra-Morpheous | 33 |
| Skippy | 29 |
| Azalea Asvail | 24 |

## Serial Guide Concepts Used

The reverse-engineering guide separates structural serial validity from item
legit rules:

| Guide concept | Relevance to working modded builder |
| --- | --- |
| `@U` Base85 prefix and custom alphabet | A serial can decode structurally before any legit-rule validation. |
| Bit mirroring and bitstream parsing | Decoder correctness is separate from item balance legality. |
| Token prefixes | Parts, separators, VarInt, VarBit, and strings are structural tokens. |
| First token determines item kind | Weapon and equipment serials have different first-token formats. |
| Weapon format is VarInt-first | Weapon root/category and level can decode even when part rules fail. |
| Equipment format is VarBit-first | Shields, grenades, class mods, and gadgets use direct category IDs. |
| Part group IDs are context-dependent | `{4}` only means something after the root/category is known. |
| Level is a direct VarInt | Level editing can be structural even when part composition is modded. |
| Elements are part tokens | Multi-element behavior is a part composition issue, not a separate field. |

## Known-Working Patterns Found

| Pattern | Count | Interpretation |
| --- | ---: | --- |
| Missing or omitted `inv_comp` | 239 | The current legit rules require exactly one composition/rarity part, but many known-working serials omit or bypass it. |
| Weapon accessory without expected parent dependency | 156 | Barrel/underbarrel/accessory parts can appear without the dependency tags the current rule model expects. |
| Licensed or cross-manufacturer exclusion tolerated | 102 | Known-working serials include combinations current rules mark as excluded by `licensed` or `licensed_topacc`. |
| Element or secondary element rule violation | 88 | Known-working serials include element tokens without the expected body/secondary-element dependency. |
| Pearlescent part dependency violation | 54 | Pearl stats/elements can appear in serials the rules do not classify as properly pearlescent. |
| Class mod legendary/passive rule violation | 33 | Some class mods overfill or combine passive/legendary bodies outside current rule expectations. |
| Ordnance child/MIRV part without parent | 12 | Grenade/gadget child parts can work without the parent tag the current validator expects. |
| Unknown AI/new root IDs | 6 | The serial decodes, but the local builder rules do not know the root/category yet. |
| Decode failure but known working | 1 | Parser false negative: `Amp Relaxed Cindershelly` failed with `unknown part subtype`. |

## Builder Audit

Current stable behavior:

| Area | Current behavior |
| --- | --- |
| Normal Legit mode | Uses `external_legit_builder.validate`, `slot_counts`, `search_parts`, and `is_part_allowed`; rejects invalid dependency/exclusion patterns. |
| Unlock rules for modded gear | Bypasses validation in `validate_build` and allows duplicate parts in the UI. |
| Base85 build | Uses the same selected root/parts list and clears stale output after root/part/level changes. |
| Give Selected/All/Non-Host | Requires a current non-stale Base85 output before delivery. |

The stable builder is useful and should remain strict. The current unlock mode is
too broad for a safer working-modded workflow because it mostly becomes "allow
anything and warn later." The known-working evidence suggests a middle layer:
allow observed working patterns with specific warnings, while continuing to flag
unobserved risky combinations.

## Recommendations

Do not loosen normal Legit mode.

Create an isolated experimental path later, for example
`external_modded_builder.py` plus a clearly labeled `Working Modded Builder`
mode/tab. It should:

1. Reuse the current decoder and builder only as helpers.
2. Keep strict Legit validation unchanged.
3. Add a `known working pattern` check using
   `resources/known_working_modded_patterns.json`.
4. Label output as `experimental/modded`.
5. Warn when a build violates legit rules but matches an observed working
   pattern.
6. Warn more strongly when a build violates both legit rules and known-working
   patterns.
7. Keep stale-output clearing and missing/stale Base85 delivery refusal.
8. Avoid exposing unknown AI roots until their root data exists in rules.

## Current Restrictions That Look Too Strict For Experimental Mode

| Restriction | Why it may be too strict experimentally |
| --- | --- |
| Exactly one `inv_comp` | 239 known-working entries fail this requirement. |
| Licensed/top accessory exclusions | 102 known-working entries violate these exclusions. |
| Parent dependency tags for barrel/accessory parts | 156 known-working entries violate these dependencies. |
| Element dependency tags | 88 known-working entries violate these dependencies. |
| Pearl stat/element dependencies | 54 known-working entries violate these dependencies. |

## Current Unlock Behavior That Looks Too Open

| Behavior | Risk |
| --- | --- |
| Validation bypass is global | It does not distinguish known-working modded patterns from unknown combinations. |
| Duplicate support is broad | It can create very large or nonsensical selected-part lists. |
| No pattern confidence | Users cannot tell whether a build matches known-working evidence. |
| Unknown roots are not isolated | AI/new roots work in-game but should not be builder-editable until root data exists. |

## Changes Actually Implemented

Added:

| File | Purpose |
| --- | --- |
| `external_app/v22_parts_codes_fixed/resources/known_working_modded_patterns.json` | Small derived pattern database for future experimental builder work |
| `MODDED_ITEM_PATTERN_AUDIT.md` | This research report |

Not changed:

| Area | Status |
| --- | --- |
| Stable Legit Builder behavior | Unchanged |
| Normal Legit validation | Unchanged |
| Serial delivery | Unchanged |
| BL4 Codes delivery | Unchanged |
| Movement, Max All, packaging | Unchanged |
| External app SDK imports | No new SDK/game/BLImGui imports |

## Open Questions For Manual Testing

1. Which omitted-`inv_comp` items are intentionally no-comp versus mapping gaps?
2. Which licensed/cross-manufacturer combinations are useful enough for presets?
3. Should pearl stat/element patterns be exposed as warnings or presets?
4. Can AI/new root IDs be added to `legit_rules_flat.json` safely later?
5. Should experimental mode start as read-only pattern comparison before allowing
   build generation?

