import { describe, expect, it } from "vitest";
import { t } from "../i18n";
import type { Release } from "../i18n/uk";
import { previewMarkup } from "./previews";
import { entriesSince, latestId } from "./registry";

const e = (title: string) => ({ title, text: `${title} text` });
const releases: Release[] = [
  { id: "r1", entries: [e("a"), e("b")] },
  { id: "r2", entries: [e("c")] },
];

describe("entriesSince", () => {
  it("null (new user) gets every entry", () => {
    expect(entriesSince(null, releases).map((x) => x.title)).toEqual([
      "a",
      "b",
      "c",
    ]);
  });

  it("a known id gets only newer releases", () => {
    expect(entriesSince("r1", releases).map((x) => x.title)).toEqual(["c"]);
  });

  it("the latest id gets nothing", () => {
    expect(entriesSince("r2", releases)).toEqual([]);
  });

  it("an unknown id gets everything", () => {
    expect(entriesSince("gone", releases)).toHaveLength(3);
  });

  it("a release appended later is toured with no other change", () => {
    const next = [...releases, { id: "r3", entries: [e("d")] }];
    expect(entriesSince("r2", next).map((x) => x.title)).toEqual(["d"]);
    expect(latestId(next)).toBe("r3");
  });

  it("defaults to the shipped releases", () => {
    expect(entriesSince(null).length).toBeGreaterThan(0);
    expect(latestId()).toBe(t.whatsNew.releases.at(-1)!.id);
    expect(entriesSince(latestId())).toEqual([]);
  });
});

describe("previewMarkup", () => {
  it("renders the eye and route look-alikes", () => {
    expect(previewMarkup("eye")).toContain("👁");
    expect(previewMarkup("route")).toContain(t.buttons.route);
  });

  it("is empty for no or an unknown key", () => {
    expect(previewMarkup(undefined)).toBe("");
    expect(previewMarkup("nope")).toBe("");
  });
});
