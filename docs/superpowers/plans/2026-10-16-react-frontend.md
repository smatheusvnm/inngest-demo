# React Frontend Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Replace the single-file UI with a React app that shows one scenario at a time.

**Spec:** `docs/superpowers/specs/2026-10-16-react-frontend-design.md`

### Task 1: Backend (TDD)
- Test in `tests/test_api.py`: `GET /api/source/concurrency` → 200 and code contains
  `Concurrency(limit=2)`; `GET /api/source/nope` → 404; `GET /api/source/__init__` → 404.
- Implement `/api/source/{module}` in `app/main.py`; serve `frontend/dist` (mounted
  after `inngest.fast_api.serve`) with a fallback page; delete `app/static/`.
- `log-cancelled-runs` logs under the stripped function id.
- Verify: `uv run pytest`, `uv run ruff check .`. Commit.

### Task 2: Frontend scaffold
- `frontend/` with package.json (react, react-dom, lucide-react, prism-react-renderer;
  dev: vite, @vitejs/plugin-react, typescript, tailwindcss, @tailwindcss/vite, @types/react,
  @types/react-dom), vite config with `/api` proxy, tsconfig, index.html.
- Verify: `npm run build`. Commit.

### Task 3: Frontend app
- `scenarios.ts`, `api.ts`, `toast.tsx`, `useActivityLog.ts`, components per the spec.
- Verify: `npm run typecheck && npm run build`. Commit.

### Task 4: Docker + Justfile + README
- Multi-stage Dockerfile, `.dockerignore`, Justfile recipes, README frontend section.
- Verify: `just up` rebuild; `just lint`; `just test`. Commit.

### Task 5: Visual verification
- Headless Chrome screenshots of grid and focused view at 1440×900, 1024×768, 390×844;
  exercise one scenario and confirm the filtered log shows entries. Fix issues, commit, push.
