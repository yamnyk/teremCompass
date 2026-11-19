// version.json is emitted at build time (see vite.config.ts) and never cached,
// so it always names the build that is live right now.
export async function fetchLatestId(): Promise<string | null> {
  try {
    const r = await fetch("version.json", { cache: "no-store" });
    if (!r.ok) return null;
    const j: unknown = await r.json();
    const id = (j as { id?: unknown } | null)?.id;
    return typeof id === "string" ? id : null;
  } catch {
    return null;
  }
}

export async function isOutdated(): Promise<boolean> {
  const latest = await fetchLatestId();
  return latest !== null && latest !== __BUILD_ID__;
}
