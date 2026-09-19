"""Serves the site and proxies STM's i3 service-status API.

Run with:  uvicorn server:app --reload --port 8000
"""
import os
import time

import httpx
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.staticfiles import StaticFiles

load_dotenv()
API_KEY = os.getenv("STM_API_KEY")

STM_URL = "https://api.stm.info/pub/od/i3/v2/messages/etatservice"
METRO_ROUTES = {"1", "2", "4", "5"}
NORMAL = "Service normal"
CACHE_SECONDS = 60

app = FastAPI()

# Cache STM's answer: several screens polling often shouldn't mean many API calls
_cache = {"at": 0.0, "data": None}


@app.get("/api/status")
async def status():
    """The raw i3 feed: every alert for the whole network, buses included."""
    if not API_KEY:
        raise HTTPException(500, "STM_API_KEY is not set. Check your .env file.")

    now = time.time()
    if _cache["data"] and now - _cache["at"] < CACHE_SECONDS:
        return _cache["data"]

    headers = {"apiKey": API_KEY, "accept": "application/json"}

    try:
        async with httpx.AsyncClient(timeout=10) as client:
            r = await client.get(STM_URL, headers=headers)
    except httpx.RequestError as e:
        raise HTTPException(502, f"Could not reach STM: {e}")

    if r.status_code != 200:
        raise HTTPException(r.status_code, f"STM returned {r.status_code}: {r.text[:300]}")

    data = r.json()
    _cache.update(at=now, data=data)
    return data


def _text(texts):
    """STM gives each message in French and English; English is often null."""
    by_lang = {t["language"]: t["text"] for t in texts or []}
    return by_lang.get("fr") or by_lang.get("en") or ""


def _strip_html(s):
    """STM embeds <a> tags in messages; a display screen can't use links."""
    out, depth = [], 0
    for ch in s:
        if ch == "<":
            depth += 1
        elif ch == ">":
            depth = max(0, depth - 1)
        elif depth == 0:
            out.append(ch)
    return " ".join("".join(out).split())


@app.get("/api/metro-status")
async def metro_status():
    """Per-line status, plus any station-level notices, for the metro only."""
    data = await status()
    now = time.time()

    lines = {r: {"route": r, "normal": True, "message": ""} for r in METRO_ROUTES}
    notices = []

    for alert in data.get("alerts", []):
        routes = {
            e["route_short_name"]
            for e in alert.get("informed_entities", [])
            if e.get("route_short_name") in METRO_ROUTES
        }
        if not routes:
            continue

        # Skip alerts that haven't started yet or have already ended
        period = alert.get("active_periods") or {}
        start, end = period.get("start"), period.get("end")
        if (start and start > now) or (end and end < now):
            continue

        title = _text(alert.get("header_texts"))
        message = _strip_html(_text(alert.get("description_texts")))
        if not message:
            continue

        for route in routes:
            if title == "Votre ligne":
                lines[route] = {
                    "route": route,
                    "normal": message.startswith(NORMAL),
                    "message": message,
                }
            else:
                stops = [
                    e["stop_code"]
                    for e in alert["informed_entities"]
                    if "stop_code" in e
                ]
                notices.append({"route": route, "message": message, "stops": stops})

    return {
        "timestamp": data.get("header", {}).get("timestamp"),
        "lines": [lines[r] for r in sorted(lines)],
        "notices": notices,
    }


# Everything else is served as static files, like python -m http.server
app.mount("/", StaticFiles(directory=".", html=True), name="site")