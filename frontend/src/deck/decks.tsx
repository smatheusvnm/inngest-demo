import type { ComponentType } from "react";
import { ChecklistSlide } from "./debug/ChecklistSlide";
import { CorrelationSlide } from "./debug/CorrelationSlide";
import { DebugTitleSlide } from "./debug/DebugTitleSlide";
import { FailureSlide } from "./debug/FailureSlide";
import { FlowSlide } from "./debug/FlowSlide";
import { GotchasSlide } from "./debug/GotchasSlide";
import { McpSlide } from "./debug/McpSlide";
import { OutcomesSlide } from "./debug/OutcomesSlide";
import { CodeSlide } from "./slides/CodeSlide";
import { EventsSlide } from "./slides/EventsSlide";
import { RoutingSlide } from "./slides/RoutingSlide";
import { StepsSlide } from "./slides/StepsSlide";
import { TitleSlide } from "./slides/TitleSlide";

export interface Slide {
  title: string;
  /** Number of animation steps (presses of →) on this slide. */
  steps: number;
  component: ComponentType<{ step: number }>;
}

export interface DeckDefinition {
  id: string;
  title: string;
  summary: string;
  slides: Slide[];
  exit: { label: string; hash: string };
}

export const DECKS: DeckDefinition[] = [
  {
    id: "intro",
    title: "Why Inngest",
    summary: "Events, routing, durable steps and the code, then the live feature demo.",
    exit: { label: "Skip to demo", hash: "/features" },
    slides: [
      { title: "Inngest", steps: 1, component: TitleSlide },
      { title: "Events come from anywhere", steps: 5, component: EventsSlide },
      { title: "Inngest routes events to functions", steps: 4, component: RoutingSlide },
      { title: "A function is a list of steps", steps: 7, component: StepsSlide },
      { title: "Three building blocks", steps: 5, component: CodeSlide },
    ],
  },
  {
    id: "debug",
    title: "When a run goes wrong",
    summary: "How a sync run executes, and how to debug it with the Inngest MCP and Sentry.",
    exit: { label: "All decks", hash: "/" },
    slides: [
      { title: "When a run goes wrong", steps: 1, component: DebugTitleSlide },
      { title: "The flow", steps: 5, component: FlowSlide },
      { title: "One failure, isolated", steps: 5, component: FailureSlide },
      { title: "Not every stop is a failure", steps: 5, component: OutcomesSlide },
      { title: "Follow the run id", steps: 5, component: CorrelationSlide },
      { title: "Ask the Inngest MCP", steps: 4, component: McpSlide },
      { title: "Gotchas", steps: 6, component: GotchasSlide },
      { title: "Checklist", steps: 1, component: ChecklistSlide },
    ],
  },
];
