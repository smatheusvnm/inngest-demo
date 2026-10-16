"""Debounce: wait for a quiet period, then run once with the latest event."""

from datetime import timedelta

import inngest

from app import activity
from app.client import inngest_client

FN = "search-products"


@inngest_client.create_function(
    fn_id=FN,
    trigger=inngest.TriggerEvent(event="demo/search.typed"),
    # Each new event for the same user restarts a 3s timer. When it expires,
    # the function runs once with the LAST event received.
    debounce=inngest.Debounce(key="event.data.user_id", period=timedelta(seconds=3)),
)
async def search_products(ctx: inngest.Context) -> dict:
    query = ctx.event.data.get("query", "")

    async def search() -> dict:
        activity.log(FN, f'Searching for "{query}"', ctx.run_id)
        return {"query": query, "results": 3}

    return await ctx.step.run("search", search)
