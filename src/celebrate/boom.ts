import { $, replay } from "../lib/dom";
import { cheers } from "./cheers";

export const flashTemplate = () => `<div id="flash"></div>`;
export const boomTemplate = () =>
  `<div id="boom"><span>${cheers[0]}</span></div>`;

export function triggerBoom(cheer: string) {
  $("boom").firstElementChild!.textContent = cheer;
  replay($("boom"));
  replay($("flash"));
}
