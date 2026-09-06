# Blender authoring and MCP

The verified authoring executable is the user's **Steam Blender 5.2.1 LTS**, build `9e2066aef7ef`, at `D:/SteamLibrary/steamapps/common/Blender/blender.exe`. `npm run blender -- --version` selects it. Set `BLENDER_PATH` in your terminal to select a different executable. The wrapper also checks the default Steam location, ignored project-local tools and PATH. It does not edit Blender or Steam preferences.

For reproducible assets, use the background command in [the asset contract](asset-contract.md). Background exports need no MCP process. Each task owns its own script, `.blend`, GLB and preview outputs.

All npm and Python commands below run from `CITRUS_WORLD/`. Local runtime paths are relative to that application directory.

## Interactive MCP setup

The one selected integration is [ahujasid/blender-mcp](https://github.com/ahujasid/blender-mcp), MIT, pinned to commit `c5f35d9cc54451d785ac4c00c48bf9e98a2e8db9` (package 1.9.1). The source and addon are downloaded from that exact revision. No other Blender MCP integration is configured.

1. With Python 3.10+ installed, run `python scripts/setup-blender-mcp.py` from `CITRUS_WORLD/`. It installs only into ignored `.local/blender-mcp/`. Python 3.14.6 is verified here. The pinned source is fixed; transitive Python package versions are resolved during installation.
2. Run `npm run blender -- --factory-startup --python scripts/blender-mcp-bootstrap.py` to open a dedicated Blender process. Keep it running while using MCP. Do not pass `--background`: the upstream bridge deliberately requires Blender's UI event loop.
3. Open this trusted project in Codex and restart its MCP connection if needed. [Official Codex MCP documentation](https://developers.openai.com/codex/mcp/) supports repository-root `.codex/config.toml`; no global Codex configuration is changed. The server command starts from the repository root and launches `CITRUS_WORLD/scripts/blender-mcp-server.mjs`; the launcher resolves its own application directory.
4. Verify independently with `.local/blender-mcp/venv/Scripts/python.exe scripts/verify-blender-mcp.py` on Windows (`.local/blender-mcp/venv/bin/python` elsewhere).

The bridge listens only on `127.0.0.1:9876`. The stdio server sets `DISABLE_TELEMETRY=true`, and the addon process receives the same setting. The pinned upstream source omits its imported `config.py`; setup supplies that missing module with only `telemetry_config.enabled=False` and no endpoints or credentials. This local configuration is the only source addition to the pinned package. Verification checks that startup events are not queued and screenshot upload returns empty. Codex exposes only scene inspection, object inspection, viewport screenshot and Python execution tools; online asset-provider tools are omitted. Python execution operates inside the dedicated Blender process. The bootstrap registers the addon only in that process and never saves user preferences.

To stop it, close the dedicated Blender process. It does not affect independently running background asset jobs or another Blender instance. A hidden instance used by automated verification is recorded by its specific PID in the local verification output; terminate only that owned PID if cleaning it up.

## Publishing

The preserved `origin` remote is the source template. **Never use a default push to origin.** Publish with the explicit destination:

```text
git push https://github.com/SamuelAsherRivello/babylon-lite-astra-blender-demo.git HEAD:main
```

The unused Blender 4.5.9 portable download completed under `.local/tools/` before the Steam installation was identified. It is ignored, not published, and not selected while Steam Blender is present.
