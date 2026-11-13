import { Ban, Clock, Hourglass, RotateCw } from "lucide-react";
import type { ReactNode } from "react";
import { Caption, Reveal, SlideTitle } from "../ui";
import { Card, Code, TEXT, type Tone } from "./parts";

interface Outcome {
  icon: ReactNode;
  tone: Tone;
  name: string;
  example: ReactNode;
  result: ReactNode;
}

const OUTCOMES: Outcome[] = [
  {
    icon: <RotateCw className="size-6" />,
    tone: "amber",
    name: "Retry",
    example: "Google or HubSpot answers 500, or the call times out.",
    result: "The step runs once more. Still failing: an isolated failure.",
  },
  {
    icon: <Ban className="size-6" />,
    tone: "rose",
    name: "Abort",
    example: "SalesPro has the email, but Genius does not know the account.",
    result: (
      <>
        <Code>AbortAction</Code> → <Code>NonRetriableError</Code>. No retry. A human must act.
      </>
    ),
  },
  {
    icon: <Hourglass className="size-6" />,
    tone: "sky",
    name: "Defer",
    example: "HubSpot and RingCentral wait for a new Google mailbox. SalesPro hits its rate limit.",
    result: (
      <>
        The run ends <span className="text-emerald-300">green</span>. A wake-up event reconciles the user later.
      </>
    ),
  },
  {
    icon: <Clock className="size-6" />,
    tone: "violet",
    name: "Debounce",
    example: "“I changed the title and nothing happened.”",
    result: "Nothing ran yet. The run starts 5 min after the last event for that user.",
  },
];

export function OutcomesSlide({ step }: { step: number }) {
  return (
    <>
      <SlideTitle kicker="4 · Outcomes">Not every stop is a failure</SlideTitle>

      <div className="absolute inset-x-20 top-[180px] grid grid-cols-2 gap-5">
        {OUTCOMES.map((outcome, index) => (
          <Reveal key={outcome.name} show={step >= index}>
            <Card tone={step === index ? outcome.tone : "neutral"} className="h-[188px]">
              <div className={`flex items-center gap-3 ${TEXT[outcome.tone]}`}>
                {outcome.icon}
                <span className="text-2xl font-semibold">{outcome.name}</span>
              </div>
              <p className="mt-3 text-lg text-zinc-400">{outcome.example}</p>
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
