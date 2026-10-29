import { describe, it, expect } from 'vitest';
import { t } from '.';
import { SHARE, DOTS } from '../ui/icons';
import type { StepsPlatform } from './uk';

const UA_IOS_CHROME =
  'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/120.0.6099.119 Mobile/15E148 Safari/604.1';
const UA_IOS_SAFARI =
  'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1';
const UA_ANDROID =
  'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36';
const UA_DESKTOP =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15';

const iosChrome: StepsPlatform = { ua: UA_IOS_CHROME, isIOS: true, isAndroid: false };
const ios: StepsPlatform = { ua: UA_IOS_SAFARI, isIOS: true, isAndroid: false };
const android: StepsPlatform = { ua: UA_ANDROID, isIOS: false, isAndroid: true };
const desktop: StepsPlatform = { ua: UA_DESKTOP, isIOS: false, isAndroid: false };

const icons = { SHARE, DOTS };

function expectNonEmptyStrings(items: string[]) {
  for (const item of items) {
    expect(typeof item).toBe('string');
    expect(item.trim().length).toBeGreaterThan(0);
  }
}

describe('installSteps', () => {
  it('iOS Chrome: 3 non-empty steps', () => {
    const steps = t.installSteps(iosChrome, icons);
    expect(steps).toHaveLength(3);
    expectNonEmptyStrings(steps);
  });

  it('iOS Safari: 3 non-empty steps', () => {
    const steps = t.installSteps(ios, icons);
    expect(steps).toHaveLength(3);
    expectNonEmptyStrings(steps);
  });

  it('Android: 3 non-empty steps', () => {
    const steps = t.installSteps(android, icons);
    expect(steps).toHaveLength(3);
    expectNonEmptyStrings(steps);
  });

  it('desktop: 3 non-empty steps', () => {
    const steps = t.installSteps(desktop, icons);
    expect(steps).toHaveLength(3);
    expectNonEmptyStrings(steps);
  });
});

describe('geoFixSteps', () => {
  it('iOS Chrome: 3 non-empty steps', () => {
    const steps = t.geoFixSteps(iosChrome);
    expect(steps).toHaveLength(3);
    expectNonEmptyStrings(steps);
  });

  it('iOS Safari: 3 non-empty steps', () => {
    const steps = t.geoFixSteps(ios);
    expect(steps).toHaveLength(3);
    expectNonEmptyStrings(steps);
  });

  it('Android: 3 non-empty steps', () => {
    const steps = t.geoFixSteps(android);
    expect(steps).toHaveLength(3);
    expectNonEmptyStrings(steps);
  });

  it('desktop: 1 non-empty step', () => {
    const steps = t.geoFixSteps(desktop);
    expect(steps).toHaveLength(1);
    expectNonEmptyStrings(steps);
  });
});
