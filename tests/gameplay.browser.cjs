async (sourcePage) => {
  const sourceViewport = sourcePage.viewportSize();
  const sourceMetrics = await sourcePage.evaluate(() => [innerWidth, innerHeight]);
  const context = await sourcePage.context().browser().newContext({ viewport: { width: 1280, height: 960 } });
  const page = await context.newPage();
  const assert = (value, message) => { if (!value) throw new Error(message); };
  const url = sourcePage.url();
  const state = () => page.evaluate(() => window.__littleCitrus.snapshot());
  const settle = () => page.waitForTimeout(140);
  const fresh = async () => { await page.goto(url); await page.waitForFunction(() => window.__littleCitrus); await page.bringToFront(); await page.waitForTimeout(500); };
  const distance = (a, b) => Math.hypot(a.player.x - b.player.x, a.player.z - b.player.z);
  const centered = s => s.camera.target.every(v => v === 0) && s.safe && s.player.y === 0;
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('console', msg => { if (msg.type() === 'error') errors.push(msg.text()); });
  const report = {};

  let cdp;
  try {
  await page.setViewportSize({ width: 1280, height: 960 });
  await fresh();
  const initial = await state();
  assert(initial.animation === 'Idle' && centered(initial), 'Initial idle/safe/center state');
  await page.keyboard.down('KeyW'); await page.waitForTimeout(500);
  const walking = await state();
  await page.keyboard.up('KeyW'); await settle();
  const stopped = await state();
  assert(walking.animation === 'Walk' && walking.clips.find(g => g.name === 'Walk').playing, 'Walk clip must actually run');
  assert(distance(initial, walking) > 0.65 && walking.player.z < initial.player.z, 'W must move toward camera center');
  assert(stopped.animation === 'Idle' && centered(stopped), 'Release must idle on ground');
  report.keyboard = { initial: initial.player, moving: walking.player, distance: distance(initial, walking), animationDuringMove: walking.animation, animationAfterRelease: stopped.animation };

  const canvas = await page.locator('#renderCanvas').boundingBox();
  const cx = canvas.x + canvas.width * 0.45, cy = canvas.y + canvas.height * 0.4;
  await page.mouse.move(cx, cy); await page.mouse.down(); await page.mouse.move(cx + 85, cy + 25, { steps: 10 }); await page.mouse.up();
  const orbited = await state();
  assert(Math.abs(orbited.camera.alpha - initial.camera.alpha) > 0.3 && centered(orbited), 'Left drag orbits fixed center');
  await page.mouse.wheel(0, -10000); await settle();
  assert((await state()).camera.radius === 12, 'Wheel zoom lower bound');
  await page.mouse.wheel(0, 10000); await settle();
  assert((await state()).camera.radius === 27, 'Wheel zoom upper bound');
  report.camera = { orbited: orbited.camera, lowerBound: 12, upperBound: 27, centered: true };

  await fresh();
  await page.keyboard.down('KeyW');
  for (let i = 0; i < 12; i++) { await page.waitForTimeout(100); assert(centered(await state()), 'Movement through village stays safe'); }
  await page.keyboard.up('KeyW');
  await fresh();
  await page.keyboard.down('KeyW'); await page.waitForTimeout(150);
  await page.setViewportSize({ width: 1200, height: 900 }); await settle();
  assert((await state()).input.y === 0, 'Resize clears keyboard');
  await page.keyboard.up('KeyW');

  report.layouts = [];
  for (const [width, height] of [[1280,960], [390,844], [320,568], [844,390]]) {
    await page.setViewportSize({ width, height }); await settle();
    const box = await page.locator('.game').boundingBox();
    assert(box.x >= -1 && box.y >= -1 && box.x + box.width <= width + 1 && box.y + box.height <= height + 1, 'Frame fits viewport');
    assert(Math.abs(box.x + box.width / 2 - width / 2) <= 1, 'Frame is horizontally centered');
    assert(Math.abs(box.width / box.height - 9 / 16) < 0.002, 'Frame stays 9:16');
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth > innerWidth || document.documentElement.scrollHeight > innerHeight);
    assert(!overflow, 'No page overflow');
    report.layouts.push({ width, height, frame: box });
    await page.screenshot({ path: `output/playwright/c004-${width}x${height}.png` });
  }

  await page.setViewportSize({ width: 390, height: 844 }); await fresh();
  cdp = await page.context().newCDPSession(page);
  await cdp.send('Emulation.setTouchEmulationEnabled', { enabled: true, maxTouchPoints: 5 });
  const joy = await page.locator('#joystick').boundingBox();
  const jx = joy.x + joy.width / 2, jy = joy.y + joy.height / 2;
  const touch = (id, x, y) => ({ id, x, y, radiusX: 3, radiusY: 3, force: 1 });
  const send = (type, touchPoints) => cdp.send('Input.dispatchTouchEvent', { type, touchPoints });
  const beforeTouch = await state();
  await send('touchStart', [touch(1, jx, jy)]);
  await send('touchMove', [touch(1, jx, jy - 32)]); await page.waitForTimeout(350);
  const stickMoving = await state();
  assert(stickMoving.animation === 'Walk' && distance(beforeTouch, stickMoving) > 0.3, 'Real touch joystick moves and animates');
  assert(stickMoving.camera.alpha === beforeTouch.camera.alpha, 'Joystick does not orbit');
  await send('touchStart', [touch(1, jx, jy - 32), touch(2, jx + 10, jy + 10)]);
  await send('touchMove', [touch(1, jx, jy - 32), touch(2, jx + 22, jy + 16)]);
  assert((await state()).input.y > 0.9, 'Second joystick pointer cannot steal first pointer');
  await send('touchEnd', [touch(1, jx, jy - 32)]);
  await send('touchStart', [touch(1, jx, jy - 32), touch(3, 140, 310)]);
  await send('touchMove', [touch(1, jx, jy - 32), touch(3, 200, 330)]); await settle();
  const concurrent = await state();
  assert(concurrent.camera.alpha !== beforeTouch.camera.alpha && concurrent.input.y > 0.9 && centered(concurrent), 'World pointer orbits independently of active joystick');
  await send('touchCancel', []); await settle();
  const cancelled = await state();
  assert(cancelled.input.x === 0 && cancelled.input.y === 0 && cancelled.animation === 'Idle', 'Cancellation clears movement');
  await send('touchStart', [touch(4, jx, jy)]);
  await send('touchMove', [touch(4, jx + 30, jy)]);
  await send('touchEnd', []); await settle();
  assert((await state()).input.x === 0, 'Touch release clears movement');
  await cdp.send('Emulation.setTouchEmulationEnabled', { enabled: false });
  await cdp.send('Emulation.setFocusEmulationEnabled', { enabled: false });
  report.touch = { movement: distance(beforeTouch, stickMoving), animation: stickMoving.animation, concurrentCamera: concurrent.camera, cancelledInput: cancelled.input, secondPointerIsolation: true };

  await page.keyboard.down('KeyW'); await page.waitForTimeout(150);
  const other = await page.context().newPage(); await other.goto('about:blank'); await other.bringToFront(); await page.waitForTimeout(150);
  await page.bringToFront(); await settle();
  const blurred = await state();
  await page.keyboard.up('KeyW'); await other.close();
  assert(blurred.input.y === 0 && blurred.animation === 'Idle', 'Actual window focus loss clears input');
  report.blur = true;
  await fresh();
  await page.screenshot({ path: 'output/playwright/c004-portrait.png' });
  assert(errors.length === 0, `Browser errors: ${errors.join('; ')}`);
  report.consoleErrors = errors;
  } finally {
    // Closing this disposable context releases mouse/keys, CDP emulation and
    // every temporary tab even when an assertion fails. The caller is untouched.
    await context.close();
  }
  assert(JSON.stringify(sourcePage.viewportSize()) === JSON.stringify(sourceViewport), 'QA must not change caller viewport state');
  assert(JSON.stringify(await sourcePage.evaluate(() => [innerWidth, innerHeight])) === JSON.stringify(sourceMetrics), 'QA must not change caller viewport pixels');
  report.viewportRestored = true;
  return report;
}
