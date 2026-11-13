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
    title: "Something changed",
    lines: ["user form saved", "admin resync", "seat added or removed"],
  },
  {
    icon: <Radio className="size-5" />,
    label: "event",
    tone: "amber",
    title: (
      <span className="font-mono text-base text-amber-300">
        {EVENT_NAME.split("/")[0]}/<wbr />
        {EVENT_NAME.split("/")[1]}
      </span>
    ),
    lines: [<Code key="data">user_id</Code>, <Code key="by">triggered_by_id</Code>, "sent after the DB commit"],
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
    title: <span className="font-mono text-base text-zinc-100">{FUNCTION_ID}</span>,
    lines: [<Code key="plan">compute-plan</Code>, "then waves of actions", "1 step per action"],
  },
  {
    icon: <Database className="size-5" />,
    label: "database",
    tone: "emerald",
    title: "Account row",
    lines: [<Code key="state">state</Code>, <Code key="error">error_message</Code>, <Code key="run">last_run_id</Code>],
  },
];

export function FlowSlide({ step }: { step: number }) {
  return (
    <>
      <SlideTitle kicker="1 · Flow">From a click to an account</SlideTitle>

      <div className="absolute inset-x-20 top-[210px] flex items-stretch">
        {STAGES.map((stage, index) => {
          const isShown = step >= index;
          return (
            <div key={stage.label} className="flex items-stretch">
              {index > 0 && (
                <ChevronRight
                  className={`mx-1 size-10 self-center transition-colors duration-500 ${isShown ? "text-violet-400" : "text-zinc-800"}`}
                />
              )}
              <Card
                tone={step === index ? stage.tone : "neutral"}
                className={`flex w-[190px] flex-col gap-3 ${isShown ? "opacity-100" : "translate-y-3 opacity-0"}`}
              >
                <div className={`flex items-center gap-2 ${TEXT[stage.tone]}`}>
                  {stage.icon}
                  <Label tone={stage.tone}>{stage.label}</Label>
                </div>
                <div className="text-xl font-semibold text-zinc-50">{stage.title}</div>
                <ul className="space-y-2 text-base text-zinc-400">
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
        Your code runs in your app. Inngest keeps the <span className="text-zinc-50">run state</span>; the database keeps
        the <span className="text-zinc-50">account state</span>.
      </Caption>
    </>
  );
}
