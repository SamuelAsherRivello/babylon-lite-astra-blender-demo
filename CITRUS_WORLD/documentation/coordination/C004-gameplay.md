# C004 gameplay handoff

> Historical record from before C006: command paths and measurements below retain their original context. For current commands, use `CITRUS_WORLD/` as the application working directory and `documentation/` in place of `docs/`. See [C006 migration](../coordination/C006-structure.md).

Verified 2026-09-06. Change: `c004-gameplay-integration`. Proposal, specification, design and tasks were completed before the authorized apply phase.

## Delivered behavior

Citrus World loads the final C002 world and C003 orange character in a right-handed Babylon scene, with no art scaling or corrective root rotation. A gameplay parent supplies world translation and travel yaw. The character remains at navigation groundY=0; actual displacement selects looping Idle/Walk clips.

WASD and the analog joystick produce normalized, camera-relative movement at 2m/s. Collision uses perimeter segment clearance, circle/box clearance and substepped sliding (at most 4cm per substep). Long frames are capped at 100ms. The camera target stays exactly [0,0,0], initial alpha/beta/radius are 0.96/0.96/26.5, radius limits are 12–27m, and tilt is bounded. Left drag and touch drag orbit; mouse wheel zooms. The user-approved minimal release UI has no separate zoom/reset buttons. Pointer ownership prevents joystick gestures from reaching the camera, including concurrent touch pointers.

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

## Initial real-browser acceptance (before release UI simplification)

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

## Browser-session regression follow-up

The September 6 browser-size report prompted tests in installed Microsoft Edge 152.0.4191.66. Product CSS and camera scale were preserved. Edge passed centered, overflow-free layout at 1280×960, 390×844, 320×568, 844×390, 2560×1396 and 1030×602. The currently connected Chrome tab also had correctly centered natural bounds. The original screenshot's precise cause was not established from these checks.

A separate, confirmed QA defect was reproduced: the browser script left its responsive viewport override active after success or failure. The failing regression recorded original1030×602 becoming1280×960 after an interrupted assertion. The same regression passes after guaranteed cleanup, restoring1030×602. The complete Edge gameplay suite also passes with the restored viewport. The script now restores viewport/device metrics, key state, touch emulation and forced focus in `finally`, and checks horizontal centering as well as containment. Readiness checks focus the dedicated test page before input to avoid inactive-window timing failures.

Use `--browser msedge` with the open command to run the same suite in actual Microsoft Edge; use `--browser chrome` for Chrome. Always use a dedicated session and close it when finished. Repository `AGENTS.md` makes isolation, cleanup and cross-browser verification explicit for future work.

Evidence boundary: the cleanup change was based on HEAD `ed2acdfa0b9ebf55c90627efcbedc95d06cad3e1`. During this follow-up, concurrent uncommitted edits appeared in README, index.html, src/main.ts and src/style.css, with product-file write times 07:43–07:44 UTC. They were not authored, staged or reverted by this fix. The final 07:45 Edge run verifies the browser-served snapshot; it is not proof that those separately edited files match the published baseline. The viewport cleanup regression is independent of the scene changes. The dedicated Edge session was closed after verification.

## Integration ownership

C004 owns `src/main.ts`, `src/style.css`, `src/controls.ts`, `src/navigation.ts`, `index.html`, `tests/gameplay.test.ts`, `tests/gameplay.browser.cjs`, README updates, `docs/images/c004-*.png`, this handoff and `openspec/changes/c004-gameplay-integration/`.

Worktree: `C:/Users/srive/.codex/worktrees/cc2a/babylon-lite-astra-blender-demo`. Coordinator receives the additive C004 commit SHA after commit. C004 does not push. Preserve the newer C001 configuration/scripts and C002/C003 asset commits during integration; publish only to the explicit new repository destination, never the inherited template origin.

## v0.1.0 release candidate

The reviewed local release includes the Citrus World title, simplified joystick footer and panoramic sky. Browser zoom buttons were removed in that snapshot; the current acceptance suite covers its wheel zoom behavior. Chrome and Microsoft Edge both passed full gameplay checks at localhost5180 with no console errors. QA now creates and closes its own disposable browser context: caller dimensions and API state stay untouched, and all mouse/key/touch state and temporary tabs are discarded on failure. An injected first-viewport-change failure from a native caller kept viewportSize=null, actual1031x604 and browser context count unchanged. This supersedes the earlier direct-CDP cleanup approach and its no-override limitation.

## Published v0.1.0 build

GitHub Pages run34020483443 deployed main9a36ba53b81869825b7a309225e3fdd429aa8224 successfully. The public page at https://samuelasherrivello.github.io/babylon-lite-astra-blender-demo/ was opened in real Chrome: world GLB, navigation and character GLB all returned200, WebGPU rendered Citrus World, and no console errors occurred during keyboard movement, mouse orbit and wheel zoom. The development QA hook was absent. README's sole gameplay screenshot, docs/images/gameplay.png, was captured from that public page after reloading to its default view. The release archive is packaged from this exact GitHub Pages build artifact. A subsequent documentation commit adds the verified URLs and screenshot without changing runtime code.
