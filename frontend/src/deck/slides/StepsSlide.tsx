import { Check, Lock, Mail, X } from "lucide-react";
import { Caption, Reveal, SlideTitle } from "../ui";

const STEPS = ["create HubSpot contact", "save to DB", "send welcome email", "update status"];

type State = "idle" | "done" | "crashed" | "memoized" | "next";

/**
 * Attempt 1 (row 1): steps 1–3 succeed one by one, step 4 crashes.
 * Attempt 2 (row 2): steps 1–3 are memoized, it resumes at step 4 and finishes.
 *
 * Slide steps: 0 idle · 1–3 steps go green · 4 crash · 5 retry resumes · 6 done.
 */
export function StepsSlide({ step }: { step: number }) {
  const firstRow: State[] = STEPS.map((_, i) => {
    if (i < 3) return step > i ? "done" : "idle";
    return step >= 4 ? "crashed" : "idle";
  });
  const secondRow: State[] = STEPS.map((_, i) =>
    i < 3 ? "memoized" : step >= 6 ? "done" : "next",
  );
  const emails = step >= 3 ? 1 : 0;

  return (
    <>
      <SlideTitle kicker="3 · Steps">A function is a list of steps</SlideTitle>

      <Row label="attempt 1" states={firstRow} top={180} emails={emails} />

      <Reveal show={step >= 5} className="absolute inset-x-0 top-[385px]">
        <Row label="attempt 2 (retry)" states={secondRow} top={0} emails={1} still />
        <div className="absolute left-20 top-[188px] text-lg text-violet-300">
          ✓ finished steps are memoized: their saved result comes back instantly, no re-run
        </div>
      </Reveal>

      <Caption show={step >= 6}>
        A retry <span className="text-zinc-50">resumes</span> where it failed:{" "}
        <span className="text-emerald-300">one contact, exactly one email</span>.
      </Caption>
    </>
  );
}

function Row(props: { label: string; states: State[]; top: number; emails: number; still?: boolean }) {
  return (
    <div className="absolute left-20 right-20" style={{ top: props.top }}>
      <div className="mb-3 flex items-center justify-between">
        <span className="font-mono text-base uppercase tracking-widest text-zinc-500">{props.label}</span>
        <span
          className={`flex items-center gap-2 font-mono text-lg transition-opacity duration-500 ${
            props.emails ? "text-emerald-300 opacity-100" : "opacity-0"
          }`}
        >
          <Mail className="size-5" /> ×{props.emails}
          {props.still && <span className="text-emerald-400/80">(still 1)</span>}
        </span>
      </div>
      <div className="grid grid-cols-4 gap-4 rounded-2xl border-2 border-dashed border-zinc-700 p-4">
        {STEPS.map((name, i) => (
          <StepBox key={name} name={name} state={props.states[i]} />
        ))}
      </div>
    </div>
  );
}

const STYLES: Record<State, string> = {
  idle: "border-zinc-700 bg-zinc-900 text-zinc-400",
  done: "border-emerald-400 bg-emerald-500 text-emerald-950",
  crashed: "border-rose-400 bg-rose-500/20 text-rose-200 [background-image:repeating-linear-gradient(45deg,transparent,transparent_10px,rgb(244_63_94/0.25)_10px,rgb(244_63_94/0.25)_20px)]",
  memoized: "border-emerald-400/60 bg-emerald-500/80 text-emerald-950",
  next: "border-violet-400 bg-zinc-900 text-zinc-100 shadow-[0_0_40px_-8px] shadow-violet-500/70",
};

function StepBox({ name, state }: { name: string; state: State }) {
  return (
    <div
      className={`relative flex h-24 flex-col items-center justify-center rounded-xl border-2 px-3 text-center text-xl font-semibold transition-all duration-500 ${STYLES[state]}`}
    >
      {name}
      {state === "crashed" && (
        <span className="mt-1 text-sm font-normal text-rose-300">crash: deploy · OOM · API 500</span>
      )}
      {state === "next" && <span className="mt-1 text-sm font-normal text-violet-300">↻ resumes here</span>}
      {state === "done" && <Check className="absolute right-2 top-2 size-5" />}
      {state === "crashed" && <X className="absolute right-2 top-2 size-6 text-rose-400" />}
      {state === "memoized" && (
        <span className="absolute -top-3 right-3 flex size-7 items-center justify-center rounded-full bg-zinc-950 text-emerald-300 ring-2 ring-emerald-400">
          <Lock className="size-4" />
        </span>
      )}
    </div>
  );
}
