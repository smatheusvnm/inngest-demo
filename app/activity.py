"""In-memory activity log shown in the UI, plus the toggle for the replay demo.

Everything lives in process memory, so restarting the app clears it. Fine for a demo.
"""

import itertools
import time
from collections import deque

_entries: deque[dict] = deque(maxlen=500)
# Start ids at the current time in ms so they keep growing across hot reloads,
# and the UI (which polls with the last id it saw) never misses new entries.
_ids = itertools.count(int(time.time() * 1000))
_shipping_broken = False


def log(function: str, message: str, run_id: str | None = None) -> None:
    """Record one line for the live activity panel."""
    _entries.append(
        {
            "id": next(_ids),
            "ts": time.time(),
            "function": function,
            "message": message,
            "run_id": run_id,
        }
    )


def since(after_id: int = 0) -> list[dict]:
    """Entries newer than `after_id` (the UI polls with the last id it has seen)."""
    return [entry for entry in _entries if entry["id"] > after_id]


def clear() -> None:
    _entries.clear()


def is_shipping_broken() -> bool:
    return _shipping_broken


def set_shipping_broken(enabled: bool) -> None:
    global _shipping_broken
    _shipping_broken = enabled
