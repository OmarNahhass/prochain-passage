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
    .replace("Square-Victoria-OACI", "Square-Victoria")
    .trim();
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
  const [csvText, trips] = await Promise.all([
    fetch("stations_schematic.csv").then((r) => r.text()),
    fetch("trips_today.json").then((r) => r.json()),
  ]);
  const rows = parseCSV(csvText);
  // Station names are cleaned here so the CSV, the JSON and the map all use the same keys
  rows.forEach((r) => (r.stop_name = shortName(r.stop_name)));
  const pos = {};
  rows.forEach((r) => (pos[r.stop_name] = [Number(r.x), Number(r.y)]));
  return { rows, pos, trips };
}
