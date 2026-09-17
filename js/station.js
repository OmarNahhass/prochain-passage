// Find the next trains arriving at a station, grouped by destination.
export function upcomingArrivals(
  trips,
  station,
  t,
  perDirection = 3,
  horizon = 3600,
) {
  const byDest = new Map();

  for (const trip of trips) {
    const i = trip.stops.indexOf(station);
    if (i === -1) continue;

    let wait = trip.times[i] - t;
    if (wait < -60) wait += 86400; // just after midnight, look at yesterday's late trains
    if (wait < -60 || wait > horizon) continue;

    const last = trip.stops.length - 1;
    const dest = i === last ? "Terminus" : trip.stops[last];
    const key = trip.route + "|" + dest;

    if (!byDest.has(key))
      byDest.set(key, { route: trip.route, dest, waits: [] });
    byDest.get(key).waits.push(wait);
  }

  const groups = [...byDest.values()];
  for (const g of groups) {
    g.waits.sort((a, b) => a - b);
    g.waits = g.waits.slice(0, perDirection);
  }
  groups.sort(
    (a, b) => a.route.localeCompare(b.route) || a.waits[0] - b.waits[0],
  );
  return groups;
}

// Average gap between consecutive trains, in seconds
export function headway(waits) {
  if (waits.length < 2) return null;
  const gaps = [];
  for (let i = 1; i < waits.length; i++) gaps.push(waits[i] - waits[i - 1]);
  return gaps.reduce((a, b) => a + b, 0) / gaps.length;
}
