"""Priority: higher-priority runs jump ahead in the queue."""

import asyncio

import inngest

from app import activity
from app.client import inngest_client

FN = "handle-ticket"


@inngest_client.create_function(
    fn_id=FN,
    trigger=inngest.TriggerEvent(event="demo/ticket.created"),
    # One ticket at a time, so a queue builds up...
    concurrency=[inngest.Concurrency(limit=1)],
    # ...and enterprise tickets are treated as if they arrived 600s earlier.
    priority=inngest.Priority(run="event.data.plan == 'enterprise' ? 600 : 0"),
)
async def handle_ticket(ctx: inngest.Context) -> str:
    plan = ctx.event.data.get("plan")
    label = f"{plan} ticket #{ctx.event.data.get('seq', 1)}"

    async def handle() -> str:
        activity.log(FN, f"Handling {label}", ctx.run_id)
        await asyncio.sleep(3)
        return f"handled {label}"

    return await ctx.step.run("handle", handle)
