import { Check, CircleSlash, Loader, X } from "lucide-react";
import { Caption, Reveal, SlideTitle } from "../ui";
import { Card, Code, FUNCTION_ID, Label, RUN_ID } from "./parts";

type Status = "pending" | "done" | "failed" | "skipped";

interface TraceRow {
  name: string;
  wave: string;
  shownFrom: number;
  status: Status;
  detail: string;
}

const ROWS: TraceRow[] = [
  { name: "compute-plan", wave: "", shownFrom: 1, status: "done", detail: "3 actions in 2 waves" },
  { name: "crm:provision", wave: "wave 1", shownFrom: 2, status: "failed", detail: "409 Conflict: email already exists" },
  { name: "email:provision", wave: "wave 1", shownFrom: 3, status: "done", detail: "ABSENT → ACTIVE" },
  { name: "scheduler:provision", wave: "wave 2", shownFrom: 4, status: "skipped", detail: "needs crm → skipped, no step" },
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
      <SlideTitle kicker="2 · Execution">One failure, isolated</SlideTitle>

      <Card tone={isFinished ? "rose" : "neutral"} className="absolute left-20 right-20 top-[190px] !p-0">
        <div className="flex items-center justify-between border-b border-zinc-800 px-6 py-4">
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

        <ul className="divide-y divide-zinc-800">
          {ROWS.map((row) => {
            const status: Status = step >= row.shownFrom ? row.status : "pending";
            return (
              <li key={row.name} className="flex items-center gap-5 px-6 py-4 text-xl">
                <StatusIcon status={status} />
                <span className="w-64 font-mono text-zinc-100">{row.name}</span>
                <span className="w-24 font-mono text-sm uppercase tracking-widest text-zinc-500">{row.wave}</span>
                <span className={`transition-colors duration-500 ${STATUS_STYLE[status]}`}>
                  {status === "pending" ? "…" : row.detail}
                </span>
              </li>
            );
          })}
        </ul>

        <Reveal show={isFinished} className="border-t border-zinc-800 px-6 py-4 font-mono text-base text-rose-200">
          NonRetriableError: Reconciliation failed for user 42 — crm: provision failed: 409 Conflict… | scheduler:
          skipped, blocked by crm
        </Reveal>
      </Card>

      <Caption show={step >= 4}>
        Siblings keep going. Dependents are skipped. The run ends <span className="text-rose-300">Failed</span> and the
        error names <span className="text-zinc-50">every</span> cause. Each row also stores its <Code>error_message</Code>.
      </Caption>
    </>
  );
}

function StatusIcon({ status }: { status: Status }) {
  if (status === "done") return <Check className="size-6 text-emerald-400" />;
  if (status === "failed") return <X className="size-6 text-rose-400" />;
  if (status === "skipped") return <CircleSlash className="size-6 text-zinc-500" />;
  return <Loader className="size-6 text-zinc-600" />;
}
