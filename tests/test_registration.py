from app.functions import ALL_FUNCTIONS


def config(fn_id: str) -> dict:
    fn = next(f for f in ALL_FUNCTIONS if f.local_id == fn_id)
    return fn.get_config("http://test").main.model_dump(exclude_none=True, by_alias=True)


def trigger_event(fn_id: str) -> str:
    return config(fn_id)["triggers"][0]["event"]


def test_all_functions_registered():
    assert {f.local_id for f in ALL_FUNCTIONS} == {
        "send-confirmation-email",
        "update-inventory",
        "encode-video",
        "process-order",
        "search-products",
        "charge-payment-once",
        "risky-task",
        "generate-report",
        "send-notification",
        "sync-external-api",
        "handle-ticket",
        "sync-account",
        "slow-task",
        "track-page-views",
        "send-reminder",
        "log-cancelled-runs",
    }


def test_fan_out_two_functions_same_event():
    assert trigger_event("send-confirmation-email") == "demo/order.created"
    assert trigger_event("update-inventory") == "demo/order.created"


def test_flow_control_configs():
    assert config("encode-video")["concurrency"] == [{"limit": 2}]
    assert config("search-products")["debounce"] == {"key": "event.data.user_id", "period": "3s"}
    assert config("charge-payment-once")["idempotency"] == "event.data.payment_id"
    assert config("send-notification")["rateLimit"] == {
        "key": "event.data.user_id",
        "limit": 1,
        "period": "10s",
    }
    assert config("sync-external-api")["throttle"]["limit"] == 1
    assert config("handle-ticket")["priority"]["run"].startswith("event.data.plan")
    assert config("handle-ticket")["concurrency"] == [{"limit": 1}]
    assert config("sync-account")["singleton"] == {"key": "event.data.account_id", "mode": "skip"}
    assert config("slow-task")["timeouts"] == {"finish": "10s"}
    assert config("track-page-views")["batchEvents"] == {"maxSize": 5, "timeout": "5s"}
    assert config("send-reminder")["cancel"][0]["event"] == "demo/reminder.cancelled"


def test_risky_task_has_failure_handler():
    fn = next(f for f in ALL_FUNCTIONS if f.local_id == "risky-task")
    assert fn.on_failure_fn_id is not None
