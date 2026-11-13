import { ArrowRight, KeyRound, User, Users } from "lucide-react";
import { Caption, Reveal, SlideTitle } from "../ui";
import { Card, Code, Label, PERSON_EMAIL } from "./parts";

const PROFILES = [
  { division: "East division", title: "Home Remodeling Expert" },
  { division: "West division", title: "Field Marketing Expert" },
];

const INTEGRATIONS = ["google-workspace", "hubspot", "ringcentral", "arrivy", "salespro"];

export function PersonModelSlide({ step }: { step: number }) {
  return (
    <>
      <SlideTitle kicker="1 · Model">One person, one owner</SlideTitle>

      <div className="absolute left-20 top-[180px] flex w-[500px] flex-col gap-4">
        <Reveal show={step >= 1}>
          <Card className="flex items-center gap-4 !py-3">
            <KeyRound className="size-6 text-sky-300" />
            <div>
              <div className="text-xl font-semibold text-zinc-50">Account (login)</div>
              <div className="text-base text-zinc-400">Active while any profile is active</div>
            </div>
          </Card>
        </Reveal>

        <Card tone="violet" className="flex items-center gap-4">
          <Users className="size-7 text-violet-300" />
          <div>
            <div className="text-2xl font-semibold text-zinc-50">UserAssociations</div>
            <div className="text-base text-zinc-400">The person. The owner of the integration rows.</div>
          </div>
        </Card>

        <div className="grid grid-cols-2 gap-4">
          {PROFILES.map((profile) => (
            <Card key={profile.division} className="!p-4">
              <div className="flex items-center gap-2 text-zinc-300">
                <User className="size-5" />
                <Label>profile (User)</Label>
              </div>
              <div className="mt-2 text-lg font-semibold text-zinc-50">{profile.division}</div>
              <div className="text-base text-zinc-400">{profile.title}</div>
            </Card>
          ))}
        </div>
      </div>

      <Reveal show={step >= 2} className="absolute left-[600px] top-[300px]">
        <ArrowRight className="size-10 text-violet-400" />
      </Reveal>

      <Reveal show={step >= 2} className="absolute left-[670px] right-20 top-[180px]">
        <Card className="!p-0">
          <div className="flex items-baseline justify-between border-b border-zinc-800 px-5 py-3">
            <Label tone="violet">IntegrationAccount</Label>
            <span className="font-mono text-sm text-zinc-500">owner = UserAssociations</span>
          </div>
          <ul className="divide-y divide-zinc-800">
            {INTEGRATIONS.map((key) => (
              <li key={key} className="flex items-center justify-between px-5 py-2.5 text-lg">
                <span className="font-mono text-zinc-100">{key}</span>
                <span className="font-mono text-base text-emerald-300">ACTIVE</span>
              </li>
            ))}
          </ul>
          <div className="border-t border-zinc-800 px-5 py-3 text-base text-zinc-400">
            1 row per integration → 1 external account for <Code>{PERSON_EMAIL}</Code>
          </div>
        </Card>
      </Reveal>

      <Caption show={step >= 3}>
        Profiles come and go. <span className="text-violet-300">The owner must stay the same.</span>
      </Caption>
    </>
  );
}
