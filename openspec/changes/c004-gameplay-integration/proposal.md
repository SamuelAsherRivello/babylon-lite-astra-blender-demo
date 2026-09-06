## Why

The setup cube cannot demonstrate the authored village or character. C004 joins the independent asset deliveries into a small, polished, playable portrait scene.

## What Changes

- Load the C002 world and navigation and C003 character with Idle/Walk clips using the shared asset contract.
- Add a viewport-fitted 9:16 pastel frame, safe-area spacing, thumb joystick, keyboard movement and bounded mouse-wheel zoom.
- Enforce camera-relative continuous movement, safe terrain clearance, and a fixed-center orbit camera.
- Add reproducible control/navigation tests and real-browser desktop/mobile acceptance evidence.

## Capabilities

### New Capabilities
- `portrait-gameplay`: Authored scene presentation, player navigation, independent fixed-center camera, and resilient touch/keyboard controls.

### Modified Capabilities

None.

## Impact

Release revision: the user-approved minimal interface uses the Citrus World title and joystick instructions. Separate zoom/reset buttons and decorative copy were removed; touch dragging still orbits the scene.

Owns src, index.html, integration tests, README screenshot/documentation and C004 coordination records. Reuses approved Babylon, TypeScript, Vite and Vitest dependencies. Asset source/output ownership stays with C002/C003; setup scripts stay with C001. Final integration depends on their verified outputs.
