export async function fetchStatus() {
  try {
    const r = await fetch("/api/metro-status");
    if (!r.ok) return null;
    return await r.json();
  } catch {
    return null;
  }
}

export function noticesFor(status, stopCode) {
  if (!status || !stopCode) return [];
  return status.notices.filter((n) => n.stops.includes(stopCode));
}
