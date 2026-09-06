const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const [packagePath, channel = 'chrome', renderer = 'webgpu', baseUrl = 'http://127.0.0.1:4189/'] = process.argv.slice(2);
const { chromium } = require(packagePath || 'playwright');
process.chdir(path.resolve(__dirname, '..'));
const prefix = `output/playwright/c007-sleep-${channel}-${renderer}`;
fs.mkdirSync(prefix, { recursive: true });
(async () => {
  const browser = await chromium.launch({ channel, headless: false });
  const context = await browser.newContext({ viewport: { width: 1280, height: 960 } });
  const page = await context.newPage(), viewport = page.viewportSize();
  const cdp = await context.newCDPSession(page);
  const report = { channel, version: browser.version(), renderer, errors: [] };
  page.on('pageerror', error => report.errors.push(error.message));
  const state = () => page.evaluate(() => window.__littleCitrus.snapshot());
  try {
    await page.goto(`${baseUrl}?renderer=${renderer}`); await page.bringToFront();
    await page.locator('#renderCanvas').click({ position: { x: 50, y: 100 } });
    await page.waitForFunction(() => window.__littleCitrus?.snapshot().activity.frames > 5);
    assert.equal((await state()).renderer.toLowerCase(), renderer);
    await page.keyboard.down('KeyW'); await page.waitForTimeout(200);
    // Exercise the exact blur handler even on hosts that virtualize browser focus.
    await page.evaluate(() => window.dispatchEvent(new Event('blur')));
    await page.waitForTimeout(250);
    const before = await state();
    await page.screenshot({ path: `${prefix}/sleeping.png` });
    await page.waitForTimeout(1500);
    const asleep = await state();
    assert.equal(asleep.activity.sleeping, true); assert.equal(asleep.activity.renderLoops, 0);
    assert.equal(asleep.activity.frames, before.activity.frames);
    assert.deepEqual(asleep.vfx, before.vfx); assert.deepEqual(asleep.player, before.player);
    assert.deepEqual(asleep.input, { x: 0, y: 0 });
    report.frozen = { durationMs: 1500, before: before.activity, after: asleep.activity, waterTime: asleep.vfx.time };
    report.overlay = await page.evaluate(() => {
      const overlay = document.querySelector('#sleep-overlay'), text = overlay.querySelector('span');
      const box = overlay.getBoundingClientRect(), label = text.getBoundingClientRect();
      const style = getComputedStyle(overlay);
      return { viewport: [innerWidth, innerHeight], bounds: [box.x, box.y, box.width, box.height],
        center: [label.x + label.width / 2, label.y + label.height / 2], text: text.textContent,
        opacity: style.opacity, background: style.backgroundColor, loadingAnimation: getComputedStyle(document.querySelector('.loading-dot')).animationPlayState,
        runningAnimations: document.getAnimations().filter(animation => animation.playState === 'running').length };
    });
    assert.equal(report.overlay.text, 'Sleeping'); assert.equal(report.overlay.opacity, '1');
    assert.equal(report.overlay.loadingAnimation, 'paused');
    assert.equal(report.overlay.runningAnimations, 0);
    assert.deepEqual(report.overlay.bounds.slice(0, 2), [0, 0]);
    report.overlay.viewport.forEach((size, axis) => {
      assert(Math.abs(report.overlay.bounds[axis + 2] - size) < .5);
      assert(Math.abs(report.overlay.center[axis] - size / 2) < .5);
    });
    await page.keyboard.up('KeyW');
    report.wake = await page.evaluate(async () => {
      const before = window.__littleCitrus.snapshot();
      window.dispatchEvent(new Event('focus'));
      await new Promise(resolve => requestAnimationFrame(resolve));
      const after = window.__littleCitrus.snapshot();
      return { before, after };
    });
    assert.equal(report.wake.after.activity.renderLoops, 1);
    assert.equal(report.wake.after.activity.frames - report.wake.before.activity.frames, 1);
    assert.equal(report.wake.after.vfx.time, report.wake.before.vfx.time);
    assert.deepEqual(report.wake.after.player, report.wake.before.player);
    await page.waitForTimeout(250);
    await page.screenshot({ path: `${prefix}/awake.png` });
    assert.equal(await page.locator('#sleep-overlay').evaluate(e => getComputedStyle(e).opacity), '0');
    report.visibility = await page.evaluate(async () => {
      const descriptor = Object.getOwnPropertyDescriptor(document, 'hidden');
      try {
        Object.defineProperty(document, 'hidden', { configurable: true, get: () => true });
        document.dispatchEvent(new Event('visibilitychange')); window.dispatchEvent(new Event('focus'));
        const before = window.__littleCitrus.snapshot();
        await new Promise(resolve => setTimeout(resolve, 1000));
        return { before: before.activity, after: window.__littleCitrus.snapshot().activity };
      } finally {
        if (descriptor) Object.defineProperty(document, 'hidden', descriptor); else delete document.hidden;
        document.dispatchEvent(new Event('visibilitychange')); window.dispatchEvent(new Event('focus'));
      }
    });
    assert.equal(report.visibility.after.renderLoops, 0);
    assert.equal(report.visibility.after.frames, report.visibility.before.frames);
    await page.waitForFunction(() => !window.__littleCitrus.snapshot().activity.sleeping);
    // Clear automation focus virtualization before checking a genuine background tab.
    await cdp.send('Emulation.setFocusEmulationEnabled', { enabled: false });
    const other = await context.newPage(); await other.goto('about:blank'); await other.bringToFront();
    await page.waitForTimeout(250);
    report.nativeTab = await page.evaluate(() => ({ hidden: document.hidden, focused: document.hasFocus(), activity: window.__littleCitrus.snapshot().activity }));
    if (report.nativeTab.hidden || !report.nativeTab.focused) assert.equal(report.nativeTab.activity.renderLoops, 0);
    const pausedFrames = report.nativeTab.activity.frames;
    await page.waitForTimeout(1000);
    if (report.nativeTab.activity.sleeping) assert.equal((await state()).activity.frames, pausedFrames);
    await page.bringToFront(); await other.close();
    await cdp.send('Emulation.setFocusEmulationEnabled', { enabled: true });
    await page.locator('#renderCanvas').click({ position: { x: 50, y: 100 } });
    await page.waitForFunction(() => window.__littleCitrus.snapshot().activity.renderLoops === 1);
    await page.evaluate(() => window.dispatchEvent(new Event('blur')));
    const beforeResize = await state();
    await page.setViewportSize({ width: 390, height: 844 });
    await page.waitForTimeout(100);
    assert.deepEqual((await state()).activity.renderSize, beforeResize.activity.renderSize, 'Sleeping resize defers GPU buffer changes until wake-up');
    await page.emulateMedia({ reducedMotion: 'reduce' });
    report.portrait = await page.locator('#sleep-overlay').evaluate(e => {
      const r = e.getBoundingClientRect(), label = e.querySelector('span').getBoundingClientRect();
      return { width: r.width, height: r.height, viewport: [innerWidth, innerHeight],
        center: [label.x + label.width / 2, label.y + label.height / 2], transition: getComputedStyle(e).transitionDuration };
    });
    report.portrait.viewport.forEach((size, axis) => assert(Math.abs(report.portrait.center[axis] - size / 2) < .5));
    assert(Math.abs(report.portrait.width - report.portrait.viewport[0]) < .5);
    assert(Math.abs(report.portrait.height - report.portrait.viewport[1]) < .5);
    assert.equal(report.portrait.transition, '0s');
    await page.screenshot({ path: `${prefix}/sleeping-portrait.png` });
    await page.evaluate(() => window.dispatchEvent(new Event('focus')));
    await page.waitForFunction(() => window.__littleCitrus.snapshot().activity.renderLoops === 1);
    assert.notDeepEqual((await state()).activity.renderSize, beforeResize.activity.renderSize, 'Wake applies the new viewport size');
    assert.deepEqual(report.errors, []); report.passed = true;
  } catch (error) { report.failure = error.message; throw error; }
  finally {
    await page.keyboard.up('KeyW').catch(() => {}); await page.mouse.up().catch(() => {});
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchCancel', touchPoints: [] }).catch(() => {});
    await cdp.send('Emulation.setTouchEmulationEnabled', { enabled: false });
    await cdp.send('Emulation.setFocusEmulationEnabled', { enabled: false });
    await page.emulateMedia({ reducedMotion: null });
    await page.setViewportSize(viewport); assert.deepEqual(page.viewportSize(), viewport); report.viewportRestored = true;
    fs.writeFileSync(`${prefix}/report.json`, JSON.stringify(report, null, 2));
    await context.close(); await browser.close();
  }
  console.log(JSON.stringify({ channel, renderer, passed: true, frozen: report.frozen, nativeTab: report.nativeTab }));
})().catch(error => { console.error(error); process.exitCode = 1; });
