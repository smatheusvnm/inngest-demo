import { TriangleAlert } from "lucide-react";
import type { ReactNode } from "react";
import { Reveal, SlideTitle } from "../ui";
import { Card, FUNCTION_ID, RUN_ID } from "./parts";

interface Exchange {
  prompt: string;
  tool: string;
  answer: ReactNode;
}

const EXCHANGES: Exchange[] = [
  {
    prompt: `Which ${FUNCTION_ID} runs failed in the last 24 h?`,
    tool: "list_function_runs",
    answer: (
      <>
        3 failed runs. Newest: <span className="text-zinc-100">{RUN_ID}</span>, user 42, 10:14 UTC.
      </>
    ),
  },
  {
    prompt: `Show the trace of ${RUN_ID}.`,
    tool: "get_run_trace",
    answer: (
      <>
        <span className="text-rose-300">crm:provision failed</span> (409 Conflict: email already exists).
        scheduler:provision skipped. email:provision ACTIVE.
      </>
    ),
  },
  {
    prompt: "Why did crm:provision fail? Check the step input.",
    tool: "get_run",
    answer: "The CRM already has a contact with this email. The account row has no external id to link it.",
  },
];

export function McpSlide({ step }: { step: number }) {
  return (
    <>
      <SlideTitle kicker="5 · Inngest MCP">Ask the Inngest MCP</SlideTitle>

      <Card className="absolute left-20 right-20 top-[180px] !bg-zinc-950 font-mono text-lg">
        <div className="space-y-5">
          {EXCHANGES.map((exchange, index) => (
            <Reveal key={exchange.tool} show={step >= index}>
              <div className="text-zinc-100">
                <span className="text-violet-400">&gt; </span>
                {exchange.prompt}
              </div>
              <div className="mt-1 text-base text-zinc-500">⏺ inngest · {exchange.tool}</div>
              <div className="mt-1 pl-4 text-zinc-300">{exchange.answer}</div>
            </Reveal>
          ))}
        </div>
      </Card>

      <Reveal show={step >= 3} className="absolute inset-x-20 bottom-10">
        <div className="flex items-start gap-3 rounded-xl border-2 border-amber-400/60 bg-amber-500/10 px-5 py-3 text-xl text-amber-100">
          <TriangleAlert className="mt-1 size-6 shrink-0 text-amber-300" />
          <span>
            <span className="font-mono">rerun</span> and <span className="font-mono">create_replay</span> call the vendors
            again. Fix the cause first, then rerun one run.
          </span>
        </div>
      </Reveal>
    </>
  );
}
