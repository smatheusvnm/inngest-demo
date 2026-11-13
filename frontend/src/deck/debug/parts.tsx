import type { ReactNode } from "react";

export const FUNCTION_ID = "sync-user-accounts";
export const EVENT_NAME = "user/lifecycle.changed";
export const RUN_ID = "01JD8Z…7Q";

export type Tone = "neutral" | "violet" | "amber" | "emerald" | "rose" | "sky";

const BORDER: Record<Tone, string> = {
  neutral: "border-zinc-800",
  violet: "border-violet-500/70 shadow-[0_0_50px_-14px] shadow-violet-500/60",
  amber: "border-amber-400/70",
  emerald: "border-emerald-400/70",
  rose: "border-rose-400/80 shadow-[0_0_50px_-14px] shadow-rose-500/60",
  sky: "border-sky-400/70",
};

export const TEXT: Record<Tone, string> = {
  neutral: "text-zinc-400",
  violet: "text-violet-300",
  amber: "text-amber-300",
  emerald: "text-emerald-300",
  rose: "text-rose-300",
  sky: "text-sky-300",
};

export function Card({
  tone = "neutral",
  className = "",
  children,
}: {
  tone?: Tone;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div className={`rounded-2xl border-2 bg-zinc-900 p-5 transition-all duration-500 ${BORDER[tone]} ${className}`}>
      {children}
    </div>
  );
}

export function Label({ tone = "neutral", children }: { tone?: Tone; children: ReactNode }) {
  return <div className={`font-mono text-sm uppercase tracking-widest ${TEXT[tone]}`}>{children}</div>;
}

export function Code({ children }: { children: ReactNode }) {
  return <code className="rounded-md bg-zinc-800 px-1.5 py-0.5 font-mono text-[0.9em] text-amber-200">{children}</code>;
}
