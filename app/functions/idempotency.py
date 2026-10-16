"""Idempotency: the same key triggers the function at most once per 24h."""

import inngest

from app import activity
from app.client import inngest_client

FN = "charge-payment-once"


@inngest_client.create_function(
    fn_id=FN,
    trigger=inngest.TriggerEvent(event="demo/payment.requested"),
    # Duplicate events with the same payment_id are ignored for 24 hours.
    idempotency="event.data.payment_id",
)
async def charge_payment_once(ctx: inngest.Context) -> dict:
    payment_id = ctx.event.data.get("payment_id")
    amount = ctx.event.data.get("amount")

    async def charge() -> dict:
        activity.log(FN, f"Charged {amount} for payment {payment_id}", ctx.run_id)
        return {"payment_id": payment_id, "charged": amount}

    return await ctx.step.run("charge", charge)
