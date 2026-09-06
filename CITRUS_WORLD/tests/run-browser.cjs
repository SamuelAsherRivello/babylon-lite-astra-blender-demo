// Uses an existing Playwright installation; does not add a project dependency.
// node tests/run-browser.cjs --playwright <package-directory> --channel chrome --renderer webgpu --suite checks
const fs = require('node:fs');
const path = require('node:path');
const options = Object.fromEntries(Array.from({ length: Math.floor((process.argv.length-2)/2) }, (_, i) => process.argv.slice(2+i*2,4+i*2)));
const { chromium } = require(options['--playwright'] || 'playwright');
const channel = options['--channel'] || 'chrome', renderer = options['--renderer'] || 'webgpu';
const suite = options['--suite'] || 'checks';
const baseUrl = (options['--url'] || (suite === 'performance' ? 'http://127.0.0.1:4173' : 'http://127.0.0.1:5173')).replace(/\/$/, '');
const label = options['--label'] || 'c005';
if (!/^[a-z0-9-]+$/.test(label)) throw new Error('Report label must contain only lowercase letters, numbers and hyphens.');
const root = path.resolve(__dirname, '..');
const readCheck = name => eval('('+fs.readFileSync(path.join(__dirname, name+'.browser.cjs'), 'utf8')+')');

(async () => {
  process.chdir(root);
  fs.mkdirSync('output/playwright', { recursive:true });
  const browser = await chromium.launch({ channel, headless:false });
  const context = await browser.newContext({ viewport:{width:1280,height:960},deviceScaleFactor:1 });
  const page = await context.newPage(), originalViewport = page.viewportSize();
  const report = { channel, version:browser.version(), renderer };
  try {
    if (suite === 'performance') {
      const run = readCheck('vfx-performance');
      for (const mode of ['on','off']) {
        await page.goto(`${baseUrl}/?renderer=${renderer}&vfx=${mode}`);
        report[mode] = await run(page);
        console.log(JSON.stringify({mode,...report[mode]}));
      }
    } else {
      // Suites create their own disposable game pages. Keep the coordination
      // page lightweight so it does not run a second competing WebGL/WebGPU scene.
      await page.route(`${baseUrl}/?renderer=${renderer}`, route => route.fulfill({
        contentType: 'text/html', body: '<!doctype html><title>Citrus browser QA</title>',
      }));
      await page.goto(`${baseUrl}/?renderer=${renderer}`);
      for (const name of ['vfx','gameplay']) {
        report[name] = await readCheck(name)(page);
        console.log(`${name} passed ${channel} ${renderer}`);
      }
    }
    fs.writeFileSync(`output/playwright/${label}-${channel}-${renderer}-${suite}.json`, JSON.stringify(report,null,2));
  } finally {
    await page.keyboard.up('KeyW').catch(() => {}); await page.keyboard.up('KeyS').catch(() => {});
    await page.mouse.up().catch(() => {});
    await page.setViewportSize(originalViewport).catch(() => {});
    const restored = JSON.stringify(page.viewportSize()) === JSON.stringify(originalViewport);
    await context.close(); await browser.close();
    if (!restored) throw new Error('Runner viewport restore failed');
  }
})().catch(error => { console.error(error); process.exitCode=1; });
