import datetime
import json
import os
import zipfile
from pathlib import Path

import httpx
import pandas as pd

GTFS_URL = "http://www.stm.info/sites/default/files/gtfs/gtfs_stm.zip"
GTFS_DIR = Path("gtfs")
OUT = Path("trips_today.json")
METRO_ROUTES = {"1", "2", "4", "5"}


def clean_name(n):
    return n.replace("Station ", "").replace(" -Zone B", "").strip()


def to_seconds(t):
    h, m, s = t.split(":")
    return int(h) * 3600 + int(m) * 60 + int(s)


def download_gtfs():
    GTFS_DIR.mkdir(exist_ok=True)
    tmp = Path("gtfs_stm.zip.tmp")
    with httpx.stream("GET", GTFS_URL, timeout=120, follow_redirects=True) as r:
        r.raise_for_status()
        with open(tmp, "wb") as f:
            for chunk in r.iter_bytes():
                f.write(chunk)
    with zipfile.ZipFile(tmp) as z:
        z.extractall(GTFS_DIR)
    tmp.unlink()


def gtfs_is_stale():
    feed = GTFS_DIR / "feed_info.txt"
    if not feed.exists():
        return True
    try:
        info = pd.read_csv(feed, dtype=str)
        end = info["feed_end_date"].iloc[0]
        return datetime.date.today().strftime("%Y%m%d") > end
    except Exception:
        return False


def active_services(today):
    ymd = today.strftime("%Y%m%d")
    weekday = today.strftime("%A").lower()

    cal = pd.read_csv(GTFS_DIR / "calendar.txt", dtype=str)
    active = set(cal[
        (cal[weekday] == "1")
        & (cal["start_date"] <= ymd)
        & (cal["end_date"] >= ymd)
    ]["service_id"])

    cd = pd.read_csv(GTFS_DIR / "calendar_dates.txt", dtype=str)
    cd = cd[cd["date"] == ymd]
    active |= set(cd[cd["exception_type"] == "1"]["service_id"])
    active -= set(cd[cd["exception_type"] == "2"]["service_id"])
    return active


def build_today():
    if gtfs_is_stale():
        download_gtfs()

    routes = pd.read_csv(GTFS_DIR / "routes.txt", dtype=str)
    trips = pd.read_csv(GTFS_DIR / "trips.txt", dtype=str)
    stops = pd.read_csv(GTFS_DIR / "stops.txt", dtype=str)

    metro_routes = routes[routes["route_id"].isin(METRO_ROUTES)]
    metro_trips = trips[trips["route_id"].isin(metro_routes["route_id"])]

    today = datetime.date.today()
    today_trips = metro_trips[metro_trips["service_id"].isin(active_services(today))]
    wanted = set(today_trips["trip_id"])

    chunks = pd.read_csv(GTFS_DIR / "stop_times.txt", dtype=str, chunksize=500_000)
    st = pd.concat(c[c["trip_id"].isin(wanted)] for c in chunks)

    st = st.copy()
    st["stop_sequence"] = st["stop_sequence"].astype(int)
    st["t"] = st["arrival_time"].apply(to_seconds)
    st = st.merge(stops[["stop_id", "stop_name"]], on="stop_id")
    st = st.merge(today_trips[["trip_id", "route_id"]], on="trip_id")
    st = st.sort_values(["trip_id", "stop_sequence"])

    out = []
    for _, g in st.groupby("trip_id"):
        out.append({
            "route": g["route_id"].iloc[0],
            "stops": [clean_name(n) for n in g["stop_name"]],
            "times": g["t"].tolist(),
        })

    tmp = OUT.with_suffix(".json.tmp")
    with open(tmp, "w", encoding="utf-8") as f:
        json.dump(out, f, ensure_ascii=False)
    os.replace(tmp, OUT)

    return {"date": today.isoformat(), "trips": len(out)}


if __name__ == "__main__":
    print(build_today())