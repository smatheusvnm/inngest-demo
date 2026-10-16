import { useEffect, useState } from "react";
import { getLogs, type LogEntry } from "../api";

const MAX_ENTRIES = 500;

/** Polls the backend's in-memory activity log every second. */
export function useActivityLog(): LogEntry[] {
  const [entries, setEntries] = useState<LogEntry[]>([]);

  useEffect(() => {
    let lastId = 0;
    let stopped = false;

    const poll = async () => {
      try {
        const fresh = await getLogs(lastId);
        if (stopped || fresh.length === 0) return;
        lastId = fresh[fresh.length - 1].id;
        setEntries((all) => [...all, ...fresh].slice(-MAX_ENTRIES));
      } catch {
        // App reloading: try again on the next tick.
      }
    };

    poll();
    const timer = setInterval(poll, 1000);
    return () => {
      stopped = true;
      clearInterval(timer);
    };
  }, []);

  return entries;
}
