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
    prompt: `Jane's mailbox keeps turning off. List the ${FUNCTION_ID} runs for users 1234 and 5678 this week.`,
    tool: "list_function_runs",
    answer: (
      <>
        6 runs, <span className="text-emerald-300">all Completed</span>. They alternate: 1234 suspends google-workspace,
        5678 enables it.
      </>
    ),
  },
  {
    prompt: `Show the trace of the last run for 5678 (${RUN_ID}).`,
    tool: "get_run_trace",
    answer: (
      <>
        google-workspace: SUSPENDED → ACTIVE. Every step green. The row stores <span className="text-amber-300">external_id
        1029…</span>, the same id as the row of 1234.
      </>
    ),
  },
  {
    prompt: "What triggered the run before it, for 1234?",
    tool: "get_run",
    answer: "Event hge/integrations/lifecycle.changed, sent when the East profile was set inactive.",
  },
];

export function McpSlide({ step }: { step: number }) {
  return (
    <>
      <SlideTitle kicker="7 · Inngest MCP">Ask the Inngest MCP</SlideTitle>

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
