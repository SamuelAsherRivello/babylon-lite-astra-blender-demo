## 1. Authoring

- [x] 1.1 C002 Create deterministic world script and complete village composition; verify a real Blender render includes every requested element. Evidence: final world.preview.png viewed after three render iterations; stream, path, bridge and bank artifacts resolved.
- [x] 1.2 C002 Save source scene and export embedded-material GLB; verify reopen, mesh counts, bounds, scale and mobile budget. Evidence: verify_world.py passes; 634 source meshes, 39 export meshes, 15,215 triangles, 1,015,156-byte GLB, matching reimport bounds.

## 2. Navigation and handoff

- [x] 2.1 C002 Export aligned version 1 navigation; verify polygon, spawn radius clearance, bridge ground height and connected safe routes. Evidence: all 4,540 radius-safe 0.1m samples connected and supported by ground raycasts; bridge and banks top Y=0; 19 obstacles.
- [x] 2.2 C002 Record exact delivery paths, sizes, commands and validation evidence in handoff; verify strict OpenSpec validation and commit only owned paths. Evidence: C002-world.md records delivery and checks; strict validation and staged diff check pass; the additive delivery contains only the 13 owned files.
