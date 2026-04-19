import { useState } from "react";
import CodeEditor from "./CodeEditor";
import ProblemStatement from "./ProblemStatement";

const TABS = [
  ["description", "Description"],
  ["samples", "Samples"],
];

function consoleMessage(runResult) {
  if (!runResult) return "Run your solution against the hidden test suite.";
  const hint = runResult.executionHint ? `\n\n${runResult.executionHint}` : "";
  const head =
    runResult.verdict && runResult.verdictLabel
      ? `${runResult.verdictLabel} (${runResult.verdict})${
          runResult.stats?.total > 0
            ? ` | ${runResult.stats.passed}/${runResult.stats.total} tests`
            : ""
        }\n\n`
      : "";

  if (runResult.skipped) {
    return (
      head +
      (runResult.message || "This language or problem uses AI grading only on submit.") +
      hint
    );
  }

  if (runResult.compileError) {
    return (
      head +
      (runResult.stderr || runResult.error || runResult.message || "Build failed.") +
      hint +
      "\n\nTip: Install g++ (MinGW or MSVC build tools) and JDK 17+ on the machine running the API server for C++ and Java."
    );
  }

  if (runResult.error && (runResult.passed === 0 || runResult.passed == null)) {
    return head + String(runResult.error) + hint;
  }

  const passed = runResult.passed;
  const total = runResult.total;
  if (passed != null && total != null && total > 0) {
    if (passed === total) {
      return head + `Hidden suite: all ${total} tests passed.${hint}`;
    }
    return head + `Hidden suite: ${passed} of ${total} tests passed. Details are not shown.${hint}`;
  }

  return head + (runResult.stderr || "Finished.") + hint;
}

function DsaWorkspaceStudio({
  problem,
  language,
  onLanguageChange,
  languages,
  code,
  onCodeChange,
  onRun,
  onSubmit,
  isRunning,
  isSubmitting,
  runResult,
  roleLabel = "Software Engineer",
  theme,
}) {
  const [tab, setTab] = useState("description");

  return (
    <div className="grid gap-5 xl:grid-cols-[340px_minmax(0,1fr)]">
      <aside className="space-y-4">
        <div className="interview-panel rounded-[1.8rem] p-5">
          <p className="text-[10px] uppercase tracking-[0.3em] text-slate-400">Mission brief</p>
          <h2 className="font-display mt-3 text-2xl font-semibold text-white">{problem.title}</h2>
          <p className="mt-3 text-sm leading-7 text-slate-300/82">
            Solve for {roleLabel}. Prioritize correctness first, then make the complexity and edge
            case reasoning explicit.
          </p>
          <div className="mt-4 flex flex-wrap gap-2 text-[11px] uppercase tracking-[0.22em]">
            <span className="interview-chip rounded-full px-3 py-1.5">{problem.difficulty}</span>
            {problem.problemSource ? (
              <span className="interview-chip rounded-full px-3 py-1.5">
                {problem.problemSource}
              </span>
            ) : null}
            <span className="interview-chip rounded-full px-3 py-1.5">
              {theme?.interviewerName || "Judge Loop"}
            </span>
          </div>
        </div>

        <div className="interview-panel rounded-[1.8rem] overflow-hidden">
          <div
            className="flex border-b p-1 backdrop-blur-sm"
            style={{ borderColor: "var(--interview-border)" }}
          >
            {TABS.map(([id, label]) => (
              <button
                className={`flex-1 rounded-xl px-3 py-2.5 text-center text-xs font-semibold uppercase tracking-[0.14em] transition ${
                  tab === id
                    ? "text-white shadow-sm"
                    : "text-slate-300/72 hover:bg-slate-950/70 hover:text-white"
                }`}
                key={id}
                onClick={() => setTab(id)}
                style={
                  tab === id
                    ? {
                        background:
                          "linear-gradient(120deg, var(--interview-accent) 0%, color-mix(in srgb, var(--interview-accent-soft) 84%, white 16%) 100%)",
                      }
                    : undefined
                }
                type="button"
              >
                {label}
              </button>
            ))}
          </div>
          <div className="min-h-0 overflow-y-auto p-5">
            {tab === "description" && <ProblemStatement problem={problem} showTitle={false} />}
            {tab === "samples" && (
              <div className="space-y-5">
                <p className="text-xs uppercase tracking-[0.22em] interview-accent-text">
                  Problem samples only
                </p>
                <p className="text-sm leading-relaxed text-slate-300/78">
                  Official test vectors are hidden. Use the samples below to sanity-check your
                  understanding; <strong className="text-white">Run</strong> validates against the full
                  private suite on the server.
                </p>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="interview-panel-soft rounded-2xl p-4">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-400">
                      Sample input
                    </p>
                    <pre className="mt-2 overflow-x-auto whitespace-pre-wrap font-mono text-xs leading-6 text-slate-50">
                      {problem?.sampleInput}
                    </pre>
                  </div>
                  <div className="interview-panel-soft rounded-2xl p-4">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-400">
                      Sample output
                    </p>
                    <pre className="mt-2 overflow-x-auto whitespace-pre-wrap font-mono text-xs leading-6 text-slate-50">
                      {problem?.sampleOutput}
                    </pre>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="interview-panel-soft rounded-[1.6rem] px-4 py-4">
          <p className="text-[10px] uppercase tracking-[0.28em] text-slate-400">Evaluation focus</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {(theme?.scoreFocus || ["Correctness", "Complexity", "Communication"]).map((item) => (
              <span className="interview-chip rounded-full px-3 py-1.5 text-[11px]" key={item}>
                {item}
              </span>
            ))}
          </div>
        </div>
      </aside>

      <section className="interview-panel flex min-h-[420px] flex-col rounded-[1.9rem] p-3 lg:min-h-0">
        <div className="interview-panel-soft rounded-[1.45rem] px-4 py-3">
          <div className="flex flex-wrap items-center gap-2">
            <select
              className="rounded-full border bg-slate-950 px-3 py-2 text-xs font-medium text-white shadow-sm outline-none"
              onChange={(e) => onLanguageChange(e.target.value)}
              style={{ borderColor: "var(--interview-border)" }}
              value={language}
            >
              {languages.map((item) => (
                <option key={item} value={item}>
                  {item.toUpperCase()}
                </option>
              ))}
            </select>
            <span className="interview-chip rounded-full px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.16em]">
              Judge-backed hidden tests
            </span>
            <span
              className="rounded-full border px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-200/80"
              style={{
                borderColor: "rgba(255,255,255,0.1)",
                backgroundColor: "rgba(15,23,42,0.66)",
              }}
            >
              Drafts auto-save locally
            </span>
            <div className="ml-auto flex flex-wrap gap-2">
              <button
                className="rounded-full border bg-slate-950 px-4 py-2 text-xs font-semibold uppercase tracking-[0.12em] text-slate-100 shadow-sm transition disabled:opacity-50"
                disabled={isRunning || isSubmitting}
                onClick={onRun}
                style={{ borderColor: "var(--interview-border)" }}
                type="button"
              >
                {isRunning ? "Running..." : "Run"}
              </button>
              <button
                className="rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-[0.12em] text-white shadow-[0_12px_28px_rgba(0,0,0,0.25)] transition disabled:opacity-50"
                disabled={isSubmitting}
                onClick={onSubmit}
                style={{
                  background:
                    "linear-gradient(120deg, var(--interview-accent) 0%, color-mix(in srgb, var(--interview-accent-soft) 84%, white 16%) 100%)",
                }}
                type="button"
              >
                {isSubmitting ? "Submitting..." : "Submit"}
              </button>
            </div>
          </div>
        </div>

        <div className="mt-3 min-h-0 flex-1">
          <CodeEditor language={language} onChange={onCodeChange} value={code} />
        </div>

        <div
          className="mt-3 max-h-[220px] shrink-0 overflow-hidden rounded-[1.45rem] border"
          style={{ borderColor: "var(--interview-border)" }}
        >
          <div
            className="flex items-center justify-between border-b bg-slate-950/90 px-4 py-3"
            style={{ borderColor: "rgba(255,255,255,0.08)" }}
          >
            <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-400">
              Judge output
            </span>
            {runResult?.passed != null && runResult?.total != null && runResult.total > 0 && (
              <span
                className={`text-xs font-semibold ${
                  runResult.passed === runResult.total ? "text-emerald-300" : "text-amber-300"
                }`}
              >
                Accepted {runResult.passed}/{runResult.total}
              </span>
            )}
          </div>
          <pre className="max-h-[160px] overflow-auto bg-slate-950/70 p-4 font-mono text-[11px] leading-5 text-slate-100/88">
            {consoleMessage(runResult)}
          </pre>
        </div>
      </section>
    </div>
  );
}

export default DsaWorkspaceStudio;
