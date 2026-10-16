import { ArrowRight, Footprints, Radio, SquareFunction } from "lucide-react";
import { Highlight, themes } from "prism-react-renderer";
import { navigate } from "../../router";
import { Reveal, SlideTitle } from "../ui";

type Part = "event" | "function" | "step";

const SEND = `# anywhere: a view, a webhook handler, a script…
inngest_client.send(
    inngest.Event(name="user.signup", data={"user_id": 42})
)`;

const FUNCTION = `@inngest_client.create_function(
    fn_id="onboard-user",
    trigger=inngest.TriggerEvent(event="user.signup"),
)
async def onboard_user(ctx: inngest.Context):
    user = await ctx.step.run("load-user", load_user)
    await ctx.step.run("create-hubspot-contact", create_contact, user)
    await ctx.step.run("send-welcome-email", send_email, user)`;

// Which lines (0-based) belong to which concept.
const SEND_PARTS: Record<number, Part> = { 2: "event" };
const FUNCTION_PARTS: Record<number, Part> = {
  0: "function", 1: "function", 2: "event", 3: "function", 4: "function",
  5: "step", 6: "step", 7: "step",
};

const PARTS: { part: Part; title: string; text: string; icon: typeof Radio; color: string }[] = [
  { part: "event", title: "Event", text: "Something that happened, sent as JSON.", icon: Radio, color: "sky" },
  { part: "function", title: "Function", text: "Your code. Runs when a matching event arrives.", icon: SquareFunction, color: "amber" },
  { part: "step", title: "Step", text: "A retryable unit of work. Its result is saved once.", icon: Footprints, color: "emerald" },
];

const COLOR = {
  sky: { card: "border-sky-400 bg-sky-400/10", text: "text-sky-300", line: "bg-sky-400/15 border-sky-400" },
  amber: { card: "border-amber-400 bg-amber-400/10", text: "text-amber-300", line: "bg-amber-400/15 border-amber-400" },
  emerald: { card: "border-emerald-400 bg-emerald-400/10", text: "text-emerald-300", line: "bg-emerald-400/15 border-emerald-400" },
};

/** 0: code · 1: event · 2: function · 3: steps · 4: call to action. */
export function CodeSlide({ step }: { step: number }) {
  const active: Part | null = (["event", "function", "step"] as const)[step - 1] ?? null;
  const colorOf = (part: Part) => COLOR[PARTS.find((p) => p.part === part)!.color as keyof typeof COLOR];

  return (
    <>
      <SlideTitle kicker="4 · Code">Three building blocks</SlideTitle>

      <div className="absolute left-20 top-48 flex w-[330px] flex-col gap-4">
        {PARTS.map((p) => {
          const on = active === p.part || step >= 4;
          const c = COLOR[p.color as keyof typeof COLOR];
          return (
            <div
              key={p.part}
              className={`rounded-2xl border-2 px-5 py-4 transition-all duration-500 ${
                on ? c.card : "border-zinc-800 bg-zinc-900 opacity-60"
              }`}
            >
              <div className={`flex items-center gap-2 text-2xl font-semibold ${c.text}`}>
                <p.icon className="size-6" /> {p.title}
              </div>
              <div className="mt-1 text-lg text-zinc-300">{p.text}</div>
            </div>
          );
        })}
      </div>

      <div className="absolute left-[450px] right-20 top-48 flex flex-col gap-4">
        <Code code={SEND} parts={SEND_PARTS} active={active} colorOf={colorOf} />
        <Code code={FUNCTION} parts={FUNCTION_PARTS} active={active} colorOf={colorOf} />
      </div>

      <Reveal show={step >= 4} className="absolute bottom-10 left-20">
        <button
          onClick={() => navigate(null)}
          className="flex items-center gap-3 rounded-2xl bg-violet-500 px-7 py-4 text-2xl font-semibold text-white shadow-lg shadow-violet-500/30 transition hover:bg-violet-400"
        >
          Let's see it live <ArrowRight className="size-7" />
        </button>
      </Reveal>
    </>
  );
}

function Code(props: {
  code: string;
  parts: Record<number, Part>;
  active: Part | null;
  colorOf: (p: Part) => (typeof COLOR)[keyof typeof COLOR];
}) {
  return (
    <Highlight code={props.code} language="python" theme={themes.nightOwl}>
      {({ tokens, getLineProps, getTokenProps }) => (
        <pre className="rounded-2xl border border-zinc-800 bg-[#011627] py-4 font-mono text-[16px] leading-[1.65]">
          {tokens.map((line, i) => {
            const part = props.parts[i];
            const lit = part !== undefined && part === props.active;
            const { className, ...rest } = getLineProps({ line });
            return (
              <div
                key={i}
                {...rest}
                className={`${className} border-l-4 px-5 transition-all duration-500 ${
                  lit ? props.colorOf(part).line : "border-transparent"
                } ${props.active && !lit ? "opacity-40" : "opacity-100"}`}
              >
                {line.map((token, k) => (
                  <span key={k} {...getTokenProps({ token })} />
                ))}
                {line.length === 0 || (line.length === 1 && line[0].empty) ? "\n" : null}
              </div>
            );
          })}
        </pre>
      )}
    </Highlight>
  );
}
