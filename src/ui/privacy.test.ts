import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { t } from "../i18n";
import { $ } from "../lib/dom";
import { state } from "../state";
import { renderApp } from "./app";
import { initEye, loadMasked, MASK_KEY } from "./privacy";
import { showAzimuth, showDistance } from "./readout";

beforeEach(() => {
  localStorage.clear();
  document.body.innerHTML = "";
  renderApp();
  state.masked = false;
  state.lastKm = null;
  state.lastAzimuth = null;
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("loadMasked", () => {
  it("is false when nothing is stored", () => {
    expect(loadMasked()).toBe(false);
  });

  it("reads the stored flag", () => {
    localStorage.setItem(MASK_KEY, "1");
    expect(loadMasked()).toBe(true);
    localStorage.setItem(MASK_KEY, "0");
    expect(loadMasked()).toBe(false);
  });

  it("is false when storage throws", () => {
    localStorage.setItem(MASK_KEY, "1");
    vi.stubGlobal("localStorage", {
      getItem: () => {
        throw new Error("blocked");
      },
    });
    expect(loadMasked()).toBe(false);
  });
});

describe("initEye", () => {
  it("starts visible: eye emoji, hide label, not pressed", () => {
    initEye();
    expect($("eye").textContent).toBe("👁");
    expect($("eye").getAttribute("aria-label")).toBe(t.eye.hide);
    expect($("eye").getAttribute("aria-pressed")).toBe("false");
  });

  it("restores the persisted masked state", () => {
    localStorage.setItem(MASK_KEY, "1");
    initEye();
    expect(state.masked).toBe(true);
    expect($("eye").textContent).toBe("🙈");
    expect($("eye").getAttribute("aria-label")).toBe(t.eye.show);
    expect($("eye").getAttribute("aria-pressed")).toBe("true");
  });

  it("click toggles the mask, re-renders the readout and persists", () => {
    initEye();
    showDistance(3.4);
    showAzimuth(90);
    $("eye").click();
    expect(state.masked).toBe(true);
    expect($("dist").textContent).toBe("****");
    expect($("sub").textContent).toBe(t.sub.towardMasked);
    expect(localStorage.getItem(MASK_KEY)).toBe("1");
    $("eye").click();
    expect(state.masked).toBe(false);
    expect($("dist").innerHTML).toBe(`3<small>${t.units.km}</small>`);
    expect($("sub").textContent).toBe(t.sub.toward(90));
    expect(localStorage.getItem(MASK_KEY)).toBe("0");
  });

  it("still toggles when storage throws on write", () => {
    vi.stubGlobal("localStorage", {
      getItem: () => null,
      setItem: () => {
        throw new Error("quota");
      },
    });
    initEye();
    $("eye").click();
    expect(state.masked).toBe(true);
    expect($("eye").textContent).toBe("🙈");
  });
});
