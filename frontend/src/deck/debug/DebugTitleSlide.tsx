export function DebugTitleSlide() {
  return (
    <div className="absolute inset-0 flex flex-col justify-center px-24">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_340px_at_76%_44%,rgb(244_63_94/0.22),transparent)]" />

      <div className="font-mono text-base uppercase tracking-[0.3em] text-rose-400">HGE · Team session · 10 min</div>
      <h1 className="mt-4 text-[96px] font-bold leading-none tracking-tight text-zinc-50">When a run goes wrong</h1>
      <div className="mt-6 h-2 w-72 rounded-full bg-rose-500" />
      <p className="mt-10 max-w-4xl text-3xl leading-snug text-zinc-300">
        How the integration reconciler runs, and how to debug it with the Inngest MCP and Sentry.
      </p>

      <p className="absolute bottom-14 left-24 right-24 text-xl text-zinc-400">
        <span className="text-zinc-200">The case:</span> Jane works in two divisions. Support merged her profiles. Now
        she has two Google mailboxes, and no run sees the second one. Why?
      </p>
    </div>
  );
}
