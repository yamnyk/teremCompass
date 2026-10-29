export const $ = <T extends HTMLElement = HTMLElement>(id: string): T =>
  document.getElementById(id) as T;
export const root = document.documentElement;

export function replay(el: HTMLElement) {
  el.classList.remove("go");
  void el.offsetWidth;
  el.classList.add("go");
}
