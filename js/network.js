import { COLORS } from "./data.js";

const NS = "http://www.w3.org/2000/svg";

export function el(tag, attrs) {
  const e = document.createElementNS(NS, tag);
  for (const k in attrs) e.setAttribute(k, attrs[k]);
  return e;
}

// Label positions relative to the station: [dx, dy, text-anchor]
const LABEL_SIDES = {
  right: [11, -7, "start"],
  left: [-11, -7, "end"],
  "right-low": [11, 16, "start"],
  "left-low": [-11, 16, "end"],
  above: [0, -14, "middle"],
  below: [0, 21, "middle"],
};

// Stations whose label shouldn't use the default ("right")
const LABELS = {
  // Orange, north
  Montmorency: "left",
  "De la Concorde": "above",
  Cartier: "above",
  "Henri-Bourassa": "right-low",
  Sauvé: "right-low",
  Crémazie: "left-low",
  Jarry: "right-low",
  "Jean-Talon": "left-low",
  Beaubien: "right-low",
  Rosemont: "right",
  Laurier: "left",
  "Mont-Royal": "right-low",
  Sherbrooke: "left",

  // Blue
  "De Castelnau": "left",
  Parc: "left",
  Acadie: "left",
  Outremont: "left-low",
  "Édouard-Montpetit": "left",
  "Université-de-Montréal": "left",
  "Côte-des-Neiges": "left",
  "Côte-Sainte-Catherine": "left-low",

  // Downtown, Green and Orange together
  "Berri-UQAM": "left-low",
  "Saint-Laurent": "left",
  "Place-des-Arts": "left",
  McGill: "left",
  Peel: "left-low",
  "Guy-Concordia": "left",
  Atwater: "left",
  "Champ-de-Mars": "right",
  "Place-d'Armes": "right-low",
  "Square-Victoria-OACI": "right",
  Bonaventure: "right-low",
  "Lucien-L'Allier": "right",
  "Georges-Vanier": "right-low",
  "Lionel-Groulx": "right",
  Charlevoix: "right",
  LaSalle: "right-low",

  // Orange, west
  Plamondon: "left",
  Namur: "left",
  Snowdon: "left",
  "Villa-Maria": "right-low",
  Vendôme: "left-low",
  "Place-Saint-Henri": "left",

  // Green, south
  Jolicoeur: "left",
  Monk: "left-low",
  Verdun: "right-low",
  "De l'Église": "right",
  Angrignon: "left-low",

  // Green, east
  Papineau: "right-low",
  Frontenac: "right",
  Préfontaine: "right-low",

  // Yellow
  "Jean-Drapeau": "right-low",
  Longueuil: "right",
};

// labelOnly: a Set of station names to label. Pass null to label every station.
export function drawNetwork(layer, rows, pos, labelOnly = null) {
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
        "stroke-width": 6,
        "stroke-linejoin": "round",
        "stroke-linecap": "round",
        "data-route": route,
      }),
    );
  }

  // Stations and labels (names are already short by this point)
  for (const name in pos) {
    const [x, y] = pos[name];
    layer.appendChild(
      el("circle", {
        cx: x,
        cy: y,
        r: 5,
        fill: "#fff",
        "data-station": name,
      }),
    );

    if (labelOnly && !labelOnly.has(name)) continue;

    const [dx, dy, anchor] = LABEL_SIDES[LABELS[name] || "right"];
    const label = el("text", {
      x: x + dx,
      y: y + dy,
      fill: "#bbb",
      "font-size": 10,
      "text-anchor": anchor,
      "data-station": name,
    });
    label.textContent = name;
    layer.appendChild(label);
  }

  for (const key in LABELS) {
    if (!(key in pos)) console.warn("LABELS entry matches no station:", key);
  }
}
