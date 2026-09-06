async (page) => {
  await page.bringToFront();
  await page.waitForFunction(() => window.__littleCitrus);
  await page.waitForTimeout(5000);
  const metadata = await page.evaluate(async () => {
    const adapter = await navigator.gpu?.requestAdapter();
    return { userAgent:navigator.userAgent, gpu:adapter?.info ? {vendor:adapter.info.vendor,architecture:adapter.info.architecture,description:adapter.info.description} : null,
      viewport:[innerWidth,innerHeight],dpr:devicePixelRatio,hidden:document.hidden,renderer:window.__littleCitrus.snapshot().renderer,
      effects:!!window.__littleCitrus.snapshot().vfx };
  });
  if (metadata.hidden) throw new Error('Performance page must be foreground');
  const sample = page.evaluate(() => new Promise(resolve => {
    const intervals=[], visibility=[]; let start,previous;
    const frame=t=>{
      if(start===undefined) start=previous=t;
      else {intervals.push({t:t-start,ms:t-previous});previous=t;}
      if(document.hidden) visibility.push(t-start);
      if(t-start<30000) requestAnimationFrame(frame);
      else {
        const stats=values=>{
          const sorted=values.map(x=>x.ms).sort((a,b)=>a-b);
          const duration=values.reduce((a,x)=>a+x.ms,0);
          return {frames:values.length,durationMs:duration,averageFps:1000*values.length/duration,
            medianMs:sorted[Math.floor(sorted.length*.5)],p95Ms:sorted[Math.floor(sorted.length*.95)],
            maxMs:sorted.at(-1),stallsOver50ms:sorted.filter(x=>x>50).length};
        };
        resolve({all:stats(intervals),idle:stats(intervals.filter(x=>x.t<10000)),interactive:stats(intervals.filter(x=>x.t>=10000)),hiddenSamples:visibility.length});
      }
    };requestAnimationFrame(frame);
  }));
  const box=await page.locator('#renderCanvas').boundingBox();
  const x=box.x+box.width*.45,y=box.y+box.height*.45;
  try {
    await page.waitForTimeout(10000);
    for(let i=0;i<10;i++) {
      await page.mouse.move(x,y);await page.mouse.down();
      await page.mouse.move(x+(i%2? -65:65),y,{steps:8});await page.mouse.up();
      await page.keyboard.down(i%2?'KeyS':'KeyW');await page.waitForTimeout(300);
      await page.keyboard.up(i%2?'KeyS':'KeyW');await page.waitForTimeout(1550);
    }
    const frames=await sample;
    if(frames.hiddenSamples) throw new Error('Performance samples included a hidden tab');
    return {metadata,...frames};
  } finally {
    await page.mouse.up();await page.keyboard.up('KeyW');await page.keyboard.up('KeyS');
  }
}
