"""Every Inngest function served by the app."""

from app.functions import (
    batch,
    cancellation,
    concurrency,
    debounce,
    fan_out,
    idempotency,
    on_failure,
    output,
    priority,
    rate_limit,
    replay,
    singleton,
    throttle,
    timeouts,
)

ALL_FUNCTIONS = [
    fan_out.send_confirmation_email,
    fan_out.update_inventory,
    concurrency.encode_video,
    replay.process_order,
    debounce.search_products,
    idempotency.charge_payment_once,
    on_failure.risky_task,
    output.generate_report,
    rate_limit.send_notification,
    throttle.sync_external_api,
    priority.handle_ticket,
    singleton.sync_account,
    timeouts.slow_task,
    batch.track_page_views,
    cancellation.send_reminder,
    cancellation.log_cancelled_runs,
]
