const fs = require('node:fs');
const assert = require('node:assert/strict');
const path = require('node:path');
const [packagePath, channel = 'chrome', label = 'startup', width = '1280', height = '960'] = process.argv.slice(2);
const { chromium } = require(packagePath || 'playwright');
process.chdir(path.resolve(__dirname, '..'));
fs.mkdirSync('output/playwright', { recursive: true });
(async () => {
  const browser = await chromium.launch({ channel, headless: false });
  const context = await browser.newContext({ viewport: { width: Number(width), height: Number(height) } });
  const page = await context.newPage(), viewport = page.viewportSize();
  let release;
  let scriptBlocked = false;
  const gate = new Promise(resolve => { release = resolve; });
  const report = { channel, version: browser.version(), viewport };
  try {
    await page.route('**/src/main.ts*', async route => { scriptBlocked = true; await gate; await route.continue().catch(() => {}); });
    await page.goto('http://127.0.0.1:5173/', { waitUntil: 'commit' });
    await page.locator('.game').waitFor({ state: 'attached' });
    await page.screenshot({ path: `output/playwright/c007-${label}-${channel}-delayed-script.png` });
    const initial = await page.evaluate(() => {
      const frame = document.querySelector('.game'), heading = document.querySelector('.heading'), joystick = document.querySelector('.joystick');
      const rect = e => { const r = e.getBoundingClientRect(); return [r.x, r.y, r.width, r.height]; };
      return { framePosition: getComputedStyle(frame).position, frame: rect(frame), heading: rect(heading), joystick: rect(joystick),
        joystickRadius: getComputedStyle(joystick).borderRadius, margin: getComputedStyle(document.body).margin,
        ready: document.querySelector('canvas').dataset.ready, styledBeforeGameScript: !!document.querySelector('link[rel="stylesheet"]') };
    });
    report.initial = initial;
    assert(scriptBlocked, 'The game entry request is deliberately delayed');
    assert.equal(initial.framePosition, 'relative', 'Initial HTML must already have its final layout while game JS is delayed');
    assert.equal(initial.margin, '0px'); assert.equal(initial.joystickRadius, '50%');
    // Fractional Windows display scaling can round a CSS edge by a fraction of a pixel.
    assert(initial.frame[0] >= -.5 && initial.frame[1] >= -.5 && initial.frame[0] + initial.frame[2] <= viewport.width + .5 && initial.frame[1] + initial.frame[3] <= viewport.height + .5, 'Styled frame fits the viewport');
    assert(Math.abs(initial.frame[0] + initial.frame[2] / 2 - viewport.width / 2) < .5, 'Styled frame is horizontally centered');
    assert.equal(initial.ready, undefined);
    release();
    await page.waitForFunction(() => document.querySelector('canvas').dataset.ready === 'true', null, { timeout: 45000 });
    const final = await page.evaluate(() => {
      const rect = selector => { const r = document.querySelector(selector).getBoundingClientRect(); return [r.x, r.y, r.width, r.height]; };
      return { frame: rect('.game'), heading: rect('.heading'), joystick: rect('.joystick') };
    });
    report.final = final;
    for (const key of ['frame', 'heading', 'joystick']) initial[key].forEach((value, axis) => assert(Math.abs(value - final[key][axis]) < .5, `${key} must not jump when the game initializes`));
    await page.screenshot({ path: `output/playwright/c007-${label}-${channel}-ready.png` });
    report.passed = true;
  } catch (error) { report.failure = error.message; throw error; }
  finally {
    release();
    assert.deepEqual(page.viewportSize(), viewport); report.viewportRestored = true;
    fs.writeFileSync(`output/playwright/c007-${label}-${channel}.json`, JSON.stringify(report, null, 2));
    await context.close(); await browser.close();
  }
  console.log(`${channel}: styled before game script; header, frame and controls unchanged after loading`);
})().catch(e => { console.error(e); process.exitCode = 1; });
