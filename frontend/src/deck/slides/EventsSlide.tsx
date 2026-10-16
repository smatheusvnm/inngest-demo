import { CalendarClock, Code2, type LucideIcon, Webhook, Workflow } from "lucide-react";
import { Caption, Reveal, SlideTitle } from "../ui";

const SOURCES: { icon: LucideIcon; name: string; example: string; color: string }[] = [
  { icon: Code2, name: "Django app", example: "a user signs up", color: "text-emerald-300 bg-emerald-400/10" },
  { icon: Webhook, name: "HubSpot webhook", example: "a contact changes", color: "text-orange-300 bg-orange-400/10" },
  { icon: Workflow, name: "Make.com scenario", example: "a lead is qualified", color: "text-fuchsia-300 bg-fuchsia-400/10" },
  { icon: CalendarClock, name: "A schedule (cron)", example: "every Monday 9am", color: "text-sky-300 bg-sky-400/10" },
];

/** Steps 0–3: sources appear one by one. Step 4: the event JSON. */
export function EventsSlide({ step }: { step: number }) {
  const showEvent = step >= 4;

  return (
    <>
      <SlideTitle kicker="1 · Events">Events come from anywhere</SlideTitle>

      <ul className="absolute left-20 top-48 flex w-[440px] flex-col gap-4">
        {SOURCES.map((s, i) => (
          <li key={s.name}>
            <Reveal show={step >= i} from="-translate-x-6">
              <div className="flex items-center gap-4 rounded-2xl border border-zinc-800 bg-zinc-900 px-5 py-4">
                <span className={`flex size-12 items-center justify-center rounded-xl ${s.color}`}>
                  <s.icon className="size-6" />
                </span>
                <span>
                  <span className="block text-xl font-semibold text-zinc-100">{s.name}</span>
                  <span className="block text-base text-zinc-400">{s.example}</span>
                </span>
              </div>
            </Reveal>
          </li>
        ))}
      </ul>

      {/* converging arrow */}
      <Reveal show={showEvent} from="-translate-x-4" className="absolute left-[560px] top-[330px]">
        <svg width="110" height="60" viewBox="0 0 110 60" className="text-violet-400">
          <path d="M4 30 H96" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
          <path d="M80 14 L100 30 L80 46" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </Reveal>

      <Reveal show={showEvent} from="translate-x-6" className="absolute left-[700px] top-52 w-[500px]">
        <div className="rounded-2xl border-2 border-violet-500/60 bg-zinc-900 p-6 shadow-[0_0_60px_-15px] shadow-violet-500/50">
          <div className="mb-3 font-mono text-sm uppercase tracking-widest text-violet-300">event</div>
          <pre className="font-mono text-2xl leading-relaxed text-zinc-100">
            {"{\n"}
            {"  "}<span className="text-sky-300">"name"</span>: <span className="text-amber-300">"user.signup"</span>,{"\n"}
            {"  "}<span className="text-sky-300">"data"</span>: {"{ "}<span className="text-sky-300">"user_id"</span>: <span className="text-emerald-300">42</span>{" }\n"}
            {"}"}
          </pre>
        </div>
      </Reveal>

      <Caption show={showEvent}>
        An event is just JSON: <span className="text-zinc-50">something that happened</span>. The
        sender doesn't know who will handle it.
      </Caption>
    </>
  );
}
