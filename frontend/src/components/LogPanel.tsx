import { Activity, Eraser } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import type { LogEntry } from "../api";
import type { Scenario } from "../scenarios";

const COLORS = [
  "bg-sky-400/15 text-sky-300",
  "bg-violet-400/15 text-violet-300",
  "bg-emerald-400/15 text-emerald-300",
  "bg-amber-400/15 text-amber-300",
];

function belongsTo(entry: LogEntry, scenario: Scenario) {
  // Prefix match so "risky-task (on_failure)" counts as "risky-task".
  return scenario.logFunctions.some((f) => entry.function === f || entry.function.startsWith(`${f} `));
}

function formatTime(ts: number) {
  const d = new Date(ts * 1000);
  return `${d.toTimeString().slice(0, 8)}.${String(d.getMilliseconds()).padStart(3, "0")}`;
}

export function LogPanel({ scenario, log }: { scenario: Scenario; log: LogEntry[] }) {
  // Only show what happened since this scenario was opened (or last cleared).
  const [cutoff, setCutoff] = useState(() => Date.now() / 1000);
  const box = useRef<HTMLDivElement>(null);

  const entries = useMemo(
    () => log.filter((e) => e.ts >= cutoff && belongsTo(e, scenario)),
    [log, cutoff, scenario],
  );

  // Auto-scroll when new lines arrive, unless the user scrolled up.
  useEffect(() => {
    const el = box.current;
    if (el && el.scrollHeight - el.scrollTop - el.clientHeight < 80) el.scrollTop = el.scrollHeight;
  }, [entries.length]);

  const colorOf = (fn: string) => {
    const i = scenario.logFunctions.findIndex((f) => fn === f || fn.startsWith(`${f} `));
    return fn.includes("on_failure") ? "bg-rose-400/15 text-rose-300" : COLORS[Math.max(i, 0) % COLORS.length];
  };

  return (
    <section className="order-2 flex h-[24rem] min-h-0 flex-col overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900/60 lg:order-none lg:h-auto">
      <div className="flex items-center justify-between border-b border-zinc-800 px-4 py-2.5">
        <h2 className="flex items-center gap-2 text-sm font-semibold">
          <span className="relative flex size-2">
            <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-400 opacity-60" />
            <span className="relative inline-flex size-2 rounded-full bg-emerald-400" />
          </span>
          Live activity
          <span className="rounded-full bg-zinc-800 px-2 py-0.5 font-mono text-xs text-zinc-400">
            {entries.length}
          </span>
        </h2>
        <button
          onClick={() => setCutoff(Date.now() / 1000)}
          className="inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs text-zinc-400 transition hover:bg-zinc-800 hover:text-zinc-100"
        >
          <Eraser className="size-3.5" /> Clear
        </button>
      </div>

      <div ref={box} className="flex-1 overflow-y-auto p-2 font-mono text-[0.8rem] leading-relaxed">
        {entries.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center gap-2 p-6 text-center font-sans text-sm text-zinc-500">
            <Activity className="size-6 text-zinc-600" />
            Send an event to see the functions run.
          </div>
        ) : (
          <ul className="space-y-0.5">
            {entries.map((e) => (
              <li
                key={e.id}
                title={e.run_id ? `run ${e.run_id}` : undefined}
                className="flex flex-wrap items-baseline gap-x-2.5 rounded-md px-2 py-1 animate-[fadein_.3s_ease-out] hover:bg-zinc-800/50"
              >
                <span className="shrink-0 text-zinc-500">{formatTime(e.ts)}</span>
                <span className={`shrink-0 rounded px-1.5 text-xs font-semibold ${colorOf(e.function)}`}>
                  {e.function}
                </span>
                <span className="min-w-0 break-words text-zinc-200">{e.message}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
