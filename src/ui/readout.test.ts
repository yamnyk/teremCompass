import { describe, it, expect, beforeEach } from "vitest";
import {
  readoutTemplate,
  controlsTemplate,
  fail,
  showDistance,
  setSub,
  setHint,
  showArrived,
  showAzimuth,
  renderMasked,
} from "./readout";
import { renderApp } from "./app";
import { state } from "../state";
import { ROUTE_URL } from "../config";
import { $ } from "../lib/dom";
import { t } from "../i18n";

beforeEach(() => {
  document.body.innerHTML = "";
  renderApp();
  state.masked = false;
  state.lastKm = null;
  state.lastAzimuth = null;
});

describe("templates", () => {
  it("readoutTemplate has dist, hint and sub with t-derived initial text", () => {
    const wrap = document.createElement("div");
    wrap.innerHTML = readoutTemplate();
    expect(wrap.querySelector("#dist")?.textContent).toBe(t.readout.distEmpty);
    expect(wrap.querySelector("#hint")?.textContent).toBe("");
    expect(wrap.querySelector("#sub")?.textContent).toBe(t.readout.sub);
  });

  it("controlsTemplate renders go visible and fix/install/err hidden", () => {
    const wrap = document.createElement("div");
    wrap.innerHTML = controlsTemplate();
    expect(wrap.querySelector("#go")?.hasAttribute("hidden")).toBe(false);
    expect(wrap.querySelector("#err")?.hasAttribute("hidden")).toBe(true);
    expect(wrap.querySelector("#fix")?.hasAttribute("hidden")).toBe(true);
    expect(wrap.querySelector("#install")?.hasAttribute("hidden")).toBe(true);
  });
});

describe("fail", () => {
  it("sets the error text and unhides #err", () => {
    fail("boom");
    expect($("err").textContent).toBe("boom");
    expect($("err").hidden).toBe(false);
  });

  it("replaces previous text on repeated calls", () => {
    fail("first");
    fail(t.errors.geoTimeout);
    expect($("err").textContent).toBe(t.errors.geoTimeout);
  });

  it("treats the message as text, not HTML", () => {
    fail("<b>x</b>");
    expect($("err").textContent).toBe("<b>x</b>");
    expect($("err").querySelector("b")).toBeNull();
  });
});

describe("showDistance", () => {
  it("below 1 km: shows metres rounded, with the m unit", () => {
    showDistance(0.4567);
    expect($("dist").innerHTML).toBe(`457<small>${t.units.m}</small>`);
  });

  it("exactly 1 km uses the km branch", () => {
    showDistance(1);
    expect($("dist").innerHTML).toBe(`1<small>${t.units.km}</small>`);
  });

  it("just under 1 km rounds to 1000 m (pinned: no switch to km)", () => {
    showDistance(0.9996);
    expect($("dist").innerHTML).toBe(`1000<small>${t.units.m}</small>`);
  });

  it("1 km and above: rounds to whole km with uk-UA grouping", () => {
    showDistance(3.139);
    expect($("dist").innerHTML).toBe(
      `${Math.round(3.139).toLocaleString("uk-UA")}<small>${t.units.km}</small>`,
    );
    expect($("dist").innerHTML).toBe(`3<small>${t.units.km}</small>`);
  });

  it("thousands are grouped with the uk-UA separator", () => {
    showDistance(1234.5);
    // innerHTML serialises the grouping NBSP as &nbsp;
    const grouped = (1235).toLocaleString("uk-UA").replace(/\u00a0/g, "&nbsp;");
    expect($("dist").innerHTML).toBe(`${grouped}<small>${t.units.km}</small>`);
  });

  it("rounds half up at 1.5 km (pinned Math.round behaviour)", () => {
    showDistance(1.5);
    expect($("dist").innerHTML).toBe(`2<small>${t.units.km}</small>`);
  });

  it("zero is metres", () => {
    showDistance(0);
    expect($("dist").innerHTML).toBe(`0<small>${t.units.m}</small>`);
  });
});

describe("route link", () => {
  it("is hidden, opens the Google Maps URL in a new tab", () => {
    const a = $<HTMLAnchorElement>("route");
    expect(a.hidden).toBe(true);
    expect(a.getAttribute("href")).toBe(ROUTE_URL);
    expect(ROUTE_URL).toBe(
      "https://www.google.com/maps/dir/?api=1&destination=50.3667,30.4547",
    );
    expect(a.target).toBe("_blank");
    expect(a.rel).toBe("noopener");
    expect(a.textContent).toBe(t.buttons.route);
  });
});

describe("masking", () => {
  it("masked distance is **** with no unit or digits", () => {
    state.masked = true;
    showDistance(12.3);
    expect($("dist").textContent).toBe("****");
    expect($("dist").querySelector("small")).toBeNull();
    expect(state.lastKm).toBe(12.3);
  });

  it("masked azimuth uses the masked sub", () => {
    state.masked = true;
    showAzimuth(247);
    expect($("sub").textContent).toBe(t.sub.towardMasked);
    expect(state.lastAzimuth).toBe(247);
  });

  it("unmasked azimuth shows the number", () => {
    showAzimuth(247);
    expect($("sub").textContent).toBe(t.sub.toward(247));
  });

  it("renderMasked re-renders stored values both ways", () => {
    showDistance(3.4);
    showAzimuth(90);
    state.masked = true;
    renderMasked();
    expect($("dist").textContent).toBe("****");
    expect($("sub").textContent).toBe(t.sub.towardMasked);
    state.masked = false;
    renderMasked();
    expect($("dist").innerHTML).toBe(`3<small>${t.units.km}</small>`);
    expect($("sub").textContent).toBe(t.sub.toward(90));
  });

  it("renderMasked is a no-op before any fix", () => {
    state.masked = true;
    renderMasked();
    expect($("dist").textContent).toBe(t.readout.distEmpty);
    expect($("sub").textContent).toBe(t.readout.sub);
  });

  it("showArrived clears the stored azimuth", () => {
    showAzimuth(10);
    showArrived();
    expect($("sub").textContent).toBe(t.sub.arrived);
    expect(state.lastAzimuth).toBeNull();
    renderMasked();
    expect($("sub").textContent).toBe(t.sub.arrived);
  });
});

describe("setSub / setHint", () => {
  it("setSub writes text to #sub", () => {
    setSub(t.sub.searching);
    expect($("sub").textContent).toBe(t.sub.searching);
  });

  it("setHint writes text to #hint", () => {
    setHint(t.hint.locked);
    expect($("hint").textContent).toBe(t.hint.locked);
  });

  it("setSub / setHint escape markup (textContent, not innerHTML)", () => {
    setSub("<i>a</i>");
    setHint("<i>b</i>");
    expect($("sub").querySelector("i")).toBeNull();
    expect($("hint").querySelector("i")).toBeNull();
  });
});
