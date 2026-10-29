import { describe, it, expect } from 'vitest';
import { hintText } from '../src/ui/hint';
import { t } from '../src/i18n';

describe('hintText', () => {
  it('locked returns the locked string regardless of direction or angle', () => {
    expect(hintText(true, 0, 0)).toBe(t.hint.locked);
    expect(hintText(true, 50, 3)).toBe(t.hint.locked);
    expect(hintText(true, -50, 200)).toBe(t.hint.locked);
  });

  it('a < 25 right: almost(true)', () => {
    expect(hintText(false, 10, 10)).toBe(t.hint.almost(true));
  });

  it('a < 25 left: almost(false)', () => {
    expect(hintText(false, -10, 10)).toBe(t.hint.almost(false));
  });

  it('a < 25 with off = 0 counts as left', () => {
    expect(hintText(false, 0, 10)).toBe(t.hint.almost(false));
  });

  it('25 <= a < 90 right: warmer(true, rounded a)', () => {
    const out = hintText(false, 10, 45.6);
    expect(out).toBe(t.hint.warmer(true, 46));
    expect(out).toContain('46°');
  });

  it('25 <= a < 90 left: warmer(false, rounded a)', () => {
    const out = hintText(false, -10, 60.2);
    expect(out).toBe(t.hint.warmer(false, 60));
    expect(out).toContain('60°');
  });

  it('a >= 90 right: cold(true, rounded a)', () => {
    const out = hintText(false, 10, 120.4);
    expect(out).toBe(t.hint.cold(true, 120));
    expect(out).toContain('120°');
  });

  it('a >= 90 left: cold(false, rounded a)', () => {
    const out = hintText(false, -10, 179.6);
    expect(out).toBe(t.hint.cold(false, 180));
    expect(out).toContain('180°');
  });

  it('boundaries: 25 falls in warmer, 90 falls in cold', () => {
    expect(hintText(false, 1, 25)).toBe(t.hint.warmer(true, 25));
    expect(hintText(false, 1, 90)).toBe(t.hint.cold(true, 90));
    expect(hintText(false, 1, 24.9)).toBe(t.hint.almost(true));
  });
});
