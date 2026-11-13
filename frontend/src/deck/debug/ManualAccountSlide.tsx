import { Caption, Reveal, SlideTitle } from "../ui";
import { Card, Code, Label } from "./parts";

type Verdict = "adopt" | "once" | "human";

interface Behavior {
  key: string;
  shownFrom: number;
  verdict: Verdict;
  action: string;
  seen: string;
}

const BEHAVIORS: Behavior[] = [
  { key: "google-workspace", shownFrom: 1, verdict: "adopt", action: "Create says “exists”. Adopt it.", seen: "green" },
  { key: "hubspot", shownFrom: 1, verdict: "adopt", action: "Create says EXISTS. Adopt the user.", seen: "green" },
  { key: "ringcentral", shownFrom: 1, verdict: "adopt", action: "Adopt the extension. Enable it if needed.", seen: "green" },
  {
    key: "arrivy",
    shownFrom: 2,
    verdict: "once",
    action: "EMAIL_EXISTS: adopt. Deactivated: abort, next run enables.",
    seen: "Failed once, then green",
  },
  {
    key: "salespro",
    shownFrom: 3,
    verdict: "human",
    action: "EMAIL_EXISTS: abort. Never adopt an unknown account.",
    seen: "Failed until a human acts",
  },
];

const VERDICT_STYLE: Record<Verdict, string> = {
  adopt: "text-emerald-300",
  once: "text-amber-300",
  human: "text-rose-300",
};

export function ManualAccountSlide({ step }: { step: number }) {
  return (
    <>
      <SlideTitle kicker="5 · Case: added by hand">The account already exists</SlideTitle>

      <p className="absolute left-20 right-20 top-[160px] text-xl text-zinc-300">
        Someone created the user directly in the vendor, before Genius did. What does the reconciler do?
      </p>

      <Card className="absolute left-20 right-20 top-[205px] !p-0">
        <div className="grid grid-cols-[210px_1fr_250px] gap-6 border-b border-zinc-800 px-6 py-2.5">
          <Label>integration</Label>
          <Label>reconciler</Label>
          <Label>you see in Inngest</Label>
        </div>
        <div className="divide-y divide-zinc-800">
          {BEHAVIORS.map((behavior) => (
            <Reveal key={behavior.key} show={step >= behavior.shownFrom} from="translate-x-0">
              <div
                className={`grid grid-cols-[210px_1fr_250px] items-center gap-6 px-6 py-2.5 text-lg ${
                  step === behavior.shownFrom && behavior.verdict !== "adopt" ? "bg-zinc-800/60" : ""
                }`}
              >
                <span className="font-mono text-zinc-100">{behavior.key}</span>
                <span className="text-zinc-300">{behavior.action}</span>
                <span className={VERDICT_STYLE[behavior.verdict]}>{behavior.seen}</span>
              </div>
            </Reveal>
          ))}
        </div>
        <Reveal show={step >= 3} className="border-t border-zinc-800 px-6 py-3 text-lg text-zinc-300">
          SalesPro fix: same person? Set <Code>external_id</Code> and <Code>state=ACTIVE</Code> on the row. The error
          says how.
        </Reveal>
      </Card>

      <Caption show={step >= 4}>
        Careful: every run compares the vendor with Genius. It can{" "}
        <span className="text-zinc-50">undo a manual change</span> made in the vendor.
      </Caption>
    </>
  );
}
