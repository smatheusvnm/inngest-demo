"""Cancellation: a later event cancels a running or sleeping function."""

from datetime import timedelta

import inngest

from app import activity
from app.client import inngest_client

FN = "send-reminder"


@inngest_client.create_function(
    fn_id=FN,
    trigger=inngest.TriggerEvent(event="demo/reminder.scheduled"),
    # A "demo/reminder.cancelled" event with the same reminder_id cancels this run.
    cancel=[
        inngest.Cancel(
            event="demo/reminder.cancelled",
            if_exp="event.data.reminder_id == async.data.reminder_id",
        )
    ],
)
async def send_reminder(ctx: inngest.Context) -> str:
    reminder_id = ctx.event.data.get("reminder_id")

    async def schedule() -> None:
        activity.log(FN, f"Reminder {reminder_id} scheduled, sleeping 30s", ctx.run_id)

    async def send() -> str:
        activity.log(FN, f"Reminder {reminder_id} sent", ctx.run_id)
        return "sent"

    await ctx.step.run("schedule", schedule)
    await ctx.step.sleep("wait", timedelta(seconds=30))
    return await ctx.step.run("send", send)


@inngest_client.create_function(
    fn_id="log-cancelled-runs",
    trigger=inngest.TriggerEvent(event="inngest/function.cancelled"),
)
async def log_cancelled_runs(ctx: inngest.Context) -> None:
    """System event: Inngest emits it whenever a run is cancelled (event or timeout)."""
    # function_id is "<app-id>-<fn-id>"; log under the plain fn id so the UI groups it.
    function_id = ctx.event.data.get("function_id", "").removeprefix("inngest-demo-")
    run_id = ctx.event.data.get("run_id")
    activity.log(function_id, "Run cancelled (inngest/function.cancelled)", run_id)
