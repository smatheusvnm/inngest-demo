"""FastAPI app: serves the demo UI, sends events, and exposes the Inngest functions."""

import os
from pathlib import Path

import httpx
import inngest
import inngest.fast_api
from fastapi import FastAPI, HTTPException, Response
from fastapi.responses import FileResponse
from pydantic import BaseModel, Field

from app import activity
from app.client import inngest_client
from app.functions import ALL_FUNCTIONS

INNGEST_BASE_URL = os.getenv("INNGEST_BASE_URL", "http://localhost:8288")
INDEX_HTML = Path(__file__).parent / "static" / "index.html"

app = FastAPI(title="Inngest Demo")


class SendEventsRequest(BaseModel):
    name: str
    data: dict = Field(default_factory=dict)
    count: int = Field(default=1, ge=1, le=50)


class Toggle(BaseModel):
    enabled: bool


@app.get("/", include_in_schema=False)
async def index() -> FileResponse:
    return FileResponse(INDEX_HTML)


@app.post("/api/events")
async def send_events(body: SendEventsRequest) -> dict:
    """Send `count` copies of an event. With count > 1, each copy gets data.seq = 1..count."""
    events = [
        inngest.Event(
            name=body.name,
            data={**body.data, "seq": seq} if body.count > 1 else body.data,
        )
        for seq in range(1, body.count + 1)
    ]
    try:
        ids = await inngest_client.send(events)
    except Exception as exc:
        raise HTTPException(status_code=502, detail=f"Could not send event: {exc}") from exc
    return {"ids": ids}


@app.get("/api/events/{event_id}/runs")
async def event_runs(event_id: str) -> dict:
    """Runs (status + output) triggered by an event, read from the Inngest REST API."""
    try:
        async with httpx.AsyncClient(timeout=5) as client:
            resp = await client.get(f"{INNGEST_BASE_URL}/v1/events/{event_id}/runs")
            resp.raise_for_status()
    except httpx.HTTPError as exc:
        raise HTTPException(status_code=502, detail=f"Could not fetch runs: {exc}") from exc
    return resp.json()


@app.get("/api/logs")
async def get_logs(after: int = 0) -> list[dict]:
    return activity.since(after)


@app.delete("/api/logs", status_code=204)
async def clear_logs() -> Response:
    activity.clear()
    return Response(status_code=204)


@app.get("/api/toggles/shipping-broken")
async def get_shipping_toggle() -> Toggle:
    return Toggle(enabled=activity.is_shipping_broken())


@app.put("/api/toggles/shipping-broken")
async def set_shipping_toggle(body: Toggle) -> Toggle:
    activity.set_shipping_broken(body.enabled)
    return body


# Exposes every function at /api/inngest for the Inngest dev server.
inngest.fast_api.serve(app, inngest_client, ALL_FUNCTIONS)
