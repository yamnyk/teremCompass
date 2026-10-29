import { describe, it, expect } from 'vitest';
import { rad, deg, norm, bearing, distanceKm } from './geo';
import { TEREMKY } from '../config';

const KYIV_CENTER = { lat: 50.4501, lon: 30.5234 };
const EQUATOR = { lat: 0, lon: 0 };

describe('rad / deg', () => {
  it('roundtrips degrees through radians', () => {
    for (const x of [0, 1, 45, 90, 180, -135, 359.5]) {
      expect(deg(rad(x))).toBeCloseTo(x, 10);
    }
  });

  it('converts 180 degrees to PI radians', () => {
    expect(rad(180)).toBeCloseTo(Math.PI, 12);
  });
});

describe('norm', () => {
  it('wraps values into [-180, 180)', () => {
    expect(norm(190)).toBe(-170);
    expect(norm(-190)).toBe(170);
    expect(norm(360)).toBe(0);
    expect(norm(540)).toBe(-180);
  });

  it('keeps in-range values unchanged', () => {
    expect(norm(0)).toBe(0);
    expect(norm(90)).toBe(90);
    expect(norm(-90)).toBe(-90);
    expect(norm(179)).toBe(179);
  });

  it('always returns a value in [-180, 180) congruent mod 360', () => {
    for (let a = -1000; a <= 1000; a += 7.3) {
      const n = norm(a);
      expect(n).toBeGreaterThanOrEqual(-180);
      expect(n).toBeLessThan(180);
      const diff = (a - n) / 360;
      expect(Math.abs(diff - Math.round(diff))).toBeLessThan(1e-9);
    }
  });
});

describe('bearing', () => {
  it('due north is ~0 degrees', () => {
    expect(bearing(EQUATOR, { lat: 1, lon: 0 })).toBeCloseTo(0, 6);
  });

  it('due east is ~90 degrees (equator)', () => {
    expect(bearing(EQUATOR, { lat: 0, lon: 1 })).toBeCloseTo(90, 6);
  });

  it('due south is ~180 degrees', () => {
    expect(bearing(EQUATOR, { lat: -1, lon: 0 })).toBeCloseTo(180, 6);
  });

  it('due west is ~270 degrees', () => {
    expect(bearing(EQUATOR, { lat: 0, lon: -1 })).toBeCloseTo(270, 6);
  });

  it('Kyiv center to TEREMKY points south-west (200-250 degrees)', () => {
    const b = bearing(KYIV_CENTER, TEREMKY);
    expect(b).toBeGreaterThan(200);
    expect(b).toBeLessThan(250);
  });
});

describe('distanceKm', () => {
  it('is 0 for the same point', () => {
    expect(distanceKm(TEREMKY, TEREMKY)).toBe(0);
    expect(distanceKm(KYIV_CENTER, KYIV_CENTER)).toBe(0);
  });

  it('Kyiv center to TEREMKY is ~10.5 km (+/- 1.5)', () => {
    const d = distanceKm(KYIV_CENTER, TEREMKY);
    expect(d).toBeGreaterThan(9);
    expect(d).toBeLessThan(12);
  });

  it('is symmetric', () => {
    expect(distanceKm(KYIV_CENTER, TEREMKY)).toBeCloseTo(distanceKm(TEREMKY, KYIV_CENTER), 9);
  });

  it('one degree of latitude is ~111.2 km', () => {
    expect(distanceKm(EQUATOR, { lat: 1, lon: 0 })).toBeCloseTo(111.19, 1);
  });
});
