import { COLORS, loadData, nowSeconds } from "./data.js";
import { el, drawNetwork } from "./network.js";
import { trainState } from "./trains.js";
import { upcomingArrivals } from "./station.js";
import { fetchStatus, noticesFor } from "./status.js";

const STATION = new URLSearchParams(location.search).get("station") || "Beaudry";

const NEAR = 360;
const IMMINENT = 75;
const MAX_SHOWN = 3;
const STATUS_EVERY = 60;

const LINE_NAMES = {
  1: "Ligne verte",
  2: "Ligne orange",
  4: "Ligne jaune",
  5: "Ligne bleue",
};

const svg = document.getElementById("map");
const networkLayer = el("g", {});
const trainLayer = el("g", {});
svg.appendChild(networkLayer);
svg.appendChild(trainLayer);

let lastPanel = -99;
let serviceStatus = null;

function formatClock(s) {
  const h = Math.floor(s / 3600),
    m = Math.floor((s % 3600) / 60);
  return String(h).padStart(2, "0") + ":" + String(m).padStart(2, "0");
}

function formatWait(sec) {
  if (sec < 45) return "à quai";
  return Math.round(sec / 60) + " min";
}

const { rows, pos, trips, network } = await loadData();

if (!(STATION in network.stations)) {
  document.getElementById("station-name").textContent =
    "Unknown station: " + STATION;
  throw new Error("Unknown station: " + STATION);
}

if (network.viewBox) svg.setAttribute("viewBox", network.viewBox);

drawNetwork(networkLayer, rows, pos);
document.getElementById("station-name").textContent = STATION.toUpperCase();
let simTime = nowSeconds();

const [sx, sy] = pos[STATION];
networkLayer.appendChild(
  el("circle", {
    cx: sx,
    cy: sy,
    r: 26,
    fill: "none",
    stroke: "#fff",
    "stroke-width": 4,
    class: "you-are-here",
  }),
);
networkLayer.appendChild(el("circle", { cx: sx, cy: sy, r: 10, fill: "#fff" }));

const MY_CODE = network.stations[STATION].code;

function secondsToStation(trip, t) {
  const i = trip.stops.indexOf(STATION);
  if (i === -1) return null;
  let wait = trip.times[i] - t;
  if (wait < -60) wait += 86400;
  return wait;
}

function trainCar(s, color, big, imminent) {
  const w = big ? 34 : 20;
  const h = big ? 15 : 10;
  const g = el("g", {
    transform: `translate(${s.x} ${s.y}) rotate(${s.angle})`,
  });

  if (big) {
    g.appendChild(
      el("rect", {
        x: -w / 2 - 5,
        y: -h / 2 - 5,
        width: w + 10,
        height: h + 10,
        rx: (h + 10) / 2,
        fill: color,
        opacity: 0.22,
        class: imminent ? "imminent" : "",
      }),
    );
  }
  g.appendChild(
    el("rect", {
      x: -w / 2,
      y: -h / 2,
      width: w,
      height: h,
      rx: h / 2,
      fill: color,
      stroke: "#fff",
      "stroke-width": big ? 3 : 1.5,
      opacity: big ? 1 : 0.6,
    }),
  );
  return g;
}

function drawTrains() {
  trainLayer.innerHTML = "";
  for (const trip of trips) {
    const s =
      trainState(trip, simTime, pos) || trainState(trip, simTime + 86400, pos);
    if (!s) continue;

    const wait = secondsToStation(trip, simTime);
    const approaching = wait !== null && wait >= -30 && wait <= NEAR;
    const imminent = wait !== null && wait >= -30 && wait <= IMMINENT;

    trainLayer.appendChild(
      trainCar(s, COLORS[trip.route], approaching, imminent),
    );
  }
}

function drawPanel() {
  const groups = upcomingArrivals(trips, STATION, simTime, MAX_SHOWN);
  const box = document.getElementById("arrivals");

  if (!groups.length) {
    box.innerHTML = `<div class="closed">Service terminé<span>Service ended</span></div>`;
    return;
  }

  box.innerHTML = groups
    .map((g) => {
      const first = g.waits[0];
      const rest = g.waits.slice(1);
      return `
      <div class="dir" style="--line:${COLORS[g.route]}">
        <div class="dest">${g.dest}</div>
        <div class="first ${first < 45 ? "boarding" : ""}">${formatWait(first)}</div>
        ${rest.length ? `<div class="rest">puis ${rest.map(formatWait).join(" · ")}</div>` : ""}
      </div>`;
    })
    .join("");
}

function applyStatus() {
  const box = document.getElementById("alerts");
  if (!serviceStatus) {
    box.innerHTML = "";
    return;
  }

  const disrupted = new Set(
    serviceStatus.lines.filter((l) => !l.normal).map((l) => l.route),
  );
  for (const line of networkLayer.querySelectorAll("[data-route]")) {
    line.classList.toggle(
      "line-disrupted",
      disrupted.has(line.getAttribute("data-route")),
    );
  }

  const items = [];

  for (const l of serviceStatus.lines) {
    if (l.normal) continue;
    items.push(`<div class="alert severe">
      <span class="line-name">${LINE_NAMES[l.route] || "Ligne " + l.route}</span>
      ${l.message}
    </div>`);
  }

  for (const n of noticesFor(serviceStatus, MY_CODE)) {
    items.push(`<div class="alert">
      <span class="line-name">Cette station</span>
      ${n.message}
    </div>`);
  }

  box.innerHTML = items.join("");
}

async function refreshStatus() {
  serviceStatus = await fetchStatus();
  applyStatus();
}

function frame() {
  simTime = nowSeconds();
  drawTrains();
  document.getElementById("clock").textContent = formatClock(simTime);

  if (simTime - lastPanel > 1) {
    drawPanel();
    lastPanel = simTime;
  }
  requestAnimationFrame(frame);
}

refreshStatus();
setInterval(refreshStatus, STATUS_EVERY * 1000);
setInterval(() => location.reload(), 3600 * 1000);

requestAnimationFrame(frame);
