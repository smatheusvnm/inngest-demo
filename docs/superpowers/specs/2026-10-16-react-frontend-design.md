# React Frontend — Design

**Date:** 2026-10-16
**Status:** Approved
**Replaces:** the "Frontend" section of `2026-10-15-inngest-demo-design.md`

## Goal

Present one scenario at a time during the call. The home screen lists only the
scenario titles; clicking one opens a focused view with nothing else on screen.
The UI must look polished and fit any screen size, from a phone to a large monitor.

## Stack

Vite + React + TypeScript + Tailwind CSS v4, `lucide-react` icons,
`prism-react-renderer` for Python highlighting. Built in a multi-stage Docker
build; FastAPI serves the static build. No frontend container in compose.

## Layout

```
frontend/
├── package.json, package-lock.json, vite.config.ts, tsconfig.json, index.html
└── src/
    ├── main.tsx, App.tsx, index.css
    ├── api.ts                   # typed fetch helpers
    ├── scenarios.ts             # the 14 scenarios (single source of truth)
    ├── toast.tsx                # tiny toast system
    ├── hooks/useActivityLog.ts  # polls /api/logs
    └── components/
        ├── ScenarioGrid.tsx     # home: title tiles only
        ├── ScenarioView.tsx     # focused scenario
        ├── EventControls.tsx    # JSON editor, buttons, toggle, typing input, output
        ├── LogPanel.tsx         # live log filtered to the scenario
        └── CodePanel.tsx        # Python source with the decorator highlighted
```

## Behaviour

- Routing by URL hash: `#/` is the grid, `#/<scenario-id>` the focused view.
  Hash routing needs no server config and survives reloads.
- **Grid:** dark theme; each tile shows number, icon, title and a 3–4 word
  tagline. Columns: 1 (<640px), 2 (≥640), 3 (≥1024), 4 (≥1536).
- **Focused view:** top bar with Back, number + title, Prev/Next and a
  "Dev UI" link. Keys: `←`/`→` previous/next, `Esc` back (ignored while typing
  in an input or textarea).
  - ≥1024px: page fits the viewport (`h-dvh`, no page scroll). Left column:
    "Try it" panel above the "Code" panel. Right column: live log, full height.
    Panels scroll internally.
  - <1024px: panels stack (Try it, Log, Code) and the page scrolls; log and
    code have bounded heights.
- **Log panel:** only entries whose `function` is in the scenario's
  `logFunctions` (prefix match, so `risky-task (on_failure)` counts) and newer
  than the moment the view opened. Clear sets a new local cutoff.
- **Code panel:** fetches `GET /api/source/{module}` and highlights every
  `@inngest_client.create_function(...)` block.
- **Dev UI URL:** on `app.localhost[:port]` it is `inngest.localhost[:port]`;
  under `vite dev` it comes from `VITE_DEV_UI_URL`.

## Backend changes

- `GET /api/source/{module}` returns `{module, path, code}` for files in
  `app/functions/` (allow-list built from the directory; 404 otherwise).
- `/` serves `frontend/dist` with `StaticFiles(html=True)`, mounted after all
  API routes. Without a build, `/` returns a short HTML page saying to run
  `just build-ui`.
- `log-cancelled-runs` logs under the cancelled function's own id (prefix
  `inngest-demo-` removed), so the timeout and cancellation views show it.
- `app/static/` is deleted.

## Tooling

- `Dockerfile`: `node:24-alpine` stage runs `npm ci && npm run build`;
  the Python stage copies `dist` to `/code/frontend/dist` (outside the
  `./app` volume, so the mount does not hide it).
- Justfile: `setup` also checks `node` and runs `npm install`; new `build-ui`
  and `dev-ui` (Vite on http://localhost:5173 proxying `/api` to the running
  stack); `lint` also runs `tsc`.

## Verification

`just lint`, `just test`, `npm run build`, rebuild the stack, and Chrome
headless screenshots of the grid and a focused view at 1440×900, 1024×768
and 390×844.
