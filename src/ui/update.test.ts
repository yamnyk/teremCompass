import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { t } from "../i18n";
import { $ } from "../lib/dom";

const live = (id: string) =>
  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue({ ok: true, json: async () => ({ id }) }),
  );

async function load() {
  vi.resetModules();
  sessionStorage.clear();
  document.body.innerHTML = "";
  const { renderApp } = await import("./app");
  renderApp();
  return import("./update");
}

const visible = () => {
  Object.defineProperty(document, "visibilityState", {
    value: "visible",
    configurable: true,
  });
  document.dispatchEvent(new Event("visibilitychange"));
};
const hiddenTab = () => {
  Object.defineProperty(document, "visibilityState", {
    value: "hidden",
    configurable: true,
  });
  document.dispatchEvent(new Event("visibilitychange"));
};
const settle = () => new Promise((r) => setTimeout(r, 0));

beforeEach(() => {
  live(__BUILD_ID__);
});

afterEach(() => {
  Reflect.deleteProperty(navigator, "serviceWorker");
});

describe("update banner", () => {
  it("is hidden when this build is the live one", async () => {
    const m = await load();
    await m.initUpdate();
    expect($("update").hidden).toBe(true);
  });

  it("shows when a different build is live", async () => {
    live("other");
    const m = await load();
    await m.initUpdate();
    expect($("update").hidden).toBe(false);
    expect($("update").textContent).toContain(t.update.banner);
  });

  it("dismiss hides it for the session, even on a later recheck", async () => {
    live("other");
    const m = await load();
    await m.initUpdate();
    $("updateDismiss").click();
    expect($("update").hidden).toBe(true);
    visible();
    await settle();
    expect($("update").hidden).toBe(true);
  });

  it("rechecks when the tab becomes visible again", async () => {
    const m = await load();
    await m.initUpdate();
    expect($("update").hidden).toBe(true);
    live("other");
    hiddenTab();
    await settle();
    expect($("update").hidden).toBe(true);
    visible();
    await settle();
    expect($("update").hidden).toBe(false);
  });
});

describe("reload", () => {
  it("flags the reload, asks the service worker to update, then reloads", async () => {
    live("other");
    const update = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "serviceWorker", {
      value: { getRegistration: vi.fn().mockResolvedValue({ update }) },
      configurable: true,
    });
    const reload = vi.fn();
    vi.stubGlobal("location", { reload });
    const m = await load();
    await m.initUpdate();
    $("updateReload").click();
    await settle();
    expect(sessionStorage.getItem(m.RELOADED_KEY)).toBe("1");
    expect(update).toHaveBeenCalledOnce();
    expect(reload).toHaveBeenCalledOnce();
  });

  it("still reloads without a service worker or when update throws", async () => {
    live("other");
    const reload = vi.fn();
    vi.stubGlobal("location", { reload });
    const m = await load();
    await m.initUpdate();
    $("updateReload").click();
    await settle();
    expect(reload).toHaveBeenCalledTimes(1);

    Object.defineProperty(navigator, "serviceWorker", {
      value: { getRegistration: vi.fn().mockRejectedValue(new Error("x")) },
      configurable: true,
    });
    $("updateReload").click();
    await settle();
    expect(reload).toHaveBeenCalledTimes(2);
  });
});

describe("stuck fallback sheet", () => {
  it("opens when we reloaded for an update but are still outdated", async () => {
    live("other");
    const m = await load();
    sessionStorage.setItem(m.RELOADED_KEY, "1");
    await m.initUpdate();
    expect($("sheet").hidden).toBe(false);
    expect($("sheetT").textContent).toBe(t.update.stuckTitle);
    expect($("steps").children.length).toBeGreaterThan(0);
    expect(sessionStorage.getItem(m.RELOADED_KEY)).toBeNull();
  });

  it("stays closed after a successful update, and clears the flag", async () => {
    const m = await load();
    sessionStorage.setItem(m.RELOADED_KEY, "1");
    await m.initUpdate();
    expect($("sheet").hidden).toBe(true);
    expect(sessionStorage.getItem(m.RELOADED_KEY)).toBeNull();
  });

  it("stays closed on an ordinary outdated visit (no reload loop, no sheet)", async () => {
    live("other");
    const m = await load();
    await m.initUpdate();
    expect($("sheet").hidden).toBe(true);
  });
});
