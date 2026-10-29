import { t } from "../i18n";

export function hintText(locked: boolean, off: number, a: number): string {
  return locked
    ? t.hint.locked
    : a < 25
      ? t.hint.almost(off > 0)
      : a < 90
        ? t.hint.warmer(off > 0, Math.round(a))
        : t.hint.cold(off > 0, Math.round(a));
}
