import { describe, it, expect, beforeEach } from "vitest";
import { dialTemplate, buildTicks, setRotation } from "./dial";
import { renderApp } from "./app";
import { $ } from "../lib/dom";
import { t } from "../i18n";

const num = (el: Element, attr: string) =>
  parseFloat(el.getAttribute(attr) ?? "NaN");

beforeEach(() => {
  document.body.innerHTML = "";
  renderApp();
});

describe("dialTemplate", () => {
  it("renders an aria-hidden dial with a 240-unit viewBox", () => {
    const wrap = document.createElement("div");
    wrap.innerHTML = dialTemplate();
    const div = wrap.querySelector(".dial");
    expect(div?.getAttribute("aria-hidden")).toBe("true");
    expect(wrap.querySelector("svg")?.getAttribute("viewBox")).toBe(
      "-120 -120 240 240",
    );
  });

  it("labels the four compass points from t.dial", () => {
    const texts = [...document.querySelectorAll("#rose > text")].map(
      (n) => n.textContent,
    );
    expect(texts).toEqual([
      t.dial.north,
      t.dial.south,
      t.dial.east,
      t.dial.west,
    ]);
  });
});

describe("buildTicks", () => {
  beforeEach(() => {
    buildTicks();
  });

  it("creates 72 SVG line elements in #ticks (every 5 degrees)", () => {
    const lines = $("ticks").querySelectorAll("line");
    expect(lines).toHaveLength(72);
    for (const l of lines) {
      expect(l.namespaceURI).toBe("http://www.w3.org/2000/svg");
    }
  });

  it("marks every 6th tick as big: stroke-width 1.6, inner radius 84", () => {
    const lines = [...$("ticks").querySelectorAll("line")];
    for (let i = 0; i < 72; i += 6) {
      expect(lines[i]!.getAttribute("stroke-width")).toBe("1.6");
      const r1 = Math.hypot(num(lines[i]!, "x1"), num(lines[i]!, "y1"));
      expect(r1).toBeCloseTo(84, 9);
    }
  });

  it("other ticks: stroke-width 0.8, inner radius 88", () => {
    const lines = [...$("ticks").querySelectorAll("line")];
    for (let i = 0; i < 72; i++) {
      if (i % 6 === 0) continue;
      expect(lines[i]!.getAttribute("stroke-width")).toBe("0.8");
      const r1 = Math.hypot(num(lines[i]!, "x1"), num(lines[i]!, "y1"));
      expect(r1).toBeCloseTo(88, 9);
    }
  });

  it("every tick ends at outer radius 92", () => {
    for (const l of $("ticks").querySelectorAll("line")) {
      expect(Math.hypot(num(l, "x2"), num(l, "y2"))).toBeCloseTo(92, 9);
    }
  });

  it("i=0 points straight up (north): x1=0, y1=-84, x2=0, y2=-92", () => {
    const l = $("ticks").querySelectorAll("line")[0]!;
    expect(num(l, "x1")).toBeCloseTo(0, 9);
    expect(num(l, "y1")).toBeCloseTo(-84, 9);
    expect(num(l, "x2")).toBeCloseTo(0, 9);
    expect(num(l, "y2")).toBeCloseTo(-92, 9);
  });

  it("i=18 points east (90 degrees): x1=84, y1=0, x2=92, y2=0", () => {
    const l = $("ticks").querySelectorAll("line")[18]!;
    expect(num(l, "x1")).toBeCloseTo(84, 9);
    expect(num(l, "y1")).toBeCloseTo(0, 9);
    expect(num(l, "x2")).toBeCloseTo(92, 9);
    expect(num(l, "y2")).toBeCloseTo(0, 9);
  });

  it("i=36 points south (180 degrees): y1 is +84", () => {
    const l = $("ticks").querySelectorAll("line")[36]!;
    expect(num(l, "x1")).toBeCloseTo(0, 9);
    expect(num(l, "y1")).toBeCloseTo(84, 9);
  });
});

describe("setRotation", () => {
  it("writes rotate(x.xx) with two decimals to #rose and #needle", () => {
    setRotation(12.3456, -7.5);
    expect($("rose").getAttribute("transform")).toBe("rotate(12.35)");
    expect($("needle").getAttribute("transform")).toBe("rotate(-7.50)");
  });

  it("rounds each value independently (no shared state)", () => {
    setRotation(0, 359.999);
    expect($("rose").getAttribute("transform")).toBe("rotate(0.00)");
    expect($("needle").getAttribute("transform")).toBe("rotate(360.00)");
  });

  it("negative values that round to zero keep the minus sign", () => {
    setRotation(-0.001, 0);
    expect($("rose").getAttribute("transform")).toBe("rotate(-0.00)");
  });

  it("does not touch the ticks or the needle visibility", () => {
    setRotation(45, 90);
    expect($("needle").getAttribute("visibility")).toBe("hidden");
    expect($("ticks").hasAttribute("transform")).toBe(false);
  });

  it("throws when the dial is not rendered", () => {
    document.body.innerHTML = "";
    expect(() => setRotation(1, 2)).toThrow();
  });
});
