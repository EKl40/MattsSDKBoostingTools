from __future__ import annotations

import json
import sys
import urllib.error
import urllib.request
from pathlib import Path
from typing import Any


REPO_ROOT = Path(__file__).resolve().parents[1]
APP_DIR = REPO_ROOT / "external_app" / "v22_parts_codes_fixed"

if str(APP_DIR) not in sys.path:
    sys.path.insert(0, str(APP_DIR))

import external_legit_builder  # noqa: E402
import external_serial_tools  # noqa: E402
import matt_editor_host  # noqa: E402


STRICT_BUILDER_FIXTURES = [
    {
        "name": "Daedalus Zipgun strict pistol",
        "root_key": "dad_ps",
        "parts": [
            "inv_comp:comp_05_legendary_zipgun",
            "body:part_body",
            "body_acc:part_body_a",
            "barrel:part_barrel_01_zipgun",
            "magazine:part_mag_01",
            "scope:part_scope_ironsight",
            "grip:part_grip_01",
        ],
        "level": 60,
        "seed": 2,
        "seed2": 1534,
        "expected_human": "2, 0, 1, 60| 2, 1534|| {54} {2} {3} {1} {13} {25} {42}|",
        "expected_base85": "@Uga`vnFnkbU{4Y>DRG/(vs7=j5)j/L",
    },
    {
        "name": "Rogue class mod common composition",
        "root_key": "classmod_robodealer",
        "parts": ["inv_comp:comp_01_common"],
        "level": 60,
        "seed": 2,
        "seed2": 1534,
        "expected_human": "404, 0, 1, 60| 2, 1534|| {52}|",
        "expected_base85": "@UgeA%bm/*xI!uVgHbO-",
    },
]

CUSTOM_CATALOG_FIXTURES = [
    {
        "name": "Crayons82.0 custom static modded catalog entry",
        "id": "custom:crayons82:sent-to-mal-to-help-with-luv-on-primary-d3f5632b2302",
        "creator": "Crayons82.0",
        "classification": "Modded",
        "required_tags": {"crayons82.0", "custom", "static", "modded", "bl4"},
        "listing": "Custom Static",
    },
]

CUSTOM_CODES_PATH = APP_DIR / "resources" / "custom_bl4_codes.json"


def _fail(message: str) -> None:
    raise AssertionError(message)


def _post_json(url: str, payload: dict[str, Any]) -> Any:
    body = json.dumps(payload).encode("utf-8")
    req = urllib.request.Request(
        url,
        data=body,
        headers={"Content-Type": "application/json"},
        method="POST",
    )
    with urllib.request.urlopen(req, timeout=10) as response:
        return json.loads(response.read().decode("utf-8") or "{}")


def _get_text(url: str) -> str:
    with urllib.request.urlopen(url, timeout=10) as response:
        return response.read().decode("utf-8", errors="replace")


def _expect_equal(label: str, actual: Any, expected: Any) -> None:
    if actual != expected:
        _fail(f"{label} mismatch\nexpected: {expected!r}\nactual:   {actual!r}")


def _expect_contains(label: str, text: str, needle: str) -> None:
    if needle not in text:
        _fail(f"{label} did not contain {needle!r}")


def _load_custom_catalog_entries() -> list[dict[str, Any]]:
    data = json.loads(CUSTOM_CODES_PATH.read_text(encoding="utf-8"))
    entries = data.get("entries") if isinstance(data, dict) else None
    if not isinstance(entries, list):
        _fail(f"{CUSTOM_CODES_PATH} did not contain an entries list")
    return [entry for entry in entries if isinstance(entry, dict)]


def _find_custom_catalog_entry(entry_id: str) -> dict[str, Any]:
    for entry in _load_custom_catalog_entries():
        if entry.get("id") == entry_id:
            return entry
    _fail(f"custom catalog fixture {entry_id!r} was not found")


def _check_host_roundtrip(url: str, label: str, expected_human: str, expected_base85: str) -> None:
    one = _post_json(url + "/api.php", {"deserialized": expected_human})
    _expect_equal(f"{label} host deserialized -> base85", one.get("serial_b85"), expected_base85)

    many = _post_json(url + "/api.php", {"deserialized_strings": [expected_human]})
    _expect_equal(f"{label} host deserialized_strings -> base85", many, [expected_base85])

    decoded = _post_json(url + "/api.php", {"serial_b85": expected_base85})
    _expect_equal(f"{label} host base85 -> deserialized", decoded.get("deserialized"), expected_human)

    bulk = _post_json(url + "/api.php", {"serials": [expected_base85]})
    result = (bulk.get("results") or {}).get(expected_base85) or {}
    _expect_equal(f"{label} host serials success", result.get("success"), True)
    _expect_equal(f"{label} host serials deserialized", result.get("deserialized"), expected_human)


def _check_strict_builder_fixture(url: str, fixture: dict[str, Any]) -> tuple[str, str, str]:
    name = str(fixture["name"])
    root_key = str(fixture["root_key"])
    parts = list(fixture["parts"])
    level = int(fixture["level"])
    seed = int(fixture["seed"])
    seed2 = int(fixture["seed2"])
    expected_human = str(fixture["expected_human"])
    expected_base85 = str(fixture["expected_base85"])

    validation = external_legit_builder.validate(root_key, parts)
    if not validation.get("ok"):
        _fail(f"{name} fixture is invalid: " + "; ".join(validation.get("errors") or []))

    built_human = external_legit_builder.build_human(root_key, parts, level=level, seed=seed, seed2=seed2)
    built_base85 = external_legit_builder.build_base85(root_key, parts, level=level, seed=seed, seed2=seed2)
    _expect_equal(f"{name} builder human", built_human, expected_human)
    _expect_equal(f"{name} builder base85", built_base85, expected_base85)
    _check_host_roundtrip(url, name, expected_human, expected_base85)
    return name, expected_human, expected_base85


def _check_custom_catalog_fixture(url: str, fixture: dict[str, Any]) -> tuple[str, str, str]:
    name = str(fixture["name"])
    entry = _find_custom_catalog_entry(str(fixture["id"]))
    tags = set(str(tag).lower() for tag in entry.get("tags") or [])
    required_tags = set(str(tag).lower() for tag in fixture["required_tags"])

    _expect_equal(f"{name} creator", entry.get("creator"), fixture["creator"])
    _expect_equal(f"{name} classification", entry.get("classification"), fixture["classification"])
    _expect_equal(f"{name} listing", entry.get("listing"), fixture["listing"])
    if not required_tags.issubset(tags):
        _fail(f"{name} missing required tags: {sorted(required_tags - tags)}")

    expected_base85 = str(entry.get("serial") or "").strip()
    if not expected_base85:
        _fail(f"{name} did not have a serial")
    expected_human = external_serial_tools.serial_to_human(expected_base85)
    roundtrip_base85 = external_serial_tools.human_to_serial(expected_human)
    _expect_equal(f"{name} local roundtrip base85", roundtrip_base85, expected_base85)
    _check_host_roundtrip(url, name, expected_human, expected_base85)
    return name, expected_human, expected_base85


def _check_editor_bootstrap(url: str) -> None:
    index_html = _get_text(url + "/")
    _expect_contains("editor bootstrap", index_html, "MSBT_MATT_EDITOR_MODE")
    _expect_contains("adapter injection", index_html, "/matt_editor_adapter.js")

    adapter_js = _get_text(url + "/matt_editor_adapter.js")
    _expect_contains("adapter version", adapter_js, 'deliver-4-target-selector')


def run_check() -> None:
    checked: list[tuple[str, str, str]] = []
    url = matt_editor_host.start_editor_host().rstrip("/")
    try:
        _check_editor_bootstrap(url)
        for fixture in STRICT_BUILDER_FIXTURES:
            checked.append(_check_strict_builder_fixture(url, fixture))
        for fixture in CUSTOM_CATALOG_FIXTURES:
            checked.append(_check_custom_catalog_fixture(url, fixture))
    finally:
        matt_editor_host.stop_editor_host()

    print("Matt editor cross-builder check passed.")
    for name, human, base85 in checked:
        print(f"Fixture: {name}")
        print(f"Human: {human}")
        print(f"Base85: {base85}")


if __name__ == "__main__":
    try:
        run_check()
    except urllib.error.URLError as exc:
        print(f"Matt editor cross-builder check failed: {exc}", file=sys.stderr)
        raise SystemExit(1)
    except Exception as exc:
        print(f"Matt editor cross-builder check failed: {exc}", file=sys.stderr)
        raise SystemExit(1)
