import {
  Ban,
  Boxes,
  Crown,
  FileOutput,
  Fingerprint,
  Gauge,
  Hourglass,
  Layers,
  type LucideIcon,
  RotateCcw,
  Share2,
  Siren,
  Timer,
  TimerReset,
  Waves,
} from "lucide-react";

export type EventData = Record<string, unknown>;

export interface ScenarioButton {
  label: string;
  /** Overrides the scenario's event name (e.g. the "Cancel" button). */
  event?: string;
  /** Overrides the JSON from the editor. */
  data?: EventData;
  count?: number;
  /** Send several batches in order (used by the priority demo). */
  sequence?: { data: EventData; count: number }[];
  /** After sending, poll the run and show its output. */
  showOutput?: boolean;
  variant?: "primary" | "secondary" | "danger";
}

export interface Scenario {
  id: string;
  title: string;
  tagline: string;
  icon: LucideIcon;
  /** What the feature is, in one or two sentences. */
  description: string;
  /** What the audience should look for in the log. */
  watch: string;
  event: string;
  data: EventData;
  buttons: ScenarioButton[];
  /** File name in app/functions/ (without .py). */
  module: string;
  /** Function names whose log lines belong to this scenario. */
  logFunctions: string[];
  /** Show the "shipping broken" switch (replay demo). */
  toggle?: boolean;
  /** Show a text box that sends one event per keystroke (debounce demo). */
  typing?: boolean;
}

export const SCENARIOS: Scenario[] = [
  {
    id: "fan-out",
    title: "Fan-out",
    tagline: "One event, many functions",
    icon: Share2,
    description:
      "Two functions listen to the same event. Inngest starts one independent run per function: each retries, fails and scales on its own.",
    watch: "One event produces two log lines from two different functions.",
    event: "demo/order.created",
    data: { order_id: "ord_123", total: 99.9 },
    buttons: [{ label: "Send event" }],
    module: "fan_out",
    logFunctions: ["send-confirmation-email", "update-inventory"],
  },
  {
    id: "concurrency",
    title: "Concurrency",
    tagline: "Limit parallel runs",
    icon: Layers,
    description:
      "concurrency=[Concurrency(limit=2)] caps how many runs execute at the same time. Extra runs wait in the queue; nothing is lost.",
    watch: "Never more than 2 videos “started” without a “finished” in between.",
    event: "demo/video.encode",
    data: { video_id: "vid_42" },
    buttons: [{ label: "Send 6×", count: 6 }],
    module: "concurrency",
    logFunctions: ["encode-video"],
  },
  {
    id: "replay",
    title: "Partial replay",
    tagline: "Steps run exactly once",
    icon: RotateCcw,
    description:
      "Each step.run result is saved. When a later step fails, Inngest re-invokes the handler but completed steps return their saved result instantly, so only the failing step runs again.",
    watch:
      "Turn on “shipping broken” and send. “Handler invoked” repeats, but charge-payment runs once. Turn the switch off and the order ships.",
    event: "demo/order.process",
    data: { order_id: "ord_777" },
    buttons: [{ label: "Send event" }],
    module: "replay",
    logFunctions: ["process-order"],
    toggle: true,
  },
  {
    id: "debounce",
    title: "Debounce",
    tagline: "Run once after a pause",
    icon: Waves,
    description:
      "Every keystroke sends an event. Debounce restarts a 3s timer per user on each event, then runs once with the latest one.",
    watch: "Type a word: many events, one search with the full text 3s after you stop.",
    event: "demo/search.typed",
    data: { user_id: "user_1" },
    buttons: [],
    module: "debounce",
    logFunctions: ["search-products"],
    typing: true,
  },
  {
    id: "idempotency",
    title: "Idempotency",
    tagline: "No duplicate processing",
    icon: Fingerprint,
    description:
      "idempotency=\"event.data.payment_id\" ignores any event whose key was already seen in the last 24 hours.",
    watch: "Three identical payment events, one charge. Change payment_id to charge again.",
    event: "demo/payment.requested",
    data: { payment_id: "pay_001", amount: 50 },
    buttons: [{ label: "Send same payment 3×", count: 3 }],
    module: "idempotency",
    logFunctions: ["charge-payment-once"],
  },
  {
    id: "on-failure",
    title: "on_failure",
    tagline: "React when retries run out",
    icon: Siren,
    description:
      "Failed steps are retried automatically. When every retry fails, the on_failure handler runs: a good place for alerts or compensation.",
    watch: "Two failed attempts (3s apart), then “Alert sent to on-call”.",
    event: "demo/risky.task",
    data: { task_id: "task_9" },
    buttons: [{ label: "Send event", variant: "danger" }],
    module: "on_failure",
    logFunctions: ["risky-task"],
  },
  {
    id: "output",
    title: "Output",
    tagline: "Stored return values",
    icon: FileOutput,
    description:
      "Step results and the function's return value are stored by Inngest. You can read them in the Dev UI or through the REST API, as this card does.",
    watch: "The report JSON appears below once the run completes.",
    event: "demo/report.generate",
    data: { month: "2026-10" },
    buttons: [{ label: "Generate report", showOutput: true }],
    module: "output",
    logFunctions: ["generate-report"],
  },
  {
    id: "rate-limit",
    title: "Rate limit",
    tagline: "Drop excess events",
    icon: Ban,
    description:
      "rate_limit allows at most 1 run per user every 10s. Events over the limit are dropped: they never run.",
    watch: "Five notifications sent, only one delivered. Compare with Throttle.",
    event: "demo/notification.send",
    data: { user_id: "user_1" },
    buttons: [{ label: "Send 5×", count: 5 }],
    module: "rate_limit",
    logFunctions: ["send-notification"],
  },
  {
    id: "throttle",
    title: "Throttle",
    tagline: "Queue and pace runs",
    icon: Gauge,
    description:
      "throttle starts at most 1 run every 5s. Unlike rate limit, extra events are queued and run later: nothing is dropped.",
    watch: "All five calls happen, about 5s apart (the first two may start together).",
    event: "demo/api.sync",
    data: { resource: "contacts" },
    buttons: [{ label: "Send 5×", count: 5 }],
    module: "throttle",
    logFunctions: ["sync-external-api"],
  },
  {
    id: "priority",
    title: "Priority",
    tagline: "Important work first",
    icon: Crown,
    description:
      "With one ticket handled at a time, a queue builds up. The priority expression moves enterprise tickets 600s ahead in that queue.",
    watch: "The enterprise ticket is handled before the free tickets still waiting.",
    event: "demo/ticket.created",
    data: { plan: "free" },
    buttons: [
      {
        label: "5 free, then 1 enterprise",
        sequence: [
          { data: { plan: "free" }, count: 5 },
          { data: { plan: "enterprise" }, count: 1 },
        ],
      },
    ],
    module: "priority",
    logFunctions: ["handle-ticket"],
  },
  {
    id: "singleton",
    title: "Singleton",
    tagline: "One run per key",
    icon: Boxes,
    description:
      "singleton keeps a single active run per account. In “skip” mode new events are ignored while one runs; “cancel” mode would replace it.",
    watch: "Three sync requests, one sync. Send again after it finishes and it runs.",
    event: "demo/account.sync",
    data: { account_id: "acc_1" },
    buttons: [{ label: "Send 3×", count: 3 }],
    module: "singleton",
    logFunctions: ["sync-account"],
  },
  {
    id: "timeouts",
    title: "Timeouts",
    tagline: "Cancel slow runs",
    icon: Hourglass,
    description:
      "timeouts=Timeouts(finish=10s) cancels any run still going 10s after it started. start= would limit time spent waiting in the queue.",
    watch: "3s finishes normally. 15s is cancelled at the 10s mark.",
    event: "demo/slow.task",
    data: { seconds: 3 },
    buttons: [
      { label: "3s (completes)", data: { seconds: 3 } },
      { label: "15s (times out)", data: { seconds: 15 }, variant: "danger" },
    ],
    module: "timeouts",
    logFunctions: ["slow-task"],
  },
  {
    id: "batch",
    title: "Batch",
    tagline: "Many events, one run",
    icon: Timer,
    description:
      "batch_events collects up to 5 events per run, or whatever arrived 5s after the first one. Great for bulk inserts.",
    watch: "Twelve page views stored in three runs: 5, 5 and 2.",
    event: "demo/page.viewed",
    data: { page: "/pricing" },
    buttons: [{ label: "Send 12×", count: 12 }],
    module: "batch",
    logFunctions: ["track-page-views"],
  },
  {
    id: "cancellation",
    title: "Cancellation",
    tagline: "Stop runs with an event",
    icon: TimerReset,
    description:
      "The reminder sleeps 30s before sending. A demo/reminder.cancelled event with the same reminder_id cancels the run while it sleeps.",
    watch: "Schedule, then Cancel: “Run cancelled” appears and the reminder is never sent.",
    event: "demo/reminder.scheduled",
    data: { reminder_id: "rem_1" },
    buttons: [
      { label: "Schedule" },
      { label: "Cancel", event: "demo/reminder.cancelled", variant: "danger" },
    ],
    module: "cancellation",
    logFunctions: ["send-reminder"],
  },
];
