import { useEffect, useState } from "react";
import { ScenarioGrid } from "./components/ScenarioGrid";
import { ScenarioView } from "./components/ScenarioView";
import { Deck } from "./deck/Deck";
import { useActivityLog } from "./hooks/useActivityLog";
import { readRoute } from "./router";
import { SCENARIOS } from "./scenarios";
import { Toaster } from "./toast";

export default function App() {
  const [route, setRoute] = useState(readRoute);
  const log = useActivityLog();

  useEffect(() => {
    const onHash = () => setRoute(readRoute());
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);

  let screen;
  if (route.page === "intro") {
    screen = <Deck slide={route.slide} step={route.step} />;
  } else if (route.page === "features") {
    screen = <ScenarioGrid />;
  } else {
    const index = SCENARIOS.findIndex((s) => s.id === route.id);
    // key: remount per scenario so editors and log cutoff start fresh.
    screen = <ScenarioView key={route.id} index={index} log={log} />;
  }

  return (
    <>
      {screen}
      <Toaster />
    </>
  );
}
