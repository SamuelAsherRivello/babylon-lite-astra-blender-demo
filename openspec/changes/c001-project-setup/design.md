## Context

See proposal.md. Template commit `54c4b860db322db9d2a3136f3146e2c7bef5bac7` has a README, MIT license, creator art, inherited wallet `.openspec/` content and a workflow targeting a nonexistent wallet package. The active project is empty of application code. Node 26.7.0, npm 11.19.0, uv and GitHub CLI are available. Blender was absent from PATH and the standard installation directory.

## Goals / Non-Goals

**Goals:** Establish independently usable browser and deterministic asset authoring foundations, with a public baseline from which C002 and C003 can branch.

**Non-Goals:** World art, mascot art, controller/gameplay, or publishing a live site during C001.

## Decisions

- Use Babylon core and loaders 9.25.0, TypeScript 7.0.2, Vite 8.2.2, Vitest 5.0.0, and OpenSpec 1.12.0, verified from npm. Pin direct versions and commit npm's lockfile. Native DOM/CSS avoids a UI framework. Node 24.12+ is the documented baseline.
- A tiny injectable engine selection helper tests unsupported WebGPU, initialization failure and successful selection without GPU dependence. Browser smoke verification confirms actual rendering. The shell reports renderer and handles fatal startup errors.
- Use `scene.useRightHandedSystem = true` and standard Blender glTF export. The full downstream interface is `docs/asset-contract.md`; world and character have disjoint source/output paths.
- Use the user's installed Steam Blender 5.2.1 LTS (`D:/SteamLibrary/steamapps/common/Blender/blender.exe`, build `9e2066aef7ef`). Discover `BLENDER_PATH`, PATH, Steam or project-local installs without global changes. A portable download completed before Steam discovery; it remains ignored and unused. Background scripts use factory startup. MCP is optional for batch exports.
- Choose MIT `ahujasid/blender-mcp` pinned to commit `c5f35d9cc54451d785ac4c00c48bf9e98a2e8db9`. It provides sufficient scene inspection and Python execution. RFingAdam/mcp-blender was considered and not selected. Install source/addon and Python environment locally, set `DISABLE_TELEMETRY=true`, and use localhost port 9876. Start addon in a dedicated Blender process with a project-local bootstrap script. The pinned upstream archive omits its imported telemetry config module; setup supplies a minimal disabled config with no endpoints or credentials. Verify that telemetry events and screenshot uploads are skipped.
- Use active `openspec/` without deleting unrelated inherited `.openspec/`; mark inherited material in provenance docs. Preserve template README section order, banner, attribution and license.
- Replace inherited deployment workflow with test/build CI and a manual-only Pages workflow targeting `dist`; C001 does not enable Pages or claim a demo URL.

## Risks / Trade-offs

- GPU adapter support differs across browsers → catch initialization errors and fall back; verify actual runtime plus deterministic unit tests.
- Blender download is large → install once in ignored local tools and share its absolute path with independent worktrees.
- MCP executes Python code → bind only to loopback, disable telemetry and use a dedicated Blender instance; no global registration.
- New dependency majors → exact lockfile and type/test/build checks before push.
- Template's hidden wallet planning may confuse readers → identify active root and provenance explicitly.

## Migration Plan

Write/validate planning first, apply setup, commit the verified browser baseline for asset tasks, then finish toolchain verification in an additive follow-up commit. Publish only normal commits to the requested repository. Fix forward through additional commits if needed.
