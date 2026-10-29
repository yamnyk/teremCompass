import { describe, expect, it, vi } from 'vitest';

const h = vi.hoisted(() => ({ calls: [] as string[], start: vi.fn() }));

vi.mock('./celebrate/confetti', () => ({ initFx: () => h.calls.push('initFx') }));
vi.mock('./demo', () => ({ initDemo: () => h.calls.push('initDemo') }));
vi.mock('./install', () => ({ initInstall: () => h.calls.push('initInstall') }));
vi.mock('./loop', () => ({ startLoop: () => h.calls.push('startLoop') }));
vi.mock('./sensors/location', () => ({ start: () => h.start() }));
vi.mock('./sw-register', () => ({ registerSW: () => h.calls.push('registerSW') }));
vi.mock('./ui/sheet', () => ({ initSheet: () => h.calls.push('initSheet') }));
vi.mock('./ui/dial', () => ({ buildTicks: () => h.calls.push('buildTicks') }));
vi.mock('./ui/app', () => ({
  renderApp: () => {
    h.calls.push('renderApp');
    document.body.innerHTML = '<button id="go"></button>';
  },
}));

describe('main', () => {
  it('boots modules in order and wires the go button to start', async () => {
    await import('./main');

    expect(h.calls).toEqual([
      'renderApp',
      'buildTicks',
      'initFx',
      'startLoop',
      'initSheet',
      'initInstall',
      'initDemo',
      'registerSW',
    ]);
    expect(h.start).not.toHaveBeenCalled();
    document.getElementById('go')!.click();
    expect(h.start).toHaveBeenCalledOnce();
  });
});
