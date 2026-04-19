import { useEffect, useState } from "react";
import Aurora, { SAMVAAD_AURORA_STOPS } from "./Aurora.jsx";

/**
 * Fixed full-viewport aurora (black → navy → sapphire).
 */
export default function AuroraBackdrop() {
  const [allowMotion, setAllowMotion] = useState(true);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setAllowMotion(!mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  if (!allowMotion) return null;

  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 z-0 print:hidden"
      style={{ contain: "strict" }}
    >
      <Aurora
        amplitude={0.88}
        blend={0.48}
        colorStops={SAMVAAD_AURORA_STOPS}
        speed={0.52}
      />
    </div>
  );
}
