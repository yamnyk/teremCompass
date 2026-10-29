import { t } from '../i18n';
import { $ } from '../lib/dom';
import { isAndroid, isIOS, ua } from '../lib/platform';
import { DOTS, SHARE } from './icons';

export const sheetTemplate = () => `<div class="sheetBg" id="sheet" hidden>
    <div class="sheet" role="dialog" aria-modal="true" aria-labelledby="sheetT">
      <h2 id="sheetT">${t.sheet.title}</h2>
      <ol id="steps"></ol>
      <div class="warn" id="warn">${t.sheet.warn}</div>
      <button id="sheetClose">${t.buttons.sheetClose}</button>
    </div>
  </div>`;

export function openSheet(
  title: string = t.sheet.title,
  steps: string[] = t.installSteps({ ua, isIOS, isAndroid }, { SHARE, DOTS }),
) {
  $('sheetT').textContent = title;
  $('warn').hidden = steps !== undefined && title !== t.sheet.title;
  $('steps').innerHTML = steps.map((step) => `<li><span>${step}</span></li>`).join('');
  $('sheet').hidden = false;
}

export function initSheet() {
  $('fix').addEventListener('click', () =>
    openSheet(t.sheet.geoTitle, t.geoFixSteps({ ua, isIOS, isAndroid })),
  );
  $('sheetClose').addEventListener('click', () => ($('sheet').hidden = true));
  $('sheet').addEventListener('click', (e) => {
    if ((e.target as HTMLElement).id === 'sheet') $('sheet').hidden = true;
  });
}
