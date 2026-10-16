"""Timeouts: cancel runs that take too long."""

from datetime import timedelta

import inngest

from app import activity
from app.client import inngest_client

FN = "slow-task"


@inngest_client.create_function(
    fn_id=FN,
    trigger=inngest.TriggerEvent(event="demo/slow.task"),
    # finish: cancel if the run is not done 10s after it started.
    # start=timedelta(...) would cancel runs that wait too long in the queue.
    timeouts=inngest.Timeouts(finish=timedelta(seconds=10)),
)
async def slow_task(ctx: inngest.Context) -> str:
    seconds = int(ctx.event.data.get("seconds", 3))

    async def start() -> None:
        activity.log(FN, f"Started, will take {seconds}s (limit is 10s)", ctx.run_id)

    async def finish() -> str:
        activity.log(FN, f"Finished after {seconds}s", ctx.run_id)
        return "done"

    await ctx.step.run("start", start)
    await ctx.step.sleep("work", timedelta(seconds=seconds))
    return await ctx.step.run("finish", finish)
