import { COLORS, loadData } from "./data.js";
import { el, drawNetwork } from "./network.js";
import { trainState } from "./trains.js";
import { upcomingArrivals } from "./station.js";

// Which station this screen is installed at: display.html?station=Beaudry
const params = new URLSearchParams(location.search);
const STATION = params.get("station") || "Beaudry";

// A train counts as "approaching" when it reaches this station within NEAR seconds
const NEAR = 360; // 6 minutes: drawn large
const IMMINENT = 75; // about a minute away: halo pulses
const MAX_SHOWN = 3; // arrivals listed per direction
const LABEL_HOPS = 2; // label stations within this many stops of here

const svg = document.getElementById("map");
const networkLayer = el("g", {});
const trainLayer = el("g", {});
svg.appendChild(networkLayer);
svg.appendChild(trainLayer);

let simTime = 0;
let lastPanel = -99;

function nowSeconds() {
  const d = new Date();
  return (
    d.getHours() * 3600 +
    d.getMinutes() * 60 +
    d.getSeconds() +
    d.getMilliseconds() / 1000
  );
}

function formatClock(s) {
  const h = Math.floor(s / 3600),
    m = Math.floor((s % 3600) / 60);
  return String(h).padStart(2, "0") + ":" + String(m).padStart(2, "0");
}

function displayName(name) {
  return name.replace(/^Longueuil.*/, "Longueuil");
}

function formatWait(sec) {
  if (sec < 45) return "à quai";
  return Math.round(sec / 60) + " min";
}

const { rows, pos, trips } = await loadData();
const network = await fetch("network.json").then((r) => r.json());

if (!(STATION in network.stations)) {
  document.getElementById("station-name").textContent =
    "Unknown station: " + STATION;
  throw new Error("Unknown station: " + STATION);
}

// Crop the drawing to the area the stations occupy, so the map fills the screen
if (network.viewBox) svg.setAttribute("viewBox", network.viewBox);

// Walk outward through the network, one stop at a time (breadth-first search)
function nearbyStations(station, hops) {
  const near = new Set([station]);
  let frontier = [station];
  for (let step = 0; step < hops; step++) {
    const next = [];
    for (const e of network.edges) {
      if (frontier.includes(e.from) && !near.has(e.to)) {
        near.add(e.to);
        next.push(e.to);
      }
      if (frontier.includes(e.to) && !near.has(e.from)) {
        near.add(e.from);
        next.push(e.from);
      }
    }
    frontier = next;
  }
  return near;
}

// Label only what a viewer here needs: this station, its neighbours, terminals and interchanges
const labelled = nearbyStations(STATION, LABEL_HOPS);
for (const [name, s] of Object.entries(network.stations)) {
  if (s.terminal || s.routes.length > 1) labelled.add(name);
}

drawNetwork(networkLayer, rows, pos);
document.getElementById("station-name").textContent = STATION.toUpperCase();
simTime = nowSeconds();

// Ring marking the station this screen belongs to
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

// When does this trip reach our station? Returns seconds away, or null.
function secondsToStation(trip, t) {
  const i = trip.stops.indexOf(STATION);
  if (i === -1) return null;
  let wait = trip.times[i] - t;
  if (wait < -60) wait += 86400;
  return wait;
}

// A train drawn from above: a rounded rectangle pointing the way it travels
function trainCar(s, color, big, imminent) {
  const w = big ? 34 : 20; // length, along the track
  const h = big ? 15 : 10; // width, across the track
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
        <div class="dest">${displayName(g.dest)}</div>
        <div class="first ${first < 45 ? "boarding" : ""}">${formatWait(first)}</div>
        ${rest.length ? `<div class="rest">puis ${rest.map(formatWait).join(" · ")}</div>` : ""}
      </div>`;
    })
    .join("");
}

function frame() {
  simTime = nowSeconds();
  drawTrains();
  document.getElementById("clock").textContent = formatClock(simTime);

  if (simTime - lastPanel > 1 || lastPanel < 0) {
    drawPanel();
    lastPanel = simTime;
  }
  requestAnimationFrame(frame);
}

// Reload once an hour so a screen left running for weeks picks up new data
setInterval(() => location.reload(), 3600 * 1000);

requestAnimationFrame(frame);
