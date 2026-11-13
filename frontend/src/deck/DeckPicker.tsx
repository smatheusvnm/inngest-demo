import { ArrowRight, LayoutGrid, Presentation } from "lucide-react";
import { DECKS } from "./decks";

export function DeckPicker() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-4xl flex-col justify-center gap-8 px-4 py-10 sm:px-8">
      <header>
        <div className="font-mono text-sm uppercase tracking-[0.25em] text-violet-400">Inngest</div>
        <h1 className="mt-2 text-4xl font-semibold tracking-tight text-zinc-50">Pick a presentation</h1>
      </header>

      <ul className="grid gap-4 sm:grid-cols-2">
        {DECKS.map((deck) => (
          <li key={deck.id}>
            <a
              href={`#/${deck.id}`}
              className="group flex h-full flex-col rounded-2xl border border-zinc-800 bg-zinc-900 p-6 transition hover:border-violet-500/60 hover:bg-zinc-800/60"
            >
              <div className="flex items-center gap-2 text-sm text-zinc-500">
                <Presentation className="size-4" /> {deck.slides.length} slides
              </div>
              <div className="mt-3 text-2xl font-semibold text-zinc-50">{deck.title}</div>
              <p className="mt-2 flex-1 text-zinc-400">{deck.summary}</p>
              <span className="mt-5 inline-flex items-center gap-1.5 text-violet-300 group-hover:text-violet-200">
                Start <ArrowRight className="size-4" />
              </span>
            </a>
          </li>
        ))}
      </ul>

      <a href="#/features" className="inline-flex items-center gap-1.5 self-start text-sm text-zinc-400 hover:text-zinc-200">
        <LayoutGrid className="size-4" /> Feature demo
      </a>
    </main>
  );
}
