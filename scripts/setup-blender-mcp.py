"""Install the pinned MCP source/addon into .local, without global changes."""
from pathlib import Path
import hashlib
import shutil
import subprocess
import sys
import urllib.request
import venv
import zipfile

REVISION = "c5f35d9cc54451d785ac4c00c48bf9e98a2e8db9"
ARCHIVE_SHA256 = "d018a18a3448bbc386d8b89b07c1a458b7d817f891b0aab557b2ab4dc3db8a10"
ROOT = Path(__file__).resolve().parents[1]
LOCAL = ROOT / ".local" / "blender-mcp"
LOCAL.mkdir(parents=True, exist_ok=True)
archive = LOCAL / f"{REVISION}.zip"
if not archive.exists():
    urllib.request.urlretrieve(f"https://github.com/ahujasid/blender-mcp/archive/{REVISION}.zip", archive)
if hashlib.sha256(archive.read_bytes()).hexdigest() != ARCHIVE_SHA256:
    raise RuntimeError("Pinned Blender MCP archive checksum mismatch")
source = LOCAL / "source"
source.mkdir(exist_ok=True)
prefix = f"blender-mcp-{REVISION}/"
with zipfile.ZipFile(archive) as bundle:
    for member in bundle.infolist():
        relative = member.filename.removeprefix(prefix)
        if member.is_dir() or not (relative.startswith("src/") or relative in {"pyproject.toml", "README.md", "LICENSE", "addon.py"}):
            continue
        target = (source / relative).resolve()
        if not target.is_relative_to(source.resolve()):
            raise RuntimeError("Unsafe archive path")
        target.parent.mkdir(parents=True, exist_ok=True)
        target.write_bytes(bundle.read(member))
shutil.copyfile(source / "addon.py", LOCAL / "addon.py")
# Upstream's pinned source omits config.py even though telemetry imports it.
# Supply only a disabled configuration, with no endpoint or credential fields.
(source / "src/blender_mcp/config.py").write_text(
    '"""Project-local configuration: telemetry is always disabled."""\n'
    'from types import SimpleNamespace\n'
    'telemetry_config = SimpleNamespace(enabled=False)\n', encoding="utf-8"
)
venv.EnvBuilder(with_pip=True).create(LOCAL / "venv")
python = LOCAL / "venv" / ("Scripts/python.exe" if sys.platform == "win32" else "bin/python")
subprocess.run([str(python), "-m", "pip", "install", "--disable-pip-version-check", "--no-cache-dir", str(source)], check=True)
(LOCAL / "revision.txt").write_text(REVISION + "\n", encoding="utf-8")
print(f"Installed Blender MCP {REVISION} in {LOCAL}")
