## Context

The baseline is a single Babylon setup scene with engine fallback tests. C002/C003 own independent assets described in docs/asset-contract.md. See proposal.md for motivation.

## Goals / Non-Goals

**Goals:** Small pure modules for input vectors, collision and camera constraints, with native DOM controls and an asset-loading scene composition layer.

**Non-Goals:** Physics engine, multiplayer, procedural replacement assets, new UI dependencies, asset authoring changes, global tooling changes.

## Decisions

- Use pure X/Z navigation predicates with polygon segment clearance, expanded boxes and circles, and bounded movement substeps. A full physics engine adds complexity without helping a flat terrain contract.
- Use a custom pointer controller for orbit and joystick with pointer capture and explicit pointer ownership. Babylon default pointer inputs are excluded to prevent accidental pan and conflicting joystick gestures. A fixed target is reasserted with each camera update.
- Keep keyboard and joystick state separate and combine with magnitude clamping. Compute camera-relative travel from actual camera position; face runtime +Z using travel yaw and choose animation from actual displacement.
- Load GLBs as asset containers and preserve authoring roots. A separate character movement parent applies gameplay position/yaw only, with no art compensation.
- Fit the frame using both dynamic viewport height and width with safe-area outer padding. Use a cream/mint backdrop, restrained pink/orange accents and a translucent joystick footer.
- Expose read-only development QA snapshots for precise browser assertions while retaining real mouse, keyboard and touch interaction tests.

## Risks / Trade-offs

- [Final asset scale/composition uncertain until delivery] → Wait for verified assets and assess browser screenshots before acceptance.
- [Narrow aspect ratio makes island small] → Reserve most of the frame for the canvas and tune the default orbit distance after asset delivery.
- [Mobile devices vary] → Browser touch emulation and multiple viewport sizes are reproducible; physical-device coverage is reported separately.
- [Long frame movement can cross geometry] → Substep displacement and cap elapsed time after stalls.

## Migration Plan

Replace the setup view with integrated gameplay. Verify tests, production build, strict OpenSpec and browser acceptance before committing owned paths. Coordinator integrates assets and publishes by additive commits. No history rewriting is required.
