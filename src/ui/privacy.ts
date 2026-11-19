import { t } from "../i18n";
import { $ } from "../lib/dom";
import { state } from "../state";
import { renderMasked } from "./readout";

export const MASK_KEY = "teremcompass:masked";

export function loadMasked(): boolean {
  try {
    return localStorage.getItem(MASK_KEY) === "1";
  } catch {
    return false;
  }
}

function saveMasked(masked: boolean) {
  try {
    localStorage.setItem(MASK_KEY, masked ? "1" : "0");
  } catch {}
}

function paintEye() {
  const eye = $("eye");
  eye.textContent = state.masked ? "🙈" : "👁";
  eye.setAttribute("aria-label", state.masked ? t.eye.show : t.eye.hide);
  eye.setAttribute("aria-pressed", String(state.masked));
}

export function initEye() {
  state.masked = loadMasked();
  paintEye();
  $("eye").addEventListener("click", () => {
    state.masked = !state.masked;
    saveMasked(state.masked);
    paintEye();
    renderMasked();
  });
}
