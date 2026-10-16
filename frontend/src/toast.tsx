import { CheckCircle2, XCircle } from "lucide-react";
import { useEffect, useState } from "react";

interface Toast {
  id: number;
  message: string;
  error: boolean;
}

const EVENT = "demo-toast";
let nextId = 1;

/** Show a short notification from anywhere. */
export function toast(message: string, error = false) {
  window.dispatchEvent(new CustomEvent<Toast>(EVENT, { detail: { id: nextId++, message, error } }));
}

export function Toaster() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  useEffect(() => {
    const onToast = (e: Event) => {
      const t = (e as CustomEvent<Toast>).detail;
      setToasts((all) => [...all.slice(-2), t]);
      setTimeout(() => setToasts((all) => all.filter((x) => x.id !== t.id)), 3500);
    };
    window.addEventListener(EVENT, onToast);
    return () => window.removeEventListener(EVENT, onToast);
  }, []);

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-4 z-50 flex flex-col items-center gap-2 px-4">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`flex max-w-lg items-center gap-2 rounded-lg border px-4 py-2.5 text-sm shadow-xl backdrop-blur ${
            t.error
              ? "border-red-500/40 bg-red-950/90 text-red-100"
              : "border-zinc-700 bg-zinc-900/95 text-zinc-100"
          }`}
        >
          {t.error ? (
            <XCircle className="size-4 shrink-0 text-red-400" />
          ) : (
            <CheckCircle2 className="size-4 shrink-0 text-emerald-400" />
          )}
          <span className="break-words">{t.message}</span>
        </div>
      ))}
    </div>
  );
}
