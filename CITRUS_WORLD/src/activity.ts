/** Event-driven focus state: no timer or animation-frame polling while asleep. */
export function watchActivity(onChange: (sleeping: boolean) => void,
  browser: Pick<EventTarget, 'addEventListener'> = window,
  page: Pick<Document, 'hidden' | 'hasFocus' | 'addEventListener'> = document) {
  const abort = new AbortController(), options = { signal: abort.signal };
  let sleeping: boolean | undefined;
  const set = (next: boolean) => {
    if (next === sleeping) return;
    sleeping = next; onChange(next);
  };
  const sync = () => set(page.hidden || !page.hasFocus());
  browser.addEventListener('blur', () => set(true), options);
  browser.addEventListener('focus', sync, options);
  page.addEventListener('visibilitychange', sync, options);
  sync();
  return { sleeping: () => !!sleeping, dispose: () => abort.abort() };
}
