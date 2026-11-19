import { describe, it, expect } from "vitest";
import { t } from ".";
import { SHARE, DOTS } from "../ui/icons";
import type { StepsPlatform } from "./uk";

const UA_IOS_CHROME =
  "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/120.0.6099.119 Mobile/15E148 Safari/604.1";
const UA_IOS_SAFARI =
  "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1";
const UA_ANDROID =
  "Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36";
const UA_DESKTOP =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15";

const iosChrome: StepsPlatform = {
  ua: UA_IOS_CHROME,
  isIOS: true,
  isAndroid: false,
};
const ios: StepsPlatform = { ua: UA_IOS_SAFARI, isIOS: true, isAndroid: false };
const android: StepsPlatform = {
  ua: UA_ANDROID,
  isIOS: false,
  isAndroid: true,
};
const desktop: StepsPlatform = {
  ua: UA_DESKTOP,
  isIOS: false,
  isAndroid: false,
};

const icons = { SHARE, DOTS };

function expectNonEmptyStrings(items: string[]) {
  for (const item of items) {
    expect(typeof item).toBe("string");
    expect(item.trim().length).toBeGreaterThan(0);
  }
}

describe("installSteps", () => {
  it("iOS Chrome: 3 non-empty steps", () => {
    const steps = t.installSteps(iosChrome, icons);
    expect(steps).toHaveLength(3);
    expectNonEmptyStrings(steps);
  });

  it("iOS Safari: 3 non-empty steps", () => {
    const steps = t.installSteps(ios, icons);
    expect(steps).toHaveLength(3);
    expectNonEmptyStrings(steps);
  });

  it("Android: 3 non-empty steps", () => {
    const steps = t.installSteps(android, icons);
    expect(steps).toHaveLength(3);
    expectNonEmptyStrings(steps);
  });

  it("desktop: 3 non-empty steps", () => {
    const steps = t.installSteps(desktop, icons);
    expect(steps).toHaveLength(3);
    expectNonEmptyStrings(steps);
  });
});

describe("geoFixSteps", () => {
  it("iOS Chrome: 3 non-empty steps", () => {
    const steps = t.geoFixSteps(iosChrome);
    expect(steps).toHaveLength(3);
    expectNonEmptyStrings(steps);
  });

  it("iOS Safari: 3 non-empty steps", () => {
    const steps = t.geoFixSteps(ios);
    expect(steps).toHaveLength(3);
    expectNonEmptyStrings(steps);
  });

  it("Android: 3 non-empty steps", () => {
    const steps = t.geoFixSteps(android);
    expect(steps).toHaveLength(3);
    expectNonEmptyStrings(steps);
  });

  it("desktop: 1 non-empty step", () => {
    const steps = t.geoFixSteps(desktop);
    expect(steps).toHaveLength(1);
    expectNonEmptyStrings(steps);
  });
});

describe("step platform branching", () => {
  it("iOS Chrome (CriOS) differs from iOS Safari for both step lists", () => {
    expect(t.geoFixSteps(iosChrome)).not.toEqual(t.geoFixSteps(ios));
    expect(t.installSteps(iosChrome, icons)).not.toEqual(
      t.installSteps(ios, icons),
    );
  });

  it("CriOS UA without isIOS falls through to the Android/desktop branches", () => {
    const notIosButChrome: StepsPlatform = {
      ua: UA_IOS_CHROME,
      isIOS: false,
      isAndroid: true,
    };
    expect(t.geoFixSteps(notIosButChrome)).toEqual(t.geoFixSteps(android));
    expect(t.installSteps(notIosButChrome, icons)).toEqual(
      t.installSteps(android, icons),
    );
  });

  it("iOS (non-Chrome) and Android differ from each other and from desktop", () => {
    expect(t.geoFixSteps(ios)).not.toEqual(t.geoFixSteps(android));
    expect(t.geoFixSteps(android)).not.toEqual(t.geoFixSteps(desktop));
    expect(t.installSteps(android, icons)).not.toEqual(
      t.installSteps(desktop, icons),
    );
  });

  it("iOS Safari with isAndroid=true still takes the iOS branch (isIOS checked first)", () => {
    const both: StepsPlatform = {
      ua: UA_IOS_SAFARI,
      isIOS: true,
      isAndroid: true,
    };
    expect(t.installSteps(both, icons)).toEqual(t.installSteps(ios, icons));
    expect(t.geoFixSteps(both)).toEqual(t.geoFixSteps(ios));
  });
});

describe("installSteps icon interpolation", () => {
  it("iOS steps embed the SHARE icon, not DOTS", () => {
    for (const p of [iosChrome, ios]) {
      const steps = t.installSteps(p, icons);
      expect(steps[0]).toContain(SHARE);
      expect(steps[0]).not.toContain(DOTS);
    }
  });

  it("Android steps embed the DOTS icon, not SHARE", () => {
    const steps = t.installSteps(android, icons);
    expect(steps[0]).toContain(DOTS);
    expect(steps.join("")).not.toContain(SHARE);
  });

  it("desktop embeds DOTS in the second step only", () => {
    const steps = t.installSteps(desktop, icons);
    expect(steps[0]).not.toContain(DOTS);
    expect(steps[1]).toContain(DOTS);
    expect(steps[2]).not.toContain(DOTS);
  });

  it("uses whatever icon markup the caller passes", () => {
    const custom = { SHARE: "<i>S</i>", DOTS: "<i>D</i>" };
    expect(t.installSteps(ios, custom)[0]).toContain("<i>S</i>");
    expect(t.installSteps(android, custom)[0]).toContain("<i>D</i>");
  });
});

describe("geoFixSteps markup", () => {
  it("desktop has a single step and no icon placeholders", () => {
    const [only] = t.geoFixSteps(desktop);
    expect(t.geoFixSteps(desktop)).toHaveLength(1);
    expect(only).not.toContain("undefined");
  });

  it('every step is HTML-safe to inject as innerHTML (no unbalanced "undefined")', () => {
    for (const p of [iosChrome, ios, android, desktop]) {
      for (const s of t.geoFixSteps(p)) expect(s).not.toContain("undefined");
      for (const s of t.installSteps(p, icons))
        expect(s).not.toContain("undefined");
    }
  });
});

describe("message functions", () => {
  it("geoDenied interpolates the message", () => {
    expect(t.errors.geoDenied("XYZ")).toContain("(XYZ)");
    expect(t.errors.geoDenied(t.errors.geoDeniedFallback)).toContain(
      t.errors.geoDeniedFallback,
    );
  });

  it("geoUnknown interpolates the message and differs per message", () => {
    expect(t.errors.geoUnknown("ABC")).toContain("ABC");
    expect(t.errors.geoUnknown("one")).not.toBe(t.errors.geoUnknown("two"));
  });

  it("fallback strings are returned as stored", () => {
    expect(t.errors.geoUnknownFallback).toBe(
      t.errors.geoUnknownFallback.trim(),
    );
    expect(t.errors.geoUnknownFallback.length).toBeGreaterThan(0);
  });

  it("hint.almost / warmer / cold depend on direction", () => {
    expect(t.hint.almost(true)).not.toBe(t.hint.almost(false));
    expect(t.hint.warmer(true, 30)).not.toBe(t.hint.warmer(false, 30));
    expect(t.hint.cold(true, 120)).not.toBe(t.hint.cold(false, 120));
  });

  it("hint.warmer / cold include the rounded-by-caller angle verbatim", () => {
    expect(t.hint.warmer(true, 46)).toContain("46°");
    expect(t.hint.cold(false, 120)).toContain("120°");
  });

  it("sub.toward includes the azimuth with a degree sign", () => {
    expect(t.sub.toward(247)).toContain("247°");
  });

  it("cheers has twenty unique entries, all non-empty", () => {
    expect(t.cheers).toHaveLength(20);
    expect(new Set(t.cheers).size).toBe(20);
    for (const c of t.cheers) expect(c.length).toBeGreaterThan(0);
  });

  it("sub.towardMasked hides the azimuth", () => {
    expect(t.sub.towardMasked).toContain("****");
    expect(t.sub.towardMasked).not.toMatch(/\d/);
  });

  it("route and eye strings are non-empty", () => {
    expect(t.buttons.route).toBe("Прокласти маршрут");
    expect(t.eye.hide.length).toBeGreaterThan(0);
    expect(t.eye.show).not.toBe(t.eye.hide);
  });

  it("update.stuckSteps differs per platform and always has steps", () => {
    const ios = t.update.stuckSteps({ ua: "", isIOS: true, isAndroid: false });
    const android = t.update.stuckSteps({
      ua: "",
      isIOS: false,
      isAndroid: true,
    });
    const desktop = t.update.stuckSteps({
      ua: "",
      isIOS: false,
      isAndroid: false,
    });
    for (const steps of [ios, android, desktop])
      expect(steps.length).toBeGreaterThan(0);
    expect(new Set([ios.join(), android.join(), desktop.join()]).size).toBe(3);
  });

  it("whatsNew releases have unique ids and non-empty entries", () => {
    const ids = t.whatsNew.releases.map((r) => r.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const r of t.whatsNew.releases) {
      expect(r.entries.length).toBeGreaterThan(0);
      for (const e of r.entries) {
        expect(e.title.length).toBeGreaterThan(0);
        expect(e.text.length).toBeGreaterThan(0);
      }
    }
  });

  it("units are exposed as stored", () => {
    expect(t.units.m).toBe(t.units.m.trim());
    expect(t.units.km).not.toBe(t.units.m);
  });
});
