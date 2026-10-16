import { ArrowLeft, ArrowUpRight, ChevronLeft, ChevronRight, Eye } from "lucide-react";
import { useEffect } from "react";
import { DEV_UI_URL, type LogEntry } from "../api";
import { navigate } from "../router";
import { SCENARIOS } from "../scenarios";
import { CodePanel } from "./CodePanel";
import { EventControls } from "./EventControls";
import { LogPanel } from "./LogPanel";

interface Props {
  index: number;
  log: LogEntry[];
}

export function ScenarioView({ index, log }: Props) {
  const scenario = SCENARIOS[index];
  const prev = SCENARIOS[index - 1];
  const next = SCENARIOS[index + 1];
  const Icon = scenario.icon;

  // Keyboard: ← / → to move between scenarios, Esc back to the grid.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target.closest("input, textarea")) return;
      if (e.key === "Escape") navigate(null);
      if (e.key === "ArrowLeft" && prev) navigate(prev.id);
      if (e.key === "ArrowRight" && next) navigate(next.id);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [prev, next]);

  return (
    <div className="flex min-h-dvh flex-col lg:h-dvh">
      {/* Top bar */}
      <header className="sticky top-0 z-10 flex items-center gap-2 border-b border-zinc-800 bg-zinc-950/90 px-3 py-2.5 backdrop-blur sm:gap-3 sm:px-5">
        <button
          onClick={() => navigate(null)}
          title="Back (Esc)"
          className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm text-zinc-400 transition hover:bg-zinc-800 hover:text-zinc-100"
        >
          <ArrowLeft className="size-4" />
          <span className="hidden sm:inline">All features</span>
        </button>

        <div className="flex min-w-0 flex-1 items-center gap-2.5">
          <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-indigo-500/15 text-indigo-300">
            <Icon className="size-4" />
          </span>
          <h1 className="truncate text-lg font-semibold sm:text-xl">
            <span className="mr-2 font-mono text-sm text-zinc-500">
              {String(index).padStart(2, "0")}
            </span>
            {scenario.title}
          </h1>
        </div>

        <nav className="flex items-center gap-1">
          <NavButton label="Previous (←)" disabled={!prev} onClick={() => prev && navigate(prev.id)}>
            <ChevronLeft className="size-5" />
          </NavButton>
          <NavButton label="Next (→)" disabled={!next} onClick={() => next && navigate(next.id)}>
            <ChevronRight className="size-5" />
          </NavButton>
          <a
            href={`${DEV_UI_URL}/runs`}
            target="_blank"
            rel="noreferrer"
            className="ml-1 inline-flex items-center gap-1 rounded-lg border border-zinc-800 px-2.5 py-1.5 text-sm text-zinc-300 transition hover:border-zinc-700 hover:bg-zinc-800"
          >
            <span className="hidden sm:inline">Dev UI</span>
            <ArrowUpRight className="size-4" />
          </a>
        </nav>
      </header>

      {/* Body: stacked on small screens, two columns that fit the viewport on lg+ */}
      <main className="grid flex-1 gap-4 p-3 sm:p-5 lg:min-h-0 lg:grid-cols-[minmax(0,1fr)_minmax(340px,40%)] lg:grid-rows-1">
        <div className="flex min-h-0 flex-col gap-4">
          <section className="shrink-0 rounded-xl border border-zinc-800 bg-zinc-900/60 p-4 sm:p-5 lg:max-h-[60%] lg:overflow-y-auto">
            <p className="text-base leading-relaxed text-zinc-300">{scenario.description}</p>
            <p className="mt-3 flex gap-2 rounded-lg border border-amber-500/20 bg-amber-500/5 px-3 py-2 text-sm text-amber-200/90">
              <Eye className="mt-0.5 size-4 shrink-0" />
              <span>{scenario.watch}</span>
            </p>
            <EventControls scenario={scenario} />
          </section>

          <CodePanel module={scenario.module} />
        </div>

        <LogPanel scenario={scenario} log={log} />
      </main>
    </div>
  );
}

function NavButton(props: {
  label: string;
  disabled: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      title={props.label}
      aria-label={props.label}
      disabled={props.disabled}
      onClick={props.onClick}
      className="rounded-lg p-1.5 text-zinc-400 transition hover:bg-zinc-800 hover:text-zinc-100 disabled:pointer-events-none disabled:opacity-30"
    >
      {props.children}
    </button>
  );
}
