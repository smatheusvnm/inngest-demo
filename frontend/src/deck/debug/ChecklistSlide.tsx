import { TriangleAlert } from "lucide-react";
import type { ReactNode } from "react";
import { SlideTitle } from "../ui";
import { Code, Label } from "./parts";

const ITEMS: ReactNode[] = [
  <>
    Open the person's IntegrationAccount rows. Copy <Code>last_workflow_run_id</Code>.
  </>,
  <>
    Open the run: Inngest UI, or <Code>get_run_trace</Code> through the MCP.
  </>,
  "Read the failed step: its error, its input, its output.",
  <>
    Search Sentry for <Code>inngest.run.id:&lt;id&gt;</Code>: stack trace and logs.
  </>,
  <>
    All green but wrong? Look for orphan rows: an <Code>owner_id</Code> with no UserAssociations.
  </>,
  "Fix the data first. Then resync, and know what the run calls again.",
];

const MCP_TOOLS = [
  { tool: "get_run", use: "who the run was for: the event and its user_id" },
  { tool: "get_run_trace", use: "each step with its input and output, e.g. which mailbox it created" },
  { tool: "list_function_runs", use: "what ran for a function in a time range" },
];

const NOT_BUGS = ["debounce: 5 min", "same event id: dropped for 24 h", "code outside step.run runs again"];

export function ChecklistSlide() {
  return (
    <>
      <SlideTitle kicker="Checklist">Six steps, every time</SlideTitle>

      <ol className="absolute inset-x-20 top-[168px] space-y-2.5">
        {ITEMS.map((item, index) => (
          <li key={index} className="flex items-center gap-4 text-xl text-zinc-200">
            <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-violet-500/20 font-mono text-lg text-violet-300">
              {index + 1}
            </span>
            <span>{item}</span>
          </li>
        ))}
      </ol>

      <div className="absolute inset-x-20 top-[462px] rounded-xl border-2 border-violet-500/40 bg-zinc-900 px-5 py-3">
        <div className="flex items-baseline justify-between">
          <Label tone="violet">extra · ask the Inngest MCP</Label>
          <span className="flex items-center gap-1.5 text-base text-amber-200">
            <TriangleAlert className="size-4 text-amber-300" />
            <span className="font-mono">rerun</span> and <span className="font-mono">create_replay</span> call the
            vendors again
          </span>
        </div>
        <ul className="mt-2 space-y-1 text-lg">
          {MCP_TOOLS.map((entry) => (
            <li key={entry.tool} className="flex gap-3">
              <span className="w-56 shrink-0 font-mono text-violet-300">{entry.tool}</span>
              <span className="text-zinc-300">{entry.use}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="absolute inset-x-20 bottom-12 flex items-end justify-between gap-8">
        <div className="text-lg text-zinc-400">
          <span className="text-zinc-200">Not a bug:</span> {NOT_BUGS.join(" · ")}
        </div>
        <p className="shrink-0 text-3xl font-semibold text-zinc-50">Questions?</p>
      </div>
    </>
  );
}
