export interface LatLon {
  lat: number;
  lon: number;
}

export const rad = (d: number) => (d * Math.PI) / 180,
  deg = (r: number) => (r * 180) / Math.PI;
export const norm = (a: number) => (((a % 360) + 540) % 360) - 180;

export function bearing(a: LatLon, b: LatLon) {
  const φ1 = rad(a.lat),
    φ2 = rad(b.lat),
    Δλ = rad(b.lon - a.lon);
  const y = Math.sin(Δλ) * Math.cos(φ2);
  const x = Math.cos(φ1) * Math.sin(φ2) - Math.sin(φ1) * Math.cos(φ2) * Math.cos(Δλ);
  return (deg(Math.atan2(y, x)) + 360) % 360;
}
export function distanceKm(a: LatLon, b: LatLon) {
  const R = 6371,
    dφ = rad(b.lat - a.lat),
    dλ = rad(b.lon - a.lon);
  const h =
    Math.sin(dφ / 2) ** 2 +
    Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dλ / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}
