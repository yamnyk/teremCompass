import { describe, it, expect, beforeEach } from "vitest";
import {
  readoutTemplate,
  controlsTemplate,
  fail,
  showDistance,
  setSub,
  setHint,
} from "./readout";
import { renderApp } from "./app";
import { $ } from "../lib/dom";
import { t } from "../i18n";

beforeEach(() => {
  document.body.innerHTML = "";
  renderApp();
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
