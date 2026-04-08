from pathlib import Path
import shutil

base = Path("data")
if base.exists():
    shutil.rmtree(base)

(base / "uploads").mkdir(parents=True, exist_ok=True)
(base / "index").mkdir(parents=True, exist_ok=True)

print("Reset complete.")
