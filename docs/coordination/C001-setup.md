# C001 setup handoff

## Delivered

- Public repository: [SamuelAsherRivello/babylon-lite-astra-blender-demo](https://github.com/SamuelAsherRivello/babylon-lite-astra-blender-demo).
- Template ancestor: `54c4b860db322db9d2a3136f3146e2c7bef5bac7`; preserved history, license, banner and attribution.
- Published browser baseline: `ff5412ca13ba9649bf24dd7fb16120de381ea15a` on `main`.
- Active proposal: `openspec/changes/c001-project-setup/`. Inherited `.openspec/` wallet material is provenance only.
- Locked Babylon core/loaders 9.25.0, TypeScript 7.0.2, Vite 8.2.2, Vitest 5.0.0, OpenSpec 1.12.0. No UI library or backend.
- Asset interface: [asset contract](../asset-contract.md). C002/C003 own disjoint authoring/output files; C004 owns final application and README.
- Blender: existing Steam 5.2.1 LTS, build `9e2066aef7ef`, executable `D:/SteamLibrary/steamapps/common/Blender/blender.exe`.
- MCP: exactly one integration, ahujasid/blender-mcp commit `c5f35d9cc54451d785ac4c00c48bf9e98a2e8db9`, MIT, installed package 1.9.1. See [toolchain instructions](../blender-toolchain.md).

## Verification on 2026-09-06

- `npm install`: 124 packages, audit reported zero vulnerabilities.
- `npm run check`: 5 renderer-selection tests passed; TypeScript passed; production `dist/` built. Babylon's main bundle triggers Vite's advisory 500 kB chunk warning (about 298 kB gzip), not a build failure.
- Initial test attempt hit sandbox `spawn EPERM` before executing assertions. Rerunning outside that restriction passed. No behavioral red-test claim is made from the infrastructure failure.
- `npm run spec:validate`: strict C001 validation passed.
- Real Codex browser at `http://127.0.0.1:5174/`: visibly rendered sample cube and `WebGPU ready`, with no error/warning logs. Port 5173 was occupied, so Vite selected 5174. Browser fallback paths are covered by deterministic tests; browser WebGL was not forced in this setup check.
- [Baseline GitHub Actions run](https://github.com/SamuelAsherRivello/babylon-lite-astra-blender-demo/actions/runs/34018549485): successful test/build/spec validation on Ubuntu Node 24.
- `npm run blender -- --version`: Steam Blender 5.2.1 LTS selected.
- Background factory-startup Python probe printed `BATCH_PYTHON_OK 5.2.1 LTS` and exited successfully.
- `codex mcp get blender --json`: project-local server enabled, correct stdio launcher, loopback host/port, telemetry disable setting, and four-tool allow list.
- Live `scripts/verify-blender-mcp.py`: MCP initialization succeeded, 28 upstream tools advertised, the four allowed tools present, and scene inspection returned Cube, Light, Camera. Handshake verified addon protocol 5 / addon version [1, 6] against Blender 5.2.1 LTS.
- Telemetry check printed `TELEMETRY_DISABLED_OK`: configuration disabled, startup event queue empty, screenshot upload skipped; final live MCP inspection still passed.
- Dedicated interactive bridge launched hidden as PID 42304. Its logs and PID are under `.local/blender-mcp/`. It uses factory startup and does not save global preferences. Only this owned bridge should be stopped when no longer needed.

## Tooling notes

The first uv archive install failed because Windows denied a cache-directory rename. The delivered setup uses Python venv/pip and a bounded archive extraction instead, and succeeded. The source archive is pinned by both commit URL and SHA256. Upstream omits the `config.py` imported by its telemetry module; setup adds a minimal configuration with telemetry disabled and no endpoint or credential fields. The server redirects its application data/config files into ignored `.local/` even with telemetry disabled.

The official portable Blender 4.5.9 download completed before the Steam installation was identified. It remains ignored and unused; no global installation occurred. Input art references also remain ignored in `.local/references/`.

The original `origin` remote remains the template under the user's Git operation restrictions. Never default-push to it. Publish normally using `git push https://github.com/SamuelAsherRivello/babylon-lite-astra-blender-demo.git HEAD:main`.
