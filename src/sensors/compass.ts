import { t } from "../i18n";
import { state } from "../state";
import { fail } from "../ui/readout";

function onOrient(e: DeviceOrientationEvent) {
  let h: number | null = null;
  if (typeof e.webkitCompassHeading === "number" && e.webkitCompassHeading >= 0)
    h = e.webkitCompassHeading; // iOS
  else if (e.absolute && typeof e.alpha === "number") h = 360 - e.alpha; // Android
  if (h == null || isNaN(h)) return;
  const so =
    (screen.orientation && screen.orientation.angle) || window.orientation || 0;
  state.heading = (((h + so) % 360) + 360) % 360;
  state.lastOrient = Date.now();
}

const doe = () =>
  DeviceOrientationEvent as unknown as DeviceOrientationEventConstructorWithPermission;

export function hasCompassPermissionApi() {
  return (
    typeof DeviceOrientationEvent !== "undefined" &&
    typeof doe().requestPermission === "function"
  );
}

export async function requestCompassPermission() {
  try {
    const p = await doe().requestPermission!();
    if (p !== "granted") fail(t.errors.compassDenied);
  } catch {
    fail(t.errors.compassRequestFailed);
  }
}

export function listenCompass() {
  addEventListener("deviceorientationabsolute", onOrient);
  addEventListener("deviceorientation", onOrient);
  setTimeout(() => {
    if (!state.lastOrient) fail(t.errors.compassSilent);
  }, 3000);
}
