## Why

Application files are scattered across the repository root, documentation is split between `PROJECT_NAME/documentation/` and `docs/`, and two OpenSpec trees have different meanings. C006 establishes the requested `CITRUS_WORLD/` project boundary and one canonical `.openspec/` planning home while preserving the working game and template provenance.

## What Changes

- **BREAKING (development paths):** Rename `PROJECT_NAME/` to `CITRUS_WORLD/` and move application source, tests, scripts, package manifests, build configuration, public assets and Blender authoring assets beneath it. Keep their existing internal names, including `scripts/` and `assets/blender/`.
- Merge root `docs/` into `CITRUS_WORLD/documentation/`, alongside the existing template documentation images. There will be no separate root `documentation/` folder.
- Consolidate active Citrus planning into lowercase `.openspec/`. Preserve inherited template planning under `.openspec/history/template/`, outside active changes and specs. Preserve every current change, including C005 and this C006 proposal.
- Retain the existing CLI compatibility approach with a persistent, ignored local `openspec/` alias pointing to `.openspec/`. OpenSpec 1.12.0 can discover the same files through this shortcut; GitHub tracks only the canonical hidden tree. The user confirmed this choice during the C006 interview.
- Update npm commands, Blender/MCP launch paths, CI, Pages build paths, documentation links and local generated-output locations together.
- Preserve repository/package identity, public demo URLs, asset URL paths, gameplay, camera settings, visual composition and current C005 work.

## Capabilities

### New Capabilities

None. This is repository organization, tooling and documentation work; it introduces no game capability. `skip_specs: true` explicitly omits delta specs.

### Modified Capabilities

None. Existing gameplay and asset requirements remain unchanged. The active `openspec/specs/` directory currently has no main specs; inherited wallet specs are provenance rather than Citrus World requirements.

## Impact

- Application home: `CITRUS_WORLD/`, with one npm manifest and lockfile pair. Repository metadata, root README, license, agent instructions, `.github/`, `.agents/` and `.codex/` remain at the root.
- Root commands become `npm --prefix CITRUS_WORLD ...`; commands after `cd CITRUS_WORLD` retain their usual form. No package upgrade is required.
- `.codex/config.toml` continues at the repository root and points to the relocated MCP launcher. The Steam Blender installation remains `D:/SteamLibrary/steamapps/common/Blender/blender.exe`.
- CI runs in `CITRUS_WORLD`, caches its lockfile, validates the hidden planning home and uploads `CITRUS_WORLD/dist`. Pages continues to serve the same application URL.
- C005 is checkpointed at `5c6cd4075401526599f4f74c266f1a70549e7759` on `checkpoint/c005-before-c006`. Implementation must preserve that work and recheck for later edits before moving shared files. Publication of these planning artifacts is authorized; applying the structural migration remains a separate step.
