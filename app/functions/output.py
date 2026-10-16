"""Output: step results and the function's return value are stored by Inngest."""

import inngest

from app import activity
from app.client import inngest_client

FN = "generate-report"


@inngest_client.create_function(
    fn_id=FN,
    trigger=inngest.TriggerEvent(event="demo/report.generate"),
)
async def generate_report(ctx: inngest.Context) -> dict:
    month = ctx.event.data.get("month", "2026-10")

    async def fetch_sales() -> dict:
        activity.log(FN, f"Fetched sales for {month}", ctx.run_id)
        return {"orders": 128, "revenue": 45210.50}

    async def fetch_refunds() -> dict:
        activity.log(FN, f"Fetched refunds for {month}", ctx.run_id)
        return {"refunds": 4, "amount": 812.00}

    sales = await ctx.step.run("fetch-sales", fetch_sales)
    refunds = await ctx.step.run("fetch-refunds", fetch_refunds)

    # The return value is the run output: visible in the Dev UI and via the REST API.
    return {
        "month": month,
        "orders": sales["orders"],
        "net_revenue": round(sales["revenue"] - refunds["amount"], 2),
        "refund_rate": round(refunds["refunds"] / sales["orders"], 3),
    }
