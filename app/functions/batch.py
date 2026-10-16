"""Batch: receive many events in a single run."""

from datetime import timedelta

import inngest

from app import activity
from app.client import inngest_client

FN = "track-page-views"


@inngest_client.create_function(
    fn_id=FN,
    trigger=inngest.TriggerEvent(event="demo/page.viewed"),
    # Run when 5 events are collected, or 5s after the first one, whichever comes first.
    batch_events=inngest.Batch(max_size=5, timeout=timedelta(seconds=5)),
)
async def track_page_views(ctx: inngest.Context) -> dict:
    views = [f"{e.data.get('page')}#{e.data.get('seq', 1)}" for e in ctx.events]

    async def store() -> dict:
        activity.log(FN, f"Stored batch of {len(views)}: {', '.join(views)}", ctx.run_id)
        return {"stored": len(views)}

    return await ctx.step.run("store", store)
