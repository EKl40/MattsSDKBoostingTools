from __future__ import annotations

import sys
from pathlib import Path


def app_base_dir() -> Path:
    """Return the folder containing the external app or frozen executable."""
    if getattr(sys, "frozen", False):
        return Path(sys.executable).resolve().parent
    return Path(__file__).resolve().parent


BASE_DIR = app_base_dir()
RESOURCE_DIR = BASE_DIR / "resources"
