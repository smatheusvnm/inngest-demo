import { Mail, Users } from "lucide-react";
import type { ReactNode } from "react";
import { Reveal, SlideTitle } from "../ui";
import { Card, Code, Label, PERSON_EMAIL, TEXT, type Tone } from "./parts";

const EXTERNAL_ID = "1029…";

interface TimelineEntry {
  tone: Tone;
  text: ReactNode;
}

const TIMELINE: TimelineEntry[] = [
  {
    tone: "emerald",
    text: (
      <>
        Right way to move Jane: <b>Copy user</b> or <b>associate</b> the new profile. It joins owner A.
      </>
    ),
  },
  {
    tone: "amber",
    text: (
      <>
        What happened: <b>Add user</b> for Jane in West. New profile, new UserAssociations B, new Account.
      </>
    ),
  },
  {
    tone: "amber",
    text: (
      <>
        Run for B: google-workspace says “exists” and adopts it. Two rows, one <Code>external_id</Code>.
      </>
    ),
  },
  {
    tone: "rose",
    text: (
      <>
        East profile deactivated. Account A goes inactive. Run for A <b>suspends</b> the mailbox. Green.
      </>
    ),
  },
  {
    tone: "rose",
    text: (
      <>
        Any event for B (title change, resync): run for B <b>enables</b> it. Green. Next event for A: off again.
      </>
    ),
  },
  {
    tone: "violet",
    text: (
      <>
        Detect: two rows with the same <Code>external_id</Code>. Fix the data: one person, one UserAssociations. Then
        resync.
      </>
    ),
  },
];

export function DuplicateProfileSlide({ step }: { step: number }) {
  const isSuspended = step === 3;
  const hasSecondOwner = step >= 1;
  const isShared = step >= 2;

  return (
    <>
      <SlideTitle kicker="5 · Case: repeated profile">One person, two owners</SlideTitle>

      <Owner
        className="left-20"
        name="UserAssociations A"
        profile="Jane · East profile"
        isAccountActive={step < 3}
        isShared={isShared}
      />

      <div
        className={`absolute left-[410px] top-[268px] w-[92px] border-t-2 border-dashed transition-colors duration-500 ${
          isSuspended ? "border-rose-400" : "border-violet-400"
        }`}
      />

      <Card
        tone={isSuspended ? "rose" : "emerald"}
        className="absolute left-[502px] top-[200px] flex w-[276px] flex-col items-center gap-2 text-center"
      >
        <Mail className={`size-8 ${isSuspended ? "text-rose-300" : "text-emerald-300"}`} />
        <Label>google mailbox</Label>
        <div className="font-mono text-lg text-zinc-100">{PERSON_EMAIL}</div>
        <div className={`font-mono text-xl font-semibold ${isSuspended ? "text-rose-300" : "text-emerald-300"}`}>
          {isSuspended ? "SUSPENDED" : "ACTIVE"}
        </div>
        <div className={`text-sm text-amber-300 transition-opacity duration-500 ${step >= 4 ? "opacity-100" : "opacity-0"}`}>
          ↻ flips on every event
        </div>
      </Card>

      <div
        className={`absolute left-[778px] top-[268px] w-[92px] border-t-2 border-dashed transition-all duration-500 ${
          isShared ? "border-amber-400 opacity-100" : "opacity-0"
        }`}
      />

      <Reveal show={hasSecondOwner} className="absolute inset-0">
        <Owner
          className="left-[870px]"
          name="UserAssociations B"
          profile="Jane · West profile (Add user)"
          isAccountActive
          isShared={isShared}
        />
      </Reveal>

      <ol className="absolute inset-x-20 top-[392px] space-y-2.5">
        {TIMELINE.map((entry, index) => (
          <li
            key={index}
            className={`flex items-start gap-3 text-xl transition-all duration-500 ${
              step >= index ? "opacity-100" : "translate-y-2 opacity-0"
            } ${step === index ? "text-zinc-50" : "text-zinc-400"}`}
          >
            <span className={`mt-2 size-3 shrink-0 rounded-full bg-current ${TEXT[entry.tone]}`} />
            <span>{entry.text}</span>
          </li>
        ))}
      </ol>
    </>
  );
}

function Owner(props: {
  className: string;
  name: string;
  profile: string;
  isAccountActive: boolean;
  isShared: boolean;
}) {
  return (
    <Card tone="violet" className={`absolute top-[180px] w-[330px] !p-4 ${props.className}`}>
      <div className="flex items-center gap-2 text-violet-300">
        <Users className="size-5" />
        <span className="text-xl font-semibold text-zinc-50">{props.name}</span>
      </div>
      <div className="mt-1 text-base text-zinc-400">{props.profile}</div>
      <div className="mt-3 flex items-center justify-between text-base">
        <span className="text-zinc-400">Account</span>
        <span className={`font-mono ${props.isAccountActive ? "text-emerald-300" : "text-rose-300"}`}>
          {props.isAccountActive ? "active" : "inactive"}
        </span>
      </div>
      <div className="mt-1 flex items-center justify-between text-base">
        <span className="font-mono text-zinc-400">google-workspace row</span>
        <span className={`font-mono ${props.isShared ? "text-amber-300" : "text-zinc-300"}`}>{EXTERNAL_ID}</span>
      </div>
    </Card>
  );
}
