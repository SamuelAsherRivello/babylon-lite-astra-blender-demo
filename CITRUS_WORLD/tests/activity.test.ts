import { describe, expect, it, vi } from 'vitest';
import { watchActivity } from '../src/activity';

describe('game focus lifecycle', () => {
  const fixture = (focused = true) => {
    const browser = new EventTarget();
    const page = Object.assign(new EventTarget(), { hidden: false, hasFocus: () => focused });
    const change = vi.fn();
    const activity = watchActivity(change, browser, page);
    return { browser, page, change, activity, focus: (value: boolean) => { focused = value; browser.dispatchEvent(new Event(value ? 'focus' : 'blur')); } };
  };
  it('sleeps immediately on blur and resumes once, without polling or duplicate transitions', () => {
    const f = fixture();
    expect(f.change.mock.calls).toEqual([[false]]);
    f.focus(false); f.focus(false);
    expect(f.activity.sleeping()).toBe(true);
    expect(f.change.mock.calls).toEqual([[false], [true]]);
    f.focus(true); f.focus(true);
    expect(f.change.mock.calls).toEqual([[false], [true], [false]]);
    f.activity.dispose();
  });
  it('keeps hidden or initially unfocused pages asleep and removes listeners on disposal', () => {
    const f = fixture(false);
    expect(f.activity.sleeping()).toBe(true);
    f.page.hidden = true; f.focus(true);
    expect(f.change.mock.calls).toEqual([[true]]);
    f.page.hidden = false; f.page.dispatchEvent(new Event('visibilitychange'));
    expect(f.activity.sleeping()).toBe(false);
    f.page.hidden = true; f.page.dispatchEvent(new Event('visibilitychange'));
    expect(f.activity.sleeping()).toBe(true);
    f.activity.dispose(); f.page.hidden = false; f.focus(true);
    expect(f.change.mock.calls).toEqual([[true], [false], [true]]);
  });
});
