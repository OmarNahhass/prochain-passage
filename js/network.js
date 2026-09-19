import { COLORS } from "./data.js";

const NS = "http://www.w3.org/2000/svg";

export function el(tag, attrs) {
  const e = document.createElementNS(NS, tag);
  for (const k in attrs) e.setAttribute(k, attrs[k]);
  return e;
}

const LABEL_SIDES = {
  right: [11, -7, "start"],
  left: [-11, -7, "end"],
  "right-low": [11, 16, "start"],
  "left-low": [-11, 16, "end"],
  above: [0, -14, "middle"],
  below: [0, 21, "middle"],
};

const LABELS = {
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
  "Lionel-Groulx": "right-low",
  "Georges-Vanier": "right-low",
  "Lucien-L'Allier": "right-low",
  Bonaventure: "right-low",
  "Square-Victoria–OACI": "right-low",
  "Place-d'Armes": "right-low",
  "Champ-de-Mars": "right-low",
  "Berri-UQAM": "left-low",
  Sherbrooke: "left-low",
  "Mont-Royal": "right",
  Laurier: "above",
  Rosemont: "left-low",
  Beaubien: "right",
  "Jean-Talon": "left-low",
  Jarry: "right",
  Crémazie: "right",
  Sauvé: "right",
  "Henri-Bourassa": "right",
  Cartier: "right",
  "De la Concorde": "right",
  Montmorency: "right",
  Angrignon: "right-low",
  Monk: "right-low",
  Jolicoeur: "right-low",
  Verdun: "right-low",
  "De l'Église": "right-low",
  LaSalle: "left-low",
  Charlevoix: "left-low",
  Atwater: "left-low",
  "Guy-Concordia": "left",
  Peel: "left",
  McGill: "left",
  "Place-des-Arts": "left",
  "Saint-Laurent": "left",
  Beaudry: "left",
  Papineau: "left",
  Frontenac: "right",
  Préfontaine: "right",
  Joliette: "right",
  "Pie-IX": "right",
  Viau: "right",
  Assomption: "right",
  Cadillac: "left",
  Langelier: "left",
  Radisson: "left",
  "Honoré-Beaugrand": "left",
  "Côte-des-Neiges": "right-low",
  "Université-de-Montréal": "right-low",
  "Édouard-Montpetit": "right-low",
  Outremont: "left",
  Acadie: "left",
  Parc: "left",
  "De Castelnau": "left",
  Fabre: "right-low",
  "D'Iberville": "right-low",
  "Saint-Michel": "right-low",
  Longueuil: "right-low",
  "Jean-Drapeau": "right-low",
};

export function drawNetwork(layer, rows, pos) {
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
}
