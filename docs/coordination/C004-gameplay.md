# C004 gameplay handoff

Verified 2026-09-06. Change: `c004-gameplay-integration`. Proposal, specification, design and tasks were completed before the authorized apply phase.

## Delivered behavior

Little Citrus loads the final C002 world and C003 orange character in a right-handed Babylon scene, with no art scaling or corrective root rotation. A gameplay parent supplies world translation and travel yaw. The character remains at navigation groundY=0; actual displacement selects looping Idle/Walk clips.

WASD and the analog joystick produce normalized, camera-relative movement at 2m/s. Collision uses perimeter segment clearance, circle/box clearance and substepped sliding (at most 4cm per substep). Long frames are capped at 100ms. The camera target stays exactly [0,0,0], initial alpha/beta/radius are 0.96/0.96/26.5, radius limits are 12–27m, and tilt is bounded. Left drag and touch drag orbit; wheel and +/− zoom; ↺ restores the view. Pointer ownership prevents joystick gestures from reaching the camera, including concurrent touch pointers.

The 9:16 frame fits width and dynamic viewport height with phone safe-area padding, desktop/landscape letterboxing, restrained pastel styling and a cream joystick footer. Loading and retry states cover startup failure. WebGPU is preferred with the existing WebGL fallback. No new project dependencies or UI library were added.

## Exact asset inputs

- C002 source commit: `4f4004f4100c64eb0c5eac947c97585de175541e`; world GLB SHA256 `FA6D88A102B6AAB9FE5CE7B931E97A4130CC70226BA32A92C4D723DB84A13D5E`.
- C003 source commit: `318de87a424a0970239d6d23b9e42e9d2f43b2bc`; character GLB SHA256 `26264CCA4C048487885048EA7BBFE2A43D9C3DE523795B03BA456F8A8FD76EBA`.
- Runtime URLs: `assets/world/world.glb`, `assets/world/world.navigation.json`, `assets/character/character.glb`, relative to Vite BASE_URL.
- Safe spawn X=-1.6, Y=0, Z=2.8; radius 0.25m. World renders 39 authored meshes plus the imported root. Character clips are exactly Idle and Walk.

Assets were copied for local integration testing but excluded from the C004 commit. C002/C003 retain ownership of authoring files and public asset outputs.

## Automated verification

- `npm run check`: 14 tests pass across renderer selection and gameplay; TypeScript and production Vite build pass. The build reports a nonfatal Babylon bundle-size advisory.
- `openspec validate --all --strict`: pass for the changes present in this worktree.
- Regression test covers Babylon Vector3 accessor coordinates so movement never relies on object spread to copy x/z.
- Navigation tests cover frame-rate equivalence, polygon/box/circle clearance, concave and diagonal boundaries, long-frame thin-obstacle tunneling, safe spawn validation and wall sliding.

## Real-browser acceptance

Chromium on Windows, Babylon 9.25 WebGPU. `tests/gameplay.browser.cjs` drives actual keyboard, mouse and CDP touch input, and reads the development-only `window.__littleCitrus.snapshot()` for precise assertions. No gameplay mutation is exposed by that hook, and it is absent from production builds.

- Held W moved 0.9992m in approximately 500ms; Walk was running during movement and Idle resumed after release. The character visibly faced travel, with feet on the ground.
- Actual left drag changed alpha from 0.96 to 1.555 and beta from 0.96 to 0.81; target remained [0,0,0]. Wheel clamped at 12 and 27. Zoom buttons and reset worked.
- Real touch joystick moved 0.7332m and played Walk without changing camera angle. A second joystick pointer could not take ownership. A simultaneous world pointer orbited while joystick input remained active.
- Touch release/cancel cleared input and returned to Idle. Resize cleared held movement. Switching to another actual browser tab cleared movement through blur, then returning preserved Idle. The test disables Playwright's forced-focus emulation for this check.
- 1280×960 desktop: frame 526.5×936; 390×844 portrait: approximately 390.22×693.72; 320×568 narrow: 319.5×568; 844×390 landscape: approximately 206×366.22. All fit with no page overflow; a one-pixel tolerance accommodates fractional Windows viewport rounding.
- Browser console errors: zero in the complete acceptance run. Final scene screenshots were visually inspected for full-island framing, character visibility, stream/bridge surfaces and UI fit.
- Coordinator independently inspected actual left drag, wheel zoom, reset and 320×568 portrait using a separate browser session; its warning/error log was empty.

This is browser viewport/touch emulation, not physical Android/iOS device coverage.

## Reproduce

Start `npm run dev -- --port 5175`, or open whichever localhost port Vite prints. Then, from the repository root:

```powershell
New-Item -ItemType Directory -Force output/playwright | Out-Null
npx --yes --package @playwright/cli playwright-cli -s=c004 open http://127.0.0.1:5175 --headed
npx --yes --package @playwright/cli playwright-cli -s=c004 run-code --filename tests/gameplay.browser.cjs --raw
```

The script uses the opened page URL, so another port is supported. It writes four viewport captures and `output/playwright/c004-portrait.png`. Checked-in review images are `docs/images/c004-portrait.png` and `docs/images/c004-desktop.png`. Runtime QA was served on loopback port 5175 because neighboring task servers occupied other development ports.

## Integration ownership

C004 owns `src/main.ts`, `src/style.css`, `src/controls.ts`, `src/navigation.ts`, `index.html`, `tests/gameplay.test.ts`, `tests/gameplay.browser.cjs`, README updates, `docs/images/c004-*.png`, this handoff and `openspec/changes/c004-gameplay-integration/`.

Worktree: `C:/Users/srive/.codex/worktrees/cc2a/babylon-lite-astra-blender-demo`. Coordinator receives the additive C004 commit SHA after commit. C004 does not push. Preserve the newer C001 configuration/scripts and C002/C003 asset commits during integration; publish only to the explicit new repository destination, never the inherited template origin.
