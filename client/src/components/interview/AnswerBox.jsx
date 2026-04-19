import { useState } from "react";
import { FaMicrophone, FaStop } from "react-icons/fa";
import { useVoiceInput } from "../../hooks/useVoiceInput";

function AnswerBox({
  isEvaluating,
  isFollowUp = false,
  onSubmit,
  placeholder,
  questionNumber,
  totalQuestions,
}) {
  const [text, setText] = useState("");

  const { error, interimTranscript, isListening, isSupported, toggleListening } =
    useVoiceInput({
      onTranscript: (chunk) => {
        setText((current) => `${current} ${chunk}`.trim());
      },
    });

  const handleSubmit = () => {
    if (!text.trim()) return;
    onSubmit(text.trim());
    setText("");
  };

  const wordCount = text.trim() ? text.trim().split(/\s+/).length : 0;
  const charCount = text.length;

  return (
    <div className="space-y-4">
      <div className="interview-panel rounded-[1.9rem] p-5">
        <div
          className="flex flex-wrap items-center justify-between gap-3 border-b pb-4"
          style={{ borderColor: "var(--interview-border)" }}
        >
          <div>
            <h3 className="font-display mt-2 text-2xl font-semibold text-white">
              {isFollowUp ? "Refine your answer" : "Build your response"}
            </h3>
          </div>
          <div className="flex flex-wrap gap-2 text-[11px] uppercase tracking-[0.22em]">
            {questionNumber && totalQuestions ? (
              <span className="interview-chip rounded-full px-3 py-1.5">
                Q{questionNumber} of {totalQuestions}
              </span>
            ) : null}
          </div>
        </div>

        <div
          className="mt-4 rounded-[1.6rem] border bg-slate-950/80 p-4 shadow-[0_8px_32px_rgba(0,0,0,0.25)]"
          style={{ borderColor: "var(--interview-border)" }}
        >
          <textarea
            className="min-h-64 w-full resize-none bg-transparent text-sm leading-7 text-white outline-none placeholder:text-slate-500"
            onChange={(event) => setText(event.target.value)}
            placeholder={
              placeholder || "Type your answer here, or use voice input to dictate it live."
            }
            value={text}
          />
          <div
            className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t pt-3 text-xs text-slate-400"
            style={{ borderColor: "rgba(255,255,255,0.08)" }}
          >
            <span>{wordCount} words</span>
            <span>{charCount} characters</span>
          </div>
          {interimTranscript && (
            <p
              className="mt-3 rounded-2xl border px-3 py-2 text-xs italic text-slate-100"
              style={{
                borderColor: "var(--interview-border)",
                backgroundColor:
                  "color-mix(in srgb, var(--interview-accent) 10%, rgba(7,12,24,0.75))",
              }}
            >
              Listening: {interimTranscript}
            </p>
          )}
        </div>

        {error && <p className="mt-4 text-xs text-amber-300/95">{error}</p>}

        <div className="mt-5 flex flex-wrap items-center gap-3">
          <button
            className={`inline-flex items-center gap-2 rounded-full border px-4 py-2.5 text-sm transition ${
              isListening
                ? "text-white shadow-[0_12px_28px_rgba(0,0,0,0.25)]"
                : "bg-slate-950/70 text-slate-100 hover:text-white"
            }`}
            disabled={!isSupported}
            onClick={toggleListening}
            style={{
              borderColor: "var(--interview-border)",
              backgroundColor: isListening
                ? "color-mix(in srgb, var(--interview-accent) 18%, rgba(5,10,22,0.84))"
                : undefined,
            }}
            type="button"
          >
            {isListening ? <FaStop size={12} /> : <FaMicrophone size={12} />}
            {isSupported ? (isListening ? "Stop voice" : "Use voice") : "Voice unavailable"}
          </button>

          <button
            className="rounded-full border bg-slate-950/70 px-4 py-2.5 text-sm text-slate-100 shadow-sm transition hover:text-white"
            onClick={() => setText("")}
            style={{ borderColor: "var(--interview-border)" }}
            type="button"
          >
            Clear
          </button>

          <button
            className="rounded-full px-5 py-2.5 text-sm font-semibold text-white shadow-[0_12px_28px_rgba(0,0,0,0.25)] transition disabled:cursor-not-allowed disabled:opacity-40"
            disabled={!text.trim() || isEvaluating}
            onClick={handleSubmit}
            style={{
              background:
                "linear-gradient(120deg, var(--interview-accent) 0%, color-mix(in srgb, var(--interview-accent-soft) 84%, white 16%) 100%)",
            }}
            type="button"
          >
            {isEvaluating ? "Evaluating..." : isFollowUp ? "Submit follow-up" : "Submit answer"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default AnswerBox;
