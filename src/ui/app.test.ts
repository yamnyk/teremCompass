import { describe, it, expect, beforeEach } from 'vitest';
import { renderApp } from './app';
import { $ } from '../lib/dom';
import { t } from '../i18n';

const KEY_IDS = [
  'go',
  'dist',
  'hint',
  'sub',
  'err',
  'fix',
  'install',
  'sheet',
  'steps',
  'sheetClose',
  'flash',
  'boom',
  'fx',
  'rose',
  'needle',
  'ticks',
  'ringOuter',
];

beforeEach(() => {
  document.body.innerHTML = '';
});

describe('renderApp', () => {
  it('injects every key element id into the body', () => {
    renderApp();
    for (const id of KEY_IDS) {
      expect(document.getElementById(id), id).not.toBeNull();
    }
  });

  it('renders the title as an h1 first', () => {
    renderApp();
    const h1 = document.querySelector('body > h1');
    expect(h1?.textContent).toBe(t.title);
  });

  it('sets initial texts from t', () => {
    renderApp();
    expect($('go').textContent).toBe(t.buttons.go);
    expect($('fix').textContent).toBe(t.buttons.fix);
    expect($('install').textContent).toBe(t.buttons.install);
    expect($('sheetClose').textContent).toBe(t.buttons.sheetClose);
    expect($('dist').textContent).toBe(t.readout.distEmpty);
    expect($('sub').textContent).toBe(t.readout.sub);
    expect($('sheetT').textContent).toBe(t.sheet.title);
    expect($('warn').textContent).toBe(t.sheet.warn);
  });

  it('starts with an empty hint and empty error', () => {
    renderApp();
    expect($('hint').textContent).toBe('');
    expect($('err').textContent).toBe('');
  });

  it('keeps err, fix, install and sheet hidden', () => {
    renderApp();
    expect($('err').hidden).toBe(true);
    expect($('fix').hidden).toBe(true);
    expect($('install').hidden).toBe(true);
    expect($('sheet').hidden).toBe(true);
  });

  it('keeps the go button visible (not hidden)', () => {
    renderApp();
    expect($('go').hidden).toBe(false);
  });

  it('starts the needle group with visibility="hidden"', () => {
    renderApp();
    expect($('needle').getAttribute('visibility')).toBe('hidden');
  });

  it('places the ticks group inside the rose group', () => {
    renderApp();
    expect($('ticks').parentElement?.id).toBe('rose');
  });

  it('inserts markup into body, keeping the pre-existing script as the last child', () => {
    document.body.innerHTML = '<script id="entry"></script>';
    renderApp();
    // happy-dom reverses the order of multi-node afterbegin inserts (browsers keep it),
    // so only membership and the anchored last child are asserted here.
    const top = [...document.body.children].map((c) => c.tagName);
    expect(top).toContain('H1');
    expect(top).toContain('CANVAS');
    expect(document.body.lastElementChild?.id).toBe('entry');
  });
});
