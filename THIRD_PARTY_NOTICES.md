# Third-Party Notices

## Mattmab Legit Builder

This repository includes an experimental local integration of Mattmab's Legit Builder / item editor assets under:

- `external_app/v22_parts_codes_fixed/matt_editor/`

Upstream source:

- `https://github.com/mattmab/legit-builder`

The upstream `Application/package.json` declares license `ISC`. No separate upstream `LICENSE` file was present in the reviewed checkout at the time this integration was added.

The MSBT wrapper starts a local Python host for these assets and routes serial conversion through MSBT's standalone serial helpers. The external app must not import SDK/game modules for this editor path.
