import { describe, it, expect, beforeEach } from "vitest";
import { sheetTemplate, openSheet, initSheet } from "./sheet";
import { renderApp } from "./app";
import { $ } from "../lib/dom";
import { t } from "../i18n";
import { ua, isIOS, isAndroid } from "../lib/platform";
import { SHARE, DOTS } from "./icons";

const stepItems = () => [...$("steps").querySelectorAll("li")];
// Re-serialise through the DOM so expected markup matches innerHTML (e.g. self-closing SVG tags).
const normHtml = (html: string) => {
  const tmp = document.createElement("div");
  tmp.innerHTML = html;
  return tmp.innerHTML;
};

beforeEach(() => {
  document.body.innerHTML = "";
  renderApp();
  initSheet();
});

describe("sheetTemplate", () => {
  it("is a hidden modal dialog labelled by the title", () => {
    const wrap = document.createElement("div");
    wrap.innerHTML = sheetTemplate();
    const bg = wrap.querySelector("#sheet");
    expect(bg?.hasAttribute("hidden")).toBe(true);
    const dlg = wrap.querySelector(".sheet");
    expect(dlg?.getAttribute("role")).toBe("dialog");
    expect(dlg?.getAttribute("aria-modal")).toBe("true");
    expect(dlg?.getAttribute("aria-labelledby")).toBe("sheetT");
  });
});

describe("openSheet defaults", () => {
  it("title defaults to t.sheet.title and steps to install steps for this platform", () => {
    openSheet();
    expect($("sheetT").textContent).toBe(t.sheet.title);
    const expected = t.installSteps({ ua, isIOS, isAndroid }, { SHARE, DOTS });
    expect(stepItems()).toHaveLength(expected.length);
    expect(
      stepItems().map((li) => li.querySelector("span")?.innerHTML),
    ).toEqual(expected.map(normHtml));
  });

  it("shows the warn block for the default title", () => {
    openSheet();
    expect($("warn").hidden).toBe(false);
  });

  it("unhides the sheet", () => {
    openSheet();
    expect($("sheet").hidden).toBe(false);
  });
});

describe("openSheet with custom args", () => {
  it("hides warn when the title differs from the default (geo-fix case)", () => {
    openSheet(t.sheet.geoTitle, t.geoFixSteps({ ua, isIOS, isAndroid }));
    expect($("sheetT").textContent).toBe(t.sheet.geoTitle);
    expect($("warn").hidden).toBe(true);
  });

  it("geo-fix steps are rendered as li > span items", () => {
    const steps = t.geoFixSteps({ ua, isIOS, isAndroid });
    openSheet(t.sheet.geoTitle, steps);
    const items = stepItems();
    expect(items).toHaveLength(steps.length);
    items.forEach((li, i) => {
      expect(li.children).toHaveLength(1);
      expect(li.firstElementChild?.tagName).toBe("SPAN");
      expect(li.querySelector("span")?.innerHTML).toBe(normHtml(steps[i]!));
    });
  });

  it("pinned quirk: default title with custom steps still shows warn", () => {
    openSheet(t.sheet.title, ["only step"]);
    expect($("warn").hidden).toBe(false);
    expect(stepItems()).toHaveLength(1);
  });

  it("pinned quirk: custom title with explicit default-equivalent steps still hides warn", () => {
    openSheet("Other", ["x"]);
    expect($("warn").hidden).toBe(true);
  });

  it("step strings are injected as HTML (inline tags kept)", () => {
    openSheet("T", ["<b>bold</b> text"]);
    expect($("steps").querySelector("li span b")?.textContent).toBe("bold");
  });

  it("an empty steps array clears the list", () => {
    openSheet();
    openSheet("T", []);
    expect(stepItems()).toHaveLength(0);
    expect($("steps").innerHTML).toBe("");
  });

  it("each open replaces the previous steps", () => {
    openSheet("A", ["one", "two"]);
    openSheet("B", ["three"]);
    expect(stepItems().map((li) => li.textContent)).toEqual(["three"]);
  });
});

describe("initSheet", () => {
  it("fix button opens the geo-fix sheet with the geo title and steps", () => {
    $("fix").click();
    expect($("sheetT").textContent).toBe(t.sheet.geoTitle);
    expect($("sheet").hidden).toBe(false);
    expect(stepItems()).toHaveLength(
      t.geoFixSteps({ ua, isIOS, isAndroid }).length,
    );
    expect($("warn").hidden).toBe(true);
  });

  it("close button hides the sheet", () => {
    openSheet();
    $("sheetClose").click();
    expect($("sheet").hidden).toBe(true);
  });

  it("clicking the backdrop itself hides the sheet", () => {
    openSheet();
    $("sheet").click();
    expect($("sheet").hidden).toBe(true);
  });

  it("clicks inside the dialog do not close the sheet", () => {
    openSheet();
    $("sheet").querySelector<HTMLElement>(".sheet")!.click();
    expect($("sheet").hidden).toBe(false);
    $("sheetT").click();
    expect($("sheet").hidden).toBe(false);
  });

  it("a click on a child of the backdrop that is not the backdrop does not close it", () => {
    openSheet();
    $("steps").click();
    expect($("sheet").hidden).toBe(false);
  });
});
