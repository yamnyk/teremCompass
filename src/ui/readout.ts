import { t } from '../i18n';
import { $ } from '../lib/dom';

export const readoutTemplate = () => `<div id="readout">
    <div class="dist" id="dist">${t.readout.distEmpty}</div>
    <div class="hint" id="hint"></div>
    <div class="sub" id="sub">${t.readout.sub}</div>
  </div>`;

export const controlsTemplate = () => `<button id="go">${t.buttons.go}</button>
  <div class="err" id="err" hidden></div>
  <button id="fix" hidden>${t.buttons.fix}</button>
  <button id="install" hidden>${t.buttons.install}</button>`;

export function fail(msg: string) {
  const el = $('err');
  el.textContent = msg;
  el.hidden = false;
}

export function showDistance(km: number) {
  $('dist').innerHTML =
    km < 1
      ? `${Math.round(km * 1000)}<small>${t.units.m}</small>`
      : `${Math.round(km).toLocaleString('uk-UA')}<small>${t.units.km}</small>`;
}

export function setSub(text: string) {
  $('sub').textContent = text;
}

export function setHint(text: string) {
  $('hint').textContent = text;
}
