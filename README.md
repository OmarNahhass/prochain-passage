# Prochain Passage

A live departure board for the Montréal metro. Pick a station and the page shows
the next trains in each direction, alongside a schematic map of the whole network
with every train currently running animated in place.

Built from the STM's public GTFS schedule and their real-time service-status API.

## What it does

- **Departure panel** — next departures at the selected station, grouped by
  direction and terminus, with the wait in minutes (`à quai` when a train is at
  the platform).
- **Animated map** — a schematic SVG of lines 1, 2, 4 and 5. Every trip in
  today's schedule is interpolated between stops, so the dots move the way the
  trains do. Trains approaching your station are drawn larger, and pulse when
  they are less than ~75 seconds away.
- **Service status** — line disruptions from the STM alert feed grey out the
  affected line on the map; alerts scoped to your stop appear under the
  departures.
- **Station picker** — switch stations from the dropdown, or link straight to one
  with `?station=Beaudry`.

The schedule is rebuilt automatically at 03:00 each day, and the GTFS feed is
re-downloaded whenever it has expired.

## Running it

```bash
python -m venv venv
venv\Scripts\activate          # macOS/Linux: source venv/bin/activate
pip install -r requirements.txt
```

Create a `.env` with an STM developer API key (free, from
[developpeurs.stm.info](https://www.stm.info/en/about/developers)):

```
STM_API_KEY=your_key_here
```

Then build today's schedule and start the server:

```bash
python build_data.py           # downloads the GTFS feed, writes trips_today.json
uvicorn server:app --reload
```

Open http://127.0.0.1:8000. The server also does the first build on startup, so
the explicit `build_data.py` run is only needed if you want the data ready first.

The page needs the server: it fetches `/api/metro-status` for alerts, and the
static files are served from the same origin.

## How it's put together

| File | Role |
| --- | --- |
| `build_data.py` | Downloads the STM GTFS zip, filters it to today's active metro services, and writes `trips_today.json` — one entry per trip with its stop names and arrival times in seconds past midnight. |
| `server.py` | FastAPI app. Serves the static site, proxies the STM service-status feed (cached 60s) at `/api/status`, and reshapes it per line at `/api/metro-status`. Runs the daily rebuild loop. |
| `network.json` | Station coordinates, line memberships, stop codes, and the edges between stations. Drives the map geometry and the station list. |
| `stations_schematic.csv` | The same layout in route/sequence order, used to draw the coloured line paths. |
| `js/data.js` | Line colours, name cleanup, and data loading. |
| `js/network.js` | Draws the schematic: line paths, station dots, label placement. |
| `js/trains.js` | Interpolates a trip's position at a given time, including platform dwell. |
| `js/station.js` | Groups upcoming arrivals by destination and computes headways. |
| `js/status.js` | Fetches service status and matches notices to a stop code. |
| `js/display.js` | Ties it together: the render loop, the panel, the picker. |
| `01_explore.ipynb` | Scratch notebook used to work out the GTFS filtering and the schematic layout. |

`gtfs/`, `venv/` and `.env` are not tracked — the feed is downloaded on demand.

## Data

Schedules and alerts come from the
[Société de transport de Montréal](https://www.stm.info/). GTFS data is
published by the STM under its own terms; this project just reads it.

---

© 2026 Omar Nahhas
