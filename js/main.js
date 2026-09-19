import { COLORS, loadData, nowSeconds } from "./data.js";
import { el, drawNetwork } from "./network.js";
import { trainState } from "./trains.js";
import { upcomingArrivals, headway } from "./station.js";

const svg = document.getElementById("map");
const networkLayer = el("g", {});
const trainLayer = el("g", {});
svg.appendChild(networkLayer);
svg.appendChild(trainLayer);

let speed = 1;
let lastFrame = performance.now();
let selected = "";
let routesHere = null;
let lastPanelUpdate = -99;

function formatTime(s) {
  const h = Math.floor(s / 3600),
    m = Math.floor((s % 3600) / 60),
    sec = Math.floor(s % 60);
  return [h, m, sec].map((n) => String(n).padStart(2, "0")).join(":");
}

function formatWait(sec) {
  if (sec < 30) return "now";
  return Math.round(sec / 60) + " min";
}

const { rows, pos, trips, network } = await loadData();
if (network.viewBox) svg.setAttribute("viewBox", network.viewBox);
drawNetwork(networkLayer, rows, pos);
let simTime = nowSeconds();

const stationSelect = document.getElementById("station");
for (const name of Object.keys(network.stations).sort()) {
  stationSelect.appendChild(new Option(name, name));
}

function applySelection() {
  routesHere = selected ? new Set(network.stations[selected].routes) : null;

  for (const line of networkLayer.querySelectorAll("[data-route]")) {
    const off = selected && !routesHere.has(line.getAttribute("data-route"));
    line.classList.toggle("dim", off);
  }

  for (const node of networkLayer.querySelectorAll("[data-station]")) {
    const name = node.getAttribute("data-station");
    const serves =
      !selected || network.stations[name].routes.some((r) => routesHere.has(r));
    node.classList.toggle("dim", !serves);
    if (node.tagName === "circle") {
      node.setAttribute("r", name === selected ? 9 : 5);
      node.setAttribute("fill", name === selected ? "#ff3" : "#fff");
    }
  }

  lastPanelUpdate = -99;
}

function updatePanel() {
  const box = document.getElementById("arrivals");
  if (!selected) {
    box.innerHTML = "";
    return;
  }

  const groups = upcomingArrivals(trips, selected, simTime);
  if (!groups.length) {
    box.innerHTML = "<p style='color:#888'>No trains in the next hour.</p>";
    return;
  }

  box.innerHTML = groups
    .map((g) => {
      const gap = headway(g.waits);
      return `
      <div class="dest" style="border-color:${COLORS[g.route]}">
      <div class="where">to ${g.dest}</div>
      <div class="waits">${g.waits.map(formatWait).join(" · ")}</div>
        ${gap ? `<div class="gap">every ~${Math.round(gap / 60)} min</div>` : ""}
      </div>`;
    })
    .join("");
}

function frame(now) {
  const dt = (now - lastFrame) / 1000;
  lastFrame = now;
  simTime = (simTime + dt * speed) % 86400;

  trainLayer.innerHTML = "";
  let running = 0;
  for (const trip of trips) {
    const p =
      trainState(trip, simTime, pos) || trainState(trip, simTime + 86400, pos);
    if (!p) continue;
    running++;
    const dim = selected && !routesHere.has(trip.route);
    trainLayer.appendChild(
      el("circle", {
        cx: p.x,
        cy: p.y,
        r: 8,
        fill: COLORS[trip.route],
        stroke: "#fff",
        "stroke-width": 2.5,
        class: dim ? "dim" : "",
      }),
    );
  }

  document.getElementById("clock").textContent = formatTime(simTime);
  document.getElementById("count").textContent = `${running} trains running`;

  if (Math.abs(simTime - lastPanelUpdate) > 0.5) {
    updatePanel();
    lastPanelUpdate = simTime;
  }

  requestAnimationFrame(frame);
}

stationSelect.onchange = (e) => {
  selected = e.target.value;
  applySelection();
};
document.getElementById("speed").onchange = (e) =>
  (speed = Number(e.target.value));
document.getElementById("now").onclick = () => {
  simTime = nowSeconds();
  lastPanelUpdate = -99;
};

svg.addEventListener("click", (e) => {
  const name = e.target.getAttribute && e.target.getAttribute("data-station");
  if (!name) return;
  selected = selected === name ? "" : name;
  stationSelect.value = selected;
  applySelection();
});

requestAnimationFrame(frame);
