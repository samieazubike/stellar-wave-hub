"use client";

import {useCallback, useEffect, useState} from "react";
import {MAX_RETRY_AFTER_SECONDS} from "./retry-after.mjs";

export function useRetryCountdown() {
  const [deadline, setDeadline] = useState<number | null>(null);
  const [remainingSeconds, setRemainingSeconds] = useState(0);

  useEffect(() => {
    if (deadline === null) return;

    const update = () => {
      const remaining = Math.max(0, Math.ceil((deadline - Date.now()) / 1000));
      setRemainingSeconds(remaining);
      if (remaining === 0) setDeadline(null);
    };

    const timer = window.setInterval(update, 1000);
    return () => window.clearInterval(timer);
  }, [deadline]);

  const start = useCallback((seconds: number | null) => {
    const duration = typeof seconds === "number" && Number.isFinite(seconds)
      ? Math.min(MAX_RETRY_AFTER_SECONDS, Math.max(0, Math.ceil(seconds)))
      : 0;
    if (duration === 0) {
      setDeadline(null);
      setRemainingSeconds(0);
      return;
    }
    setRemainingSeconds(duration);
    setDeadline(Date.now() + duration * 1000);
  }, []);

  const clear = useCallback(() => {
    setDeadline(null);
    setRemainingSeconds(0);
  }, []);

  return {remainingSeconds, start, clear};
}
