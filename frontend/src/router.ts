import { DECKS } from "./deck/decks";
import { SCENARIOS } from "./scenarios";

export type Route =
  | { page: "decks" }
  | { page: "deck"; deckId: string; slide: number; step: number } // slide is 0-based internally
  | { page: "features" }
  | { page: "scenario"; id: string };

/**
 * "#/"                      -> deck picker
 * "#/<deck-id>/<n>/<step>"  -> slide n (1-based in the URL) of a deck, step
 * "#/features"              -> feature grid
 * "#/<scenario-id>"         -> focused scenario
 */
export function readRoute(): Route {
  const parts = location.hash.replace(/^#\/?/, "").split("/").filter(Boolean);

  if (parts.length === 0) return { page: "decks" };
  if (DECKS.some((deck) => deck.id === parts[0])) {
    const slide = Math.max(Number(parts[1] ?? 1) - 1, 0) || 0;
    const step = Math.max(Number(parts[2] ?? 0), 0) || 0;
    return { page: "deck", deckId: parts[0], slide, step };
  }
  if (parts[0] === "features") return { page: "features" };
  if (SCENARIOS.some((s) => s.id === parts[0])) return { page: "scenario", id: parts[0] };
  return { page: "decks" };
}

export function go(hash: string) {
  location.hash = hash;
}

/** Scenario id, or null for the feature grid. */
export function navigate(id: string | null) {
  go(id ? `/${id}` : "/features");
}

export function navigateDeck(deckId: string, slide: number, step: number) {
  go(`/${deckId}/${slide + 1}/${step}`);
}
