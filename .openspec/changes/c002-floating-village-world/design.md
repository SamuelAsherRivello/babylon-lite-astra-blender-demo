## Context

See proposal.md for motivation. The setup-root docs/asset-contract.md is authoritative: meters, right-handed Y-up GLB, ground Y=0, one perimeter and box/circle obstacles. The worktree initially contains the original template; inherited .openspec wallet planning is unrelated.

## Goals / Non-Goals

**Goals:** Detailed silhouette and small architectural accents, broad connected flat movement, deterministic rebuilding and a small mobile asset.

**Non-Goals:** Runtime camera, character, controls, water simulation and external textures belong outside this delivery.

## Decisions

- Compose a roughly 10m chamfered island with cottage on the west bank, tower on the east bank, and a north/south stream crossed by an east/west bridge. A level bridge avoids stairs and a height solver; rails remain outside its central route.
- Use low-poly bevels, faceted tree crowns, layered cliff strata, roof shingles, arched doors and framed windows. Simple principled materials keep the GLB self-contained; procedural textures and texture baking add unnecessary dependencies.
- Author with a helper mapping runtime X/Z and height to Blender X/-Y/Z. Standard glTF export performs the only conversion back to runtime. Export meshes only; the saved scene retains studio lights and an orthographic camera for preview.
- Derive navigation from the same structure dimensions used to build buildings, stream, bridge rails and tree trunks. Keep sparse flowers and flat path inlays decorative. Test inflated obstacles and perimeter with a 0.25m disk and flood-fill the safe area.
- Combine exported geometry by material to reduce draw calls while retaining descriptive source object names in the Blender file. Target fewer than 60,000 triangles and a GLB below 8MB.

## Risks / Trade-offs

- Overhead roof/crown overhang can obscure a character → keep architecture at the rear, clear spawn at the front, and generous circulation on both banks.
- Render lighting differs from runtime → use only embedded simple PBR colors and give C004 an unambiguous camera orientation and bounds; browser acceptance is C004's responsibility.
- Low-poly water is static → use opaque turquoise surface ribbons and foam geometry for a stable mobile export.

## Migration Plan

Add owned assets and handoff as an additive commit. C004 consumes the exact published filenames without applying extra rotation or art offsets. Corrections are subsequent additive commits; no history rewriting.
