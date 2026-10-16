"""Partial replay: finished steps are memoized and never run again.

Inngest calls the handler again for every step. Steps that already finished
return their saved result instantly, so only the failing step re-executes.
"""

import inngest

from app import activity
from app.client import inngest_client

FN = "process-order"


@inngest_client.create_function(
    fn_id=FN,
    trigger=inngest.TriggerEvent(event="demo/order.process"),
    retries=20,
)
async def process_order(ctx: inngest.Context) -> dict:
    order_id = ctx.event.data.get("order_id")

    # Code outside steps runs on every invocation. This line makes the re-runs visible.
    activity.log(FN, f"Handler invoked (attempt {ctx.attempt})", ctx.run_id)

    async def reserve_stock() -> dict:
        activity.log(FN, f"reserve-stock ran for {order_id}", ctx.run_id)
        return {"reserved": True}

    async def charge_payment() -> dict:
        activity.log(FN, "charge-payment ran (card charged exactly once)", ctx.run_id)
        return {"charged": 99.9}

    async def ship_order() -> dict:
        if activity.is_shipping_broken():
            activity.log(FN, "ship-order FAILED: carrier API down, retry in 5s", ctx.run_id)
            raise inngest.RetryAfterError("Carrier API is down", 5000)
        activity.log(FN, "ship-order ran: order shipped", ctx.run_id)
        return {"tracking": f"TRACK-{order_id}"}

    await ctx.step.run("reserve-stock", reserve_stock)
    payment = await ctx.step.run("charge-payment", charge_payment)
    shipment = await ctx.step.run("ship-order", ship_order)
    return {"order_id": order_id, "payment": payment, "shipment": shipment}
