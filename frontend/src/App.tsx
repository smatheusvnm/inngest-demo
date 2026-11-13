import { useEffect, useState } from "react";
import { ScenarioGrid } from "./components/ScenarioGrid";
import { ScenarioView } from "./components/ScenarioView";
import { Deck } from "./deck/Deck";
import { DeckPicker } from "./deck/DeckPicker";
import { DECKS } from "./deck/decks";
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
  if (route.page === "decks") {
    screen = <DeckPicker />;
  } else if (route.page === "deck") {
    const deck = DECKS.find((d) => d.id === route.deckId)!;
    screen = <Deck key={deck.id} deck={deck} slide={route.slide} step={route.step} />;
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
