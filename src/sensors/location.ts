import { TEREMKY } from '../config';
import { unlockAudio } from '../celebrate/sound';
import { t } from '../i18n';
import { $ } from '../lib/dom';
import { bearing, distanceKm } from '../lib/geo';
import { state } from '../state';
import { fail, setSub, showDistance } from '../ui/readout';
import { hasCompassPermissionApi, listenCompass, requestCompassPermission } from './compass';

function onGeoErr(err: GeolocationPositionError) {
  if (err.code === 1) {
    fail(t.errors.geoDenied(err.message || t.errors.geoDeniedFallback));
    $('fix').hidden = false;
    $('go').hidden = false;
    $('go').textContent = t.buttons.retry;
  } else if (err.code === 3) {
    fail(t.errors.geoTimeout);
    $('go').hidden = false;
    $('go').textContent = t.buttons.retry;
  } else fail(t.errors.geoUnknown(err.message || t.errors.geoUnknownFallback));
}

export async function start() {
  $('err').hidden = true;
  unlockAudio();
  if (hasCompassPermissionApi()) {
    await requestCompassPermission();
  }
  listenCompass();

  if (!navigator.geolocation) return fail(t.errors.geoUnavailable);
  setSub(t.sub.searching);
  if (state.geoWatch != null) navigator.geolocation.clearWatch(state.geoWatch);
  state.geoWatch = navigator.geolocation.watchPosition(
    (pos) => {
      const me = { lat: pos.coords.latitude, lon: pos.coords.longitude };
      const first = state.target === null;
      state.target = bearing(me, TEREMKY);
      if (first) state.shownNeedle = state.target;
      $('needle').setAttribute('visibility', 'visible');
      const km = distanceKm(me, TEREMKY);
      showDistance(km);
      setSub(km < 0.3 ? t.sub.arrived : t.sub.toward(Math.round(state.target)));
      $('go').hidden = true;
      $('fix').hidden = true;
      $('err').hidden = true;
    },
    onGeoErr,
    { enableHighAccuracy: true, maximumAge: 0, timeout: 20000 },
  );

  try {
    await navigator.wakeLock?.request('screen');
  } catch {}
}
