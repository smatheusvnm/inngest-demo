"""Fan-out: one event, two independent functions.

Both functions listen to the same event. Inngest creates one run per function,
so each one retries, fails and scales on its own.
"""

import asyncio

import inngest

from app import activity
from app.client import inngest_client

ORDER_CREATED = "demo/order.created"


@inngest_client.create_function(
    fn_id="send-confirmation-email",
    trigger=inngest.TriggerEvent(event=ORDER_CREATED),
)
async def send_confirmation_email(ctx: inngest.Context) -> str:
    order_id = ctx.event.data.get("order_id")

    async def send_email() -> str:
        await asyncio.sleep(1)
        activity.log("send-confirmation-email", f"Email sent for order {order_id}", ctx.run_id)
        return f"email sent for {order_id}"

    return await ctx.step.run("send-email", send_email)


@inngest_client.create_function(
    fn_id="update-inventory",
    trigger=inngest.TriggerEvent(event=ORDER_CREATED),
)
async def update_inventory(ctx: inngest.Context) -> str:
    order_id = ctx.event.data.get("order_id")

    async def decrement_stock() -> str:
        await asyncio.sleep(2)
        activity.log("update-inventory", f"Stock updated for order {order_id}", ctx.run_id)
        return f"stock updated for {order_id}"

    return await ctx.step.run("decrement-stock", decrement_stock)
