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
            ? ` · ${runResult.stats.passed}/${runResult.stats.total} tests`
            : ""
        }\n\n`
      : "";
  if (runResult.skipped) {
    return head + (runResult.message || "This language or problem uses AI grading only on submit.") + hint;
  }
  if (runResult.compileError) {
    return (
      head +
      (runResult.stderr || runResult.error || runResult.message || "Build failed.") +
      hint +
      "\n\nTip: Install g++ (MinGW / MSVC build tools) and JDK 17+ on the machine running the API server for C++/Java."
    );
  }
  if (runResult.error && (runResult.passed === 0 || runResult.passed == null)) {
    return head + String(runResult.error) + hint;
  }
  const p = runResult.passed;
  const t = runResult.total;
  if (p != null && t != null && t > 0) {
    if (p === t) {
      return head + `Hidden suite: all ${t} tests passed.${hint}`;
    }
    return head + `Hidden suite: ${p} of ${t} tests passed. Details are not shown.${hint}`;
  }
  return head + (runResult.stderr || "Finished.") + hint;
}

function DsaWorkspace({
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
}) {
  const [tab, setTab] = useState("description");

  return (
    <div className="flex flex-col gap-0 lg:min-h-[calc(100vh-8rem)]">
      <div className="relative z-10 grid flex-1 gap-0 lg:grid-cols-[minmax(300px,40%)_1fr] lg:divide-x lg:divide-blue-500/15">
        <aside className="flex min-h-[260px] flex-col border-b border-blue-500/15 bg-zinc-950/95 lg:min-h-0 lg:border-b-0">
          <div className="flex border-b border-blue-500/15 bg-zinc-900/90 p-1 backdrop-blur-sm">
            {TABS.map(([id, label]) => (
              <button
                className={`flex-1 rounded-xl px-3 py-2.5 text-center text-xs font-semibold uppercase tracking-[0.14em] transition ${
                  tab === id
                    ? "bg-blue-600 text-white shadow-sm"
                    : "text-blue-300/70 hover:bg-blue-950/60 hover:text-white"
                }`}
                key={id}
                onClick={() => setTab(id)}
                type="button"
              >
                {label}
              </button>
            ))}
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto p-5">
            {tab === "description" && <ProblemStatement problem={problem} showTitle={false} />}
            {tab === "samples" && (
              <div className="space-y-5">
                <p className="text-xs uppercase tracking-[0.22em] text-blue-400/85">
                  Problem samples only
                </p>
                <p className="text-sm leading-relaxed text-blue-100/75">
                  Official test vectors are hidden. Use the samples below to sanity-check your
                  understanding; <strong className="text-white">Run</strong> validates against the full private suite on the
                  server.
                </p>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-2xl border border-blue-500/20 bg-zinc-950/90 p-4 shadow-sm">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-blue-400/85">
                      Sample input
                    </p>
                    <pre className="mt-2 overflow-x-auto whitespace-pre-wrap font-mono text-xs leading-6 text-blue-50">
                      {problem?.sampleInput}
                    </pre>
                  </div>
                  <div className="rounded-2xl border border-blue-500/20 bg-zinc-950/90 p-4 shadow-sm">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-blue-400/85">
                      Sample output
                    </p>
                    <pre className="mt-2 overflow-x-auto whitespace-pre-wrap font-mono text-xs leading-6 text-blue-50">
                      {problem?.sampleOutput}
                    </pre>
                  </div>
                </div>
              </div>
            )}
          </div>
        </aside>

        <section className="flex min-h-[420px] flex-col bg-zinc-950 lg:min-h-0">
          <div className="flex flex-wrap items-center gap-2 border-b border-blue-500/15 bg-zinc-900/80 px-3 py-2.5">
            <select
              className="rounded-full border border-blue-500/25 bg-zinc-950 px-3 py-2 text-xs font-medium text-white shadow-sm outline-none"
              onChange={(e) => onLanguageChange(e.target.value)}
              value={language}
            >
              {languages.map((item) => (
                <option key={item} value={item}>
                  {item.toUpperCase()}
                </option>
              ))}
            </select>
            <span className="rounded-full border border-blue-500/20 bg-blue-950/40 px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-blue-200/80">
              Judge-backed hidden tests
            </span>
            <div className="ml-auto flex flex-wrap gap-2">
              <button
                className="rounded-full border border-blue-500/25 bg-zinc-950 px-4 py-2 text-xs font-semibold uppercase tracking-[0.12em] text-blue-100 shadow-sm transition hover:border-blue-400/40 hover:bg-blue-950/50 disabled:opacity-50"
                disabled={isRunning || isSubmitting}
                onClick={onRun}
                type="button"
              >
                {isRunning ? "Running…" : "Run"}
              </button>
              <button
                className="rounded-full bg-blue-600 px-4 py-2 text-xs font-semibold uppercase tracking-[0.12em] text-white shadow-[0_8px_24px_rgba(37,99,235,0.3)] transition hover:bg-blue-500 disabled:opacity-50"
                disabled={isSubmitting}
                onClick={onSubmit}
                type="button"
              >
                {isSubmitting ? "Submitting…" : "Submit"}
              </button>
            </div>
          </div>
          <div className="min-h-0 flex-1 p-3">
            <CodeEditor language={language} onChange={onCodeChange} value={code} />
          </div>
          <div className="max-h-[180px] shrink-0 border-t border-blue-500/15 bg-blue-950/30">
            <div className="flex items-center justify-between border-b border-blue-500/10 px-4 py-2">
              <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-blue-400/85">
                Judge output
              </span>
              {runResult?.passed != null && runResult?.total != null && runResult.total > 0 && (
                <span
                  className={`text-xs font-semibold ${
                    runResult.passed === runResult.total ? "text-blue-400" : "text-amber-400"
                  }`}
                >
                  Accepted {runResult.passed}/{runResult.total}
                </span>
              )}
            </div>
            <pre className="max-h-[120px] overflow-auto p-4 font-mono text-[11px] leading-5 text-blue-100/85">
              {consoleMessage(runResult)}
            </pre>
          </div>
        </section>
      </div>
    </div>
  );
}

export default DsaWorkspace;
