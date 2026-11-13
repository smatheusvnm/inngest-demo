import { ArrowLeft, Mail, Users } from "lucide-react";
import type { ReactNode } from "react";
import { Reveal, SlideTitle } from "../ui";
import { Card, TEXT, type Tone } from "./parts";

interface TimelineEntry {
  tone: Tone;
  text: ReactNode;
}

const TIMELINE: TimelineEntry[] = [
  { tone: "emerald", text: "Jane starts in East. One profile, one owner, one mailbox: jane.doe@." },
  {
    tone: "amber",
    text: "She must also work in West. New profile, new Account. The username gets a suffix: jane.doe1@.",
  },
  {
    tone: "amber",
    text: (
      <>
        Support <b>merges</b> her: the West profile moves to owner A. Owner B has no profile left and is deleted.
      </>
    ),
  },
  {
    tone: "rose",
    text: (
      <>
        Account B loses its owner. The rows of B keep <b>owner_id = B</b>, which no longer exists: orphans.
      </>
    ),
  },
  {
    tone: "rose",
    text: "The planner starts from a profile, so no run reaches them. jane.doe1@ stays ACTIVE, also after offboarding.",
  },
  {
    tone: "violet",
    text: (
      <>
        Every run is green and Sentry is quiet. Look for the orphans yourself:
        <code className="mt-1 block font-mono text-base text-amber-200">
          IntegrationAccount.objects.filter(owner__isnull=False).exclude(owner__in=UserAssociations.objects.all())
        </code>
      </>
    ),
  },
];

export function OrphanedAccountSlide({ step }: { step: number }) {
  const hasSecondOwner = step >= 1;
  const isMerged = step >= 2;
  const isOrphan = step >= 3;

  return (
    <>
      <SlideTitle kicker="5 · Case: merged profiles">One person, two mailboxes</SlideTitle>

      <Owner
        className="left-20"
        name="UserAssociations A"
        profiles={isMerged ? "East · West" : "East"}
        account="Account A · active"
        accountTone="emerald"
        email="jane.doe@…"
        ownerLine="owner_id = A"
        ownerTone="neutral"
      />

      <Reveal show={isMerged} className="absolute left-[440px] top-[236px] w-[400px] text-center">
        <ArrowLeft className="mx-auto size-10 text-amber-300" />
        <div className="mt-1 text-lg text-amber-200">West profile moves to A</div>
      </Reveal>

      <Reveal show={hasSecondOwner} className="absolute inset-0">
        <Owner
          className={`left-[860px] ${isMerged ? "!border-dashed !border-rose-400/70" : ""}`}
          name={isMerged ? "UserAssociations B · deleted" : "UserAssociations B"}
          profiles={isMerged ? "no profile" : "West"}
          account={isOrphan ? "Account B · no owner" : "Account B · active"}
          accountTone={isOrphan ? "rose" : "emerald"}
          email="jane.doe1@…"
          emailTone={isOrphan ? "amber" : "emerald"}
          ownerLine={isOrphan ? "owner_id = B → missing" : "owner_id = B"}
          ownerTone={isOrphan ? "rose" : "neutral"}
        />
      </Reveal>

      <ol className="absolute inset-x-20 top-[400px] space-y-2">
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
  profiles: string;
  account: string;
  accountTone: Tone;
  email: string;
  emailTone?: Tone;
  ownerLine: string;
  ownerTone: Tone;
}) {
  return (
    <Card tone="violet" className={`absolute top-[170px] w-[340px] !p-4 ${props.className}`}>
      <div className="flex items-center gap-2 text-violet-300">
        <Users className="size-5 shrink-0" />
        <span className="text-xl font-semibold text-zinc-50">{props.name}</span>
      </div>
      <div className="mt-1 text-base text-zinc-400">Profiles: {props.profiles}</div>
      <div className={`mt-1 text-base ${TEXT[props.accountTone]}`}>{props.account}</div>
      <div className="mt-3 rounded-lg border border-zinc-800 bg-zinc-950/60 px-3 py-2 font-mono text-sm">
        <div className="text-zinc-400">google-workspace row</div>
        <div className={TEXT[props.ownerTone]}>{props.ownerLine}</div>
        <div className={`flex items-center gap-2 ${TEXT[props.emailTone ?? "emerald"]}`}>
          <Mail className="size-4" /> {props.email} ACTIVE
        </div>
      </div>
    </Card>
  );
}
