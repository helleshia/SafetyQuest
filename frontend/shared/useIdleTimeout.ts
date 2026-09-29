import { useEffect, useRef, useState } from "react";

/** Minutes of inactivity before the session is closed. Matches IDLE_MINUTES on the
    server, which is the side that actually enforces it — this hook only makes the
    timeout visible instead of letting the next click fail with an expired session. */
export const IDLE_MINUTES = 5;
const WARN_SECONDS = 30;
const ACTIVITY = ["pointerdown", "keydown", "wheel", "touchstart", "scroll"] as const;

export function useIdleTimeout(active: boolean, onTimeout: () => void) {
  const [secondsLeft, setSecondsLeft] = useState<number | null>(null);
  const deadline = useRef(0);
  const fired = useRef(false);
  const timeout = useRef(onTimeout);
  timeout.current = onTimeout;

  useEffect(() => {
    if (!active) { setSecondsLeft(null); return; }

    fired.current = false;
    const reset = () => {
      deadline.current = Date.now() + IDLE_MINUTES * 60_000;
      setSecondsLeft(previous => (previous === null ? null : null));
    };
    reset();

    // `passive` keeps scrolling smooth; these listeners only note that time moved.
    for (const event of ACTIVITY) window.addEventListener(event, reset, { passive: true });
    // Coming back to a tab that slept past the deadline should sign out immediately.
    document.addEventListener("visibilitychange", check);

    const timer = window.setInterval(check, 1000);

    function check() {
      if (fired.current) return;
      const remaining = Math.ceil((deadline.current - Date.now()) / 1000);
      if (remaining <= 0) {
        fired.current = true;
        setSecondsLeft(null);
        timeout.current();
        return;
      }
      setSecondsLeft(remaining <= WARN_SECONDS ? remaining : null);
    }

    return () => {
      window.clearInterval(timer);
      for (const event of ACTIVITY) window.removeEventListener(event, reset);
      document.removeEventListener("visibilitychange", check);
    };
  }, [active]);

  return secondsLeft;
}
