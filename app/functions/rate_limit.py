"""Rate limit: extra events in the window are DROPPED (never run)."""

from datetime import timedelta

import inngest

from app import activity
from app.client import inngest_client

FN = "send-notification"


@inngest_client.create_function(
    fn_id=FN,
    trigger=inngest.TriggerEvent(event="demo/notification.send"),
    # At most 1 run per user every 10s. Compare with throttle, which queues instead.
    rate_limit=inngest.RateLimit(key="event.data.user_id", limit=1, period=timedelta(seconds=10)),
)
async def send_notification(ctx: inngest.Context) -> str:
    label = f"#{ctx.event.data.get('seq', 1)} to {ctx.event.data.get('user_id')}"

    async def send() -> str:
        activity.log(FN, f"Notification {label} sent", ctx.run_id)
        return f"sent {label}"

    return await ctx.step.run("send", send)
