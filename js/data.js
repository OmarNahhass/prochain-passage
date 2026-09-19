export const COLORS = {
  1: "#00B300",
  2: "#D95700",
  4: "#FFD900",
  5: "#0095E6",
};

export function shortName(name) {
  return name
    .replace("Station ", "")
    .replace(" -Zone B", "")
    .replace(/^Longueuil.*/, "Longueuil")
    .trim();
}

export function nowSeconds() {
  const d = new Date();
  return (
    d.getHours() * 3600 +
    d.getMinutes() * 60 +
    d.getSeconds() +
    d.getMilliseconds() / 1000
  );
}

function parseCSV(text) {
  const lines = text.trim().split(/\r?\n/);
  const header = lines[0].split(",");
  return lines.slice(1).map((line) => {
    const values = line.split(",");
    const row = {};
    header.forEach((h, i) => (row[h] = values[i]));
    return row;
  });
}

export async function loadData() {
  const [csvText, trips, network] = await Promise.all([
    fetch("stations_schematic.csv").then((r) => r.text()),
    fetch("trips_today.json").then((r) => r.json()),
    fetch("network.json").then((r) => r.json()),
  ]);
  const rows = parseCSV(csvText);
  rows.forEach((r) => (r.stop_name = shortName(r.stop_name)));
  const pos = {};
  rows.forEach((r) => (pos[r.stop_name] = [Number(r.x), Number(r.y)]));
  return { rows, pos, trips, network };
}
