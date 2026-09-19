import { shortName } from "./data.js";

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
    if (wait < -60) wait += 86400;
    if (wait < -60 || wait > horizon) continue;

    const last = trip.stops.length - 1;
    const dest = i === last ? "end of line" : shortName(trip.stops[last]);
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

export function headway(waits) {
  if (waits.length < 2) return null;
  return (waits[waits.length - 1] - waits[0]) / (waits.length - 1);
}
