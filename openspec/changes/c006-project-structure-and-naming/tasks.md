## 1. Preserve the migration baseline

- [ ] 1.1 C006 Establish the baseline from C005 checkpoint `5c6cd40`, recheck subsequent edits and coordinate active writers; inventory tracked, modified and untracked project files, both planning trees and unique local evidence, verifying source paths, destination paths and content hashes without collecting secrets.
- [ ] 1.2 C006 Check every proposed move stays within the workspace and preflight documentation/planning collisions; verify distinct destination content will be preserved and record the resolution mapping in the migration handoff.

## 2. Establish the application directory

- [ ] 2.1 C006 Rename `PROJECT_NAME/` to `CITRUS_WORLD/` and relocate `src/`, `tests/`, `scripts/`, `public/`, `assets/`, both package files, `index.html`, `tsconfig.json` and `vite.config.ts`; verify the expected tree and preserved hashes, including current C005 files and Blender binaries.
- [ ] 2.2 C006 Merge `docs/` into `CITRUS_WORLD/documentation/` preserving subdirectories and template images; verify the inventory contains every source document and no separate tracked root docs/documentation tree remains.
- [ ] 2.3 C006 Install dependencies in the nested package, retain package identity and pinned versions, and scope generated build/test/local-tool outputs beneath the app; verify `npm --prefix CITRUS_WORLD ci` and `npm --prefix CITRUS_WORLD run check` pass, with unique prior local evidence preserved and generated output ignored.

## 3. Consolidate OpenSpec

- [ ] 3.1 C006 Preserve the inherited hidden tree under `.openspec/history/template/`, then move active Citrus config, changes and specs into `.openspec/`; verify template hashes and that all current Citrus change IDs, artifacts and task checkbox states survive, including C006 itself.
- [ ] 3.2 C006 Add the local OpenSpec launcher, npm `spec` command and routed `spec:validate`, with a persistent ignored alias, local configuration and preserved CLI output/exit status; verify Windows junction and Linux symlink fixture tests cover first creation, reuse, concurrent creation, child failure and wrong-target/broken-alias/real-directory refusal without changing target contents.
- [ ] 3.3 C006 Update active planning config, root agent guidance and local skill command examples for canonical `.openspec/`, launcher use and the local shortcut; verify root and nested-package context/list/status/instructions/strict validation resolve Citrus planning, exclude template history, preserve the valid alias after success/failure and track only canonical paths.

## 4. Update consumers of project paths

- [ ] 4.1 C006 Update the root MCP launcher path and setup guidance, audit Node/Python/Blender root derivation and recreate the app-local pinned MCP environment; verify Steam Blender can load the preserved world and character files in background mode and the dedicated loopback MCP connection returns a read-only scene query with telemetry disabled.
- [ ] 4.2 C006 Update CI and manual Pages workflow working directories, npm cache lockfile and artifact paths; verify workflows reference `CITRUS_WORLD/package-lock.json` and `CITRUS_WORLD/dist`, run the nested checks, and preserve the existing deployment URL and trigger behavior.
- [ ] 4.3 C006 Update README, active asset/toolchain contracts and documentation links/commands for the final structure; verify linked files exist with exact casing, README retains one actual gameplay screenshot, and historical evidence remains distinguishable from current instructions.

## 5. Verify the integrated migration

- [ ] 5.1 C006 Run the nested package check and strict canonical OpenSpec validation after all path edits; verify both succeed, binary/navigation hashes match the baseline, and a Linux CI run passes before declaring cross-platform verification complete.
- [ ] 5.2 C006 Run the built preview in dedicated installed Chrome and Edge test sessions; verify GLB/navigation loads, portrait fit and centering, existing keyboard/joystick movement and camera controls, with no new console errors, then restore and verify original viewport/input state in `finally` and record the exact browser surfaces.
- [ ] 5.3 C006 Deliver `CITRUS_WORLD/documentation/coordination/C006-structure.md` with path/hash mapping, commands/results and any pre-existing failures; verify the final diff preserves unrelated C005 edits, contains no local runtime or secrets, and leaves only canonical tracked project/documentation/planning locations.

## 6. Sequencing and parallel work

Tasks in sections 1-3 share paths and must run sequentially. Once the new application and planning homes are stable, Blender/MCP work (4.1), workflow updates (4.2), and documentation updates (4.3) can proceed independently with disjoint file ownership. Section 5 follows all three. Independent read-only OpenSpec commands may share the persistent alias; coordinate commands that mutate the same planning files. Do not move files while another task is editing them. This checklist identifies parallel work; it does not launch additional tasks during proposal creation.
