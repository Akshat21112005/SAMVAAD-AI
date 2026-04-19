function formatTime(totalSeconds) {
  const minutes = Math.floor(totalSeconds / 60)
    .toString()
    .padStart(2, "0");
  const seconds = (totalSeconds % 60).toString().padStart(2, "0");
  return `${minutes}:${seconds}`;
}

const PHASE_LABEL = {
  safe: "On track",
  warning: "Pace check",
  danger: "Final stretch",
  alarm: "Last minute",
  end: "Time up",
};

const PHASE_TONE = {
  safe: "text-emerald-300",
  warning: "text-amber-300",
  danger: "text-orange-300",
  alarm: "text-red-300",
  end: "text-slate-300",
};

function InterviewTimer({ progress, timeLeft, phase = "safe", label = "Session timer" }) {
  const p = phase in PHASE_TONE ? phase : "safe";

  return (
    <div className="interview-panel-soft min-w-[178px] rounded-[1.6rem] px-4 py-3.5 shadow-[0_18px_42px_rgba(0,0,0,0.32)]">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[10px] uppercase tracking-[0.3em] text-slate-400">{label}</p>
          <p className={`mt-2 text-xs font-semibold uppercase tracking-[0.2em] ${PHASE_TONE[p]}`}>
            {PHASE_LABEL[p] || "Timer"}
          </p>
        </div>
        <span className="font-display text-2xl font-semibold tracking-[-0.06em] text-white">
          {formatTime(Math.max(0, timeLeft))}
        </span>
      </div>
      <div className="interview-progress-track mt-3 h-2.5 rounded-full">
        <div
          className={`interview-progress-fill h-full rounded-full transition-all duration-500 ${
            p === "alarm" ? "animate-pulse" : ""
          }`}
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}

export default InterviewTimer;
