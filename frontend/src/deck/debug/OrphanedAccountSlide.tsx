import type { ReactNode } from "react";
import { SlideTitle } from "../ui";
import { TEXT, type Tone } from "./parts";

interface Lane {
  top: number;
  height: number;
}

interface Column {
  left: number;
  width: number;
}

const LANE_A: Lane = { top: 170, height: 84 };
const PROFILE_ROW: Lane = { top: 318, height: 64 };
const LANE_B: Lane = { top: 448, height: 84 };

const ACCOUNT: Column = { left: 80, width: 170 };
const OWNER: Column = { left: 354, width: 230 };
const ROW: Column = { left: 688, width: 220 };
const MAILBOX: Column = { left: 1010, width: 190 };
const PROFILE_EAST: Column = { left: 354, width: 105 };
const PROFILE_WEST: Column = { left: 479, width: 105 };

const middle = (lane: Lane) => lane.top + lane.height / 2;
const bottom = (lane: Lane) => lane.top + lane.height;
const right = (column: Column) => column.left + column.width;
const center = (column: Column) => column.left + column.width / 2;

const NARRATION: ReactNode[] = [
  "Jane starts in East: one Account, one UserAssociations, one profile. The reconciler creates jane.doe@.",
  "She must also work in West. Support creates a new profile and Account. The username gets a suffix: jane.doe1@.",
  <>
    Support <b>merges</b> her: the West profile moves to UserAssociations A.
  </>,
  <>
    UserAssociations B has no profile left and is deleted. Account B loses its link. IntegrationAccount B keeps{" "}
    <b>owner_id = B</b>: an orphan.
  </>,
  "Every run starts from a profile: profile → UserAssociations → its rows. No path reaches the orphan. jane.doe1@ stays ACTIVE, also after offboarding.",
  <>
    Runs green, Sentry quiet. Find the orphans yourself:
    <code className="mt-1 block font-mono text-base text-amber-200">
      IntegrationAccount.objects.filter(owner__isnull=False).exclude(owner__in=UserAssociations.objects.all())
    </code>
  </>,
];

export function OrphanedAccountSlide({ step }: { step: number }) {
  const hasLaneB = step >= 1;
  const isMerged = step >= 2;
  const isOrphan = step >= 3;
  const isRunPathShown = step >= 4;
  const runPathTone: Tone = isRunPathShown ? "emerald" : "violet";

  return (
    <>
      <SlideTitle kicker="4 · Case: merged profiles">One person, two mailboxes</SlideTitle>

      <svg className="absolute inset-0" width="1280" height="720">
        <Edge from={[right(ACCOUNT), middle(LANE_A)]} to={[OWNER.left, middle(LANE_A)]} tone="violet" label="user_profiles" />
        <Edge from={[right(OWNER), middle(LANE_A)]} to={[ROW.left, middle(LANE_A)]} tone={runPathTone} label="owner" />
        <Edge from={[right(ROW), middle(LANE_A)]} to={[MAILBOX.left, middle(LANE_A)]} tone="violet" />
        <Edge from={[center(PROFILE_EAST), PROFILE_ROW.top]} to={[center(PROFILE_EAST), bottom(LANE_A)]} tone={runPathTone} />

        <Edge
          from={[center(PROFILE_WEST), bottom(PROFILE_ROW)]}
          to={[center(PROFILE_WEST), LANE_B.top]}
          tone="violet"
          isShown={hasLaneB && !isMerged}
        />
        <Edge
          from={[center(PROFILE_WEST), PROFILE_ROW.top]}
          to={[center(PROFILE_WEST), bottom(LANE_A)]}
          tone={isRunPathShown ? "emerald" : "amber"}
          isShown={isMerged}
        />

        <Edge
          from={[right(ACCOUNT), middle(LANE_B)]}
          to={[OWNER.left, middle(LANE_B)]}
          tone={isOrphan ? "rose" : "violet"}
          label={isOrphan ? "NULL" : "user_profiles"}
          isBroken={isOrphan}
          isShown={hasLaneB}
        />
        <Edge
          from={[right(OWNER), middle(LANE_B)]}
          to={[ROW.left, middle(LANE_B)]}
          tone={isOrphan ? "rose" : "violet"}
          label={isOrphan ? "owner: gone" : "owner"}
          isBroken={isOrphan}
          isShown={hasLaneB}
        />
        <Edge
          from={[right(ROW), middle(LANE_B)]}
          to={[MAILBOX.left, middle(LANE_B)]}
          tone={isOrphan ? "amber" : "violet"}
          isShown={hasLaneB}
        />
      </svg>

      <Node column={ACCOUNT} lane={LANE_A} title="Account A" subtitle="login · active" />
      <Node
        column={OWNER}
        lane={LANE_A}
        title="UserAssociations A"
        subtitle={isMerged ? "profiles: East, West" : "profiles: East"}
        tone={runPathTone}
      />
      <Node
        column={ROW}
        lane={LANE_A}
        title="IntegrationAccount"
        subtitle="google-workspace"
        tone={isRunPathShown ? "emerald" : "neutral"}
      />
      <Node column={MAILBOX} lane={LANE_A} title="jane.doe@…" subtitle="Google · ACTIVE" tone="emerald" isMono />

      <Node
        column={PROFILE_EAST}
        lane={PROFILE_ROW}
        title="East"
        subtitle="profile"
        tone={isRunPathShown ? "emerald" : "neutral"}
      />
      <Node
        column={PROFILE_WEST}
        lane={PROFILE_ROW}
        title="West"
        subtitle="profile"
        tone={isRunPathShown ? "emerald" : isMerged ? "amber" : "neutral"}
        isShown={hasLaneB}
      />

      <Node
        column={ACCOUNT}
        lane={LANE_B}
        title="Account B"
        subtitle={isOrphan ? "login · no owner" : "login · active"}
        tone={isOrphan ? "rose" : "neutral"}
        isShown={hasLaneB}
      />
      <Node
        column={OWNER}
        lane={LANE_B}
        title="UserAssociations B"
        subtitle={isOrphan ? "deleted" : isMerged ? "no profile left" : "profiles: West"}
        tone={isOrphan ? "rose" : isMerged ? "amber" : "violet"}
        isShown={hasLaneB}
        isDeleted={isOrphan}
      />
      <Node
        column={ROW}
        lane={LANE_B}
        title="IntegrationAccount"
        subtitle={isOrphan ? "orphan, never planned" : "google-workspace"}
        tone={isOrphan ? "rose" : "neutral"}
        isShown={hasLaneB}
      />
      <Node
        column={MAILBOX}
        lane={LANE_B}
        title="jane.doe1@…"
        subtitle="Google · ACTIVE"
        tone={isOrphan ? "amber" : "emerald"}
        isShown={hasLaneB}
        isMono
      />

      <div className="absolute inset-x-20 top-[562px] flex items-start gap-3 text-xl text-zinc-100">
        <span className={`mt-2 size-3 shrink-0 rounded-full bg-current ${TEXT[isOrphan ? "rose" : "violet"]}`} />
        <div>{NARRATION[Math.min(step, NARRATION.length - 1)]}</div>
      </div>
    </>
  );
}

const NODE_BORDER: Record<Tone, string> = {
  neutral: "border-zinc-700",
  violet: "border-violet-500/70",
  amber: "border-amber-400/80 shadow-[0_0_40px_-12px] shadow-amber-400/60",
  emerald: "border-emerald-400/70",
  rose: "border-rose-400/80 shadow-[0_0_40px_-12px] shadow-rose-500/60",
  sky: "border-sky-400/70",
};

function Node(props: {
  column: Column;
  lane: Lane;
  title: string;
  subtitle: string;
  tone?: Tone;
  isShown?: boolean;
  isDeleted?: boolean;
  isMono?: boolean;
}) {
  const tone = props.tone ?? "neutral";
  const isShown = props.isShown ?? true;
  const hasPlainSubtitle = tone === "neutral" || tone === "violet";
  return (
    <div
      className={`absolute flex flex-col justify-center rounded-xl border-2 px-4 transition-all duration-500 ${NODE_BORDER[tone]} ${
        props.isDeleted ? "border-dashed bg-zinc-950" : "bg-zinc-900"
      } ${isShown ? "opacity-100" : "pointer-events-none translate-y-2 opacity-0"}`}
      style={{ left: props.column.left, top: props.lane.top, width: props.column.width, height: props.lane.height }}
    >
      <div
        className={`truncate font-semibold ${props.isMono ? "font-mono text-base" : "text-lg"} ${
          props.isDeleted ? "text-zinc-500 line-through decoration-rose-400" : "text-zinc-50"
        }`}
      >
        {props.title}
      </div>
      <div className={`truncate text-sm ${hasPlainSubtitle ? "text-zinc-400" : TEXT[tone]}`}>{props.subtitle}</div>
    </div>
  );
}

const STROKE: Record<Tone, string> = {
  neutral: "stroke-zinc-600",
  violet: "stroke-violet-400",
  amber: "stroke-amber-300",
  emerald: "stroke-emerald-400",
  rose: "stroke-rose-400",
  sky: "stroke-sky-400",
};

const LABEL_FILL: Record<Tone, string> = {
  neutral: "fill-zinc-500",
  violet: "fill-violet-300",
  amber: "fill-amber-300",
  emerald: "fill-emerald-300",
  rose: "fill-rose-300",
  sky: "fill-sky-300",
};

function Edge(props: {
  from: [number, number];
  to: [number, number];
  tone: Tone;
  label?: string;
  isShown?: boolean;
  isBroken?: boolean;
}) {
  const isShown = props.isShown ?? true;
  const [x1, y1] = props.from;
  const [x2, y2] = props.to;
  return (
    <g className={`transition-opacity duration-500 ${isShown ? "opacity-100" : "opacity-0"}`}>
      <line
        x1={x1}
        y1={y1}
        x2={x2}
        y2={y2}
        strokeWidth={3}
        strokeDasharray={props.isBroken ? "6 8" : undefined}
        className={`transition-colors duration-500 ${STROKE[props.tone]}`}
      />
      {props.label && (
        <text
          x={(x1 + x2) / 2}
          y={y1 - 10}
          textAnchor="middle"
          className={`font-mono text-[12px] transition-colors duration-500 ${LABEL_FILL[props.tone]}`}
        >
          {props.label}
        </text>
      )}
    </g>
  );
}
