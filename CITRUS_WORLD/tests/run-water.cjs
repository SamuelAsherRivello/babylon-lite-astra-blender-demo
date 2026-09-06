// Dedicated installed-browser verification; uses an existing Playwright package.
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const [playwrightPath, channel = 'chrome', renderer = 'webgpu', stage = 'final', baseUrl = 'http://127.0.0.1:5173/'] = process.argv.slice(2);
const { chromium } = require(playwrightPath || 'playwright');
const root = path.resolve(__dirname, '..');
process.chdir(root);
const prefix = `output/playwright/c007-${stage}-${channel}-${renderer}`;
fs.mkdirSync(prefix, { recursive: true });
const check = name => eval(`(${fs.readFileSync(path.join(__dirname, `${name}.browser.cjs`), 'utf8')})`);
(async () => {
  const browser = await chromium.launch({ channel, headless: false });
  const context = await browser.newContext({ viewport: { width: 1280, height: 960 }, deviceScaleFactor: 1 });
  const page = await context.newPage(), originalViewport = page.viewportSize();
  const cdp = await context.newCDPSession(page);
  const report = { stage, channel, version: browser.version(), renderer, baseUrl, errors: [] };
  page.on('pageerror', e => report.errors.push(e.message));
  try {
    await page.goto(`${baseUrl}?renderer=${renderer}${stage.includes('profile') ? '&profile=1' : ''}`);
    await page.waitForFunction(() => window.__littleCitrus);
    await page.bringToFront();
    report.initial = await page.evaluate(() => window.__littleCitrus.snapshot());
    assert.equal(report.initial.renderer.toLowerCase(), renderer, 'Requested renderer is active');
    assert.equal(report.initial.vfx.issues.length, 0);
    await page.screenshot({ path: `${prefix}/initial.png` });
    report.performance = await check('vfx-performance')(page);
    report.final = await page.evaluate(() => window.__littleCitrus.snapshot());
    if (report.final.profile) console.log(JSON.stringify({ profile: report.final.profile, water: report.final.vfx.water, updates: report.final.vfx.updates }));
    console.log(JSON.stringify({ stage, channel, renderer, performance: report.performance }));
    if (stage !== 'baseline' && !stage.startsWith('performance')) {
      report.water = await check('water')(page, prefix);
      // The shared suites create their own game pages; release this scene first.
      const url = page.url();
      await page.route(url, route => route.fulfill({ contentType: 'text/html', body: '<!doctype html><title>Citrus water QA</title>' }));
      await page.goto(url);
      report.vfx = await check('vfx')(page);
      console.log('VFX compatibility passed');
      report.gameplay = await check('gameplay')(page);
      console.log('Gameplay compatibility passed');
    }
    assert.deepEqual(report.errors, []);
  } catch (error) {
    report.failure = error.message;
    throw error;
  } finally {
    for (const key of ['KeyW', 'KeyA', 'KeyS', 'KeyD']) await page.keyboard.up(key).catch(() => {});
    await page.mouse.up().catch(() => {});
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchCancel', touchPoints: [] }).catch(() => {});
    await cdp.send('Emulation.setTouchEmulationEnabled', { enabled: false });
    await cdp.send('Emulation.setFocusEmulationEnabled', { enabled: false });
    if (originalViewport) await page.setViewportSize(originalViewport);
    else await cdp.send('Emulation.clearDeviceMetricsOverride');
    assert.deepEqual(page.viewportSize(), originalViewport);
    report.viewportRestored = true;
    fs.writeFileSync(`${prefix}/report.json`, JSON.stringify(report, null, 2));
    await context.close(); await browser.close();
  }
  console.log(`${stage} ${channel} ${renderer} passed`);
})().catch(e => { console.error(e); process.exitCode = 1; });
