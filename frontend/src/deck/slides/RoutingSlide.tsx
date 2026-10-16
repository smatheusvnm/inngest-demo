import { Mail, UserPlus, Zap } from "lucide-react";
import { Caption, Reveal, SlideTitle } from "../ui";

// Diagram coordinates on the 1280×720 stage.
const EVENT = { x: 80, y: 300, w: 240, h: 120 };
const HUB = { x: 450, y: 250, w: 280, h: 220 };
const FN_A = { x: 860, y: 190, w: 340, h: 110 };
const FN_B = { x: 860, y: 420, w: 340, h: 110 };

const midY = (b: { y: number; h: number }) => b.y + b.h / 2;

/**
 * 0: the pieces. 1: event travels to Inngest. 2: fan-out to both functions.
 * 3: functions run in your app, Inngest keeps the state.
 */
export function RoutingSlide({ step }: { step: number }) {
  const atHub = step >= 1;
  const fannedOut = step >= 2;

  return (
    <>
      <SlideTitle kicker="2 · Inngest">Inngest routes events to functions</SlideTitle>

      {/* connectors */}
      <svg className="absolute inset-0" width="1280" height="720">
        <Line x1={EVENT.x + EVENT.w} y1={midY(EVENT)} x2={HUB.x} y2={midY(EVENT)} active={atHub} />
        <Line x1={HUB.x + HUB.w} y1={midY(HUB) - 30} x2={FN_A.x} y2={midY(FN_A)} active={fannedOut} />
        <Line x1={HUB.x + HUB.w} y1={midY(HUB) + 30} x2={FN_B.x} y2={midY(FN_B)} active={fannedOut} />
      </svg>

      {/* event */}
      <Box {...EVENT} glow={step === 0}>
        <div className="font-mono text-sm uppercase tracking-widest text-violet-300">event</div>
        <div className="mt-2 font-mono text-2xl text-amber-300">user.signup</div>
      </Box>

      {/* Inngest */}
      <Box {...HUB} glow={atHub} strong>
        <div className="flex items-center gap-2 text-3xl font-semibold text-zinc-50">
          <Zap className="size-7 text-violet-400" /> Inngest
        </div>
        <ul className="mt-4 space-y-1.5 text-lg text-zinc-400">
          <li>Queue · Retries · State</li>
          <li>Flow control</li>
          <li>Dashboard &amp; replay</li>
        </ul>
      </Box>

      {/* functions */}
      <Box {...FN_A} glow={fannedOut} dim={!fannedOut}>
        <FnLabel icon={<UserPlus className="size-5" />} name="create-hubspot-contact" />
      </Box>
      <Box {...FN_B} glow={fannedOut} dim={!fannedOut}>
        <FnLabel icon={<Mail className="size-5" />} name="send-welcome-email" />
      </Box>

      {/* packets */}
      <Packet
        from={[EVENT.x + EVENT.w - 10, midY(EVENT)]}
        to={[HUB.x + 20, midY(EVENT)]}
        moved={atHub}
        visible={step >= 1 && !fannedOut}
      />
      <Packet from={[HUB.x + HUB.w, midY(HUB) - 30]} to={[FN_A.x + 10, midY(FN_A)]} moved={fannedOut} visible={fannedOut} />
      <Packet from={[HUB.x + HUB.w, midY(HUB) + 30]} to={[FN_B.x + 10, midY(FN_B)]} moved={fannedOut} visible={fannedOut} />

      <Reveal show={fannedOut} className="absolute left-[860px] top-[340px] w-[340px] text-center text-lg text-violet-300">
        fan-out: 1 event → 2 runs
      </Reveal>

      <Caption show={step >= 3}>
        Functions are <span className="text-zinc-50">your code, in your app</span>. Inngest calls
        them over HTTP and keeps track of every run.
      </Caption>
    </>
  );
}

function Box(props: {
  x: number;
  y: number;
  w: number;
  h: number;
  glow?: boolean;
  dim?: boolean;
  strong?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div
      className={`absolute flex flex-col justify-center rounded-2xl border-2 bg-zinc-900 px-6 transition-all duration-500 ${
        props.glow
          ? "border-violet-500 shadow-[0_0_60px_-10px] shadow-violet-500/60"
          : props.strong
            ? "border-violet-500/40"
            : "border-zinc-800"
      } ${props.dim ? "opacity-40" : "opacity-100"}`}
      style={{ left: props.x, top: props.y, width: props.w, height: props.h }}
    >
      {props.children}
    </div>
  );
}

function FnLabel({ icon, name }: { icon: React.ReactNode; name: string }) {
  return (
    <>
      <div className="font-mono text-sm uppercase tracking-widest text-zinc-500">function</div>
      <div className="mt-2 flex items-center gap-2 whitespace-nowrap font-mono text-lg text-zinc-100">
        <span className="text-emerald-300">{icon}</span>
        {name}
      </div>
    </>
  );
}

function Line(p: { x1: number; y1: number; x2: number; y2: number; active: boolean }) {
  return (
    <line
      {...p}
      strokeWidth={3}
      strokeDasharray="8 8"
      className={`transition-colors duration-500 ${p.active ? "stroke-violet-400" : "stroke-zinc-700"}`}
    />
  );
}

/** A glowing dot that slides from `from` to `to` when `moved` turns true. */
function Packet(p: { from: [number, number]; to: [number, number]; moved: boolean; visible: boolean }) {
  const [x, y] = p.moved ? p.to : p.from;
  return (
    <div
      className={`absolute left-0 top-0 size-5 rounded-full bg-amber-300 shadow-[0_0_20px_4px] shadow-amber-300/60 transition-[transform,opacity] duration-700 ease-in-out ${
        p.visible ? "opacity-100" : "opacity-0"
      }`}
      style={{ transform: `translate(${x - 10}px, ${y - 10}px)` }}
    />
  );
}
