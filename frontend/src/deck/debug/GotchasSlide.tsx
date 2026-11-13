import type { ReactNode } from "react";
import { Caption, Reveal, SlideTitle } from "../ui";
import { Code } from "./parts";

interface Gotcha {
  symptom: string;
  cause: ReactNode;
}

const GOTCHAS: Gotcha[] = [
  {
    symptom: "“I clicked and nothing happened.”",
    cause: "Debounce: the run starts 5 min after the last event for that user.",
  },
  {
    symptom: "“I sent the event again and got no run.”",
    cause: "An event id seen in the last 24 h is dropped.",
  },
  {
    symptom: "“The run failed, but Sentry has no issue for it.”",
    cause: "The Sentry middleware reports only the last attempt. The issue can come from a logged exception instead.",
  },
  {
    symptom: "“This log line shows up three times.”",
    cause: (
      <>
        Code outside <Code>step.run</Code> runs again on every step call. Put side effects in a step.
      </>
    ),
  },
  {
    symptom: "“My INFO log is not in Sentry.”",
    cause: "Sentry Logs keep INFO only from app loggers. Framework INFO is dropped.",
  },
];

export function GotchasSlide({ step }: { step: number }) {
  return (
    <>
      <SlideTitle kicker="6 · Gotchas">Things that look like bugs</SlideTitle>

      <div className="absolute inset-x-20 top-[180px] space-y-3">
        {GOTCHAS.map((gotcha, index) => (
          <Reveal key={gotcha.symptom} show={step >= index} from="-translate-x-4">
            <div className="grid grid-cols-[440px_1fr] gap-6 rounded-xl border border-zinc-800 bg-zinc-900 px-5 py-3">
              <span className="text-xl text-zinc-100">{gotcha.symptom}</span>
              <span className="text-lg text-zinc-400">{gotcha.cause}</span>
            </div>
          </Reveal>
        ))}
      </div>

      <Caption show={step >= 5}>
        When in doubt, the <span className="text-violet-300">Inngest run</span> is the source of truth.
      </Caption>
    </>
  );
}
