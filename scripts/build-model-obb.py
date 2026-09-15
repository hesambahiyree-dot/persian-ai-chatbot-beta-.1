#!/usr/bin/env python3
"""Pack Gemma GGUF into an Android expansion (OBB) zip if the model is present.

Does not fail the build when the model is missing — APK still builds and the
app shows «مدل نصب نشده».
"""
from __future__ import annotations

import os
import sys
import zipfile
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
MODEL_NAME = "gemma-3-4b-persian-v0.Q4_K_M.gguf"
PACKAGE = "ai.nova.app"
VERSION = os.environ.get("NOVA_VERSION_CODE", "1")

SEARCH = [
    ROOT / "models" / MODEL_NAME,
    ROOT / MODEL_NAME,
    Path(os.environ.get("NOVA_MODEL_PATH", "")),
]

OUT_DIR = ROOT / "native" / "android" / "app" / "build" / "outputs" / "obb"
OUT_FILE = OUT_DIR / f"main.{VERSION}.{PACKAGE}.obb"


def find_model() -> Path | None:
    for p in SEARCH:
        if p and p.is_file() and p.stat().st_size > 1024:
            return p
    return None


def main() -> int:
    model = find_model()
    if model is None:
        print("[build-model-obb] no GGUF found — skipping OBB (APK will still build)")
        return 0

    OUT_DIR.mkdir(parents=True, exist_ok=True)
    print(f"[build-model-obb] packing {model} ({model.stat().st_size} bytes)")
    with zipfile.ZipFile(OUT_FILE, "w", compression=zipfile.ZIP_STORED) as zf:
        zf.write(model, arcname=MODEL_NAME)
    print(f"[build-model-obb] wrote {OUT_FILE} ({OUT_FILE.stat().st_size} bytes)")
    return 0


if __name__ == "__main__":
    sys.exit(main())
