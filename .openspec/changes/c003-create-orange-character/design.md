## Context

The current worktree contains a template. The coordinator's current `docs/asset-contract.md` fixes axes, filenames and animation names. See proposal.md for motivation. Blender 5.2.1 is installed at the user-supplied executable path. No existing character or current project main specs exist here.

## Goals / Non-Goals

**Goals:** Crisp silhouette and face at small scale, repeatable procedural authoring, predictable animation exports and evidence that C004 can import directly.

**Non-Goals:** Controller code, world assets, setup files, global configuration, photoreal textures or publication of input reference art.

## Decisions

- Author a softly faceted mandarin body with broad ivory eyes, warm dark pupils, curved brows, freckles and a small smile. Add a curved stem, folded leaf and sculpted scarlet boots with darker soles and cuffs. Geometry and principled material colors export without texture dependencies; detailed image textures would add size and reduce reproducibility.
- Use a small rigid-part armature for body, boots and leaf. Assign each vertex to one bone, keeping facial parts attached to the body. Two armature actions export cleanly as named clips and permit one combined mesh, reducing draw overhead versus many animated objects. Soft body deformation is unnecessary for the stylized character.
- Author Blender -Y as front and export with standard Y-up conversion. Keep the armature at identity and all geometry in meters. Boot lift uses nonnegative animation and body bobbing stays within leg clearance.
- Use a 2-second Idle with gentle breathing/leaf motion and a 0.8-second Walk with alternating boot swing and body sway. Duplicate endpoint poses and sample intermediate frames. The root is never keyed; C004 supplies translation.
- Save editable scene with preview camera/lights but export only character meshes and rig. Render front three-quarter preview, reopen the file and independently inspect GLB JSON and sampled transforms. Keep verification in the owned source folder.

## Risks / Trade-offs

- [Action exporter naming or filtering changes] → Inspect actual exported animation names and time ranges; fail the build if incorrect.
- [Boot intersections or ground penetration] → Sample evaluated vertex bounds throughout both actions before export.
- [Face readability varies with runtime lighting] → Use large contrasting features, modest roughness and inspect a real render; C004 verifies browser lighting.
- [Rigid animation has a toy-like gait] → Deliberately embrace the chunky boots and small body bob while preserving the stable origin.

## Migration Plan

Deliver an additive commit containing only assigned paths. C004 consumes the GLB at the fixed URL. Correct future asset issues with additional commits, preserving history. No setup migrations are required.
