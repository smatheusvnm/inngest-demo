"""Concurrency: cap how many runs execute at the same time."""

import asyncio

import inngest

from app import activity
from app.client import inngest_client

FN = "encode-video"


@inngest_client.create_function(
    fn_id=FN,
    trigger=inngest.TriggerEvent(event="demo/video.encode"),
    # At most 2 runs execute at once; the rest wait in the queue.
    # Add key="event.data.customer_id" to apply the limit per customer instead.
    concurrency=[inngest.Concurrency(limit=2)],
)
async def encode_video(ctx: inngest.Context) -> dict:
    label = f"{ctx.event.data.get('video_id')} #{ctx.event.data.get('seq', 1)}"

    async def encode() -> dict:
        activity.log(FN, f"Encoding {label} started", ctx.run_id)
        await asyncio.sleep(5)
        activity.log(FN, f"Encoding {label} finished", ctx.run_id)
        return {"video": label, "status": "encoded"}

    return await ctx.step.run("encode", encode)
