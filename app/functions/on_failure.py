"""on_failure: run a handler after the function exhausts its retries."""

import inngest

from app import activity
from app.client import inngest_client

FN = "risky-task"


async def alert_on_failure(ctx: inngest.Context) -> None:
    # ctx.event is the "inngest/function.failed" event:
    # data.error holds the error, data.event the original triggering event.
    error = ctx.event.data.get("error", {}).get("message", "unknown error")
    task_id = ctx.event.data.get("event", {}).get("data", {}).get("task_id")

    async def send_alert() -> None:
        activity.log(f"{FN} (on_failure)", f"Alert sent to on-call: task {task_id}: {error}")

    await ctx.step.run("send-alert", send_alert)


@inngest_client.create_function(
    fn_id=FN,
    trigger=inngest.TriggerEvent(event="demo/risky.task"),
    retries=1,
    on_failure=alert_on_failure,
)
async def risky_task(ctx: inngest.Context) -> None:
    task_id = ctx.event.data.get("task_id")

    async def call_flaky_service() -> None:
        activity.log(
            FN, f"Attempt {ctx.attempt + 1}: calling flaky service ({task_id})", ctx.run_id
        )
        # Any exception fails the step. RetryAfterError only shortens the wait before
        # the retry (3s instead of the default backoff) so the demo stays quick.
        raise inngest.RetryAfterError("Flaky service exploded", 3000)

    await ctx.step.run("call-flaky-service", call_flaky_service)
