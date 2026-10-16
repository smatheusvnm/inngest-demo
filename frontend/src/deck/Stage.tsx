import { useLayoutEffect, useRef, useState, type ReactNode } from "react";

export const STAGE_W = 1280;
export const STAGE_H = 720;

/**
 * A fixed 1280×720 canvas scaled to fit its container (letterboxed), so every
 * slide looks the same on a laptop, a big monitor or a shared screen.
 */
export function Stage({ children }: { children: ReactNode }) {
  const box = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);

  useLayoutEffect(() => {
    const el = box.current;
    if (!el) return;
    const fit = () =>
      setScale(Math.min(el.clientWidth / STAGE_W, el.clientHeight / STAGE_H));
    fit();
    const observer = new ResizeObserver(fit);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={box} className="relative flex min-h-0 flex-1 items-center justify-center overflow-hidden">
      <div
        className="relative shrink-0 overflow-hidden"
        style={{ width: STAGE_W, height: STAGE_H, transform: `scale(${scale})` }}
      >
        {children}
      </div>
    </div>
  );
}
