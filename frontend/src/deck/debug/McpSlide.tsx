import { TriangleAlert } from "lucide-react";
import type { ReactNode } from "react";
import { Reveal, SlideTitle } from "../ui";
import { Card, EVENT_NAME, FUNCTION_ID, RUN_ID } from "./parts";

interface Exchange {
  prompt: string;
  tool: string;
  answer: ReactNode;
}

const EXCHANGES: Exchange[] = [
  {
    prompt: `${RUN_ID} is the last_workflow_run_id of an orphan IntegrationAccount. Who was it for?`,
    tool: "get_run",
    answer: (
      <>
        Event {EVENT_NAME}: <span className="text-zinc-100">user_id 5678</span> (Jane, West profile),
        triggered_by_id 42.
      </>
    ),
  },
  {
    prompt: "Show its trace.",
    tool: "get_run_trace",
    answer: (
      <>
        google-workspace-provision: ABSENT → ACTIVE for <span className="text-amber-300">jane.doe1@…</span>. That
        is the second mailbox.
      </>
    ),
  },
  {
    prompt: `List the ${FUNCTION_ID} runs for user 5678 since the merge.`,
    tool: "list_function_runs",
    answer: "All green. They act on owner A and jane.doe@ only. No run touches jane.doe1@.",
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
