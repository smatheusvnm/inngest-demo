# Inngest Demo Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A FastAPI + Inngest demo app, run with Docker Compose behind Caddy, with a one-page UI that triggers 14 scenarios covering the main Inngest features.

**Architecture:** One FastAPI service serves the static UI, a generic "send event" endpoint, an in-memory activity log, and the Inngest serve endpoint. The Inngest dev server calls the app over the compose network. Caddy terminates HTTPS for `app.localhost` and `inngest.localhost`.

**Tech Stack:** Python 3.13, FastAPI, inngest 0.5.19, httpx, uvicorn, uv, pytest, ruff, Docker Compose, Caddy 2, just.

Spec: `docs/superpowers/specs/2026-10-15-inngest-demo-design.md`

Spec adjustments made while planning:
- No `.env` / `.env.example`: the stack needs no user config, so they would be noise.
- `/api/events` adds `data.seq = 1..count` when `count > 1`, so the log can tell copies apart.
- Extra helper function `log-cancelled-runs` listens to `inngest/function.cancelled` so timeouts and cancellations show up in the live log.

---

## File map

| File | Responsibility |
|---|---|
| `pyproject.toml`, `.python-version`, `.gitignore` | Project metadata, deps, tool config |
| `app/client.py` | The shared `inngest.Inngest` client |
| `app/activity.py` | In-memory activity log + `shipping_broken` toggle |
| `app/functions/*.py` | One module per scenario |
| `app/functions/__init__.py` | `ALL_FUNCTIONS` list |
| `app/main.py` | FastAPI routes + `inngest.fast_api.serve` |
| `app/static/index.html` | UI: scenario cards + live log |
| `tests/test_activity.py`, `tests/test_api.py`, `tests/test_registration.py` | Unit tests |
| `Dockerfile`, `compose.yaml`, `Caddyfile` | Runtime |
| `Justfile` | Documented commands |
| `README.md` | Quick start, scenario guide, demo script |

---

### Task 1: Project skeleton

**Files:** Create `pyproject.toml`, `.python-version`, `.gitignore`, `app/__init__.py`, `app/functions/__init__.py` (temporary empty list), `tests/__init__.py`

- [ ] **Step 1: Write `pyproject.toml`**

```toml
[project]
name = "inngest-demo"
version = "0.1.0"
description = "FastAPI + Inngest demo of the main Inngest features"
readme = "README.md"
requires-python = ">=3.13"
dependencies = [
    "fastapi>=0.115",
    "httpx>=0.27",
    "inngest>=0.5.19",
    "uvicorn[standard]>=0.30",
]

[dependency-groups]
dev = ["pytest>=8", "ruff>=0.6"]

[tool.ruff]
line-length = 100
target-version = "py313"

[tool.ruff.lint]
select = ["E", "F", "I", "UP", "B"]

[tool.pytest.ini_options]
testpaths = ["tests"]
pythonpath = ["."]
```

- [ ] **Step 2: Write `.python-version`** with `3.13`, and `.gitignore`:

```
.venv/
__pycache__/
.pytest_cache/
.ruff_cache/
.caddy-root.crt
.DS_Store
```

- [ ] **Step 3: Lock and install**

Run: `uv sync`
Expected: creates `.venv` and `uv.lock`.

- [ ] **Step 4: Commit**

```bash
git add pyproject.toml .python-version .gitignore uv.lock app tests
git commit -m "Add project skeleton"
```

### Task 2: Inngest client and activity log (TDD)

**Files:** Create `app/client.py`, `app/activity.py`, `tests/test_activity.py`

- [ ] **Step 1: Write the failing test** `tests/test_activity.py`

```python
from app import activity


def setup_function():
    activity.clear()
    activity.set_shipping_broken(False)


def test_log_and_since_return_new_entries_only():
    activity.log("fn-a", "first", run_id="run-1")
    first_id = activity.since(0)[-1]["id"]
    activity.log("fn-b", "second")

    entries = activity.since(first_id)

    assert [e["message"] for e in entries] == ["second"]
    assert entries[0]["function"] == "fn-b"
    assert entries[0]["run_id"] is None


def test_clear_removes_entries():
    activity.log("fn-a", "hello")
    activity.clear()
    assert activity.since(0) == []


def test_shipping_toggle():
    assert activity.is_shipping_broken() is False
    activity.set_shipping_broken(True)
    assert activity.is_shipping_broken() is True
```

- [ ] **Step 2: Run** `uv run pytest tests/test_activity.py -v` → FAIL (`ImportError`).

- [ ] **Step 3: Implement `app/activity.py`**

```python
"""In-memory activity log shown in the UI, plus the toggle for the replay demo.

Everything lives in process memory, so restarting the app clears it. Fine for a demo.
"""

import itertools
import time
from collections import deque

_entries: deque[dict] = deque(maxlen=500)
_ids = itertools.count(1)
_shipping_broken = False


def log(function: str, message: str, run_id: str | None = None) -> None:
    """Record one line for the live activity panel."""
    _entries.append(
        {
            "id": next(_ids),
            "ts": time.time(),
            "function": function,
            "message": message,
            "run_id": run_id,
        }
    )


def since(after_id: int = 0) -> list[dict]:
    """Entries newer than `after_id` (the UI polls with the last id it has seen)."""
    return [entry for entry in _entries if entry["id"] > after_id]


def clear() -> None:
    _entries.clear()


def is_shipping_broken() -> bool:
    return _shipping_broken


def set_shipping_broken(enabled: bool) -> None:
    global _shipping_broken
    _shipping_broken = enabled
```

- [ ] **Step 4: Implement `app/client.py`**

```python
"""The single Inngest client shared by the API and every function."""

import inngest

# INNGEST_DEV and INNGEST_BASE_URL come from the environment (see compose.yaml).
inngest_client = inngest.Inngest(app_id="inngest-demo", is_production=False)
```

- [ ] **Step 5: Run** `uv run pytest tests/test_activity.py -v` → 3 passed.

- [ ] **Step 6: Commit** `git commit -m "Add Inngest client and activity log"`

### Task 3: Inngest functions (TDD via registration test)

**Files:** Create every module in `app/functions/`, `tests/test_registration.py`; replace `app/functions/__init__.py`

- [ ] **Step 1: Write the failing test** `tests/test_registration.py`

```python
from app.functions import ALL_FUNCTIONS


def config(fn_id: str) -> dict:
    fn = next(f for f in ALL_FUNCTIONS if f.local_id == fn_id)
    return fn.get_config("http://test").main.model_dump(exclude_none=True)


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
```

Note: confirm the camelCase keys (`rateLimit`, `batchEvents`, `maxSize`) by printing a config once; adjust the test keys if the SDK serializes differently.

- [ ] **Step 2: Run** `uv run pytest tests/test_registration.py -v` → FAIL (`ALL_FUNCTIONS` empty / ImportError).

- [ ] **Step 3: Write the function modules**

`app/functions/fan_out.py`
```python
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
```

`app/functions/concurrency.py`
```python
"""Concurrency: cap how many runs execute at the same time."""

import asyncio

import inngest

from app import activity
from app.client import inngest_client

FN = "encode-video"


@inngest_client.create_function(
    fn_id=FN,
    trigger=inngest.TriggerEvent(event="demo/video.encode"),
    # At most 2 runs execute at once; the rest wait in the queue.
    # Add key="event.data.customer_id" to apply the limit per customer instead.
    concurrency=[inngest.Concurrency(limit=2)],
)
async def encode_video(ctx: inngest.Context) -> dict:
    label = f"{ctx.event.data.get('video_id')} #{ctx.event.data.get('seq', 1)}"

    async def encode() -> dict:
        activity.log(FN, f"Encoding {label} started", ctx.run_id)
        await asyncio.sleep(5)
        activity.log(FN, f"Encoding {label} finished", ctx.run_id)
        return {"video": label, "status": "encoded"}

    return await ctx.step.run("encode", encode)
```

`app/functions/replay.py`
```python
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
```

`app/functions/debounce.py`
```python
"""Debounce: wait for a quiet period, then run once with the latest event."""

from datetime import timedelta

import inngest

from app import activity
from app.client import inngest_client

FN = "search-products"


@inngest_client.create_function(
    fn_id=FN,
    trigger=inngest.TriggerEvent(event="demo/search.typed"),
    # Each new event for the same user restarts a 3s timer. When it expires,
    # the function runs once with the LAST event received.
    debounce=inngest.Debounce(key="event.data.user_id", period=timedelta(seconds=3)),
)
async def search_products(ctx: inngest.Context) -> dict:
    query = ctx.event.data.get("query", "")

    async def search() -> dict:
        activity.log(FN, f'Searching for "{query}"', ctx.run_id)
        return {"query": query, "results": 3}

    return await ctx.step.run("search", search)
```

`app/functions/idempotency.py`
```python
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
```

`app/functions/on_failure.py`
```python
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
        raise RuntimeError("Flaky service exploded")

    await ctx.step.run("call-flaky-service", call_flaky_service)
```

`app/functions/output.py`
```python
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
```

`app/functions/rate_limit.py`
```python
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
```

`app/functions/throttle.py`
```python
"""Throttle: extra events are QUEUED and run later, at a steady pace."""

from datetime import timedelta

import inngest

from app import activity
from app.client import inngest_client

FN = "sync-external-api"


@inngest_client.create_function(
    fn_id=FN,
    trigger=inngest.TriggerEvent(event="demo/api.sync"),
    # Start at most 1 run every 5s. Nothing is dropped.
    # Options: key= for per-tenant throttling, burst= to allow short spikes.
    throttle=inngest.Throttle(limit=1, period=timedelta(seconds=5)),
)
async def sync_external_api(ctx: inngest.Context) -> str:
    label = f"{ctx.event.data.get('resource')} #{ctx.event.data.get('seq', 1)}"

    async def call_api() -> str:
        activity.log(FN, f"Called external API for {label}", ctx.run_id)
        return f"synced {label}"

    return await ctx.step.run("call-api", call_api)
```

`app/functions/priority.py`
```python
"""Priority: higher-priority runs jump ahead in the queue."""

import asyncio

import inngest

from app import activity
from app.client import inngest_client

FN = "handle-ticket"


@inngest_client.create_function(
    fn_id=FN,
    trigger=inngest.TriggerEvent(event="demo/ticket.created"),
    # One ticket at a time, so a queue builds up...
    concurrency=[inngest.Concurrency(limit=1)],
    # ...and enterprise tickets are treated as if they arrived 600s earlier.
    priority=inngest.Priority(run="event.data.plan == 'enterprise' ? 600 : 0"),
)
async def handle_ticket(ctx: inngest.Context) -> str:
    plan = ctx.event.data.get("plan")
    label = f"{plan} ticket #{ctx.event.data.get('seq', 1)}"

    async def handle() -> str:
        activity.log(FN, f"Handling {label}", ctx.run_id)
        await asyncio.sleep(3)
        return f"handled {label}"

    return await ctx.step.run("handle", handle)
```

`app/functions/singleton.py`
```python
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
```

`app/functions/timeouts.py`
```python
"""Timeouts: cancel runs that take too long."""

from datetime import timedelta

import inngest

from app import activity
from app.client import inngest_client

FN = "slow-task"


@inngest_client.create_function(
    fn_id=FN,
    trigger=inngest.TriggerEvent(event="demo/slow.task"),
    # finish: cancel if the run is not done 10s after it started.
    # start=timedelta(...) would cancel runs that wait too long in the queue.
    timeouts=inngest.Timeouts(finish=timedelta(seconds=10)),
)
async def slow_task(ctx: inngest.Context) -> str:
    seconds = int(ctx.event.data.get("seconds", 3))

    async def start() -> None:
        activity.log(FN, f"Started, will take {seconds}s (limit is 10s)", ctx.run_id)

    async def finish() -> str:
        activity.log(FN, f"Finished after {seconds}s", ctx.run_id)
        return "done"

    await ctx.step.run("start", start)
    await ctx.step.sleep("work", timedelta(seconds=seconds))
    return await ctx.step.run("finish", finish)
```

`app/functions/batch.py`
```python
"""Batch: receive many events in a single run."""

from datetime import timedelta

import inngest

from app import activity
from app.client import inngest_client

FN = "track-page-views"


@inngest_client.create_function(
    fn_id=FN,
    trigger=inngest.TriggerEvent(event="demo/page.viewed"),
    # Run when 5 events are collected, or 5s after the first one, whichever comes first.
    batch_events=inngest.Batch(max_size=5, timeout=timedelta(seconds=5)),
)
async def track_page_views(ctx: inngest.Context) -> dict:
    views = [f"{e.data.get('page')}#{e.data.get('seq', 1)}" for e in ctx.events]

    async def store() -> dict:
        activity.log(FN, f"Stored batch of {len(views)}: {', '.join(views)}", ctx.run_id)
        return {"stored": len(views)}

    return await ctx.step.run("store", store)
```

`app/functions/cancellation.py`
```python
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
    function_id = ctx.event.data.get("function_id")
    run_id = ctx.event.data.get("run_id")
    activity.log("inngest/function.cancelled", f"Run of {function_id} was cancelled", run_id)
```

`app/functions/__init__.py`
```python
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
```

- [ ] **Step 4: Run** `uv run pytest tests/test_registration.py -v` → 4 passed.
- [ ] **Step 5: Run** `uv run ruff check . && uv run ruff format .`
- [ ] **Step 6: Commit** `git commit -m "Add Inngest demo functions"`

### Task 4: FastAPI app (TDD)

**Files:** Create `app/main.py`, `tests/test_api.py`

- [ ] **Step 1: Write the failing test** `tests/test_api.py`

```python
import pytest
from fastapi.testclient import TestClient

from app import activity
from app.main import app, inngest_client


@pytest.fixture
def client():
    activity.clear()
    activity.set_shipping_broken(False)
    return TestClient(app)


def test_send_events_adds_seq_when_count_gt_1(client, monkeypatch):
    sent = []

    async def fake_send(events):
        sent.extend(events)
        return [f"id-{i}" for i, _ in enumerate(events)]

    monkeypatch.setattr(inngest_client, "send", fake_send)

    resp = client.post("/api/events", json={"name": "demo/x", "data": {"a": 1}, "count": 3})

    assert resp.status_code == 200
    assert resp.json() == {"ids": ["id-0", "id-1", "id-2"]}
    assert [e.data for e in sent] == [{"a": 1, "seq": 1}, {"a": 1, "seq": 2}, {"a": 1, "seq": 3}]


def test_send_single_event_keeps_data(client, monkeypatch):
    sent = []

    async def fake_send(events):
        sent.extend(events)
        return ["id-0"]

    monkeypatch.setattr(inngest_client, "send", fake_send)

    client.post("/api/events", json={"name": "demo/x", "data": {"a": 1}})

    assert sent[0].data == {"a": 1}


def test_send_events_failure_returns_502(client, monkeypatch):
    async def boom(events):
        raise RuntimeError("dev server down")

    monkeypatch.setattr(inngest_client, "send", boom)

    resp = client.post("/api/events", json={"name": "demo/x"})

    assert resp.status_code == 502
    assert "dev server down" in resp.json()["detail"]


def test_logs_endpoints(client):
    activity.log("fn", "hello")

    assert [e["message"] for e in client.get("/api/logs").json()] == ["hello"]
    assert client.delete("/api/logs").status_code == 204
    assert client.get("/api/logs").json() == []


def test_shipping_toggle_endpoints(client):
    assert client.get("/api/toggles/shipping-broken").json() == {"enabled": False}
    client.put("/api/toggles/shipping-broken", json={"enabled": True})
    assert client.get("/api/toggles/shipping-broken").json() == {"enabled": True}


def test_index_served(client):
    resp = client.get("/")
    assert resp.status_code == 200
    assert "Inngest Demo" in resp.text
```

- [ ] **Step 2: Run** `uv run pytest tests/test_api.py -v` → FAIL (`ModuleNotFoundError: app.main`).

- [ ] **Step 3: Implement `app/main.py`**

```python
"""FastAPI app: serves the demo UI, sends events, and exposes the Inngest functions."""

import os
from pathlib import Path

import httpx
import inngest
import inngest.fast_api
from fastapi import FastAPI, HTTPException, Response
from fastapi.responses import FileResponse
from pydantic import BaseModel, Field

from app import activity
from app.client import inngest_client
from app.functions import ALL_FUNCTIONS

INNGEST_BASE_URL = os.getenv("INNGEST_BASE_URL", "http://localhost:8288")
INDEX_HTML = Path(__file__).parent / "static" / "index.html"

app = FastAPI(title="Inngest Demo")


class SendEventsRequest(BaseModel):
    name: str
    data: dict = Field(default_factory=dict)
    count: int = Field(default=1, ge=1, le=50)


class Toggle(BaseModel):
    enabled: bool


@app.get("/", include_in_schema=False)
async def index() -> FileResponse:
    return FileResponse(INDEX_HTML)


@app.post("/api/events")
async def send_events(body: SendEventsRequest) -> dict:
    """Send `count` copies of an event. With count > 1, each copy gets data.seq = 1..count."""
    events = [
        inngest.Event(
            name=body.name,
            data={**body.data, "seq": seq} if body.count > 1 else body.data,
        )
        for seq in range(1, body.count + 1)
    ]
    try:
        ids = await inngest_client.send(events)
    except Exception as exc:
        raise HTTPException(status_code=502, detail=f"Could not send event: {exc}") from exc
    return {"ids": ids}


@app.get("/api/events/{event_id}/runs")
async def event_runs(event_id: str) -> dict:
    """Runs (status + output) triggered by an event, read from the Inngest REST API."""
    try:
        async with httpx.AsyncClient(timeout=5) as client:
            resp = await client.get(f"{INNGEST_BASE_URL}/v1/events/{event_id}/runs")
            resp.raise_for_status()
    except httpx.HTTPError as exc:
        raise HTTPException(status_code=502, detail=f"Could not fetch runs: {exc}") from exc
    return resp.json()


@app.get("/api/logs")
async def get_logs(after: int = 0) -> list[dict]:
    return activity.since(after)


@app.delete("/api/logs", status_code=204)
async def clear_logs() -> Response:
    activity.clear()
    return Response(status_code=204)


@app.get("/api/toggles/shipping-broken")
async def get_shipping_toggle() -> Toggle:
    return Toggle(enabled=activity.is_shipping_broken())


@app.put("/api/toggles/shipping-broken")
async def set_shipping_toggle(body: Toggle) -> Toggle:
    activity.set_shipping_broken(body.enabled)
    return body


# Exposes every function at /api/inngest for the Inngest dev server.
inngest.fast_api.serve(app, inngest_client, ALL_FUNCTIONS)
```

- [ ] **Step 4:** Create a minimal `app/static/index.html` containing `<title>Inngest Demo</title>` (replaced in Task 5).
- [ ] **Step 5: Run** `uv run pytest -v` → all pass.
- [ ] **Step 6: Commit** `git commit -m "Add FastAPI app"`

### Task 5: Frontend

**Files:** Replace `app/static/index.html`

One file, plain HTML/CSS/JS. The page is driven by this `SCENARIOS` array (the rendering code is generic):

```js
const SCENARIOS = [
  { title: "0. Fan-out", text: "One event, two functions. Each gets its own run, retries and logs.",
    event: "demo/order.created", data: { order_id: "ord_123", total: 99.9 },
    buttons: [{ label: "Send" }] },
  { title: "1. Concurrency", text: "Limit 2. Send 6 jobs and watch at most 2 encode at the same time.",
    event: "demo/video.encode", data: { video_id: "vid_42" },
    buttons: [{ label: "Send 6×", count: 6 }] },
  { title: "2. Partial replay", text: "Steps are memoized. Turn on 'shipping broken', send, watch only ship-order retry, then turn it off.",
    event: "demo/order.process", data: { order_id: "ord_777" },
    buttons: [{ label: "Send" }], toggle: true },
  { title: "3. Debounce", text: "Type below: one event per keystroke, one run 3s after you stop.",
    event: "demo/search.typed", data: { user_id: "user_1" }, typing: true, buttons: [] },
  { title: "4. Idempotency", text: "Same payment_id sent 3 times: only 1 charge.",
    event: "demo/payment.requested", data: { payment_id: "pay_001", amount: 50 },
    buttons: [{ label: "Send same payment 3×", count: 3 }] },
  { title: "5. on_failure", text: "Always fails. After 1 retry, the on_failure handler sends an alert.",
    event: "demo/risky.task", data: { task_id: "task_9" },
    buttons: [{ label: "Send" }] },
  { title: "6. Output", text: "The function's return value is stored. We read it back from the Inngest API.",
    event: "demo/report.generate", data: { month: "2026-10" },
    buttons: [{ label: "Generate report", showOutput: true }] },
  { title: "7. Rate limit", text: "1 per user per 10s. Send 5: 1 runs, 4 are DROPPED.",
    event: "demo/notification.send", data: { user_id: "user_1" },
    buttons: [{ label: "Send 5×", count: 5 }] },
  { title: "8. Throttle", text: "1 every 5s. Send 5: all run, spaced out. Nothing dropped.",
    event: "demo/api.sync", data: { resource: "contacts" },
    buttons: [{ label: "Send 5×", count: 5 }] },
  { title: "9. Priority", text: "One at a time. Queue 5 free tickets, then 1 enterprise: enterprise runs next.",
    event: "demo/ticket.created", data: { plan: "free" },
    buttons: [{ label: "5 free, then 1 enterprise",
                sequence: [{ data: { plan: "free" }, count: 5 }, { data: { plan: "enterprise" }, count: 1 }] }] },
  { title: "10. Singleton", text: "One run per account. Send 3 quickly: 1 runs, 2 are skipped.",
    event: "demo/account.sync", data: { account_id: "acc_1" },
    buttons: [{ label: "Send 3×", count: 3 }] },
  { title: "11. Timeouts", text: "Runs must finish within 10s.",
    event: "demo/slow.task", data: { seconds: 3 },
    buttons: [{ label: "3s (completes)", data: { seconds: 3 } }, { label: "15s (times out)", data: { seconds: 15 } }] },
  { title: "12. Batch", text: "Up to 5 events per run, or whatever arrived after 5s. Send 12: runs of 5, 5, 2.",
    event: "demo/page.viewed", data: { page: "/pricing" },
    buttons: [{ label: "Send 12×", count: 12 }] },
  { title: "13. Cancellation", text: "Schedule a reminder (sleeps 30s), then cancel it with another event.",
    event: "demo/reminder.scheduled", data: { reminder_id: "rem_1" },
    buttons: [{ label: "Schedule" }, { label: "Cancel", event: "demo/reminder.cancelled" }] },
];
```

Behaviour to implement:
- Layout: header (title, links to `https://inngest.localhost` Dev UI), two columns: cards grid (left), sticky "Live activity" panel (right) with a Clear button.
- Card: title, text, `<textarea>` with `JSON.stringify(data, null, 2)`, buttons, "View runs in Dev UI" link to `https://inngest.localhost/runs`.
- Button click: payload data = `button.data ?? JSON.parse(textarea)`; event = `button.event ?? scenario.event`; `count = button.count ?? 1`; `sequence` sends each item in order. POST `/api/events`. Show a toast with the returned ids, or the error detail.
- `toggle: true`: a checkbox bound to GET/PUT `/api/toggles/shipping-broken`.
- `typing: true`: an `<input>`; on every `input` event, send `{...textareaData, query: input.value}`.
- `showOutput: true`: after sending, poll `/api/events/{id}/runs` every 1s (max 30 tries) until a run has status `Completed`/`Failed`; show `output` in a `<pre>` under the card.
- Live log: poll `/api/logs?after=<lastId>` every 1s; append rows `HH:MM:SS.mmm  [function]  message`; function badge colour from a hash of the name; auto-scroll; Clear calls `DELETE /api/logs` and empties the panel.

- [ ] **Step 1:** Write the file.
- [ ] **Step 2:** `uv run pytest tests/test_api.py::test_index_served -v` → PASS.
- [ ] **Step 3: Commit** `git commit -m "Add demo frontend"`

### Task 6: Docker, Compose, Caddy

**Files:** Create `Dockerfile`, `.dockerignore`, `compose.yaml`, `Caddyfile`

`Dockerfile`
```dockerfile
FROM python:3.13-slim

COPY --from=ghcr.io/astral-sh/uv:latest /uv /uvx /bin/

ENV UV_COMPILE_BYTECODE=1 \
    UV_LINK_MODE=copy \
    UV_PROJECT_ENVIRONMENT=/venv \
    PATH="/venv/bin:$PATH" \
    PYTHONUNBUFFERED=1

WORKDIR /code

# Dependencies first, so code changes don't reinstall them.
COPY pyproject.toml uv.lock ./
RUN uv sync --frozen --no-dev

COPY app ./app

EXPOSE 8000
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--reload", "--reload-dir", "app"]
```

`.dockerignore`
```
.venv
.git
**/__pycache__
.pytest_cache
.ruff_cache
docs
tests
```

`compose.yaml`
```yaml
name: inngest-demo

services:
  # FastAPI app: UI + API + Inngest functions (hot reload on ./app changes)
  app:
    build: .
    environment:
      INNGEST_DEV: "1"
      INNGEST_BASE_URL: http://inngest:8288
    volumes:
      - ./app:/code/app

  # Inngest dev server: event API, queue, executor and Dev UI (in-memory)
  inngest:
    image: inngest/inngest:latest
    command: inngest dev --host 0.0.0.0 -u http://app:8000/api/inngest --no-discovery
    ports:
      - "8288:8288" # fallback Dev UI at http://localhost:8288
    depends_on:
      - app

  # Caddy: local HTTPS for https://app.localhost and https://inngest.localhost
  caddy:
    image: caddy:2-alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./Caddyfile:/etc/caddy/Caddyfile:ro
      - caddy_data:/data
      - caddy_config:/config
    depends_on:
      - app
      - inngest

volumes:
  caddy_data:
  caddy_config:
```

`Caddyfile`
```
# Caddy signs these with its own local CA. Run `just trust` once to trust it.

app.localhost {
	tls internal
	reverse_proxy app:8000
}

inngest.localhost {
	tls internal
	reverse_proxy inngest:8288
}
```

- [ ] **Step 1:** Write the files.
- [ ] **Step 2:** `docker compose up -d --build` → all 3 services `running` in `docker compose ps`.
- [ ] **Step 3:** `curl -sk https://app.localhost/ | grep -c "Inngest Demo"` → `1`; `curl -sk -o /dev/null -w '%{http_code}' https://inngest.localhost/` → `200`.
- [ ] **Step 4:** `curl -s localhost:8288/v1/apps` (or Dev UI) shows the `inngest-demo` app synced with 16 functions.
- [ ] **Step 5: Commit** `git commit -m "Add Docker Compose stack with Caddy"`

### Task 7: Justfile

**Files:** Create `Justfile`

```just
# Inngest demo. Run `just` to list every command.

app_url := "https://app.localhost"
dev_ui_url := "https://inngest.localhost"

# List all commands
default:
    @just --list --unsorted

# Check required tools and install Python deps locally (for tests, lint and your editor)
setup:
    @command -v docker >/dev/null || (echo "docker not found: install Docker Desktop" && exit 1)
    @command -v uv >/dev/null || (echo "uv not found: brew install uv" && exit 1)
    uv sync
    @echo "Ready. Next: just up"

# Build and start app + Inngest dev server + Caddy in the background
up:
    docker compose up -d --build
    @echo ""
    @echo "  App (buttons + live log): {{app_url}}"
    @echo "  Inngest Dev UI:           {{dev_ui_url}}   (fallback: http://localhost:8288)"
    @echo ""
    @echo "  First time? Run 'just trust' to remove the browser HTTPS warning."

# Stop the stack (keeps Caddy's certificates)
down:
    docker compose down

# Restart all services
restart:
    docker compose restart

# Show service status
ps:
    docker compose ps

# Follow logs: `just logs` for all services, `just logs app` for one
logs service="":
    docker compose logs -f {{service}}

# Trust Caddy's local CA in the macOS keychain (asks for your password, run once after `just up`)
trust:
    docker compose cp caddy:/data/caddy/pki/authorities/local/root.crt .caddy-root.crt
    sudo security add-trusted-cert -d -r trustRoot -k /Library/Keychains/System.keychain .caddy-root.crt
    @echo "Trusted. Restart your browser if it still shows a warning."

# Open the app and the Inngest Dev UI in the browser
open:
    open {{app_url}}
    open {{dev_ui_url}}

# Send an event from the terminal: just send demo/order.created '{"order_id": "ord_1"}' 1
send event data="{}" count="1":
    @curl -sk -X POST {{app_url}}/api/events \
        -H 'content-type: application/json' \
        -d '{"name": "{{event}}", "data": {{data}}, "count": {{count}}}'
    @echo ""

# Run the test suite
test:
    uv run pytest -v

# Check lint and formatting
lint:
    uv run ruff check .
    uv run ruff format --check .

# Format code and apply safe lint fixes
fmt:
    uv run ruff format .
    uv run ruff check --fix .

# Stop the stack and delete volumes (Caddy certificates included)
clean:
    docker compose down -v --remove-orphans
```

- [ ] **Step 1:** Write the file; `just --list` shows every recipe with its comment.
- [ ] **Step 2:** `just send demo/order.created '{"order_id": "ord_1"}'` → `{"ids":[...]}`.
- [ ] **Step 3: Commit** `git commit -m "Add documented Justfile"`

### Task 8: End-to-end verification of every scenario

For each scenario, send with `just send` (or the UI) and check `/api/logs` plus `curl -s localhost:8288/v1/events/<id>/runs`.

| Scenario | Command | Pass criteria |
|---|---|---|
| Fan-out | `just send demo/order.created '{"order_id":"o1"}'` | 2 runs, both Completed |
| Concurrency | `just send demo/video.encode '{"video_id":"v"}' 6` | log never shows >2 "started" without a "finished" in between |
| Replay | toggle on, `just send demo/order.process '{"order_id":"o2"}'`, wait ~12s, toggle off | reserve-stock and charge-payment logged once; ship-order failed ≥1 then shipped |
| Debounce | send 5 events with different `query` quickly | 1 run, with the last query |
| Idempotency | `just send demo/payment.requested '{"payment_id":"p1","amount":5}' 3` | 1 "Charged" line |
| on_failure | `just send demo/risky.task '{"task_id":"t1"}'` | 2 attempts, then "Alert sent" |
| Output | `just send demo/report.generate '{"month":"2026-10"}'` | runs API returns output with `net_revenue` |
| Rate limit | `just send demo/notification.send '{"user_id":"u1"}' 5` | 1 "Notification" line |
| Throttle | `just send demo/api.sync '{"resource":"c"}' 5` | 5 lines ~5s apart |
| Priority | send 5 free, then 1 enterprise | enterprise handled 2nd |
| Singleton | `just send demo/account.sync '{"account_id":"a1"}' 3` | 1 "Sync started" |
| Timeouts | `seconds: 3` and `seconds: 15` | 3s finishes; 15s cancelled (log-cancelled-runs line) |
| Batch | `just send demo/page.viewed '{"page":"/p"}' 12` | batches of 5, 5, 2 |
| Cancellation | schedule rem_1, then send `demo/reminder.cancelled` rem_1 | no "sent" line; cancelled line |

Also open both URLs in a browser and check that the Dev UI works through Caddy. If any scenario misbehaves on the dev server, fix it or document the limitation in the README.

- [ ] Fix anything found; commit `git commit -m "Fix issues found in end-to-end check"` if needed.

### Task 9: README and push

**Files:** Create `README.md`

Sections: what it is; prerequisites (Docker Desktop, uv, just); quick start (`just setup`, `just up`, `just trust`, `just open`); URLs; architecture diagram (ASCII: browser → Caddy → app / inngest, inngest ↔ app); project layout; scenario table (feature, file, what to click, what to expect); demo script for the call (suggested order and talking points); troubleshooting (ports 80/443 busy, HTTPS warning, Firefox certificate store, Safari and `*.localhost`, Dev UI fallback on :8288); command reference (`just --list` output).

- [ ] **Step 1:** Write README.
- [ ] **Step 2:** `just lint && just test` → clean.
- [ ] **Step 3:** Commit and `git push`.
