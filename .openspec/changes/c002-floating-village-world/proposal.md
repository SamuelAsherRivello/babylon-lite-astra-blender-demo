## Why

C002 supplies the original Blender village needed for the playable portrait demo. The initial template has no world assets; C001 owns setup while C004 will consume this independent, verifiable delivery.

## What Changes

- Author a pastel floating island with a detailed cream cottage, pink roof, mint tower, stream, waterfall, flush wooden bridge, trees, rocks and flowers.
- Deliver deterministic Blender source, saved scene, embedded-material GLB and rendered preview.
- Deliver version 1 navigation matching visible terrain, with a clear spawn and connected routes for a one-meter character of radius 0.25m.
- Record asset validation and integration guidance in the C002 handoff.

## Capabilities

### New Capabilities
- `floating-village-world`: Rebuildable world art and aligned safe navigation.

### Modified Capabilities
None.

## Impact

Owns only assets/blender/world/, public/assets/world/, docs/coordination/C002-world.md and this change. Uses installed Blender 5.2.1 LTS, no new runtime dependency. Consumes the current setup-root asset contract; does not modify C001 or C004. Reference inputs remain unpublished.
