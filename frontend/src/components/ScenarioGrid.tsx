import { ArrowUpRight, Presentation, Zap } from "lucide-react";
import { DEV_UI_URL } from "../api";
import { navigate } from "../router";
import { SCENARIOS } from "../scenarios";

export function ScenarioGrid() {
  return (
    <div className="mx-auto flex min-h-dvh max-w-[1600px] flex-col px-4 py-8 sm:px-8 sm:py-12">
      <header className="mb-8 flex flex-col gap-4 sm:mb-12 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-indigo-500/30 bg-indigo-500/10 px-3 py-1 text-xs font-medium text-indigo-300">
            <Zap className="size-3.5" /> FastAPI + Inngest
          </div>
          <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">Inngest Demo</h1>
          <p className="mt-2 max-w-xl text-zinc-400">
            Pick a feature to focus on it. Each one sends real events to the Inngest dev server
            and shows what the Python functions do.
          </p>
        </div>
        <div className="flex gap-2 self-start sm:self-auto">
          <a
            href="#/"
            className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-800 bg-zinc-900 px-4 py-2 text-sm font-medium text-zinc-200 transition hover:border-zinc-700 hover:bg-zinc-800"
          >
            <Presentation className="size-4" /> Intro
          </a>
          <a
            href={DEV_UI_URL}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-800 bg-zinc-900 px-4 py-2 text-sm font-medium text-zinc-200 transition hover:border-zinc-700 hover:bg-zinc-800"
          >
            Inngest Dev UI <ArrowUpRight className="size-4" />
          </a>
        </div>
      </header>

      <ol className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3 2xl:grid-cols-4">
        {SCENARIOS.map((s, i) => (
          <li key={s.id}>
            <button
              onClick={() => navigate(s.id)}
              className="group flex h-full w-full items-center gap-4 rounded-xl border border-zinc-800 bg-zinc-900/60 p-4 text-left transition hover:-translate-y-0.5 hover:border-indigo-500/50 hover:bg-zinc-900 focus-visible:outline-2 focus-visible:outline-indigo-500 sm:p-5"
            >
              <span className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-zinc-800 text-zinc-300 transition group-hover:bg-indigo-500/15 group-hover:text-indigo-300">
                <s.icon className="size-5" />
              </span>
              <span className="min-w-0">
                <span className="block font-mono text-xs text-zinc-500">
                  {String(i).padStart(2, "0")}
                </span>
                <span className="block truncate text-base font-semibold">{s.title}</span>
                <span className="block truncate text-sm text-zinc-400">{s.tagline}</span>
              </span>
            </button>
          </li>
        ))}
      </ol>
    </div>
  );
}
