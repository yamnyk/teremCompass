import { t } from "../i18n";
import type { Release, ReleaseEntry } from "../i18n/uk";

// Adding a feature to the tour = appending to `whatsNew.releases` in the i18n file.
export function entriesSince(
  lastSeen: string | null,
  releases: Release[] = t.whatsNew.releases,
): ReleaseEntry[] {
  const at = releases.findIndex((r) => r.id === lastSeen);
  // no stored id (new user) or an id we no longer know: show everything
  return releases.slice(at + 1).flatMap((r) => r.entries);
}

export const latestId = (releases: Release[] = t.whatsNew.releases): string =>
  releases[releases.length - 1]!.id;
