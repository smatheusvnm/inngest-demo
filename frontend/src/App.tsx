import { useEffect, useState } from "react";
import { ScenarioGrid } from "./components/ScenarioGrid";
import { ScenarioView } from "./components/ScenarioView";
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

  const index = SCENARIOS.findIndex((s) => s.id === route);

  return (
    <>
      {index === -1 ? (
        <ScenarioGrid />
      ) : (
        // key: remount per scenario so editors and log cutoff start fresh.
        <ScenarioView key={route} index={index} log={log} />
      )}
      <Toaster />
    </>
  );
}
