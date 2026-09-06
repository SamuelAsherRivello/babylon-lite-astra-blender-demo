## Why

The portrait village demo needs a readable, charming player asset with animation that the C004 controller can drive directly. An original Blender-authored orange character supplies that identity while keeping mobile rendering and repeatable authoring simple.

## What Changes

- Create an original round orange character with large expressive eyes, eyebrows, freckles, a stem, green leaf and chunky red boots.
- Deliver deterministic Blender source, editable scene, inspected preview and self-contained GLB at the shared contract paths.
- Export exactly named looping in-place `Idle` and `Walk` clips, with a stable ground origin and no runtime art corrections.
- Record dimensions, orientation, animation sampling and reopen checks in the C003 handoff.

## Capabilities

### New Capabilities

- `orange-character-asset`: Reproducible, attractive animated character asset conforming to the shared scene interface.

### Modified Capabilities

None.

## Impact

Owns only `assets/blender/character/`, `public/assets/character/character.glb`, this C003 change and `docs/coordination/C003-character.md`. Uses installed Blender 5.2.1 and its built-in glTF exporter, without new runtime dependencies. C004 owns controls and browser integration; C001 setup and C002 world remain independently owned. Current worktree is a template; the coordinator's current asset contract is authoritative and inherited `.openspec/` wallet content is unrelated.
