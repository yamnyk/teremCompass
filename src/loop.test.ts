import { beforeEach, describe, expect, it, vi } from 'vitest';
import { LOCK_IN, LOCK_OUT } from './config';
import { t } from './i18n';
import { hintText } from './ui/hint';
import { norm } from './lib/geo';

const celebrate = vi.fn();
const drawFx = vi.fn();
vi.mock('./celebrate', () => ({ celebrate: () => celebrate() }));
vi.mock('./celebrate/confetti', async (orig) => ({
  ...(await orig<typeof import('./celebrate/confetti')>()),
  drawFx: () => drawFx(),
}));

let rafCb: FrameRequestCallback | null;
const raf = vi.fn((cb: FrameRequestCallback) => {
  rafCb = cb;
  return 1;
});
const tick = () => {
  const cb = rafCb!;
  rafCb = null;
  cb(0);
};

async function load(reduced = false) {
  vi.resetModules();
  celebrate.mockClear();
  drawFx.mockClear();
  raf.mockClear();
  rafCb = null;
  vi.stubGlobal('requestAnimationFrame', raf);
  vi.stubGlobal('matchMedia', (q: string) => ({
    matches: q.includes('reduced') ? reduced : false,
  }));
  document.body.className = '';
  document.documentElement.style.removeProperty('--heat');
  const { renderApp } = await import('./ui/app');
  const { buildTicks } = await import('./ui/dial');
  document.body.innerHTML = '';
  renderApp();
  buildTicks();
  const { startLoop } = await import('./loop');
  const { state } = await import('./state');
  return { startLoop, state };
}

const hint = () => document.getElementById('hint')!.textContent;
const heat = () => document.documentElement.style.getPropertyValue('--heat');

beforeEach(() => {
  rafCb = null;
});

describe('loop', () => {
  it('startLoop schedules a frame; each frame calls drawFx and reschedules', async () => {
    const { startLoop } = await load();
    startLoop();
    expect(raf).toHaveBeenCalledTimes(1);
    expect(drawFx).not.toHaveBeenCalled();
    tick();
    expect(drawFx).toHaveBeenCalledTimes(1);
    expect(raf).toHaveBeenCalledTimes(2);
    tick();
    expect(drawFx).toHaveBeenCalledTimes(2);
    expect(raf).toHaveBeenCalledTimes(3);
  });

  it('with no heading/target it does nothing to the readout', async () => {
    const { startLoop, state } = await load();
    startLoop();
    tick();
    expect(state.shownRose).toBe(0);
    expect(state.shownNeedle).toBe(0);
    expect(hint()).toBe('');
    expect(heat()).toBe('');
  });

  it('smooths rose by 0.22 toward -heading', async () => {
    const { startLoop, state } = await load();
    state.heading = 50;
    startLoop();
    tick();
    expect(state.shownRose).toBeCloseTo(norm(-50) * 0.22, 10);
    tick();
    const first = norm(-50) * 0.22;
    expect(state.shownRose).toBeCloseTo(first + norm(-50 - first) * 0.22, 10);
  });

  it('smooths needle by 0.22 toward target', async () => {
    const { startLoop, state } = await load();
    state.target = 100;
    startLoop();
    tick();
    expect(state.shownNeedle).toBeCloseTo(22, 10);
    expect(hint()).toBe(''); // heading null: no hint
  });

  it('reduced motion jumps straight to the value', async () => {
    const { startLoop, state } = await load(true);
    state.heading = 50;
    state.target = 100;
    startLoop();
    tick();
    expect(state.shownRose).toBeCloseTo(-50, 10);
    expect(state.shownNeedle).toBeCloseTo(100, 10);
  });

  it('sets --heat and hint from offset', async () => {
    const { startLoop, state } = await load();
    state.target = 100;
    state.heading = 55; // off 45
    startLoop();
    tick();
    expect(heat()).toBe('0.500');
    expect(hint()).toBe(hintText(false, 45, 45));
    expect(state.locked).toBe(false);
  });

  it('heat is clamped to 0 when far off', async () => {
    const { startLoop, state } = await load();
    state.target = 180;
    state.heading = 0;
    startLoop();
    tick();
    expect(heat()).toBe('0.000');
  });

  it('locks below LOCK_IN: class, celebrate once, locked hint', async () => {
    const { startLoop, state } = await load();
    state.target = 100;
    state.heading = 100 - (LOCK_IN - 1);
    startLoop();
    tick();
    expect(state.locked).toBe(true);
    expect(document.body.classList.contains('locked')).toBe(true);
    expect(celebrate).toHaveBeenCalledTimes(1);
    expect(hint()).toBe(t.hint.locked);
    tick();
    expect(celebrate).toHaveBeenCalledTimes(1);
  });

  it('does not lock exactly at LOCK_IN', async () => {
    const { startLoop, state } = await load();
    state.target = 100;
    state.heading = 100 - LOCK_IN;
    startLoop();
    tick();
    expect(state.locked).toBe(false);
    expect(celebrate).not.toHaveBeenCalled();
  });

  it('hysteresis: stays locked between LOCK_IN and LOCK_OUT, unlocks above LOCK_OUT', async () => {
    const { startLoop, state } = await load();
    state.target = 100;
    state.heading = 100;
    startLoop();
    tick();
    expect(state.locked).toBe(true);
    state.heading = 100 - LOCK_OUT; // a == LOCK_OUT, not >
    tick();
    expect(state.locked).toBe(true);
    expect(hint()).toBe(t.hint.locked);
    state.heading = 100 - LOCK_OUT - 1;
    tick();
    expect(state.locked).toBe(false);
    expect(document.body.classList.contains('locked')).toBe(false);
    expect(hint()).toBe(hintText(false, LOCK_OUT + 1, LOCK_OUT + 1));
  });
});
