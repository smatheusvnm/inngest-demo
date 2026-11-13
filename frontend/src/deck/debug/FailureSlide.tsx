import { Check, CircleSlash, Loader, X } from "lucide-react";
import { Caption, Reveal, SlideTitle } from "../ui";
import { Card, FUNCTION_ID, Label, RUN_ID } from "./parts";

type Status = "pending" | "done" | "failed" | "skipped";

interface TraceRow {
  name: string;
  wave: string;
  shownFrom: number;
  status: Status;
  detail: string;
}

const ROWS: TraceRow[] = [
  { name: "compute-plan", wave: "", shownFrom: 1, status: "done", detail: "5 actions in 4 waves" },
  { name: "google-workspace-provision-812", wave: "1", shownFrom: 1, status: "done", detail: "ABSENT → ACTIVE" },
  { name: "hubspot-provision-813", wave: "2", shownFrom: 2, status: "failed", detail: "HubSpotError: 500, still failing after the retry" },
  { name: "ringcentral-provision-814", wave: "2", shownFrom: 2, status: "done", detail: "ABSENT → ACTIVE" },
  { name: "arrivy", wave: "3", shownFrom: 3, status: "skipped", detail: "skipped: blocked by hubspot, no step" },
  { name: "salespro", wave: "4", shownFrom: 3, status: "skipped", detail: "skipped: blocked by arrivy, no step" },
];

const STATUS_STYLE: Record<Status, string> = {
  pending: "text-zinc-500",
  done: "text-emerald-300",
  failed: "text-rose-300",
  skipped: "text-zinc-400",
};

export function FailureSlide({ step }: { step: number }) {
  const isFinished = step >= 4;

  return (
    <>
      <SlideTitle kicker="3 · Execution">Waves, and one failure</SlideTitle>

      <Card tone={isFinished ? "rose" : "neutral"} className="absolute left-20 right-20 top-[160px] !p-0">
        <div className="flex items-center justify-between border-b border-zinc-800 px-6 py-3">
          <div className="flex items-baseline gap-4">
            <Label>run</Label>
            <span className="font-mono text-lg text-zinc-200">{RUN_ID}</span>
            <span className="font-mono text-lg text-zinc-500">{FUNCTION_ID}</span>
          </div>
          <span
            className={`rounded-full px-3 py-1 font-mono text-base ${
              isFinished ? "bg-rose-500/20 text-rose-300" : "bg-violet-500/20 text-violet-300"
            }`}
          >
            {isFinished ? "Failed" : "Running"}
          </span>
        </div>

        <div className="flex items-center gap-5 border-b border-zinc-800 px-6 py-2 font-mono text-sm uppercase tracking-widest text-zinc-500">
          <span className="w-6" />
          <span className="w-[340px]">step</span>
          <span className="w-16">wave</span>
          <span>output</span>
        </div>

        <ul className="divide-y divide-zinc-800">
          {ROWS.map((row) => {
            const status: Status = step >= row.shownFrom ? row.status : "pending";
            return (
              <li key={row.name} className="flex items-center gap-5 px-6 py-2 text-lg">
                <StatusIcon status={status} />
                <span className="w-[340px] font-mono text-zinc-100">{row.name}</span>
                <span className="w-16 font-mono text-zinc-500">{row.wave}</span>
                <span className={`transition-colors duration-500 ${STATUS_STYLE[status]}`}>
                  {status === "pending" ? "…" : row.detail}
                </span>
              </li>
            );
          })}
        </ul>

        <Reveal show={isFinished} className="border-t border-zinc-800 px-6 py-3 font-mono text-[15px] text-rose-200">
          NonRetriableError: Reconciliation failed for user 1234 — arrivy: skipped, blocked by hubspot | hubspot:
          provision failed: 500 … | salespro: skipped, blocked by arrivy
        </Reveal>
      </Card>

      <Caption show={isFinished}>
        Siblings keep going. Dependents wait. The error names <span className="text-zinc-50">every</span> cause.
      </Caption>
    </>
  );
}

function StatusIcon({ status }: { status: Status }) {
  if (status === "done") return <Check className="size-6 shrink-0 text-emerald-400" />;
  if (status === "failed") return <X className="size-6 shrink-0 text-rose-400" />;
  if (status === "skipped") return <CircleSlash className="size-6 shrink-0 text-zinc-500" />;
  return <Loader className="size-6 shrink-0 text-zinc-600" />;
}
