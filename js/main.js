import { COLORS, loadData } from "./data.js";
import { el, drawNetwork } from "./network.js";
import { trainPosition } from "./trains.js";

const svg = document.getElementById("map");
const networkLayer = el("g", {});
const trainLayer = el("g", {});
svg.appendChild(networkLayer);
svg.appendChild(trainLayer);

let simTime = 0;
let speed = 1;
let lastFrame = performance.now();

function nowSeconds() {
  const d = new Date();
  return (
    d.getHours() * 3600 +
    d.getMinutes() * 60 +
    d.getSeconds() +
    d.getMilliseconds() / 1000
  );
}

function formatTime(s) {
  const h = Math.floor(s / 3600),
    m = Math.floor((s % 3600) / 60),
    sec = Math.floor(s % 60);
  return [h, m, sec].map((n) => String(n).padStart(2, "0")).join(":");
}

const { rows, pos, trips } = await loadData();
drawNetwork(networkLayer, rows, pos);
simTime = nowSeconds();

function frame(now) {
  const dt = (now - lastFrame) / 1000;
  lastFrame = now;
  simTime = (simTime + dt * speed) % 86400;

  trainLayer.innerHTML = "";
  let running = 0;
  for (const trip of trips) {
    // Trips after midnight use times past 24:00:00, so also check t + 86400
    const p =
      trainPosition(trip, simTime, pos) ||
      trainPosition(trip, simTime + 86400, pos);
    if (!p) continue;
    running++;
    trainLayer.appendChild(
      el("circle", {
        cx: p[0],
        cy: p[1],
        r: 8,
        fill: COLORS[trip.route],
        stroke: "#fff",
        "stroke-width": 2.5,
      }),
    );
  }

  document.getElementById("clock").textContent = formatTime(simTime);
  document.getElementById("count").textContent = `${running} trains running`;
  requestAnimationFrame(frame);
}

document.getElementById("speed").onchange = (e) =>
  (speed = Number(e.target.value));
document.getElementById("now").onclick = () => (simTime = nowSeconds());

requestAnimationFrame(frame);
