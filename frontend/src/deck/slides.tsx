import type { ComponentType } from "react";
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

export const SLIDES: Slide[] = [
  { title: "Inngest", steps: 1, component: TitleSlide },
  { title: "Events come from anywhere", steps: 5, component: EventsSlide },
  { title: "Inngest routes events to functions", steps: 4, component: RoutingSlide },
  { title: "A function is a list of steps", steps: 7, component: StepsSlide },
  { title: "Three building blocks", steps: 5, component: CodeSlide },
];
