const DWELL = 25;
const OFFSET = 6;

export function trainState(trip, t, pos) {
  const times = trip.times;
  if (t < times[0] || t > times[times.length - 1]) return null;

  for (let i = 0; i < times.length - 1; i++) {
    if (t >= times[i] && t <= times[i + 1]) {
      const a = pos[trip.stops[i]];
      const b = pos[trip.stops[i + 1]];
      if (!a || !b) return null;

      const span = times[i + 1] - times[i];
      const elapsed = t - times[i];

      let f;
      if (span <= DWELL) {
        f = span === 0 ? 0 : elapsed / span;
      } else if (elapsed < DWELL) {
        f = 0;
      } else {
        f = (elapsed - DWELL) / (span - DWELL);
      }

      const dx = b[0] - a[0],
        dy = b[1] - a[1];
      const len = Math.hypot(dx, dy) || 1;
      return {
        x: a[0] + f * dx - (dy / len) * OFFSET,
        y: a[1] + f * dy + (dx / len) * OFFSET,
        angle: (Math.atan2(dy, dx) * 180) / Math.PI,
      };
    }
  }
  return null;
}
