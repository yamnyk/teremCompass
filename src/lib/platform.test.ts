import { describe, it, expect, afterEach, vi } from 'vitest';

interface Env {
  ua?: string;
  platform?: string;
  maxTouchPoints?: number;
  standalone?: boolean;
  displayStandalone?: boolean;
  reduceMotion?: boolean;
}

const UA_IPHONE =
  'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1';
const UA_IPAD_DESKTOP_MODE =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15';
const UA_ANDROID =
  'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36';
const UA_DESKTOP =
  'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

// platform.ts evaluates everything at import time, so each case stubs the globals
// first, resets the module registry and imports it fresh.
async function loadPlatform(env: Env) {
  vi.resetModules();
  vi.stubGlobal('navigator', {
    userAgent: env.ua ?? UA_DESKTOP,
    platform: env.platform ?? '',
    maxTouchPoints: env.maxTouchPoints ?? 0,
    standalone: env.standalone,
  });
  vi.stubGlobal(
    'matchMedia',
    vi.fn((query: string) => ({
      matches:
        (query === '(display-mode: standalone)' && !!env.displayStandalone) ||
        (query === '(prefers-reduced-motion: reduce)' && !!env.reduceMotion),
      media: query,
    })),
  );
  return import('./platform');
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('isIOS', () => {
  it('is true for an iPhone user agent', async () => {
    const p = await loadPlatform({ ua: UA_IPHONE });
    expect(p.isIOS).toBe(true);
    expect(p.isAndroid).toBe(false);
  });

  it('is true for an iPad user agent', async () => {
    const p = await loadPlatform({ ua: 'Mozilla/5.0 (iPad; CPU OS 17_0 like Mac OS X)' });
    expect(p.isIOS).toBe(true);
  });

  it('is true for an iPod user agent', async () => {
    const p = await loadPlatform({ ua: 'Mozilla/5.0 (iPod touch; CPU iPhone OS 15_0)' });
    expect(p.isIOS).toBe(true);
  });

  it('is true for iPadOS in desktop mode (MacIntel with multi-touch)', async () => {
    const p = await loadPlatform({
      ua: UA_IPAD_DESKTOP_MODE,
      platform: 'MacIntel',
      maxTouchPoints: 5,
    });
    expect(p.isIOS).toBe(true);
  });

  it('is false for a real Mac (MacIntel without touch points)', async () => {
    const p = await loadPlatform({ ua: UA_IPAD_DESKTOP_MODE, platform: 'MacIntel' });
    expect(p.isIOS).toBe(false);
  });

  it('is false for MacIntel with exactly one touch point (threshold is > 1)', async () => {
    const p = await loadPlatform({
      ua: UA_IPAD_DESKTOP_MODE,
      platform: 'MacIntel',
      maxTouchPoints: 1,
    });
    expect(p.isIOS).toBe(false);
  });

  it('is false for a non-Mac platform with touch points (e.g. Windows touch laptop)', async () => {
    const p = await loadPlatform({ ua: UA_DESKTOP, platform: 'Win32', maxTouchPoints: 10 });
    expect(p.isIOS).toBe(false);
  });
});

describe('isAndroid', () => {
  it('is true for an Android user agent and not iOS', async () => {
    const p = await loadPlatform({ ua: UA_ANDROID });
    expect(p.isAndroid).toBe(true);
    expect(p.isIOS).toBe(false);
  });

  it('is false for desktop user agents', async () => {
    const p = await loadPlatform({ ua: UA_DESKTOP });
    expect(p.isAndroid).toBe(false);
    expect(p.isIOS).toBe(false);
  });
});

describe('ua', () => {
  it('exposes navigator.userAgent verbatim', async () => {
    const p = await loadPlatform({ ua: UA_IPHONE });
    expect(p.ua).toBe(UA_IPHONE);
  });
});

describe('isStandalone', () => {
  it('is true when display-mode: standalone matches', async () => {
    const p = await loadPlatform({ displayStandalone: true });
    expect(p.isStandalone).toBe(true);
  });

  it('is true when navigator.standalone === true (iOS legacy) even if media query does not match', async () => {
    const p = await loadPlatform({ standalone: true });
    expect(p.isStandalone).toBe(true);
  });

  it('is false when neither signal is set', async () => {
    const p = await loadPlatform({});
    expect(p.isStandalone).toBe(false);
  });

  it('is false when navigator.standalone is false', async () => {
    const p = await loadPlatform({ standalone: false });
    expect(p.isStandalone).toBe(false);
  });

  it('ignores truthy non-true navigator.standalone values (strict === true)', async () => {
    const p = await loadPlatform({ standalone: 1 as unknown as boolean });
    expect(p.isStandalone).toBe(false);
  });
});

describe('reduce', () => {
  it('is true when prefers-reduced-motion matches', async () => {
    const p = await loadPlatform({ reduceMotion: true });
    expect(p.reduce).toBe(true);
  });

  it('is false when prefers-reduced-motion does not match', async () => {
    const p = await loadPlatform({});
    expect(p.reduce).toBe(false);
  });

  it('queries the exact media feature string', async () => {
    await loadPlatform({});
    expect(vi.mocked(globalThis.matchMedia)).toHaveBeenCalledWith(
      '(prefers-reduced-motion: reduce)',
    );
    expect(vi.mocked(globalThis.matchMedia)).toHaveBeenCalledWith('(display-mode: standalone)');
  });
});
