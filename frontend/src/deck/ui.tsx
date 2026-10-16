import type { ReactNode } from "react";

/** Fades/slides children in when `show` becomes true. */
export function Reveal({
  show,
  children,
  className = "",
  from = "translate-y-3",
}: {
  show: boolean;
  children: ReactNode;
  className?: string;
  from?: string;
}) {
  return (
    <div
      className={`transition-all duration-500 ease-out ${
        show ? "translate-x-0 translate-y-0 opacity-100" : `${from} pointer-events-none opacity-0`
      } ${className}`}
    >
      {children}
    </div>
  );
}

export function SlideTitle({ kicker, children }: { kicker?: string; children: ReactNode }) {
  return (
    <header className="absolute left-20 top-14">
      {kicker && (
        <div className="mb-2 font-mono text-sm uppercase tracking-[0.2em] text-violet-400">
          {kicker}
        </div>
      )}
      <h2 className="text-5xl font-semibold tracking-tight text-zinc-50">{children}</h2>
    </header>
  );
}

/** Caption pinned to the bottom of the stage. */
export function Caption({ show, children }: { show: boolean; children: ReactNode }) {
  return (
    <Reveal show={show} className="absolute inset-x-20 bottom-12 text-center text-2xl text-zinc-300">
      {children}
    </Reveal>
  );
}
