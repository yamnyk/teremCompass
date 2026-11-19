import { t } from "../i18n";
import type { ReleaseEntry } from "../i18n/uk";
import { $ } from "../lib/dom";
import { get, set } from "../lib/storage";
import { entriesSince, latestId } from "../whatsnew/registry";
import { previewMarkup } from "../whatsnew/previews";

export const SEEN_KEY = "teremcompass:seen";

export const tourTemplate = () => `<div class="sheetBg" id="tour" hidden>
    <div class="sheet tour" role="dialog" aria-modal="true" aria-labelledby="tourT">
      <div class="tourPreview" id="tourPreview"></div>
      <h2 id="tourT"></h2>
      <p id="tourText"></p>
      <div class="tourDots" id="tourDots"></div>
      <div class="tourBtns">
        <button id="tourSkip">${t.whatsNew.skip}</button>
        <button id="tourNext"></button>
      </div>
    </div>
  </div>`;

let entries: ReleaseEntry[] = [];
let index = 0;
let markSeen = false;

function render() {
  const entry = entries[index]!;
  $("tourPreview").innerHTML = previewMarkup(entry.preview);
  $("tourT").textContent = entry.title;
  $("tourText").textContent = entry.text;
  $("tourDots").innerHTML = entries
    .map((_, i) => `<i${i === index ? ' class="on"' : ""}></i>`)
    .join("");
  const last = index === entries.length - 1;
  $("tourNext").textContent = last ? t.whatsNew.done : t.whatsNew.next;
  $("tourSkip").hidden = last;
}

function finish() {
  $("tour").hidden = true;
  if (markSeen) set(SEEN_KEY, latestId());
}

// `seen` records the newest release; a replay from the help button leaves it untouched
export function startTour(list: ReleaseEntry[], opts: { seen: boolean }) {
  if (!list.length) return;
  entries = list;
  index = 0;
  markSeen = opts.seen;
  render();
  $("tour").hidden = false;
}

export function initTour() {
  $("tourNext").addEventListener("click", () => {
    if (index === entries.length - 1) finish();
    else {
      index++;
      render();
    }
  });
  $("tourSkip").addEventListener("click", finish);
  $("help").addEventListener("click", () =>
    startTour(entriesSince(null), { seen: false }),
  );
  startTour(entriesSince(get(SEEN_KEY)), { seen: true });
}
