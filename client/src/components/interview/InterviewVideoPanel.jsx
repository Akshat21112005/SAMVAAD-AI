import { useState } from "react";
import frontFacingVideo from "../../assets/videos/Front_Facing.mp4";

function InterviewVideoPanel({ theme, title = "Interview stream", subtitle = "Live presence" }) {
  const [videoFailed, setVideoFailed] = useState(false);

  return (
    <div className="interview-panel overflow-hidden rounded-[1.7rem]">
      <div className="border-b px-5 py-4" style={{ borderColor: "var(--interview-border)" }}>
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-[10px] uppercase tracking-[0.3em] text-slate-400">{subtitle}</p>
            <h3 className="font-display mt-2 text-xl font-semibold text-white">{title}</h3>
          </div>
          <div className="flex items-center gap-2 rounded-full border px-3 py-1.5 text-[10px] uppercase tracking-[0.24em] text-slate-200"
            style={{
              borderColor: "var(--interview-border)",
              backgroundColor: "color-mix(in srgb, var(--interview-accent) 12%, rgba(5,10,22,0.76))",
            }}
          >
            <span
              className="h-2 w-2 rounded-full"
              style={{ backgroundColor: theme?.accent || "var(--interview-accent)" }}
            />
            interviewer live
          </div>
        </div>
      </div>

      <div className="relative aspect-video bg-gradient-to-br from-slate-950 via-slate-950 to-black">
        {videoFailed ? (
          <div className="flex h-full min-h-[200px] flex-col items-center justify-center gap-2 px-6 text-center">
            <p className="text-sm font-medium text-white">Video failed to load</p>
            <p className="text-xs text-slate-300/70">
              Expected <code className="rounded bg-slate-900/90 px-1.5 py-0.5 text-[11px]">src/assets/videos/Front_Facing.mp4</code>
            </p>
          </div>
        ) : (
          <video
            autoPlay
            className="h-full w-full object-cover opacity-95"
            loop
            muted
            onError={() => setVideoFailed(true)}
            playsInline
            src={frontFacingVideo}
          />
        )}
        {!videoFailed && (
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-black/15" />
        )}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/15 to-transparent px-5 pb-5 pt-12">
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="text-[10px] uppercase tracking-[0.28em] text-slate-300/65">
                {theme?.interviewerRole || "AI interviewer"}
              </p>
              <p className="mt-2 font-display text-2xl font-semibold text-white">
                {theme?.interviewerName || "SAMVAAD interviewer"}
              </p>
            </div>
            <div
              className="rounded-full border px-3 py-1.5 text-[10px] uppercase tracking-[0.25em] text-white/85"
              style={{
                borderColor: "rgba(255,255,255,0.18)",
                backgroundColor: "rgba(255,255,255,0.08)",
              }}
            >
              camera ready
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default InterviewVideoPanel;
