async (sourcePage) => {
  const originalViewport = sourcePage.viewportSize();
  const originalPixels = await sourcePage.evaluate(() => [innerWidth, innerHeight]);
  const context = await sourcePage.context().browser().newContext({ viewport: { width: 1280, height: 960 } });
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
  const assert = (v, message) => { if (!v) throw new Error(message); };
  const report = {};
  const state = () => page.evaluate(() => window.__littleCitrus.snapshot());
  const url = sourcePage.url();
  const cdp = await context.newCDPSession(page);
  try {
    await page.goto(url); await page.waitForFunction(() => window.__littleCitrus);
    await page.bringToFront(); await page.waitForTimeout(2500);
    const first = await state();
    assert(first.vfx.issues.length === 0, 'Every effect binding resolves');
    assert(first.vfx.foliage.length === 21, '21 crown/tier units');
    assert(new Set(first.vfx.foliage.map(f => f.tree)).size === 6, 'All six trees');
    assert(first.vfx.water.length === 3 && first.vfx.water.every(w => !w.recursive && w.reflectionMeshes > 20), 'Actual scenery render lists, no water recursion');
    assert(first.vfx.water.map(w => w.size).join() === '512,256,256', 'Bounded reflection targets');
    report.renderer = first.renderer;
    report.defaultView = first.camera;
    const smokeCounts = [];
    for (let i = 0; i < 12; i++) {
      await page.waitForTimeout(550);
      const s = await state();
      const visible = s.vfx.smoke.filter(p => p.alpha > .025);
      smokeCounts.push(visible.length);
      assert(visible.length >= 3 && visible.length <= 10, 'Small continuous plume');
      assert(s.vfx.smoke.every(p => p.y + p.radius <= 2.100001), 'Full plume height bounded');
      assert(s.vfx.foliage.every(f => Math.abs(f.position[0]-f.rest[0]) <= f.width*.01801 && f.position[1] === f.rest[1]), 'Foliage motion remains tiny and level');
      assert(s.vfx.water.every(w => w.renders <= s.vfx.updates+1), 'Reflection passes do not advance animation');
    }
    const next = await state();
    assert(next.vfx.foliage.every((f, i) => Math.abs(f.position[0]-first.vfx.foliage[i].position[0]) > .000001), 'Every foliage unit actually moved');
    assert(next.vfx.water.every((w,i) => w.flow !== first.vfx.water[i].flow && (!w.visible || w.renders > first.vfx.water[i].renders)), 'All water flows and visible reflections refresh');
    assert(next.vfx.water.filter(w => !w.visible).every(w => w.renders === first.vfx.water.find(f => f.name === w.name).renders), 'Hidden reflections retain their cached image');
    report.smokeCounts = smokeCounts; report.effects = next.vfx;
    await page.screenshot({ path: `output/playwright/c005-${first.renderer}-default.png` });
    const canvas = await page.locator('#renderCanvas').boundingBox();
    const x = canvas.x+canvas.width*.45, y = canvas.y+canvas.height*.5;
    await page.mouse.move(x,y); await page.mouse.down();
    await page.mouse.move(x+150,y-30,{steps:25}); await page.mouse.up();
    await page.keyboard.down('KeyW'); await page.waitForTimeout(650); await page.keyboard.up('KeyW');
    await page.waitForTimeout(150);
    const orbit = await state();
    assert(Math.abs(orbit.camera.alpha-first.camera.alpha) > .5, 'Real drag changes reflected view');
    assert(orbit.safe, 'Gameplay remains safe during effects');
    await page.screenshot({ path: `output/playwright/c005-${first.renderer}-orbit.png` });
    // A dedicated blank tab suspends this page without touching any user tab.
    const other = await context.newPage(); await other.goto('about:blank'); await other.bringToFront();
    await page.waitForTimeout(150);
    const beforePause = await state(); await page.waitForTimeout(2200);
    const afterPause = await state();
    const hidden = await page.evaluate(() => document.hidden);
    if (hidden) assert(afterPause.vfx.time-beforePause.vfx.time < .1, 'Hidden effects pause');
    await page.bringToFront(); await other.close(); await page.waitForTimeout(200);
    assert((await state()).vfx.time-afterPause.vfx.time < .5, 'No return catch-up burst');
    report.suspension = { hidden, elapsed: afterPause.vfx.time-beforePause.vfx.time };
    await page.reload(); await page.waitForFunction(() => window.__littleCitrus);
    const reloaded = await state();
    assert(reloaded.vfx.water.length === 3 && reloaded.vfx.smoke.length === 8 && reloaded.vfx.foliage.length === 21, 'Reload does not duplicate resources');
    assert(errors.length === 0, errors.join('\n'));
    report.consoleErrors = errors;
  } finally {
    await page.keyboard.up('KeyW').catch(() => {});
    await page.mouse.up().catch(() => {});
    await cdp.send('Input.dispatchTouchEvent', { type:'touchCancel',touchPoints:[] }).catch(() => {});
    await cdp.send('Emulation.setTouchEmulationEnabled', { enabled:false }).catch(() => {});
    await cdp.send('Emulation.setFocusEmulationEnabled', { enabled:false }).catch(() => {});
    await page.setViewportSize({width:1280,height:960}).catch(() => {});
    await context.close();
    assert(JSON.stringify(sourcePage.viewportSize()) === JSON.stringify(originalViewport), 'Caller viewport override restored');
    assert(JSON.stringify(await sourcePage.evaluate(() => [innerWidth,innerHeight])) === JSON.stringify(originalPixels), 'Caller viewport pixels restored');
  }
  report.viewportRestored = true;
  return report;
}
