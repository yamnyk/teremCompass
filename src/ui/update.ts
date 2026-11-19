import { t } from "../i18n";
import { $ } from "../lib/dom";
import { isAndroid, isIOS, ua } from "../lib/platform";
import { get, remove, set } from "../lib/storage";
import { state } from "../state";
import { isOutdated } from "../update/check";
import { openSheet } from "./sheet";

export const RELOADED_KEY = "teremcompass:updated";

export const updateTemplate =
  () => `<div class="update" id="update" role="status" hidden>
    <span>${t.update.banner}</span>
    <button id="updateReload">${t.update.reload}</button>
    <button id="updateDismiss" aria-label="${t.update.dismiss}">✕</button>
  </div>`;

async function reload() {
  // lets the next boot tell "reloaded but still old" apart from a normal visit
  set(RELOADED_KEY, "1", "session");
  try {
    await (await navigator.serviceWorker?.getRegistration())?.update();
  } catch {}
  location.reload();
}

async function refresh(boot: boolean) {
  const outdated = await isOutdated();
  if (boot && get(RELOADED_KEY, "session")) {
    remove(RELOADED_KEY, "session");
    if (outdated)
      openSheet(
        t.update.stuckTitle,
        t.update.stuckSteps({ ua, isIOS, isAndroid }),
      );
  }
  $("update").hidden = !outdated || state.updateDismissed;
}

export function initUpdate() {
  $("updateReload").addEventListener("click", reload);
  $("updateDismiss").addEventListener("click", () => {
    state.updateDismissed = true;
    $("update").hidden = true;
  });
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") void refresh(false);
  });
  return refresh(true);
}
