export type Area = "local" | "session";

const area = (a: Area) => (a === "local" ? localStorage : sessionStorage);

// Storage can throw (private mode, blocked site data); every caller must survive that.
export function get(key: string, a: Area = "local"): string | null {
  try {
    return area(a).getItem(key);
  } catch {
    return null;
  }
}

export function set(key: string, value: string, a: Area = "local") {
  try {
    area(a).setItem(key, value);
  } catch {}
}

export function remove(key: string, a: Area = "local") {
  try {
    area(a).removeItem(key);
  } catch {}
}
