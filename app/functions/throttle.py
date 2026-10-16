"""Throttle: extra events are QUEUED and run later, at a steady pace."""

from datetime import timedelta

import inngest

from app import activity
from app.client import inngest_client

FN = "sync-external-api"


@inngest_client.create_function(
    fn_id=FN,
    trigger=inngest.TriggerEvent(event="demo/api.sync"),
    # Start at most 1 run every 5s. Nothing is dropped.
    # Options: key= for per-tenant throttling, burst= to allow short spikes.
    throttle=inngest.Throttle(limit=1, period=timedelta(seconds=5)),
)
async def sync_external_api(ctx: inngest.Context) -> str:
    label = f"{ctx.event.data.get('resource')} #{ctx.event.data.get('seq', 1)}"

    async def call_api() -> str:
        activity.log(FN, f"Called external API for {label}", ctx.run_id)
        return f"synced {label}"

    return await ctx.step.run("call-api", call_api)
