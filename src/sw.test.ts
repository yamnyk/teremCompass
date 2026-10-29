// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

type Handler = (e: Record<string, unknown>) => void;

async function load(manifest: Array<{ url: string; revision: string | null }>) {
  const handlers: Record<string, Handler> = {};
  const skipWaiting = vi.fn();
  const claim = vi.fn().mockResolvedValue(undefined);
  vi.stubGlobal('self', {
    addEventListener: (type: string, h: Handler) => {
      handlers[type] = h;
    },
    skipWaiting,
    clients: { claim },
    __WB_MANIFEST: manifest,
  });
  const cache = {
    addAll: vi.fn().mockResolvedValue(undefined),
    put: vi.fn().mockResolvedValue(undefined),
  };
  const caches = {
    open: vi.fn().mockResolvedValue(cache),
    keys: vi.fn().mockResolvedValue([]),
    delete: vi.fn().mockResolvedValue(true),
    match: vi.fn(),
  };
  vi.stubGlobal('caches', caches);
  const fetchMock = vi.fn();
  vi.stubGlobal('fetch', fetchMock);
  vi.resetModules();
  await import('./sw');
  return { handlers, skipWaiting, claim, cache, caches, fetchMock };
}

describe('service worker', () => {
  beforeEach(() => {
    vi.resetModules();
  });
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('install: caches teremky-v5 with "./" first and deduped manifest urls, skips waiting', async () => {
    const m = await load([
      { url: 'index.html', revision: 'a' },
      { url: './', revision: null },
      { url: 'index.html', revision: 'b' },
      { url: 'a.js', revision: null },
    ]);
    let waited: Promise<unknown> | undefined;
    m.handlers.install!({ waitUntil: (p: Promise<unknown>) => (waited = p) });
    await waited;
    expect(m.caches.open).toHaveBeenCalledWith('teremky-v5');
    expect(m.cache.addAll).toHaveBeenCalledWith(['./', 'index.html', 'a.js']);
    expect(m.skipWaiting).toHaveBeenCalledOnce();
  });

  it('install with empty manifest caches only "./"', async () => {
    const m = await load([]);
    let waited: Promise<unknown> | undefined;
    m.handlers.install!({ waitUntil: (p: Promise<unknown>) => (waited = p) });
    await waited;
    expect(m.cache.addAll).toHaveBeenCalledWith(['./']);
  });

  it('activate: deletes other caches, keeps current, claims clients', async () => {
    const m = await load([]);
    m.caches.keys.mockResolvedValue(['teremky-v4', 'teremky-v5', 'other']);
    let waited: Promise<unknown> | undefined;
    m.handlers.activate!({ waitUntil: (p: Promise<unknown>) => (waited = p) });
    await waited;
    expect(m.caches.delete).toHaveBeenCalledTimes(2);
    expect(m.caches.delete).toHaveBeenCalledWith('teremky-v4');
    expect(m.caches.delete).toHaveBeenCalledWith('other');
    expect(m.claim).toHaveBeenCalledOnce();
  });

  it('fetch: ignores non-GET', async () => {
    const m = await load([]);
    const respondWith = vi.fn();
    m.handlers.fetch!({ request: { method: 'POST' }, respondWith });
    expect(respondWith).not.toHaveBeenCalled();
    expect(m.fetchMock).not.toHaveBeenCalled();
  });

  it('fetch: network-first, returns the response and stores a clone', async () => {
    const m = await load([]);
    const copy = { copy: true };
    const res = { clone: () => copy };
    m.fetchMock.mockResolvedValue(res);
    const request = { method: 'GET', url: 'u' };
    let p: Promise<unknown> | undefined;
    m.handlers.fetch!({ request, respondWith: (x: Promise<unknown>) => (p = x) });
    expect(await p).toBe(res);
    expect(m.fetchMock).toHaveBeenCalledWith(request);
    expect(m.caches.open).toHaveBeenCalledWith('teremky-v5');
    await vi.waitFor(() => expect(m.cache.put).toHaveBeenCalledWith(request, copy));
    expect(m.caches.match).not.toHaveBeenCalled();
  });

  it('fetch: offline falls back to caches.match', async () => {
    const m = await load([]);
    const cached = { cached: true };
    m.fetchMock.mockRejectedValue(new Error('offline'));
    m.caches.match.mockResolvedValue(cached);
    const request = { method: 'GET', url: 'u' };
    let p: Promise<unknown> | undefined;
    m.handlers.fetch!({ request, respondWith: (x: Promise<unknown>) => (p = x) });
    expect(await p).toBe(cached);
    expect(m.caches.match).toHaveBeenCalledWith(request);
    expect(m.cache.put).not.toHaveBeenCalled();
  });
});
