export const TEREMKY = { lat: 50.3667, lon: 30.4547 }; // ст. м. Теремки, Київ
export const ROUTE_URL = `https://www.google.com/maps/dir/?api=1&destination=${TEREMKY.lat},${TEREMKY.lon}`;
export const LOCK_IN = 6,
  LOCK_OUT = 12; // hysteresis, degrees
