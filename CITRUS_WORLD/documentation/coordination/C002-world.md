# C002 world handoff

> Historical record from before C006: command paths and measurements below retain their original context. For current commands, use `CITRUS_WORLD/` as the application working directory and `documentation/` in place of `docs/`. See [C006 migration](../coordination/C006-structure.md).

Verified 2026-09-06 using Blender 5.2.1 LTS. Change: `c002-floating-village-world`.

## Original C002 delivery (before the C005 extension below)

- `assets/blender/world/create_world.py`: deterministic file-relative world builder (seed 2206).
- `assets/blender/world/verify_world.py`: independent source reopen, export import and navigation verification.
- `assets/blender/world/world.blend`: editable source with 634 individually named meshes, studio lights and preview camera.
- `assets/blender/world/world.preview.png`: final 1100 x 1100 Cycles preview, visually inspected.
- `assets/blender/world/world.validation.json`: measured bounds, counts, full mesh names and checks.
- `public/assets/world/world.glb`: 1,015,156 bytes, 15,215 triangles, 39 meshes and 39 simple PBR materials. No images, textures, cameras, lights, animation clips or external dependencies in GLB.
- `public/assets/world/world.navigation.json`: version 1, 19 obstacles, radius 0.25m.

Measured delivery sizes: builder 21,097 bytes; verifier 5,788 bytes; `.blend` 410,294 bytes; preview 1,401,933 bytes; validation JSON 1,897 bytes; navigation JSON 3,143 bytes. GLB size is listed above.

## Rebuild and verify

From repository root in PowerShell:

```powershell
& 'D:/SteamLibrary/steamapps/common/Blender/blender.exe' --background --factory-startup --python-exit-code 1 --python assets/blender/world/create_world.py
& 'D:/SteamLibrary/steamapps/common/Blender/blender.exe' --background --factory-startup --python-exit-code 1 --python assets/blender/world/verify_world.py
openspec.cmd validate c002-floating-village-world --strict
```

Once C001 is integrated, its documented wrapper is also supported:
`npm run blender -- --background --factory-startup --python assets/blender/world/create_world.py`.
The source reference is not included or required. Each build starts a clean scene and writes only world outputs. Factory Blender emitted nonfatal brush-library path warnings and a blocked OS thumbnail-cache write; the actual source, preview, GLB and verification all completed successfully.

## Coordinates and integration

Runtime is right-handed, meters, Y-up, with `scene.useRightHandedSystem = true` set before import. Blender `(x,y,z)` converts once to runtime `(x,z,-y)` during standard export. Import with no corrective root rotation, scaling or art offset.

The chamfered island walkable perimeter spans X/Z [-5,5]. Grass and all twelve bridge planks have top Y=0. Path stones are visual inlays with a 3mm anti-coplanarity offset; movement stays at Y=0. Grass seams are 1mm visual accents. Navigation uses the full perimeter, inflates solid obstacles by the character radius, and excludes both water segments and bridge side rails. Stream is X [0.05,1.15]; bridge crosses east/west at Z=1.4. Spawn is **X=-1.6, Z=2.8, Y=0**. Keep the camera target fixed at world center; the source preview looks from runtime (12,17) at height 13 toward (0,0) at height 1.

Measured complete artwork bounds (including foliage, pennant, foam and underside):

| Runtime axis | Minimum | Maximum |
| --- | ---: | ---: |
| X | -5.224395 | 5.025000 |
| Y | -2.060000 | 5.200000 |
| Z | -5.127077 | 5.127077 |

Export node and mesh names use `World_<material>`: BlossomLight, BlossomPink, Brass, CliffLavender, CliffWarm, CreamPlaster, FlowerGold, FlowerPink, FlowerWhite, Foam, GrassLight, GrassMoss, GrassSage, IvoryTrim, LeafDark, LeafPale, LeafSeafoam, Mint, MintLight, MintShade, Rock, RockLight, RoofBlush, RoofEdge, RoofPink, RoofRose, SoilLight, SoilRose, Stem, Timber, TimberDark, TowerLavender, TowerShade, Water, WaterLight, WindowBlue, WindowGlow, WoodHoney, WoodLight. Source object names retain architectural detail for editing.

## Acceptance evidence

- Three real renders inspected. Final preview shows recognizable shingled pink cottage, mint tower, blossom and pear trees, conifers, window planter, arched doors, lantern, stream, flush bridge, waterfall, flowers, mushrooms, rocks and cliff strata. Coplanar black artifacts at paths and bridge were corrected; the hidden stream was uncovered by lowering its foundation.
- Saved `.blend` reopened successfully; GLB reimport reproduced all source bounds within 0.0001m. Applied mesh scale and meter units verified.
- GLB header, embedded buffers, simple PBR materials, absence of external textures, 60,000-triangle and 8MB budgets verified.
- Convex simple ordered perimeter, schema keys, unique obstacle IDs and radius-aware spawn clearance verified.
- At 0.1m spacing all **4,540** safe samples are reachable from spawn after radius inflation. Every sample has actual ground support checked against source mesh raycasts. Both banks and bridge share Y=0. Explicit bridge route points pass clearance checks.
- `openspec validate c002-floating-village-world --strict` passes. Browser camera, lighting, character scale and actual controller behavior remain C004 integration acceptance.

No common source, README, package, lockfile, configuration or C001 content is part of this delivery. The temporary ignored OpenSpec config copy only bootstrapped the CLI in the template worktree.
# C005 VFX export extension — 2026-09-06

The world now exports 61 meshes, including 21 independent foliage units, six water meshes in three surface groups, and a `VFX_Chimney` transform node. Rest composition and 15,215 triangles are unchanged. GLB size is 1,319,756 bytes; all 39 materials remain embedded and texture images remain absent. Exact bindings are in `docs/asset-contract.md`.

Rebuilt with `npm run blender -- --background --factory-startup --python assets/blender/world/create_world.py` using Blender 5.2.1 LTS, then verified with `npm run blender -- --background --factory-startup --python assets/blender/world/verify_world.py`. Both completed successfully. The new verifier passes UV/binding checks, all 21 pivots, chimney-opening alignment, and bidirectional source/export vertex equivalence, alongside the existing 4,540 safe navigation samples and geometry/budget checks. The regenerated `.blend`, preview, GLB, and `world.validation.json` are the delivery artifacts.

Navigation SHA256 before and after rebuilding: `D07409DC542ADE666D4036C268A6E1CDD684B24A2DBBE31C1D3A2E33E4EAF0B2`. Runtime bounds remain unchanged. See `C005-vfx.md` for runtime effect and browser evidence once integration is complete.
