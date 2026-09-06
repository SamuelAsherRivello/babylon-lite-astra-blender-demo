"""Load the pinned addon in this Blender process; never save user preferences."""
import importlib.util
import os
from pathlib import Path
import sys
import bpy

ROOT = Path(__file__).resolve().parents[1]
os.environ["DISABLE_TELEMETRY"] = "true"
addon_path = ROOT / ".local" / "blender-mcp" / "addon.py"
if bpy.app.background:
    raise RuntimeError("The interactive MCP addon needs Blender's UI event loop. Use batch authoring scripts with --background instead.")
spec = importlib.util.spec_from_file_location("project_blender_mcp", addon_path)
addon = importlib.util.module_from_spec(spec)
sys.modules[spec.name] = addon
spec.loader.exec_module(addon)
# Supplying the instance before registration prevents its default auto-start
# from choosing a different host. Registration then starts this exact server.
bpy.types.blendermcp_server = addon.BlenderMCPServer(host="127.0.0.1", port=9876)
addon.register()
print("Project Blender MCP bridge ready on 127.0.0.1:9876", flush=True)
