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

// Label side for every station, one side per straight run of the schematic.
// Bends, interchanges and terminals may break from their run to stay clear.
// Checked collision-free at 14px (display.css); stations missing here fall back to "right".
const LABELS = {
  // Orange, SE run: Côte-Vertu to Place-Saint-Henri
  "Côte-Vertu": "right",
  "Du Collège": "left-low",
  "De la Savane": "left-low",
  Namur: "left-low",
  Plamondon: "left-low",
  "Côte-Sainte-Catherine": "left-low",
  Snowdon: "left-low",
  "Villa-Maria": "left-low",
  Vendôme: "left-low",
  "Place-Saint-Henri": "left-low",

  // Orange, E run: Lionel-Groulx
  "Lionel-Groulx": "right-low",

  // Orange, NE run: Georges-Vanier to Square-Victoria–OACI
  "Georges-Vanier": "right-low",
  "Lucien-L'Allier": "right-low",
  Bonaventure: "right-low",
  "Square-Victoria–OACI": "right-low",

  // Orange, N run: Place-d'Armes to Champ-de-Mars
  "Place-d'Armes": "right-low",
  "Champ-de-Mars": "right-low",

  // Orange, NW run: Berri-UQAM to Mont-Royal
  "Berri-UQAM": "left-low",
  Sherbrooke: "left-low",
  "Mont-Royal": "right",

  // Orange, W run: Laurier to Rosemont
  Laurier: "above",
  Rosemont: "left-low",

  // Orange, NW run: Beaubien to Montmorency
  Beaubien: "right",
  "Jean-Talon": "left-low",
  Jarry: "right",
  Crémazie: "right",
  Sauvé: "right",
  "Henri-Bourassa": "right",
  Cartier: "right",
  "De la Concorde": "right",
  Montmorency: "right",

  // Green, NE run: Angrignon to De l'Église
  Angrignon: "right-low",
  Monk: "right-low",
  Jolicoeur: "right-low",
  Verdun: "right-low",
  "De l'Église": "right-low",

  // Green, N run: LaSalle to Atwater
  LaSalle: "left-low",
  Charlevoix: "left-low",
  Atwater: "left-low",

  // Green, NE run: Guy-Concordia to McGill
  "Guy-Concordia": "left",
  Peel: "left",
  McGill: "left",

  // Green, N run: Place-des-Arts to Saint-Laurent
  "Place-des-Arts": "left",
  "Saint-Laurent": "left",

  // Green, NE run: Beaudry to Papineau
  Beaudry: "left",
  Papineau: "left",

  // Green, N run: Frontenac to Cadillac
  Frontenac: "right",
  Préfontaine: "right",
  Joliette: "right",
  "Pie-IX": "right",
  Viau: "right",
  Assomption: "right",
  Cadillac: "left",

  // Green, NE run: Langelier to Honoré-Beaugrand
  Langelier: "left",
  Radisson: "left",
  "Honoré-Beaugrand": "left",

  // Blue, N run: Côte-des-Neiges to Édouard-Montpetit
  "Côte-des-Neiges": "right-low",
  "Université-de-Montréal": "right-low",
  "Édouard-Montpetit": "right-low",

  // Blue, NE run: Outremont
  Outremont: "left",

  // Blue, N run: Acadie to De Castelnau
  Acadie: "left",
  Parc: "left",
  "De Castelnau": "left",

  // Blue, NE run: Fabre to Saint-Michel
  Fabre: "right-low",
  "D'Iberville": "right-low",
  "Saint-Michel": "right-low",

  // Yellow, SW run: Longueuil to Jean-Drapeau
  Longueuil: "right-low",
  "Jean-Drapeau": "right-low",
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
