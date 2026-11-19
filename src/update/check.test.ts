import { describe, expect, it, vi } from "vitest";
import { fetchLatestId, isOutdated } from "./check";

const respond = (body: unknown, ok = true) =>
  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue({ ok, json: async () => body }),
  );

describe("fetchLatestId", () => {
  it("reads the id and bypasses the cache", async () => {
    respond({ id: "abc1234" });
    expect(await fetchLatestId()).toBe("abc1234");
    expect(fetch).toHaveBeenCalledWith("version.json", { cache: "no-store" });
  });

  it("is null for a non-ok response", async () => {
    respond({ id: "abc1234" }, false);
    expect(await fetchLatestId()).toBeNull();
  });

  it("is null when the body has no string id", async () => {
    respond({ id: 5 });
    expect(await fetchLatestId()).toBeNull();
    respond(null);
    expect(await fetchLatestId()).toBeNull();
  });

  it("is null when the body is not JSON (dev server returns index.html)", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => {
          throw new SyntaxError("not json");
        },
      }),
    );
    expect(await fetchLatestId()).toBeNull();
  });

  it("is null when offline", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new TypeError("offline")));
    expect(await fetchLatestId()).toBeNull();
  });
});

describe("isOutdated", () => {
  it("is false when the live id matches this build", async () => {
    respond({ id: __BUILD_ID__ });
    expect(await isOutdated()).toBe(false);
  });

  it("is true when a different build is live", async () => {
    respond({ id: "other" });
    expect(await isOutdated()).toBe(true);
  });

  it("is false when the live id is unknown", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("x")));
    expect(await isOutdated()).toBe(false);
  });
});
