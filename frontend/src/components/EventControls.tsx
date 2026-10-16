import { Loader2, Send } from "lucide-react";
import { useEffect, useState } from "react";
import { getRuns, getShippingBroken, sendEvent, setShippingBroken } from "../api";
import type { EventData, Scenario, ScenarioButton } from "../scenarios";
import { toast } from "../toast";

const BUTTON_STYLES = {
  primary: "bg-indigo-500 text-white hover:bg-indigo-400",
  secondary: "bg-zinc-800 text-zinc-100 hover:bg-zinc-700",
  danger: "bg-rose-600 text-white hover:bg-rose-500",
};

export function EventControls({ scenario }: { scenario: Scenario }) {
  const [json, setJson] = useState(() => JSON.stringify(scenario.data, null, 2));
  const [busy, setBusy] = useState<string | null>(null);
  const [output, setOutput] = useState<string | null>(null);

  let parsed: EventData | null = null;
  try {
    parsed = JSON.parse(json || "{}");
  } catch {
    parsed = null;
  }

  async function onClick(btn: ScenarioButton) {
    if (!parsed && !btn.data && !btn.sequence) return;
    const name = btn.event ?? scenario.event;
    const batches = btn.sequence ?? [{ data: btn.data ?? parsed!, count: btn.count ?? 1 }];
    setBusy(btn.label);
    try {
      const ids: string[] = [];
      for (const b of batches) ids.push(...(await sendEvent(name, b.data, b.count)));
      toast(`Sent ${ids.length} × ${name}`);
      if (btn.showOutput) await pollOutput(ids[0], setOutput);
    } catch (err) {
      toast((err as Error).message, true);
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="mt-4 flex flex-col gap-3">
      <label className="flex flex-col gap-1.5">
        <span className="flex items-center justify-between text-xs font-medium uppercase tracking-wider text-zinc-500">
          Event
          <code className="font-mono text-[0.8rem] normal-case tracking-normal text-indigo-300">
            {scenario.event}
          </code>
        </span>
        <textarea
          value={json}
          onChange={(e) => setJson(e.target.value)}
          spellCheck={false}
          rows={json.split("\n").length}
          className={`w-full resize-y rounded-lg border bg-zinc-950 px-3 py-2 font-mono text-sm leading-relaxed text-zinc-200 outline-none transition focus:border-indigo-500 ${
            parsed ? "border-zinc-800" : "border-rose-500"
          }`}
        />
        {!parsed && <span className="text-xs text-rose-400">Invalid JSON</span>}
      </label>

      {scenario.typing && <TypingInput scenario={scenario} data={parsed} />}

      <div className="flex flex-wrap items-center gap-2">
        {scenario.buttons.map((btn) => (
          <button
            key={btn.label}
            onClick={() => onClick(btn)}
            disabled={busy !== null || (!parsed && !btn.data && !btn.sequence)}
            className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium shadow-sm transition active:scale-[0.98] disabled:opacity-50 ${
              BUTTON_STYLES[btn.variant ?? "primary"]
            }`}
          >
            {busy === btn.label ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Send className="size-4" />
            )}
            {btn.label}
          </button>
        ))}
        {scenario.toggle && <ShippingToggle />}
      </div>

      {output !== null && (
        <pre className="max-h-64 overflow-auto rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-3 font-mono text-sm text-emerald-100">
          {output}
        </pre>
      )}
    </div>
  );
}

/** Poll the Inngest REST API (via our backend) until the run ends, then show its output. */
async function pollOutput(eventId: string, show: (text: string) => void) {
  show("Waiting for the run to finish…");
  for (let i = 0; i < 30; i++) {
    await new Promise((r) => setTimeout(r, 1000));
    const runs = await getRuns(eventId).catch(() => []);
    const run = runs[0];
    if (run && ["Completed", "Failed", "Cancelled"].includes(run.status)) {
      show(`// status: ${run.status}\n${JSON.stringify(run.output, null, 2)}`);
      return;
    }
  }
  show("The run did not finish within 30s. Check the Dev UI.");
}

function TypingInput({ scenario, data }: { scenario: Scenario; data: EventData | null }) {
  const [text, setText] = useState("");
  const [sent, setSent] = useState(0);

  function onChange(value: string) {
    setText(value);
    sendEvent(scenario.event, { ...(data ?? {}), query: value })
      .then(() => setSent((n) => n + 1))
      .catch((err) => toast(err.message, true));
  }

  return (
    <label className="flex flex-col gap-1.5">
      <span className="flex items-center justify-between text-xs font-medium uppercase tracking-wider text-zinc-500">
        Search box (1 event per keystroke)
        <span className="font-mono normal-case tracking-normal text-zinc-400">
          {sent} event{sent === 1 ? "" : "s"} sent
        </span>
      </span>
      <input
        value={text}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Type something, e.g. running shoes"
        className="w-full rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2.5 text-base outline-none transition focus:border-indigo-500"
      />
    </label>
  );
}

function ShippingToggle() {
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    getShippingBroken().then(setEnabled).catch(() => {});
  }, []);

  async function toggle() {
    const value = !enabled;
    setEnabled(value);
    try {
      await setShippingBroken(value);
      toast(`Shipping ${value ? "broken: ship-order will fail" : "fixed: next retry succeeds"}`);
    } catch (err) {
      setEnabled(!value);
      toast((err as Error).message, true);
    }
  }

  return (
    <button
      role="switch"
      aria-checked={enabled}
      onClick={toggle}
      className={`ml-auto inline-flex items-center gap-2.5 rounded-lg border px-3 py-2 text-sm font-medium transition ${
        enabled
          ? "border-rose-500/50 bg-rose-500/10 text-rose-200"
          : "border-zinc-800 bg-zinc-900 text-zinc-300 hover:border-zinc-700"
      }`}
    >
      <span
        className={`relative h-5 w-9 rounded-full transition ${enabled ? "bg-rose-500" : "bg-zinc-700"}`}
      >
        <span
          className={`absolute top-0.5 size-4 rounded-full bg-white transition-all ${
            enabled ? "left-[1.125rem]" : "left-0.5"
          }`}
        />
      </span>
      Shipping broken
    </button>
  );
}
