export function readPreference(key: string, fallback: boolean) {
  try { const value = localStorage.getItem(key); return value === null ? fallback : value === 'true'; }
  catch { return fallback; }
}
export function savePreference(key: string, value: boolean) {
  try { localStorage.setItem(key, String(value)); } catch { /* Storage may be unavailable. */ }
}
