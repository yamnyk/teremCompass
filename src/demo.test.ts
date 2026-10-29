import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { t } from './i18n';

async function load(search: string) {
  vi.resetModules();
  vi.stubGlobal('location', { search });
  const { renderApp } = await import('./ui/app');
  document.body.innerHTML = '<svg><g id="needle" visibility="hidden"></g></svg>';
  renderApp();
  const { initDemo } = await import('./demo');
  const { state } = await import('./state');
  return { initDemo, state };
}

const el = (id: string) => document.getElementById(id)!;

describe('initDemo', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it('is a no-op without ?demo', async () => {
    const { initDemo, state } = await load('?x=1');
    initDemo();
    expect(state.target).toBeNull();
    expect(el('needle').getAttribute('visibility')).toBe('hidden');
    expect(el('go').hidden).toBe(false);
    vi.advanceTimersByTime(1000);
    expect(state.heading).toBeNull();
  });

  it('with ?demo seeds state and DOM', async () => {
    const { initDemo, state } = await load('?demo');
    initDemo();
    expect(state.target).toBe(57);
    expect(state.shownNeedle).toBe(57);
    expect(el('needle').getAttribute('visibility')).toBe('visible');
    expect(el('dist').innerHTML).toBe(`${t.demoDist}<small>${t.units.km}</small>`);
    expect(el('go').hidden).toBe(true);
    expect(state.heading).toBeNull();
  });

  it('spins heading by 1.5 degrees every 30 ms and wraps at 360', async () => {
    const { initDemo, state } = await load('?demo');
    initDemo();
    vi.advanceTimersByTime(30);
    expect(state.heading).toBe(1.5);
    vi.advanceTimersByTime(60);
    expect(state.heading).toBe(4.5);
    vi.advanceTimersByTime(30 * 237); // 240 ticks total = 360 degrees
    expect(state.heading).toBe(0);
    vi.advanceTimersByTime(30);
    expect(state.heading).toBe(1.5);
  });
});
