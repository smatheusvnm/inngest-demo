# Inngest Demo — Design

**Date:** 2026-10-15
**Status:** Approved
**Repo:** `smatheusvnm/inngest-demo` (public)

## Goal

A small, easy-to-read demo app for a team call that shows the main Inngest
features. One command brings the stack up; a browser page has a card per
feature with buttons that send events; a live log shows what the backend
functions do, next to the Inngest Dev UI.

Non-goals: persistence, auth, production deployment, a frontend build step.

## Stack

- Python 3.13, FastAPI, `inngest` Python SDK (>= 0.5.19), managed with `uv`
- Docker Compose: `app`, `inngest` (dev server), `caddy`
- Caddy with `tls internal` for local HTTPS on `*.localhost`
- `just` as the task runner
- Everything (code, UI, docs) in English

## Repository layout

```
inngest-demo/
├── Justfile
├── README.md
├── compose.yaml
├── Caddyfile
├── Dockerfile
├── .env.example
├── .gitignore
├── .python-version
├── pyproject.toml
├── uv.lock
├── app/
│   ├── __init__.py
│   ├── main.py           # FastAPI app, HTTP routes, inngest serve()
│   ├── client.py         # inngest.Inngest client
│   ├── activity.py       # in-memory activity log + toggles
│   ├── functions/        # one module per feature
│   │   ├── __init__.py   # exports ALL_FUNCTIONS
│   │   ├── fan_out.py
│   │   ├── concurrency.py
│   │   ├── replay.py
│   │   ├── debounce.py
│   │   ├── idempotency.py
│   │   ├── on_failure.py
│   │   ├── output.py
│   │   ├── rate_limit.py
│   │   ├── throttle.py
│   │   ├── priority.py
│   │   ├── singleton.py
│   │   ├── timeouts.py
│   │   ├── batch.py
│   │   └── cancellation.py
│   └── static/
│       └── index.html    # plain HTML + CSS + JS, no build
└── tests/
    └── test_registration.py
```

## Infrastructure

### compose.yaml

| Service | Image | Notes |
|---|---|---|
| `app` | built from `Dockerfile` | `uvicorn app.main:app --reload --host 0.0.0.0 --port 8000`; `./app` mounted for hot reload; env `INNGEST_DEV=1`, `INNGEST_BASE_URL=http://inngest:8288` |
| `inngest` | `inngest/inngest:latest` | `inngest dev --host 0.0.0.0 -u http://app:8000/api/inngest --no-discovery`; port `8288` also published on the host as a fallback |
| `caddy` | `caddy:2-alpine` | ports `80` and `443`; volumes `caddy_data` (internal CA) and `caddy_config` |

### Caddyfile

```
app.localhost {
    tls internal
    reverse_proxy app:8000
}

inngest.localhost {
    tls internal
    reverse_proxy inngest:8288
}
```

`*.localhost` resolves to `127.0.0.1` without editing `/etc/hosts`.

### Dockerfile

`python:3.13-slim` plus the `uv` binary copied from `ghcr.io/astral-sh/uv`.
Install dependencies with `uv sync --frozen --no-dev` in a cached layer, then
copy the source.

### Justfile

Every recipe has a `#` doc comment so `just --list` is self-documenting. The
default recipe lists all recipes.

| Recipe | What it does |
|---|---|
| `just` | List recipes |
| `just setup` | Check `docker`/`uv`, create `.env` from `.env.example`, `uv sync` |
| `just up` | Build and start the stack in the background, print URLs |
| `just down` | Stop the stack |
| `just restart` | Restart the stack |
| `just ps` | Show service status |
| `just logs [service]` | Follow logs (all services or one) |
| `just trust` | Copy Caddy's root CA out of the container and trust it in the macOS keychain (sudo) |
| `just open` | Open the app and the Dev UI in the browser |
| `just send <event> [json]` | Send an event through the app API with curl (fallback if the UI fails) |
| `just test` | Run pytest |
| `just lint` | Run ruff check and ruff format --check |
| `just fmt` | Run ruff format |
| `just clean` | Stop the stack and remove volumes |

## Inngest client

```python
inngest_client = inngest.Inngest(app_id="inngest-demo", is_production=False)
```

`INNGEST_DEV` and `INNGEST_BASE_URL` come from the environment.

## Activity log

`app/activity.py` keeps a module-level `collections.deque(maxlen=500)` of
entries `{id, ts, function, message, run_id}` with a monotonic `id`. It exposes
`log(function, message, run_id=None)`, `since(after_id)`, and `clear()`.

It also holds a single toggle, `shipping_broken: bool`, used by the replay
scenario.

Functions log inside `step.run` so each line appears once. The replay scenario
also logs **outside** its steps on purpose, to show that the handler re-runs
while completed steps are memoized.

## Functions

All events use the `demo/` prefix. Durations are short so the demo stays
quick.

| # | Feature | Function id(s) | Trigger | Config | Expected behaviour |
|---|---|---|---|---|---|
| 0 | Fan-out | `send-confirmation-email`, `update-inventory` | `demo/order.created` | none | One event produces two independent runs |
| 1 | Concurrency | `encode-video` | `demo/video.encode` | `Concurrency(limit=2)`; one step sleeps 5s | Sending 6 events: at most 2 run at a time |
| 2 | Partial replay (step memoization) | `process-order` | `demo/order.process` | steps `reserve-stock` → `charge-payment` → `ship-order`; `ship-order` raises `RetryAfterError(..., 5000)` while `shipping_broken` is on; `retries=10` | Steps 1–2 run once; only step 3 retries. Turning the toggle off lets the next retry succeed. The Dev UI "Rerun from step" also works here |
| 3 | Debounce | `search-products` | `demo/search.typed` | `Debounce(key="event.data.user_id", period=3s)` | Typing sends one event per keystroke; one run happens with the last text |
| 4 | Idempotency | `charge-payment-once` | `demo/payment.requested` | `idempotency="event.data.payment_id"` | Sending the same `payment_id` 3 times yields 1 run |
| 5 | on_failure | `risky-task` | `demo/risky.task` | `retries=1`; always raises; `on_failure` handler logs "alert sent" | The run fails after 1 retry and the failure handler runs |
| 6 | Output | `generate-report` | `demo/report.generate` | steps return values; the function returns a dict | The UI polls `/api/events/{id}/runs` and shows the run output JSON |
| 7 | Rate limit | `send-notification` | `demo/notification.send` | `RateLimit(key="event.data.user_id", limit=1, period=10s)` | Sending 5: 1 runs, 4 are dropped |
| 8 | Throttle | `sync-external-api` | `demo/api.sync` | `Throttle(limit=1, period=5s)` | Sending 5: all run, one every 5s (queued, not dropped) |
| 9 | Priority | `handle-ticket` | `demo/ticket.created` | `Priority(run="event.data.plan == 'enterprise' ? 600 : 0")` + `Concurrency(limit=1)`; one step sleeps 3s | Queue 5 `free` tickets, then 1 `enterprise`: the enterprise ticket runs next |
| 10 | Singleton | `sync-account` | `demo/account.sync` | `Singleton(key="event.data.account_id", mode="skip")`; one step sleeps 8s | Sending 3 quickly for the same account: 1 runs, 2 are skipped. A comment explains `mode="cancel"` |
| 11 | Timeouts | `slow-task` | `demo/slow.task` | `Timeouts(finish=10s)`; `step.sleep` for `event.data.seconds` | `seconds=3` completes; `seconds=15` is cancelled by the timeout. A comment explains `start` |
| 12 | Batch | `track-page-views` | `demo/page.viewed` | `Batch(max_size=5, timeout=5s)` | Sending 12: runs with 5, 5, and 2 events; logs `len(ctx.events)` |
| 13 | Cancellation | `send-reminder` | `demo/reminder.scheduled` | `step.sleep(30s)`; `Cancel(event="demo/reminder.cancelled", if_exp="event.data.reminder_id == async.data.reminder_id")` | Schedule, then Cancel: the run shows as cancelled and the reminder is never sent |

`app/functions/__init__.py` exports `ALL_FUNCTIONS`, the list passed to
`serve()`.

## HTTP API (`app/main.py`)

| Method | Path | Behaviour |
|---|---|---|
| GET | `/` | Serve `static/index.html` |
| POST | `/api/events` | Body `{name: str, data: dict = {}, count: int = 1}` (count 1–50). Sends `count` events with `inngest_client.send`. Returns `{ids: [...]}`. On failure returns 502 with the error message |
| GET | `/api/events/{event_id}/runs` | Proxy `GET {INNGEST_BASE_URL}/v1/events/{event_id}/runs` with `httpx` and return its JSON |
| GET | `/api/logs?after=<int>` | Return log entries with `id > after` |
| DELETE | `/api/logs` | Clear the log |
| GET | `/api/toggles/shipping-broken` | Return `{enabled: bool}` |
| PUT | `/api/toggles/shipping-broken` | Body `{enabled: bool}`; set the toggle |
| * | `/api/inngest` | `inngest.fast_api.serve(app, inngest_client, ALL_FUNCTIONS)` |

## Frontend (`app/static/index.html`)

A single file with plain HTML, CSS and JS. No framework, no build.

- Two columns. Left: one card per scenario (14 cards). Right: a sticky "Live
  activity" panel that polls `/api/logs?after=N` every second, with a Clear
  button and a colour per function.
- Each card has a title, a one-line explanation, a `<textarea>` with the
  pre-filled, editable event JSON, scenario buttons (e.g. `Send`, `Send 6×`),
  and a "View in Dev UI" link.
- Special cards:
  - Replay: a switch bound to `/api/toggles/shipping-broken`.
  - Debounce: a text input that sends `demo/search.typed` on every keystroke.
  - Output: after sending, polls `/api/events/{id}/runs` until a run finishes
    and shows its output JSON.
  - Cancellation: Schedule and Cancel buttons sharing a generated
    `reminder_id`.
- Errors from the API show in a small toast.
- Dev UI link: `https://inngest.localhost`.

## Testing and verification

- `tests/test_registration.py`: imports `ALL_FUNCTIONS`, asserts the expected
  function ids exist, and checks key config (concurrency limit, debounce,
  idempotency, rate limit, throttle, priority, singleton, timeouts, batch,
  cancel, on_failure).
- Manual end-to-end check before delivery: `just up`, then send every scenario
  with `just send` and confirm the runs through the dev server API
  (`/v1/events/{id}/runs`) and the activity log.
- Confirm the Dev UI loads through Caddy. If it does not, document
  `http://localhost:8288` as the Dev UI URL.

## Delivery

- Create the public repo with `gh repo create smatheusvnm/inngest-demo --public`.
- README: what the demo is, prerequisites, quick start
  (`just setup && just up && just trust && just open`), URLs, a table of
  scenarios with what to click and what to expect, and a short demo script for
  the call.
