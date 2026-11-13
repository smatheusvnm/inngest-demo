import { ChevronLeft, ChevronRight, FastForward } from "lucide-react";
import { useCallback, useEffect, useLayoutEffect } from "react";
import { go, navigateDeck } from "../router";
import type { DeckDefinition } from "./decks";
import { Stage } from "./Stage";

const NEXT_KEYS = new Set(["ArrowRight", " ", "PageDown", "Enter"]);
const PREV_KEYS = new Set(["ArrowLeft", "PageUp"]);

export function Deck({
  deck,
  slide: rawSlide,
  step: rawStep,
}: {
  deck: DeckDefinition;
  slide: number;
  step: number;
}) {
  const slides = deck.slides;
  const leave = useCallback(() => go(deck.exit.hash), [deck.exit.hash]);
  const slide = Math.min(rawSlide, slides.length - 1);
  const step = Math.min(rawStep, slides[slide].steps - 1);
  const current = slides[slide];

  const next = useCallback(() => {
    if (step < current.steps - 1) navigateDeck(deck.id, slide, step + 1);
    else if (slide < slides.length - 1) navigateDeck(deck.id, slide + 1, 0);
    else leave();
  }, [deck.id, slides.length, slide, step, current.steps, leave]);

  const prev = useCallback(() => {
    if (step > 0) navigateDeck(deck.id, slide, step - 1);
    else if (slide > 0) navigateDeck(deck.id, slide - 1, slides[slide - 1].steps - 1);
  }, [deck.id, slides, slide, step]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (NEXT_KEYS.has(e.key)) next();
      else if (PREV_KEYS.has(e.key)) prev();
      else if (e.key === "Escape") leave();
      else return;
      e.preventDefault();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [next, prev, leave]);

  // The stage is a fixed 1280×720 canvas, so pin rem to 16px while the deck is
  // shown (the rest of the app scales rem with the viewport).
  useLayoutEffect(() => {
    const root = document.documentElement;
    const previous = root.style.fontSize;
    root.style.fontSize = "16px";
    return () => {
      root.style.fontSize = previous;
    };
  }, []);

  const Slide = current.component;

  return (
    <div className="flex h-dvh flex-col bg-zinc-950">
      <Stage>
        {/* key: remount per slide so entry transitions replay */}
        <div key={slide} className="absolute inset-0">
          <Slide step={step} />
        </div>
      </Stage>

      <footer className="flex h-12 shrink-0 items-center gap-4 px-5 text-sm text-zinc-500">
        <div className="flex items-center gap-1">
          <FooterButton label="Previous (←)" onClick={prev} disabled={slide === 0 && step === 0}>
            <ChevronLeft className="size-4" />
          </FooterButton>
          <FooterButton label="Next (→)" onClick={next}>
            <ChevronRight className="size-4" />
          </FooterButton>
        </div>

        <ol className="flex items-center gap-2">
          {slides.map((s, i) => (
            <li key={s.title}>
              <button
                title={s.title}
                aria-label={s.title}
                onClick={() => navigateDeck(deck.id, i, 0)}
                className={`block h-1.5 rounded-full transition-all ${
                  i === slide ? "w-8 bg-violet-400" : i < slide ? "w-4 bg-zinc-500" : "w-4 bg-zinc-700"
                }`}
              />
            </li>
          ))}
        </ol>

        <span className="hidden font-mono text-xs sm:inline">
          {slide + 1}/{slides.length} · step {step + 1}/{current.steps}
        </span>

        <button
          onClick={leave}
          className="ml-auto inline-flex items-center gap-1.5 rounded-md px-2 py-1 transition hover:bg-zinc-800 hover:text-zinc-200"
        >
          {deck.exit.label} <FastForward className="size-4" />
        </button>
      </footer>
    </div>
  );
}

function FooterButton(props: {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      title={props.label}
      aria-label={props.label}
      onClick={props.onClick}
      disabled={props.disabled}
      className="rounded-md p-1.5 transition hover:bg-zinc-800 hover:text-zinc-200 disabled:pointer-events-none disabled:opacity-30"
    >
      {props.children}
    </button>
  );
}
