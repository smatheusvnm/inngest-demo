import type { ReactNode } from "react";
import { SlideTitle } from "../ui";
import { Code } from "./parts";

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
    All green but wrong? Look for a second owner: the same <Code>external_id</Code> on two rows.
  </>,
  "Fix the data first. Then resync, and know what the run calls again.",
];

const NOT_BUGS = ["debounce: 5 min", "same event id: dropped for 24 h", "code outside step.run runs again"];

export function ChecklistSlide() {
  return (
    <>
      <SlideTitle kicker="Checklist">Six steps, every time</SlideTitle>

      <ol className="absolute inset-x-20 top-[180px] space-y-4">
        {ITEMS.map((item, index) => (
          <li key={index} className="flex items-center gap-5 text-2xl text-zinc-200">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-violet-500/20 font-mono text-xl text-violet-300">
              {index + 1}
            </span>
            <span>{item}</span>
          </li>
        ))}
      </ol>

      <div className="absolute inset-x-20 bottom-12 flex items-end justify-between gap-8">
        <div className="text-lg text-zinc-400">
          <span className="text-zinc-200">Not a bug:</span> {NOT_BUGS.join(" · ")}
        </div>
        <p className="shrink-0 text-3xl font-semibold text-zinc-50">Questions?</p>
      </div>
    </>
  );
}
