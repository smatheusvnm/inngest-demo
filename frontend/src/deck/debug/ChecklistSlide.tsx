import type { ReactNode } from "react";
import { SlideTitle } from "../ui";
import { Code } from "./parts";

const ITEMS: ReactNode[] = [
  <>
    Find the account row. Copy <Code>last_run_id</Code>.
  </>,
  <>
    Open the run: Inngest UI, or <Code>get_run_trace</Code> through the MCP.
  </>,
  "Read the failed step: its error, its input, its output.",
  <>
    Search Sentry for <Code>inngest.run.id:&lt;id&gt;</Code>: stack trace and logs.
  </>,
  "Fix the cause. Then rerun one run, and know what it calls again.",
];

export function ChecklistSlide() {
  return (
    <>
      <SlideTitle kicker="Checklist">Five steps, every time</SlideTitle>

      <ol className="absolute inset-x-20 top-[200px] space-y-5">
        {ITEMS.map((item, index) => (
          <li key={index} className="flex items-center gap-5 text-2xl text-zinc-200">
            <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-violet-500/20 font-mono text-xl text-violet-300">
              {index + 1}
            </span>
            <span>{item}</span>
          </li>
        ))}
      </ol>

      <p className="absolute bottom-12 left-20 text-3xl font-semibold text-zinc-50">Questions?</p>
    </>
  );
}
