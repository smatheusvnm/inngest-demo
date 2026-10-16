import { SCENARIOS } from "./scenarios";

export type Route =
  | { page: "intro"; slide: number; step: number } // slide is 0-based internally
  | { page: "features" }
  | { page: "scenario"; id: string };

/**
 * "#/"                  -> intro, first slide
 * "#/intro/<n>/<step>"  -> intro slide n (1-based in the URL), step
 * "#/features"          -> feature grid
 * "#/<scenario-id>"     -> focused scenario
 */
export function readRoute(): Route {
  const parts = location.hash.replace(/^#\/?/, "").split("/").filter(Boolean);

  if (parts.length === 0) return { page: "intro", slide: 0, step: 0 };
  if (parts[0] === "intro") {
    const slide = Math.max(Number(parts[1] ?? 1) - 1, 0) || 0;
    const step = Math.max(Number(parts[2] ?? 0), 0) || 0;
    return { page: "intro", slide, step };
  }
  if (parts[0] === "features") return { page: "features" };
  if (SCENARIOS.some((s) => s.id === parts[0])) return { page: "scenario", id: parts[0] };
  return { page: "intro", slide: 0, step: 0 };
}

function go(hash: string) {
  location.hash = hash;
}

/** Scenario id, or null for the feature grid. */
export function navigate(id: string | null) {
  go(id ? `/${id}` : "/features");
}

export function navigateIntro(slide: number, step: number) {
  go(`/intro/${slide + 1}/${step}`);
}
