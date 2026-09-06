async (page, prefix) => {
  const assert = (value, message) => { if (!value) throw new Error(message); };
  const report = { views: [] };
  const state = () => page.evaluate(() => window.__littleCitrus.snapshot());
  await page.reload(); await page.waitForFunction(() => window.__littleCitrus);
  await page.bringToFront();
  const originalViewport = page.viewportSize();
  try {
    // Controlled visibility exercises the game's real update guard. Some automation
    // environments keep document.hidden false even when another tab is selected.
    report.visibility = await page.evaluate(async () => {
      const descriptor = Object.getOwnPropertyDescriptor(document, 'hidden');
      const time = () => window.__littleCitrus.snapshot().vfx.time;
      const before = time();
      let pausedAdvance;
      try {
        Object.defineProperty(document, 'hidden', { configurable: true, get: () => true });
        await new Promise(resolve => setTimeout(resolve, 1500));
        pausedAdvance = time() - before;
      } finally {
        if (descriptor) Object.defineProperty(document, 'hidden', descriptor);
        else delete document.hidden;
      }
      const resume = time();
      await new Promise(resolve => requestAnimationFrame(resolve));
      return { emulated: true, hiddenMs: 1500, pausedAdvance, firstFrameAdvance: time() - resume,
        restored: Object.getOwnPropertyDescriptor(document, 'hidden')?.get === descriptor?.get };
    });
    assert(report.visibility.pausedAdvance === 0, 'Hidden water time stays paused');
    assert(report.visibility.firstFrameAdvance <= .050001 && report.visibility.restored, 'Visibility restores and flow resumes without a jump');
    for (const view of ['south-river', 'north-river']) {
      if (view === 'north-river') {
        const rect = await page.locator('#renderCanvas').boundingBox();
        // A half orbit uses the actual game control, with each drag confined to the canvas.
        for (let i = 0; i < 2; i++) {
          await page.mouse.move(rect.x + rect.width * .2, rect.y + rect.height * .5);
          await page.mouse.down();
          await page.mouse.move(rect.x + rect.width * .2 + Math.PI / .007 / 2, rect.y + rect.height * .5, { steps: 30 });
          await page.mouse.up();
        }
      }
      const first = await state();
      const riverPeriod = first.vfx.water.find(w => w.name === 'River').period;
      const startCycle = Math.ceil(first.vfx.time / riverPeriod) * riverPeriod;
      const observations = [];
      // Actual render-loop time: two full cycles, successive motion frames, and both sides of rollover.
      const times = [0, 1, 2, 5.4, 6.15, 11.4, 12.15, 17.4, 18.15, 23.4, 24.15];
      for (let i = 0; i < times.length; i++) {
        const target = startCycle + times[i];
        await page.waitForFunction(t => window.__littleCitrus.snapshot().vfx.time >= t, target, { timeout: 45000 });
        const before = await state();
        const file = `${prefix}/${view}-${String(i).padStart(2, '0')}.png`;
        await page.screenshot({ path: file });
        const after = await state();
        if ([3, 5, 7, 9].includes(i)) assert(after.vfx.time < startCycle + Math.ceil(times[i]), 'Pre-rollover image completes before the boundary');
        for (const w of after.vfx.water) {
          assert(w.flow >= 0 && w.flow < 1, 'Bounded phase');
          assert(w.flow === w.colorFlow, 'Color and normal flow stay aligned');
          assert(w.texturedParts === 2 && w.textureSize === 128, 'Both meshes use the flow textures');
          assert(!w.recursive && w.renders <= after.vfx.updates + 1, 'No extra recursive reflection updates');
        }
        observations.push({ file, before: before.vfx.time, after: after.vfx.time, water: after.vfx.water });
      }
      assert(observations.at(-1).after - observations[0].before >= riverPeriod * 2, 'Two complete river and fall cycles');
      const expectedFall = view === 'south-river' ? 'FallSouth' : 'FallNorth';
      const lastWater = observations.at(-1).water;
      assert(lastWater.filter(w => w.visible).map(w => w.name).join() === `River,${expectedFall}`, 'Orbit refreshes the exposed waterfall and river');
      for (const w of lastWater) {
        const earlier = observations[0].water.find(f => f.name === w.name);
        assert(w.visible ? w.renders > earlier.renders : w.renders === earlier.renders, 'Only visible reflections render during each view');
      }
      report.views.push({ view, camera: first.camera, observations });
      console.log(`Water frames captured: ${view}`);
    }
  } finally {
    await page.mouse.up();
    // This check never changes viewport, touch or focus emulation.
    assert(JSON.stringify(page.viewportSize()) === JSON.stringify(originalViewport), 'Water check preserves viewport');
  }
  report.viewportRestored = true;
  return report;
}
