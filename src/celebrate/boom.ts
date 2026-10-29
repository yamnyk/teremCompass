import { t } from "../i18n";
import { $, replay } from "../lib/dom";

export const flashTemplate = () => `<div id="flash"></div>`;
export const boomTemplate = () =>
  `<div id="boom"><span>${t.cheers[0]}</span></div>`;

export function triggerBoom(cheer: string) {
  $("boom").firstElementChild!.textContent = cheer;
  replay($("boom"));
  replay($("flash"));
}
