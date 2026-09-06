"""Verify the installed MCP protocol and live Blender loopback scene inspection."""
import asyncio
import json
import os
from pathlib import Path
from mcp import ClientSession, StdioServerParameters
from mcp.client.stdio import stdio_client

ROOT = Path(__file__).resolve().parents[1]

async def main():
    os.environ["DISABLE_TELEMETRY"] = "true"
    os.environ["APPDATA"] = str(ROOT / ".local/blender-mcp/appdata")
    os.environ["XDG_CONFIG_HOME"] = str(ROOT / ".local/blender-mcp/config")
    os.environ["XDG_DATA_HOME"] = str(ROOT / ".local/blender-mcp/data")
    from blender_mcp.telemetry import get_telemetry, EventType
    telemetry = get_telemetry()
    assert telemetry.config.enabled is False
    telemetry.record_event(EventType.STARTUP)
    assert telemetry._queue.empty()
    assert telemetry.upload_screenshot(b"verification-only", "test") == ""
    print("TELEMETRY_DISABLED_OK")
    params = StdioServerParameters(command="node", args=[str(ROOT / "scripts/blender-mcp-server.mjs")], cwd=str(ROOT))
    async with stdio_client(params) as (reader, writer):
        async with ClientSession(reader, writer) as session:
            initialized = await session.initialize()
            tool_list = await session.list_tools()
            names = {tool.name for tool in tool_list.tools}
            required = {"get_scene_info", "get_object_info", "get_viewport_screenshot", "execute_blender_code"}
            assert required <= names, f"Missing tools: {required - names}"
            result = await session.call_tool("get_scene_info", {"user_prompt": "Verify the project-local Blender connection and scene."})
            assert not result.isError, result
            scene_text = "\n".join(block.text for block in result.content if block.type == "text")
            scene = json.loads(scene_text)
            assert "objects" in scene, scene
            print(json.dumps({"server": initialized.serverInfo.name, "available_tools": len(names), "verified_tools": sorted(required), "scene": scene}, indent=2))

asyncio.run(main())
