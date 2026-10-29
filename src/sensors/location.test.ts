import { beforeEach, describe, expect, it, vi } from 'vitest';
import { TEREMKY } from '../config';
import { t } from '../i18n';
import { distanceKm, bearing } from '../lib/geo';

const unlockAudio = vi.fn();
const compassMock = {
  hasCompassPermissionApi: vi.fn(() => false),
  listenCompass: vi.fn(),
  requestCompassPermission: vi.fn(async () => {}),
};
vi.mock('../celebrate/sound', () => ({ unlockAudio: () => unlockAudio() }));
vi.mock('./compass', () => ({
  hasCompassPermissionApi: () => compassMock.hasCompassPermissionApi(),
  listenCompass: () => compassMock.listenCompass(),
  requestCompassPermission: () => compassMock.requestCompassPermission(),
}));

type Ok = (pos: { coords: { latitude: number; longitude: number } }) => void;
type Bad = (err: { code: number; message: string }) => void;

async function load(nav: Record<string, unknown> = {}) {
  let ok!: Ok, bad!: Bad;
  let opts: unknown;
  const geolocation = {
    watchPosition: vi.fn((o: Ok, b: Bad, op: unknown) => {
      ok = o;
      bad = b;
      opts = op;
      return 7;
    }),
    clearWatch: vi.fn(),
  };
  vi.stubGlobal('navigator', { geolocation, ...nav });
  vi.resetModules();
  const { renderApp } = await import('../ui/app');
  document.body.innerHTML = '<svg><g id="needle" visibility="hidden"></g></svg>';
  renderApp();
  const loc = await import('./location');
  const { state } = await import('../state');
  return {
    loc,
    state,
    geolocation,
    ok: (p: Parameters<Ok>[0]) => ok(p),
    bad: (e: Parameters<Bad>[0]) => bad(e),
    opts: () => opts,
  };
}

const el = (id: string) => document.getElementById(id)!;
const pos = (latitude: number, longitude: number) => ({ coords: { latitude, longitude } });

beforeEach(() => {
  unlockAudio.mockClear();
  compassMock.hasCompassPermissionApi.mockReset().mockReturnValue(false);
  compassMock.listenCompass.mockReset();
  compassMock.requestCompassPermission.mockReset().mockResolvedValue(undefined);
});

describe('start', () => {
  it('hides error, unlocks audio, listens to compass, shows searching', async () => {
    const c = await load();
    el('err').hidden = false;
    await c.loc.start();
    expect(el('err').hidden).toBe(true);
    expect(unlockAudio).toHaveBeenCalledOnce();
    expect(compassMock.requestCompassPermission).not.toHaveBeenCalled();
    expect(compassMock.listenCompass).toHaveBeenCalledOnce();
    expect(el('sub').textContent).toBe(t.sub.searching);
    expect(c.opts()).toEqual({ enableHighAccuracy: true, maximumAge: 0, timeout: 20000 });
    expect(c.state.geoWatch).toBe(7);
  });

  it('requests compass permission when the API exists', async () => {
    compassMock.hasCompassPermissionApi.mockReturnValue(true);
    const c = await load();
    await c.loc.start();
    expect(compassMock.requestCompassPermission).toHaveBeenCalledOnce();
  });

  it('fails with geoUnavailable when geolocation is missing, after listening to compass', async () => {
    const c = await load({ geolocation: undefined });
    await c.loc.start();
    expect(compassMock.listenCompass).toHaveBeenCalledOnce();
    expect(el('err').textContent).toBe(t.errors.geoUnavailable);
    expect(el('err').hidden).toBe(false);
    expect(el('sub').textContent).toBe(t.readout.sub);
  });

  it('clears the previous watch on restart', async () => {
    const c = await load();
    await c.loc.start();
    await c.loc.start();
    expect(c.geolocation.clearWatch).toHaveBeenCalledWith(7);
    expect(c.geolocation.watchPosition).toHaveBeenCalledTimes(2);
  });

  it('does not clearWatch on first start', async () => {
    const c = await load();
    await c.loc.start();
    expect(c.geolocation.clearWatch).not.toHaveBeenCalled();
  });

  it('requests a screen wake lock when available', async () => {
    const request = vi.fn().mockResolvedValue({});
    const c = await load({ wakeLock: { request } });
    await c.loc.start();
    expect(request).toHaveBeenCalledWith('screen');
  });

  it('swallows wake lock rejection', async () => {
    const request = vi.fn().mockRejectedValue(new Error('no'));
    const c = await load({ wakeLock: { request } });
    await expect(c.loc.start()).resolves.toBeUndefined();
  });

  it('works without wakeLock', async () => {
    const c = await load();
    await expect(c.loc.start()).resolves.toBeUndefined();
  });
});

describe('watchPosition success', () => {
  it('far: km distance, toward sub, needle visible, buttons hidden, first fix snaps needle', async () => {
    const c = await load();
    await c.loc.start();
    el('go').hidden = false;
    el('fix').hidden = false;
    el('err').hidden = false;
    const me = { lat: 48.4647, lon: 35.0462 };
    c.ok(pos(me.lat, me.lon));
    const target = bearing(me, TEREMKY);
    expect(c.state.target).toBe(target);
    expect(c.state.shownNeedle).toBe(target);
    expect(el('needle').getAttribute('visibility')).toBe('visible');
    expect(el('dist').innerHTML).toBe(
      `${Math.round(distanceKm(me, TEREMKY)).toLocaleString('uk-UA')}<small>${t.units.km}</small>`,
    );
    expect(el('sub').textContent).toBe(t.sub.toward(Math.round(target)));
    expect(el('go').hidden).toBe(true);
    expect(el('fix').hidden).toBe(true);
    expect(el('err').hidden).toBe(true);
  });

  it('second fix does not snap shownNeedle', async () => {
    const c = await load();
    await c.loc.start();
    c.ok(pos(48.4647, 35.0462));
    const first = c.state.shownNeedle;
    c.ok(pos(50.0, 30.0));
    expect(c.state.shownNeedle).toBe(first);
    expect(c.state.target).not.toBe(first);
  });

  it('near (< 1 km): metres, but not yet arrived at 0.3 km or more', async () => {
    const c = await load();
    await c.loc.start();
    const me = { lat: TEREMKY.lat + 0.004, lon: TEREMKY.lon }; // ~445 m
    c.ok(pos(me.lat, me.lon));
    expect(el('dist').innerHTML).toBe(
      `${Math.round(distanceKm(me, TEREMKY) * 1000)}<small>${t.units.m}</small>`,
    );
    expect(el('sub').textContent).toBe(t.sub.toward(Math.round(c.state.target!)));
  });

  it('arrived (< 0.3 km): arrived sub', async () => {
    const c = await load();
    await c.loc.start();
    c.ok(pos(TEREMKY.lat + 0.001, TEREMKY.lon));
    expect(el('sub').textContent).toBe(t.sub.arrived);
    expect(el('dist').innerHTML).toContain(`<small>${t.units.m}</small>`);
  });
});

describe('watchPosition errors', () => {
  it('code 1 shows denied with message, reveals fix and retry', async () => {
    const c = await load();
    await c.loc.start();
    c.bad({ code: 1, message: 'blocked' });
    expect(el('err').textContent).toBe(t.errors.geoDenied('blocked'));
    expect(el('fix').hidden).toBe(false);
    expect(el('go').hidden).toBe(false);
    expect(el('go').textContent).toBe(t.buttons.retry);
  });

  it('code 1 with empty message uses fallback', async () => {
    const c = await load();
    await c.loc.start();
    c.bad({ code: 1, message: '' });
    expect(el('err').textContent).toBe(t.errors.geoDenied(t.errors.geoDeniedFallback));
  });

  it('code 3 shows timeout and retry, leaves fix hidden', async () => {
    const c = await load();
    await c.loc.start();
    c.bad({ code: 3, message: 'late' });
    expect(el('err').textContent).toBe(t.errors.geoTimeout);
    expect(el('go').hidden).toBe(false);
    expect(el('go').textContent).toBe(t.buttons.retry);
    expect(el('fix').hidden).toBe(true);
  });

  it('other codes show unknown with message and do not touch buttons', async () => {
    const c = await load();
    await c.loc.start();
    const goLabel = el('go').textContent;
    c.bad({ code: 2, message: 'weird' });
    expect(el('err').textContent).toBe(t.errors.geoUnknown('weird'));
    expect(el('go').textContent).toBe(goLabel);
    expect(el('fix').hidden).toBe(true);
  });

  it('other codes with empty message use fallback', async () => {
    const c = await load();
    await c.loc.start();
    c.bad({ code: 2, message: '' });
    expect(el('err').textContent).toBe(t.errors.geoUnknown(t.errors.geoUnknownFallback));
  });
});
