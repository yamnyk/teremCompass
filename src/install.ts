import { $ } from './lib/dom';
import { isAndroid, isIOS, isStandalone } from './lib/platform';
import { state } from './state';
import { openSheet } from './ui/sheet';

export function initInstall() {
  addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    state.deferred = e;
    $('install').hidden = isStandalone;
  });
  addEventListener('appinstalled', () => {
    state.deferred = null;
    $('install').hidden = true;
  });
  $('install').addEventListener('click', async () => {
    if (state.deferred) {
      state.deferred.prompt();
      await state.deferred.userChoice.catch(() => {});
      state.deferred = null;
      $('install').hidden = true;
    } else openSheet();
  });
  // iOS never fires beforeinstallprompt, so the button always leads to the manual steps there
  if (!isStandalone && (isIOS || isAndroid)) $('install').hidden = false;
}
