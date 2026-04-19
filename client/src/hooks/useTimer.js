import { useEffect, useMemo, useRef, useState } from "react";

/**
 * Countdown timer with blueprint-style phases:
 * safe (>50% left), warning (25–50%), danger (<25%, not last minute), alarm (≤60s), end (0).
 */
export const useTimer = ({ duration, active = true, onComplete }) => {
  const [timeLeft, setTimeLeft] = useState(duration);
  const onCompleteRef = useRef(onComplete);

  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  useEffect(() => {
    setTimeLeft(duration);
  }, [duration]);

  useEffect(() => {
    if (!active) return undefined;

    const id = window.setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          window.clearInterval(id);
          onCompleteRef.current?.();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => window.clearInterval(id);
  }, [active, duration]);

  const progress = useMemo(() => {
    if (!duration) return 0;
    return Math.max(0, Math.min(100, (timeLeft / duration) * 100));
  }, [duration, timeLeft]);

  const phase = useMemo(() => {
    if (timeLeft <= 0) return "end";
    if (timeLeft <= 60) return "alarm";
    const ratio = duration ? timeLeft / duration : 0;
    if (ratio > 0.5) return "safe";
    if (ratio > 0.25) return "warning";
    return "danger";
  }, [duration, timeLeft]);

  return { progress, setTimeLeft, timeLeft, phase };
};
