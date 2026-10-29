import { beforeEach, describe, expect, it, vi } from "vitest";
import { t } from "../i18n";

async function load() {
  vi.resetModules();
  const { renderApp } = await import("../ui/app");
  document.body.innerHTML = "";
  renderApp();
  const compass = await import("./compass");
  const { state } = await import("../state");
  return { compass, state };
}

const err = () => document.getElementById("err")!;

function orient(type: string, props: Record<string, unknown>) {
  const e = new Event(type);
  Object.assign(e, props);
  window.dispatchEvent(e);
}

describe("compass permission", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  it("hasCompassPermissionApi is false when DeviceOrientationEvent is missing", async () => {
    vi.stubGlobal("DeviceOrientationEvent", undefined);
    const { compass } = await load();
    expect(compass.hasCompassPermissionApi()).toBe(false);
  });

  it("is false when requestPermission is absent", async () => {
    vi.stubGlobal("DeviceOrientationEvent", class {});
    const { compass } = await load();
    expect(compass.hasCompassPermissionApi()).toBe(false);
  });

  it("is true when requestPermission is a function", async () => {
    vi.stubGlobal("DeviceOrientationEvent", { requestPermission: vi.fn() });
    const { compass } = await load();
    expect(compass.hasCompassPermissionApi()).toBe(true);
  });

  it("granted shows no error", async () => {
    const requestPermission = vi.fn().mockResolvedValue("granted");
    vi.stubGlobal("DeviceOrientationEvent", { requestPermission });
    const { compass } = await load();
    await compass.requestCompassPermission();
    expect(requestPermission).toHaveBeenCalledOnce();
    expect(err().hidden).toBe(true);
  });

  it("denied shows compassDenied", async () => {
    vi.stubGlobal("DeviceOrientationEvent", {
      requestPermission: vi.fn().mockResolvedValue("denied"),
    });
    const { compass } = await load();
    await compass.requestCompassPermission();
    expect(err().textContent).toBe(t.errors.compassDenied);
    expect(err().hidden).toBe(false);
  });

  it("throwing shows compassRequestFailed", async () => {
    vi.stubGlobal("DeviceOrientationEvent", {
      requestPermission: vi.fn().mockRejectedValue(new Error("x")),
    });
    const { compass } = await load();
    await compass.requestCompassPermission();
    expect(err().textContent).toBe(t.errors.compassRequestFailed);
  });
});

describe("listenCompass", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.stubGlobal("screen", { orientation: { angle: 0 } });
  });

  it("iOS: uses webkitCompassHeading", async () => {
    const { compass, state } = await load();
    compass.listenCompass();
    vi.setSystemTime(5000);
    orient("deviceorientation", { webkitCompassHeading: 123 });
    expect(state.heading).toBe(123);
    expect(state.lastOrient).toBe(5000);
  });

  it("iOS: heading 0 is accepted", async () => {
    const { compass, state } = await load();
    compass.listenCompass();
    orient("deviceorientation", { webkitCompassHeading: 0 });
    expect(state.heading).toBe(0);
  });

  it("negative webkitCompassHeading falls through to absolute+alpha", async () => {
    const { compass, state } = await load();
    compass.listenCompass();
    orient("deviceorientation", {
      webkitCompassHeading: -1,
      absolute: true,
      alpha: 90,
    });
    expect(state.heading).toBe(270);
  });

  it("Android: absolute + alpha gives 360 - alpha", async () => {
    const { compass, state } = await load();
    compass.listenCompass();
    orient("deviceorientationabsolute", { absolute: true, alpha: 100 });
    expect(state.heading).toBe(260);
  });

  it("Android: alpha 0 gives 0 after wrapping", async () => {
    const { compass, state } = await load();
    compass.listenCompass();
    orient("deviceorientation", { absolute: true, alpha: 0 });
    expect(state.heading).toBe(0);
  });

  it("ignores non-absolute events", async () => {
    const { compass, state } = await load();
    compass.listenCompass();
    orient("deviceorientation", { absolute: false, alpha: 100 });
    expect(state.heading).toBeNull();
    expect(state.lastOrient).toBe(0);
  });

  it("ignores absolute events with null alpha", async () => {
    const { compass, state } = await load();
    compass.listenCompass();
    orient("deviceorientation", { absolute: true, alpha: null });
    expect(state.heading).toBeNull();
  });

  it("ignores NaN heading", async () => {
    const { compass, state } = await load();
    compass.listenCompass();
    orient("deviceorientation", { webkitCompassHeading: NaN });
    expect(state.heading).toBeNull();
  });

  it("adds screen.orientation.angle and wraps", async () => {
    vi.stubGlobal("screen", { orientation: { angle: 90 } });
    const { compass, state } = await load();
    compass.listenCompass();
    orient("deviceorientation", { webkitCompassHeading: 300 });
    expect(state.heading).toBe(30);
  });

  it("falls back to window.orientation when screen.orientation is missing", async () => {
    vi.stubGlobal("screen", {});
    vi.stubGlobal("orientation", -90);
    const { compass, state } = await load();
    compass.listenCompass();
    orient("deviceorientation", { webkitCompassHeading: 10 });
    expect(state.heading).toBe(280);
  });

  it("uses 0 offset when neither orientation source exists", async () => {
    vi.stubGlobal("screen", {});
    const { compass, state } = await load();
    compass.listenCompass();
    orient("deviceorientation", { webkitCompassHeading: 10 });
    expect(state.heading).toBe(10);
  });

  it("fails with compassSilent after 3 s of silence", async () => {
    const { compass } = await load();
    compass.listenCompass();
    vi.advanceTimersByTime(2999);
    expect(err().hidden).toBe(true);
    vi.advanceTimersByTime(1);
    expect(err().textContent).toBe(t.errors.compassSilent);
    expect(err().hidden).toBe(false);
  });

  it("does not fail if an event arrived before 3 s", async () => {
    const { compass } = await load();
    compass.listenCompass();
    vi.setSystemTime(1000);
    orient("deviceorientation", { webkitCompassHeading: 50 });
    vi.advanceTimersByTime(3000);
    expect(err().hidden).toBe(true);
  });
});
