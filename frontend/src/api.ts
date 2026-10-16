import type { EventData } from "./scenarios";

export interface LogEntry {
  id: number;
  ts: number;
  function: string;
  message: string;
  run_id: string | null;
}

export interface Run {
  run_id: string;
  status: string;
  output: unknown;
}

export interface Source {
  module: string;
  path: string;
  code: string;
}

async function request<T>(method: string, path: string, body?: unknown): Promise<T> {
  const resp = await fetch(path, {
    method,
    headers: body === undefined ? {} : { "content-type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  if (!resp.ok) {
    const payload = await resp.json().catch(() => ({}));
    const detail = payload.detail ?? resp.statusText;
    throw new Error(typeof detail === "string" ? detail : JSON.stringify(detail));
  }
  return (resp.status === 204 ? null : await resp.json()) as T;
}

export async function sendEvent(name: string, data: EventData, count = 1): Promise<string[]> {
  const { ids } = await request<{ ids: string[] }>("POST", "/api/events", { name, data, count });
  return ids;
}

export const getLogs = (after: number) => request<LogEntry[]>("GET", `/api/logs?after=${after}`);

export const getShippingBroken = () =>
  request<{ enabled: boolean }>("GET", "/api/toggles/shipping-broken").then((r) => r.enabled);

export const setShippingBroken = (enabled: boolean) =>
  request("PUT", "/api/toggles/shipping-broken", { enabled });

export const getRuns = (eventId: string) =>
  request<{ data: Run[] | null }>("GET", `/api/events/${eventId}/runs`).then((r) => r.data ?? []);

export const getSource = (module: string) => request<Source>("GET", `/api/source/${module}`);

/** Dev UI lives next to the app: app.localhost[:port] -> inngest.localhost[:port]. */
export const DEV_UI_URL: string =
  import.meta.env.VITE_DEV_UI_URL ??
  (location.hostname.startsWith("app.")
    ? `${location.protocol}//${location.host.replace(/^app\./, "inngest.")}`
    : "https://inngest.localhost");
