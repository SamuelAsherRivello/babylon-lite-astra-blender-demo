# C006 project structure and naming

The application now lives in `CITRUS_WORLD/`. Project documentation is consolidated here, and canonical planning lives in repository-root `.openspec/`. Repository metadata, agent skills, MCP configuration, workflows, README and license remain at the root.

## Paths and preservation

| Original location | Current location |
| --- | --- |
| `PROJECT_NAME/documentation/` and `docs/` | `CITRUS_WORLD/documentation/` |
| `src/`, `tests/`, `scripts/` | Corresponding directories inside `CITRUS_WORLD/` |
| `assets/blender/`, `public/assets/` | Corresponding directories inside `CITRUS_WORLD/` |
| npm manifests, Vite/TypeScript config, `index.html` | `CITRUS_WORLD/` |
| Active `openspec/` content | `.openspec/` |
| Inherited template `.openspec/` content | `.openspec/history/template/` |

The clean starting commit was `962f059`, containing the C005 checkpoint and finalized C006 proposal. [The file mapping](C006-file-map.json) records SHA-256 values for all 261 files at the moment of migration. Every move was collision-checked and verified before intentional path/documentation changes. A subsequent check confirmed that all 190 authored asset, runtime asset and inherited template files still matched those hashes. Existing coordination/release records are marked historical so their original commands and measurements are not mistaken for new evidence.

A concurrent C007 task was preserved in `.openspec/changes/c007-looping-water-flow/` and is excluded from the C006 commit. It began implementation during migration, so an isolated C006 snapshot was used for verification and staging, retaining the committed C005 versions of its three shared runtime/test files while leaving C007's working files untouched. Its newly created empty CLI scaffold was preserved under the ignored application `.local/` directory before installing the alias.

## Current commands

From the repository root:

```powershell
npm --prefix CITRUS_WORLD ci
npm --prefix CITRUS_WORLD run check
npm --prefix CITRUS_WORLD run dev
npm --prefix CITRUS_WORLD run spec:validate
node CITRUS_WORLD/scripts/openspec.mjs list --json
```

Alternatively, change directory into `CITRUS_WORLD/` and run the usual short npm commands. Runtime asset URLs and the public demo URL are unchanged. CI caches `CITRUS_WORLD/package-lock.json`, runs within that package and uploads `CITRUS_WORLD/dist`. Pages deployment remains manual.

The OpenSpec launcher validates a persistent ignored local `openspec` shortcut to `.openspec`: a junction on Windows or directory symlink on Linux. Both names access the same files. Git tracks canonical `.openspec` paths only. The launcher refuses real directories, broken links and links to another target without overwriting them; it forwards CLI arguments, output and exit status, with telemetry disabled and configuration scoped inside application `.local/`. No dependency or global configuration was changed.

Blender/MCP commands run from `CITRUS_WORLD/`; see [the toolchain guide](../blender-toolchain.md). The pinned MCP environment was recreated at its new location using the checksum-verified cached source archive. Old local environments, caches and evidence were preserved in `CITRUS_WORLD/.local/legacy-root/` and prior browser output was moved to `CITRUS_WORLD/output/`. Only identified old project processes were retired. The new dedicated Blender bridge PID is recorded locally in `.local/blender-mcp/bridge.pid`.

## Verification

- `npm --prefix CITRUS_WORLD ci`: 124 packages installed with the original lockfile and pinned versions.
- Nested `npm run check`: 20 gameplay/VFX tests, four OpenSpec launcher tests, TypeScript and production build passed on Windows. The existing large-bundle warning remains.
- Launcher tests cover first/concurrent creation, reuse, shared content, real-directory/wrong-target/broken-link refusal, CLI arguments/cwd/config, exit status and alias persistence after failure.
- Canonical OpenSpec context/list/status/instructions and strict validation passed from both root and application directories. All Citrus changes are visible; inherited template history is excluded.
- Steam Blender 5.2.1 LTS loaded both relocated `.blend` files in background mode without saving or regenerating assets.
- The relocated MCP protocol check passed its scene query, required-tool checks and telemetry-disabled assertions on `127.0.0.1:9876`. Its upstream addon-discovery warning is expected because this setup loads the addon into a dedicated process rather than installing global preferences.
- Chrome 152.0.7977.77 / WebGPU and Edge 152.0.4191.66 / WebGL passed gameplay and VFX checks on the optimized QA preview. Both reports contain zero console errors and confirmed original viewport restoration. Checks include WASD and joystick movement, animations, camera orbit/zoom, navigation safety, pointer cancellation/focus loss, and centered 9:16 fit at 1280x960, 390x844, 320x568 and 844x390. The portrait screenshot was also visually inspected.
- Initial browser runs failed an animation timing assertion and an Edge startup wait. The harness now waits for actual rendered frames before timing movement and keeps its coordination page lightweight instead of running a second competing game scene. Final browser runs passed without changing gameplay code. Concurrent C007 browser work was coordinated separately.
- The isolated C006 snapshot independently passed its 20 gameplay/VFX tests, four launcher tests, TypeScript, production build and all six C001-C006 strict validations. [Linux CI run 34026695970](https://github.com/SamuelAsherRivello/babylon-lite-astra-blender-demo/actions/runs/34026695970) passed on migration commit `e063f28caba423c2b72544bbea642d90bd0e7a47`, including the real Linux symlink fixtures and nested npm/build/spec checks.
- GitHub's committed tree was inspected directly: `CITRUS_WORLD/documentation/` exists, canonical `.openspec/` is present, and `PROJECT_NAME/`, root `docs/` and the visible compatibility alias are absent from the published tree.
- Active-file whitespace checks pass. Two preserved template build logs and the template config retain their historical content, including a pre-existing blank line at EOF in that config; the history files remain hash-identical.

Browser verification uses the existing Playwright runner with `--url http://127.0.0.1:4173 --label c006`; reports stay in ignored `output/playwright/c006-*`. Build with `npm run build -- --mode qa` for diagnostic gameplay assertions, then restore a normal production build. Physical mobile hardware is outside the recorded browser-emulation coverage.
