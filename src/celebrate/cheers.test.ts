import { describe, expect, it } from "vitest";
import { cheers } from "./cheers";

// Deliberately does not pin the count: the list is meant to be edited freely.
describe("cheers", () => {
  it("has at least two entries so a round can avoid repeats", () => {
    expect(cheers.length).toBeGreaterThan(1);
  });

  it("has only non-empty, trimmed text", () => {
    for (const c of cheers) {
      expect(c.length).toBeGreaterThan(0);
      expect(c).toBe(c.trim());
    }
  });

  it("has no duplicates, which would make a repeat look like a bug", () => {
    expect(new Set(cheers).size).toBe(cheers.length);
  });
});
