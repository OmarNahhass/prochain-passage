const DWELL = 25; // seconds a train stays stopped at each station
const OFFSET = 6; // pixels to the side of the line

export function trainPosition(trip, t, pos) {
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
      return [
        a[0] + f * dx - (dy / len) * OFFSET,
        a[1] + f * dy + (dx / len) * OFFSET,
      ];
    }
  }
  return null;
}
