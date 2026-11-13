import { ArrowDown, Bug, Database, FileText, Zap } from "lucide-react";
import type { ReactNode } from "react";
import { Caption, Reveal, SlideTitle } from "../ui";
import { Card, Code, FUNCTION_ID, Label, RUN_ID, TEXT, type Tone } from "./parts";

interface Place {
  icon: ReactNode;
  tone: Tone;
  name: string;
  search: ReactNode;
  shows: string;
}

const PLACES: Place[] = [
  {
    icon: <Database className="size-6" />,
    tone: "emerald",
    name: "Account row",
    search: (
      <>
        admin filter <Code>has error</Code> → copy <Code>last_run_id</Code>
      </>
    ),
    shows: "Current state and the last error, per integration.",
  },
  {
    icon: <Zap className="size-6" />,
    tone: "violet",
    name: "Inngest run",
    search: (
      <>
        open run <Code>{RUN_ID}</Code>
      </>
    ),
    shows: "The trace: input and output of every step, the final error.",
  },
  {
    icon: <Bug className="size-6" />,
    tone: "rose",
    name: "Sentry issues",
    search: (
      <>
        <Code>inngest.run.id:{RUN_ID}</Code>
      </>
    ),
    shows: `Stack trace. Performance: transaction inngest/${FUNCTION_ID}.`,
  },
  {
    icon: <FileText className="size-6" />,
    tone: "sky",
    name: "Logs",
    search: (
      <>
        <Code>run_id</Code> or <Code>user_id</Code> in Sentry Logs / CloudWatch
      </>
    ),
    shows: "Every log line inside the run carries both ids.",
  },
];

export function CorrelationSlide({ step }: { step: number }) {
  return (
    <>
      <SlideTitle kicker="4 · Correlate">Follow the run id</SlideTitle>

      <div className="absolute inset-x-20 top-[180px] flex flex-col">
        {PLACES.map((place, index) => (
          <Reveal key={place.name} show={step >= index}>
            {index > 0 && <ArrowDown className="mx-auto -my-1 size-5 text-zinc-600" />}
            <Card tone={step === index ? place.tone : "neutral"} className="grid grid-cols-[230px_1fr_1fr] items-center gap-6 !py-3">
              <div className={`flex items-center gap-3 text-xl font-semibold ${TEXT[place.tone]}`}>
                {place.icon}
                {place.name}
              </div>
              <div>
                <Label>search</Label>
                <div className="mt-1 text-lg text-zinc-200">{place.search}</div>
              </div>
              <div>
                <Label>shows</Label>
                <div className="mt-1 text-lg text-zinc-300">{place.shows}</div>
              </div>
            </Card>
          </Reveal>
        ))}
      </div>

      <Caption show={step >= 4}>
        One id, four places. <span className="text-zinc-50">Copy the run id first.</span>
      </Caption>
    </>
  );
}
