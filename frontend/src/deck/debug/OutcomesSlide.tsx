import { Ban, Clock, Hourglass, RotateCw } from "lucide-react";
import type { ReactNode } from "react";
import { Caption, Reveal, SlideTitle } from "../ui";
import { Card, Code, Label, TEXT, type Tone } from "./parts";

interface Outcome {
  icon: ReactNode;
  tone: Tone;
  name: string;
  when: string;
  result: ReactNode;
}

const OUTCOMES: Outcome[] = [
  {
    icon: <RotateCw className="size-6" />,
    tone: "amber",
    name: "Retry",
    when: "Any unexpected exception: timeout, 500, bad response.",
    result: "Inngest runs the step again. Still failing? It counts as a failure.",
  },
  {
    icon: <Ban className="size-6" />,
    tone: "rose",
    name: "Abort",
    when: "A permanent condition: the row is gone, required data is missing.",
    result: (
      <>
        Raised as <Code>NonRetriableError</Code>. No retry.
      </>
    ),
  },
  {
    icon: <Hourglass className="size-6" />,
    tone: "sky",
    name: "Defer",
    when: "Not ready yet: the vendor still needs time.",
    result: (
      <>
        The run ends <span className="text-emerald-300">green</span>. One wake-up event syncs the user again later.
      </>
    ),
  },
  {
    icon: <Clock className="size-6" />,
    tone: "violet",
    name: "Debounce",
    when: "Not an outcome: nothing ran yet.",
    result: "The run starts 5 min after the last event for that user.",
  },
];

export function OutcomesSlide({ step }: { step: number }) {
  return (
    <>
      <SlideTitle kicker="3 · Outcomes">Not every stop is a failure</SlideTitle>

      <div className="absolute inset-x-20 top-[190px] grid grid-cols-2 gap-5">
        {OUTCOMES.map((outcome, index) => (
          <Reveal key={outcome.name} show={step >= index}>
            <Card tone={step === index ? outcome.tone : "neutral"} className="h-[180px]">
              <div className={`flex items-center gap-3 ${TEXT[outcome.tone]}`}>
                {outcome.icon}
                <span className="text-2xl font-semibold">{outcome.name}</span>
              </div>
              <div className="mt-3">
                <Label>when</Label>
                <p className="mt-1 text-lg text-zinc-300">{outcome.when}</p>
              </div>
              <p className="mt-2 text-lg text-zinc-100">{outcome.result}</p>
            </Card>
          </Reveal>
        ))}
      </div>

      <Caption show={step >= 4}>
        A green run is not always done. Look for <Code>deferred</Code> in the run output.
      </Caption>
    </>
  );
}
