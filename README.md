# Inngest Demo

A small FastAPI app that shows the main [Inngest](https://www.inngest.com) features,
one at a time. The home screen lists the features; open one and the screen shows
only that feature: what it does, buttons that send real events, the Python code
with the Inngest config highlighted, and a live log of what the functions do.
The Inngest Dev UI shows every run in detail.

Stack: FastAPI · Inngest Python SDK · React + Vite + Tailwind · uv · Docker Compose · Caddy (local HTTPS) · just

## Quick start

Prerequisites: [Docker Desktop](https://www.docker.com/products/docker-desktop/), [uv](https://docs.astral.sh/uv/),
[just](https://just.systems) and Node.js (`brew install uv just node`). Node is only needed
for local UI work: `just up` builds the UI inside Docker.

```bash
just setup   # check tools, install Python deps locally
just up      # build and start everything
just trust   # once: trust Caddy's local certificate (asks for your password)
just open    # open the app and the Dev UI
```

| URL | What |
|---|---|
| https://app.localhost | Demo app |
| https://inngest.localhost | Inngest Dev UI: runs, steps, events, replay |
| http://localhost:8288 | Dev UI fallback (direct, no Caddy) |

`*.localhost` always points to your machine, so there is nothing to add to `/etc/hosts`.

Run `just` to see every command.

## How it works

```
                 https://app.localhost        https://inngest.localhost
  browser ───────────────┐                    ┌──────────────── browser
                         ▼                    ▼
                   ┌──────────────────────────────┐
                   │            caddy             │  local HTTPS
                   └──────┬───────────────┬───────┘
                          ▼               ▼
                   ┌────────────┐  events  ┌─────────────────────┐
                   │    app     │ ───────► │       inngest       │
                   │  FastAPI   │ ◄─────── │  dev server + UI    │
                   └────────────┘  calls   └─────────────────────┘
                                /api/inngest
```

1. A button in the React UI calls `POST /api/events`, and the app sends the event to Inngest.
2. Inngest applies the function's flow control (concurrency, debounce, throttle, ...)
   and calls the app at `/api/inngest` to run the function, one step at a time.
3. Functions write to an in-memory log that the page polls every second.

```
app/
├── main.py           # HTTP routes, inngest serve(), serves the built UI
├── client.py         # Inngest client
├── activity.py       # in-memory live log + "shipping broken" toggle
└── functions/        # one file per feature, shown in the UI's Code panel
frontend/             # React UI (Vite + TypeScript + Tailwind)
└── src/
    ├── scenarios.ts  # the 14 scenarios: texts, events, buttons
    └── components/   # grid, focused view, controls, log, code
```

## Presenting

- The home screen shows only the feature titles. Click one to focus on it.
- In a feature: `←` / `→` go to the previous / next feature, `Esc` goes back home.
- The live log only shows that feature's functions, starting from when you opened it.
  **Clear** starts it over.
- The Code panel opens scrolled to the `@inngest_client.create_function(...)` config,
  which is highlighted.
- The layout fits the screen from phones to large monitors. On a laptop or larger
  everything fits without scrolling the page; zoom the browser (`⌘ +`) when screen sharing.

## Scenarios

| # | Feature | File | Do | What you should see |
|---|---|---|---|---|
| 0 | Fan-out | `fan_out.py` | **Send event** | One event, two functions, two runs |
| 1 | Concurrency | `concurrency.py` | **Send 6×** | Never more than 2 "started" at once |
| 2 | Partial replay | `replay.py` | Turn on **Shipping broken**, **Send event**, wait, turn it off | `reserve-stock` and `charge-payment` run once; only `ship-order` retries until it succeeds |
| 3 | Debounce | `debounce.py` | Type in the search box | One run, 3s after you stop, with the last text |
| 4 | Idempotency | `idempotency.py` | **Send same payment 3×** | One charge |
| 5 | on_failure | `on_failure.py` | **Send event** | 2 failed attempts, then "Alert sent" |
| 6 | Output | `output.py` | **Generate report** | The run's return value appears under the card |
| 7 | Rate limit | `rate_limit.py` | **Send 5×** | 1 runs, 4 are dropped |
| 8 | Throttle | `throttle.py` | **Send 5×** | All 5 run, about 5s apart |
| 9 | Priority | `priority.py` | **5 free, then 1 enterprise** | Enterprise runs before the waiting free tickets |
| 10 | Singleton | `singleton.py` | **Send 3×** | 1 runs, 2 are skipped |
| 11 | Timeouts | `timeouts.py` | **3s** and **15s** | 3s finishes; 15s is cancelled after 10s |
| 12 | Batch | `batch.py` | **Send 12×** | Runs with 5, 5 and 2 events |
| 13 | Cancellation | `cancellation.py` | **Schedule**, then **Cancel** | The sleeping run is cancelled; the reminder is never sent |

Each event can be edited before sending. With "N×" buttons, every copy
gets `data.seq` (1..N) so you can tell them apart in the log.

The terminal works too:

```bash
just send demo/order.created '{"order_id": "ord_1"}'
just send demo/video.encode '{"video_id": "v1"}' 6
```

## Demo script

A suggested order for a ~20 minute walkthrough:

1. **Basics (fan-out):** send `demo/order.created`. Show the two runs in the Dev UI,
   and the Code panel: a function is a decorator with a trigger plus steps.
2. **Durable steps (partial replay):** turn on *shipping broken* and send. In the log,
   "Handler invoked" repeats but `charge-payment` runs once, so the card is never charged
   twice. Turn the toggle off and the order ships. In the Dev UI, open the run and
   show the step timeline; *Rerun from step* is also available there.
3. **Failure handling (on_failure):** retries are automatic; `on_failure` runs when they run out.
4. **Results (output):** return values are stored and readable via the API.
5. **Flow control:** concurrency → throttle → rate limit (queued vs. dropped) →
   debounce → priority → singleton. Each one is a single highlighted config line.
6. **Correctness:** idempotency, timeouts, cancellation.
7. **Efficiency (batch):** 12 events, 3 runs.

## Troubleshooting

**Ports 80, 443 or 8288 are busy.** `just up` tells you which container holds them.
Stop it, or create a `.env` file with other ports:

```
HTTP_PORT=8080
HTTPS_PORT=8443
INNGEST_PORT=8289
```

Then the URLs become `https://app.localhost:8443` and `https://inngest.localhost:8443`.

**Browser shows a certificate warning.** Run `just trust` once and restart the
browser. Firefox uses its own certificate store: set
`security.enterprise_roots.enabled` to `true` in `about:config`, or accept the warning.

**`app.localhost` does not resolve.** Chrome and Firefox resolve `*.localhost` on
their own. If your browser does not, add `127.0.0.1 app.localhost inngest.localhost`
to `/etc/hosts`.

**Functions missing in the Dev UI.** Check `just logs inngest`. The dev server
syncs with `http://app:8000/api/inngest` on startup; `just restart` forces a new sync.

**State.** The dev server and the live log are in memory. `just restart` gives you
a clean slate.

## Development

```bash
just test     # pytest
just lint     # ruff check + format check + TypeScript check
just fmt      # ruff format + fixes
just dev-ui   # UI with hot reload on http://localhost:5173 (API from the running stack)
```

Python changes in `app/` reload automatically inside the container. UI changes
show up instantly with `just dev-ui`; run `just up` to rebuild the UI in the image.
