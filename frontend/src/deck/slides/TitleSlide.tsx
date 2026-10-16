export function TitleSlide() {
  return (
    <div className="absolute inset-0 flex flex-col justify-center px-24">
      {/* soft glow */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_340px_at_74%_46%,rgb(139_92_246/0.28),transparent)]" />

      <div className="font-mono text-base uppercase tracking-[0.3em] text-violet-400">
        Team demo
      </div>
      <h1 className="mt-4 text-[112px] font-bold leading-none tracking-tight text-zinc-50">
        Inngest
      </h1>
      <div className="mt-6 h-2 w-72 rounded-full bg-violet-500" />
      <p className="mt-10 max-w-3xl text-4xl leading-snug text-zinc-300">
        Durable workflows: events in, reliable functions out.
      </p>

      <p className="absolute bottom-14 left-24 text-lg text-zinc-500">
        Press <Kbd>→</Kbd> to start · <Kbd>Esc</Kbd> to jump to the live demo
      </p>
    </div>
  );
}

function Kbd({ children }: { children: string }) {
  return (
    <kbd className="mx-1 rounded-md border border-zinc-700 bg-zinc-800 px-2 py-0.5 font-mono text-base text-zinc-300">
      {children}
    </kbd>
  );
}
