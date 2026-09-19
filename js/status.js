// Poll the backend for live service status. Returns null when the backend
// isn't reachable, so the display keeps working as a schedule-only view.
export async function fetchStatus() {
  try {
    const r = await fetch("/api/metro-status");
    if (!r.ok) return null;
    return await r.json();
  } catch {
    return null;
  }
}

// Notices that name any of this station's stop codes
export function noticesFor(status, stopCodes) {
  if (!status || !stopCodes || !stopCodes.length) return [];
  return status.notices.filter((n) =>
    n.stops.some((c) => stopCodes.includes(c)),
  );
}
