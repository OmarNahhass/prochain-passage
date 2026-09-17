import { COLORS, shortName } from "./data.js";

const NS = "http://www.w3.org/2000/svg";

export function el(tag, attrs) {
  const e = document.createElementNS(NS, tag);
  for (const k in attrs) e.setAttribute(k, attrs[k]);
  return e;
}

// Label positions relative to the station: [dx, dy, text-anchor]
const LABEL_SIDES = {
  right: [9, -7, "start"],
  left: [-9, -7, "end"],
  "right-low": [9, 14, "start"],
  "left-low": [-9, 14, "end"],
  above: [0, -12, "middle"],
  below: [0, 20, "middle"],
};

// Stations whose label shouldn't use the default ("right")
const LABELS = {
  Montmorency: "left-low",
  "De Castelnau": "left",
  Parc: "left",
  Acadie: "left",
  Beaubien: "right-low",
  Sherbrooke: "left",
  "Berri-UQAM": "right-low",
  "Saint-Laurent": "left",
  "Place-des-Arts": "left",
  McGill: "left",
  Peel: "left",
  "Guy-Concordia": "left",
  Atwater: "left",
  "Champ-de-Mars": "right-low",
  "Place-Saint-Henri": "left-low",
  Charlevoix: "right-low",
  Plamondon: "left",
  Snowdon: "right-low",
  Jolicoeur: "left",
  Verdun: "right-low",
  "Jean-Drapeau": "right-low",
};

export function drawNetwork(layer, rows, pos) {
  // Lines
  for (const route of Object.keys(COLORS)) {
    const pts = rows
      .filter((r) => r.route_id === route)
      .sort((a, b) => Number(a.seq) - Number(b.seq))
      .map((r) => `${r.x},${r.y}`)
      .join(" ");
    layer.appendChild(
      el("polyline", {
        points: pts,
        fill: "none",
        stroke: COLORS[route],
        "stroke-width": 8,
        "stroke-linejoin": "round",
        "stroke-linecap": "round",
      }),
    );
  }

  // Stations and labels
  const shown = new Set();
  for (const name in pos) {
    const [x, y] = pos[name];
    const short = shortName(name);
    layer.appendChild(el("circle", { cx: x, cy: y, r: 5, fill: "#fff" }));

    const [dx, dy, anchor] = LABEL_SIDES[LABELS[short] || "right"];
    const label = el("text", {
      x: x + dx,
      y: y + dy,
      fill: "#bbb",
      "font-size": 10,
      "text-anchor": anchor,
    });
    label.textContent = short;
    layer.appendChild(label);
    shown.add(short);
  }

  for (const key in LABELS) {
    if (!shown.has(key)) console.warn("LABELS entry matches no station:", key);
  }
}
