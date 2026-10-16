"""Singleton: only one run per key at a time."""

import asyncio

import inngest

from app import activity
from app.client import inngest_client

FN = "sync-account"


@inngest_client.create_function(
    fn_id=FN,
    trigger=inngest.TriggerEvent(event="demo/account.sync"),
    # While a run for this account is active, new events are skipped.
    # mode="cancel" would instead cancel the running one and start the new one.
    singleton=inngest.Singleton(key="event.data.account_id", mode="skip"),
)
async def sync_account(ctx: inngest.Context) -> str:
    account_id = ctx.event.data.get("account_id")
    label = f"{account_id} #{ctx.event.data.get('seq', 1)}"

    async def sync() -> str:
        activity.log(FN, f"Sync started for {label}", ctx.run_id)
        await asyncio.sleep(8)
        activity.log(FN, f"Sync finished for {label}", ctx.run_id)
        return f"synced {account_id}"

    return await ctx.step.run("sync", sync)
