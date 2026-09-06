## Context

See `proposal.md` for motivation and scope. This migration crosses npm, Vite, Blender, MCP, browser tooling, CI and planning discovery.

The current application is rooted beside repository metadata. `PROJECT_NAME/documentation/` contains the attribution banner and template screenshot; root `docs/` contains the actual asset contract, gameplay screenshot and coordination records. C005 assets, runtime files, tests and documentation are now checkpointed at `5c6cd4075401526599f4f74c266f1a70549e7759` on `checkpoint/c005-before-c006`; preserve that baseline and any subsequent edits during migration.

`openspec/` holds Citrus changes C001-C005 and C006; its main specs directory is empty. Existing `.openspec/` holds unrelated wallet template material. Its `setup.ps1` already creates an `openspec` junction/symlink because the installed OpenSpec 1.12.0 hardcodes that directory (`dist/core/config.js` and `dist/utils/change-utils.js`). The current config's statement that hidden planning is template-only is superseded by this approved structure decision.

## Goals / Non-Goals

**Goals:** A self-contained application directory, preserved working files and attribution, one canonical planning store, working commands from a fresh checkout on Windows and Linux, and unchanged public runtime paths.

**Non-Goals:** Dependency upgrades, package/repository renaming, asset redesign, new gameplay, changing Steam Blender or global tool configuration, and application deployment. Publishing the finished planning artifacts to `main` is authorized separately from applying the migration.

## Decisions

### 1. One nested application package

Use this final tracked layout:

```text
/
  README.md, LICENSE, AGENTS.md, .gitignore
  .github/
  .agents/
  .codex/config.toml
  .openspec/
    config.yaml
    changes/                  # all Citrus changes, including C006
    specs/                    # Citrus main specs
    history/template/         # preserved inherited planning tree
  CITRUS_WORLD/
    package.json, package-lock.json
    index.html, tsconfig.json, vite.config.ts
    src/
    tests/
    scripts/
    public/assets/
    assets/blender/
    documentation/
      images/gameplay.png
      coordination/
      samuel-asher-rivello-banner.png
      screenshot01.png        # historical template screenshot
      ...                    # existing docs and provenance
```

Retain lowercase internal names; `CITRUS_WORLD` is the requested project folder name. Retain npm package name `babylon-lite-astra-blender-demo`. A root proxy package or workspace would add a second command surface for a single app, so use the single relocated manifest instead.

From the repository root use `npm --prefix CITRUS_WORLD ci`, `npm --prefix CITRUS_WORLD run dev`, and `npm --prefix CITRUS_WORLD run check`. After `cd CITRUS_WORLD`, use the existing short npm commands. Vite's root is the application directory; `public/assets/...` still publishes as `assets/...` and `base: './'` remains unchanged. Development stays on loopback with existing port defaults.

### 2. Merge documentation without flattening or overwriting

Rename the placeholder project directory, then merge `docs/` contents into its `documentation/`. Preserve subdirectories, image bytes and provenance. If destination files collide, compare content first and retain both distinct files with an explicit mapping; never overwrite silently. Update root README banner, gameplay image and documentation links. Keep one actual gameplay screenshot in README.

Update current command instructions, contracts and source links. Historical recorded commands, commit IDs and measurement results retain their original meaning; add a migration mapping where needed rather than presenting old commands as newly executed evidence. Record the mapping and verification in `CITRUS_WORLD/documentation/coordination/C006-structure.md`.

### 3. Consolidate planning and adapt discovery locally

First preserve the entire inherited `.openspec/` tree byte-for-byte beneath `.openspec/history/template/`, including its config, setup script, changes, specs and archives. Move active Citrus config, changes and specs into canonical `.openspec/`; update its context and C006 task-ID guidance. Template material must not be listed or validated as active Citrus requirements. Keep a path/hash inventory in the migration evidence. Do not renumber, reset checkboxes or archive completed Citrus changes as part of a folder move.

Add a small `CITRUS_WORLD/scripts/openspec.mjs` launcher, using the installed pinned CLI without modifying `node_modules` or global registrations. Derive the repository and application roots from the script location. Provide `npm --prefix CITRUS_WORLD run spec -- <arguments>` and route `spec:validate` through it.

The user selected a persistent, ignored repository-root `openspec` directory alias pointing exactly to `.openspec`: a Windows junction or Linux directory symlink. The launcher creates it when absent and verifies its target before use. Refuse any real directory, broken alias or alias with another target without changing it. If another invocation creates the alias first, revalidate that it points to the expected directory and continue. Forward arguments to the local CLI with repository-root cwd, telemetry disabled and configuration/cache directories under the app's ignored `.local/`. Preserve CLI output, exit status and errors.

Leave the alias in place on success, failure and process termination. No temporary-alias lifecycle, command lock, stale-lock recovery or output-path rewriting is needed. Returned `openspec/` paths remain usable because they resolve to the canonical files; authoring guidance and published links use `.openspec/`. Ignore `/openspec` so the alias cannot enter Git. GitHub shows only `.openspec/`; local file explorers may also show the shortcut. Verify both paths resolve to the same content and only the canonical paths are tracked.

Update repository agent guidance and local OpenSpec skill command examples to use the launcher and explain the alias-to-canonical path mapping. The inherited setup script remains historical; current setup instructions use the launcher and project-local settings. This follows the template's existing compatibility mechanism. The temporary-alias alternative was rejected during the interview because it adds lifecycle coordination and path translation solely to hide the local shortcut between commands.

### 4. Resolve tooling relative to the new application home

Node launchers and Python setup already derive their root from their script location. Blender scripts use their own authoring directory to find `public/assets`; moving the subtree together should preserve these relationships. Audit each derivation before changing it; avoid adding an extra parent traversal merely because the repository root moved.

Update root `.codex/config.toml` to `CITRUS_WORLD/scripts/blender-mcp-server.mjs` and its setup comment. Keep launcher cwd and local environment under the application home. Recreate the MCP virtual environment with the existing pinned setup at `CITRUS_WORLD/.local/blender-mcp`; a moved virtual environment can contain absolute paths. Preserve disabled telemetry, checksum verification, enabled-tool allowlist and loopback transport. Never commit local tooling or input references.

Install npm dependencies fresh under `CITRUS_WORLD/node_modules`. Generate new build and test output under its `dist/` and `output/`. Inventory old ignored root output and local runtimes; preserve unique evidence/references, and retire only confirmed disposable task-owned files after processes release them. Do not blindly move live caches or virtual environments. These generated directories are not part of the tracked migration.

### 5. Keep build and deployment contracts aligned

Set workflow run-step working directories to `CITRUS_WORLD`, setup-node `cache-dependency-path` to `CITRUS_WORLD/package-lock.json`, and upload paths to `CITRUS_WORLD/dist`. Action paths resolve from repository root, independently of run-step defaults. Preserve manual-only Pages deployment and its URL. CI's spec validation invokes the wrapper from the nested package and must validate canonical Citrus planning without including the template history.

## Risks / Trade-offs

- Writes during a move → recheck the C005 checkpoint and later changes, coordinate active writers, inventory dirty/untracked files and recheck hashes after relocation. Preserve unrelated edits; never use Git reset, restore or clean.
- Case-sensitive CI exposes Windows-tolerated paths → use exact casing in links, configuration and workflow paths, and validate in Linux CI.
- Local file explorers show two names for the same planning store → document the shortcut, verify its target before CLI use, and keep it ignored so only `.openspec/` is published.
- Blender or MCP retain old paths → rebuild local environments and verify both background asset loading and a read-only MCP scene query after relaunching the dedicated project process.
- A folder move accidentally changes exports or presentation → preserve binary hashes; run existing tests and preview smoke checks without regenerating assets merely to relocate them.

## Migration Plan

1. Capture file/hash inventories against the C005 checkpoint and coordinate any active writers. Check source/destination paths resolve inside this workspace before moving anything.
2. Relocate application and merge documentation; keep runtime/package changes separate from unrelated C005 content in review.
3. Preserve template planning, consolidate Citrus planning, and add the compatibility launcher with focused alias validation and idempotency tests.
4. Update active references, MCP configuration, workflow paths and generated-output handling. Install dependencies in the application home.
5. Run nested npm checks, launcher `context`, `list`, `status`, artifact instructions and strict validation from root and app directories. Confirm returned paths resolve to canonical `.openspec` files, all Citrus changes remain present, the alias remains usable, and only canonical paths are tracked.
6. Verify GLB/navigation hashes, background Blender file loading and a read-only MCP scene query. Run dedicated Chrome and Edge preview checks for asset loading, portrait fit and horizontal centering, existing movement/camera behavior and absence of console errors. Restore the exact original viewport/inputs in `finally`; record browser surfaces and cleanup verification.
7. Review path inventory, ignore rules and active links. Record commands, results and any pre-existing failures. A later publication uses normal additive commits and non-force push only when requested.

Recovery is an additive corrective change or collision-checked reverse path mapping, preserving any edits made since migration. Do not rewrite Git history or discard local files. Keep the current public deployment until the migrated build has passed verification and publication is requested.
