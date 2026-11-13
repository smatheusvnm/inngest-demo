import { ChevronRight, Database, MousePointerClick, Radio, Workflow, Zap } from "lucide-react";
import type { ReactNode } from "react";
import { Caption, SlideTitle } from "../ui";
import { Card, Code, EVENT_NAME, FUNCTION_ID, Label, TEXT, type Tone } from "./parts";

interface Stage {
  icon: ReactNode;
  label: string;
  tone: Tone;
  title: ReactNode;
  lines: ReactNode[];
}

const STAGES: Stage[] = [
  {
    icon: <MousePointerClick className="size-5" />,
    label: "trigger",
    tone: "sky",
    title: "A profile changed",
    lines: ["Add user, Copy user", "status or title change", "seat change, admin resync"],
  },
  {
    icon: <Radio className="size-5" />,
    label: "event",
    tone: "amber",
    title: (
      <span className="font-mono text-sm text-amber-300">
        {EVENT_NAME.split("/").map((part, index) => (
          <span key={part}>
            {index > 0 && "/"}
            <wbr />
            {part}
          </span>
        ))}
      </span>
    ),
    lines: [<Code key="user">user_id</Code>, <Code key="by">triggered_by_id</Code>, "sent after the DB commit"],
  },
  {
    icon: <Zap className="size-5" />,
    label: "inngest",
    tone: "violet",
    title: "Queue + flow control",
    lines: ["debounce 5 min per user", "1 run at a time per user", "retries = 1"],
  },
  {
    icon: <Workflow className="size-5" />,
    label: "function",
    tone: "violet",
    title: <span className="font-mono text-sm text-zinc-100">{FUNCTION_ID}</span>,
    lines: [<Code key="plan">compute-plan</Code>, "then waves of actions", "1 step per action"],
  },
  {
    icon: <Database className="size-5" />,
    label: "database",
    tone: "emerald",
    title: <span className="font-mono text-sm text-zinc-100">IntegrationAccount</span>,
    lines: [<Code key="state">state</Code>, <Code key="error">error_message</Code>, <Code key="run">last_workflow_run_id</Code>],
  },
];

export function FlowSlide({ step }: { step: number }) {
  return (
    <>
      <SlideTitle kicker="2 · Flow">From a click to an account</SlideTitle>

      <div className="absolute inset-x-20 top-[200px] flex items-stretch">
        {STAGES.map((stage, index) => {
          const isShown = step >= index;
          return (
            <div key={stage.label} className="flex items-stretch">
              {index > 0 && (
                <ChevronRight
                  className={`size-8 self-center transition-colors duration-500 ${isShown ? "text-violet-400" : "text-zinc-800"}`}
                />
              )}
              <Card
                tone={step === index ? stage.tone : "neutral"}
                className={`flex w-[198px] flex-col gap-3 !p-4 ${isShown ? "opacity-100" : "translate-y-3 opacity-0"}`}
              >
                <div className={`flex items-center gap-2 ${TEXT[stage.tone]}`}>
                  {stage.icon}
                  <Label tone={stage.tone}>{stage.label}</Label>
                </div>
                <div className="break-words text-xl font-semibold text-zinc-50">{stage.title}</div>
                <ul className="space-y-2 text-[15px] text-zinc-400">
                  {stage.lines.map((line, lineIndex) => (
                    <li key={lineIndex}>{line}</li>
                  ))}
                </ul>
              </Card>
            </div>
          );
        })}
      </div>

      <Caption show={step >= 4}>
        Inngest keeps the <span className="text-zinc-50">run state</span>. The database keeps the{" "}
        <span className="text-zinc-50">account state</span>. A click starts a run{" "}
        <span className="text-amber-300">5 min later</span>.
      </Caption>
    </>
  );
}
