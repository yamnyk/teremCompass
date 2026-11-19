import { ROUTE_URL } from "../config";
import { t } from "../i18n";
import { $ } from "../lib/dom";
import { state } from "../state";

export const readoutTemplate = () => `<div id="readout">
    <div class="dist" id="dist">${t.readout.distEmpty}</div>
    <div class="hint" id="hint"></div>
    <div class="sub" id="sub">${t.readout.sub}</div>
    <a class="route" id="route" href="${ROUTE_URL}" target="_blank" rel="noopener" hidden>${t.buttons.route}</a>
  </div>`;

export const controlsTemplate = () => `<button id="go">${t.buttons.go}</button>
  <div class="err" id="err" hidden></div>
  <button id="fix" hidden>${t.buttons.fix}</button>
  <button id="install" hidden>${t.buttons.install}</button>
  <button id="eye" type="button"></button>`;

export function fail(msg: string) {
  const el = $("err");
  el.textContent = msg;
  el.hidden = false;
}

export const MASK = "****";

function renderDistance(km: number) {
  if (state.masked) {
    $("dist").textContent = MASK;
    return;
  }
  $("dist").innerHTML =
    km < 1
      ? `${Math.round(km * 1000)}<small>${t.units.m}</small>`
      : `${Math.round(km).toLocaleString("uk-UA")}<small>${t.units.km}</small>`;
}

function renderAzimuth(azimuth: number) {
  setSub(state.masked ? t.sub.towardMasked : t.sub.toward(azimuth));
}

export function showDistance(km: number) {
  state.lastKm = km;
  renderDistance(km);
}

export function showAzimuth(azimuth: number) {
  state.lastAzimuth = azimuth;
  renderAzimuth(azimuth);
}

export function showArrived() {
  state.lastAzimuth = null;
  setSub(t.sub.arrived);
}

// re-render the stored values after the mask toggles
export function renderMasked() {
  if (state.lastKm !== null) renderDistance(state.lastKm);
  if (state.lastAzimuth !== null) renderAzimuth(state.lastAzimuth);
}

export function setSub(text: string) {
  $("sub").textContent = text;
}

export function setHint(text: string) {
  $("hint").textContent = text;
}
