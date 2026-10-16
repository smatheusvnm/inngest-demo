import { SCENARIOS } from "./scenarios";

/** "#/concurrency" -> "concurrency"; anything else -> null (the grid). */
export function readRoute(): string | null {
  const id = location.hash.replace(/^#\/?/, "");
  return SCENARIOS.some((s) => s.id === id) ? id : null;
}

export function navigate(id: string | null) {
  location.hash = id ? `/${id}` : "/";
}
