# Intro Deck — Design

**Date:** 2026-10-16
**Status:** Approved

## Goal

Before the live feature demos, a short interactive intro explains the core idea:
events (from anywhere) → Inngest → functions made of steps. The presenter
advances a scripted animation with the keyboard or a clicker. Keep it simple:
no Celery or Make.com comparison slides.

## Routes

| Hash | Screen |
|---|---|
| `#/` | Intro, slide 1 step 0 |
| `#/intro/<slide>/<step>` | Intro at a given slide/step (1-based slide, 0-based step) |
| `#/features` | Feature grid (previously `#/`) |
| `#/<scenario-id>` | Focused scenario (unchanged) |

## Navigation (intro only)

- Next: `→`, `Space`, `PageDown`, `Enter`. Previous: `←`, `PageUp`.
- Next advances one step; after a slide's last step it goes to the next slide;
  after the last slide it goes to `#/features`. Previous mirrors this.
- `Esc` or the "Skip to demo" link goes to `#/features`.
- Footer: progress dots (one per slide) and a step hint.
- The grid gets an "Intro" link back to `#/`.

## Stage

Each slide renders inside a 1280×720 stage scaled with CSS `transform` to fit
the viewport (letterboxed), so layouts are identical on every screen.

## Slides

| # | Title | Steps |
|---|---|---|
| 1 | Inngest — durable workflows | 1 (title only) |
| 2 | Events come from anywhere | sources appear one by one (Django app, HubSpot webhook, Make.com scenario, Cron), then the event JSON card |
| 3 | Inngest routes events to functions | event travels to Inngest; fans out to `create-hubspot-contact` and `send-welcome-email`; "runs in your app" note |
| 4 | A function is a list of steps | steps turn green one by one; step 4 crashes; retry: steps 1–3 locked ("memoized"), resumes at step 4; done, "exactly one email" |
| 5 | The code | snippet; highlight event, then function, then steps; final "Let's see it live →" |

Each slide is a component `({ step }) => JSX` declared with its step count in
`slides.tsx`. Transitions are CSS only (opacity/transform with Tailwind).

## Verification

Typecheck + build; Chrome screenshots of every slide's final step at
1440×900 and 1024×768; keyboard flow from `#/` reaches `#/features`.
