# Shared asset contract

This contract is the interface between C001 setup, C002 world, C003 character, and C004 integration.

## Coordinates and exports

- Runtime uses right-handed coordinates (`scene.useRightHandedSystem = true`), meters, Y up, and X/Z ground plane. Ground height is `y = 0`.
- Blender authors in meters, Z up. Standard glTF export converts Blender `(x, y, z)` to runtime `(x, z, -y)`. Do not rotate or scale the imported root to compensate again.
- GLB is self-contained glTF 2.0 with embedded materials. Use principled materials and simple geometry. No external textures or runtime file dependencies.
- World origin is its ground center. Main walkable island occupies approximately X/Z `[-5, 5]`. Decorative cliffs can extend below zero; the navigable surface stays at zero.
- Character origin is centered between its feet at ground level, approximately 1 meter high, facing runtime +Z (Blender -Y). Apply authoring scale before export. No code-side art offsets.
- Character exports looping, in-place animation clips named exactly `Idle` and `Walk`; no root motion. Export both clips and preserve names. Document durations and meshes in its handoff.

## Ownership and paths

| Change | Owned authoring paths | Runtime outputs |
| --- | --- | --- |
| C002 world | `assets/blender/world/`, `docs/coordination/C002-world.md` | `public/assets/world/world.glb`, `public/assets/world/world.navigation.json` |
| C003 character | `assets/blender/character/`, `docs/coordination/C003-character.md` | `public/assets/character/character.glb` |
| C004 integration | `src/`, integration tests and integration docs | Browser game |

World entry script is `assets/blender/world/create_world.py`; character entry script is `assets/blender/character/create_character.py`. Each determines the repo root from `__file__`, starts from a clean scene, uses a fixed random seed, saves its `.blend` into its own authoring folder, and exports to its owned runtime folder. Source scripts and `.blend` files are committed; `.blend1` backups and `.local/` tools/references are ignored. Reference input images are not published.

Run authoring with `npm run blender -- --background --factory-startup --python assets/blender/world/create_world.py` (replace with the character path as needed). Independent background Blender processes are safe with these disjoint outputs. Assets must not require the interactive MCP server to rebuild.

## Navigation JSON version 1

All coordinates are runtime X/Z meters, not Blender coordinates. C002 supplies a file matching this example:

```json
{
  "version": 1,
  "groundY": 0,
  "bounds": { "minX": -4.5, "maxX": 4.5, "minZ": -4.5, "maxZ": 4.5 },
  "walkablePolygon": [[-4,-4],[4,-4],[4,4],[-4,4]],
  "spawn": { "x": 0, "z": 0 },
  "characterRadius": 0.25,
  "obstacles": [
    { "id": "cottage", "type": "box", "minX": -3, "maxX": -1, "minZ": -2, "maxZ": 0 },
    { "id": "tree", "type": "circle", "x": 2, "z": 2, "radius": 0.5 }
  ]
}
```

`walkablePolygon` is one simple non-self-intersecting perimeter polygon, points listed in order. It is required and encloses only safe terrain. `bounds` encloses the polygon. Obstacles are axis-aligned boxes or circles, describing visible solid structures, water and unsafe terrain inside the polygon. The spawn is walkable with clearance for `characterRadius`. C004 must enforce both the perimeter and obstacle clearance, and clamp movement to groundY. C002 should leave connected routes and generous space around spawn; avoid a bridge requiring multiple ground heights.

## Handoff checks

Each asset owner records build command, Blender version, outputs and sizes, mesh/animation names, bounds, preview image path, and visual verification in its coordination file. Export GLB and navigation together for the world. Keep previews in the owned folder. The integration owner verifies imported scale, feet placement, orientation, animation clips and actual movement in the browser.
