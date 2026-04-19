import { getJudgeProblemMeta } from "../utils/judgeProblemMeta.js";
import { VERDICT, VERDICT_LABEL } from "../utils/judgeVerdict.js";
import { runDsaTests, sanitizeRunResultForClient } from "./dsaRunner.service.js";

function buildPipelineStages(raw, meta) {
  const stages = [
    { stage: "receive", status: "ok", detail: "Submission accepted" },
    { stage: "fetch_problem", status: meta ? "ok" : "error", detail: meta ? meta.id : "Unknown problem" },
    { stage: "isolate", status: "ok", detail: "Ephemeral temp directory + local child process" },
  ];

  if (raw.skipped) {
    stages.push({ stage: "compile", status: "skipped", detail: "No harness for this problem/language" });
    stages.push({ stage: "execute", status: "skipped", detail: "—" });
    stages.push({ stage: "evaluate", status: "skipped", detail: "—" });
    return stages;
  }

  if (raw.compileError) {
    stages.push({ stage: "compile", status: "error", detail: raw.stderr?.slice?.(0, 200) || "Compilation failed" });
    stages.push({ stage: "execute", status: "skipped", detail: "Not run after CE" });
    stages.push({ stage: "evaluate", status: "skipped", detail: "—" });
    return stages;
  }

  stages.push({ stage: "compile", status: raw._needsCompile === false ? "skipped" : "ok", detail: "Interpreter or compile step finished" });
  stages.push({
    stage: "execute",
    status: raw.timeLimitExceeded ? "error" : "ok",
    detail: "Local child process",
  });
  stages.push({
    stage: "evaluate",
    status: raw.ok ? "ok" : "error",
    detail: raw.ok ? "All hidden checks matched" : "Mismatch, crash, or limit",
  });
  return stages;
}

/**
 * Map raw runner output to a single LeetCode-style verdict.
 */
export function deriveVerdict(raw) {
  if (!raw || raw.skipped) {
    return { verdict: VERDICT.SKIP, verdictLabel: VERDICT_LABEL.SKIP, reason: raw?.message || "No automated judge" };
  }

  if (raw.compileError) {
    return { verdict: VERDICT.CE, verdictLabel: VERDICT_LABEL.CE, reason: "Build or compile step failed" };
  }

  if (raw.timeLimitExceeded) {
    return { verdict: VERDICT.TLE, verdictLabel: VERDICT_LABEL.TLE, reason: "Execution exceeded time limit" };
  }

  if (raw.ok) {
    return { verdict: VERDICT.AC, verdictLabel: VERDICT_LABEL.AC, reason: "All testcases passed" };
  }

  const err = raw.error ? String(raw.error) : "";
  const cases = Array.isArray(raw.cases) ? raw.cases : [];

  if (err && !cases.some((c) => c && c.ok === false)) {
    return {
      verdict: VERDICT.RE,
      verdictLabel: VERDICT_LABEL.RE,
      reason: err.slice(0, 500),
    };
  }

  if (cases.some((c) => c && c.ok === false)) {
    return { verdict: VERDICT.WA, verdictLabel: VERDICT_LABEL.WA, reason: "Output or structure did not match expected" };
  }

  if (raw.rawStdout != null || /parse judge output|Could not parse/i.test(err)) {
    return {
      verdict: VERDICT.RE,
      verdictLabel: VERDICT_LABEL.RE,
      reason: err || "Abnormal termination or unreadable judge output",
    };
  }

  return {
    verdict: VERDICT.RE,
    verdictLabel: VERDICT_LABEL.RE,
    reason: err || "Execution failed",
  };
}

function languagesRequiringCompile(language) {
  return language === "cpp" || language === "java";
}

function attachCompileHint(raw, language) {
  return {
    ...raw,
    _needsCompile: languagesRequiringCompile(language),
  };
}

function sanitizeCasesForClient(cases, showDetails) {
  if (!Array.isArray(cases)) return [];
  if (showDetails) {
    return cases.map((c) => ({
      index: c.index,
      ok: c.ok,
      expected: c.expected,
      got: c.got,
    }));
  }
  return cases.map((c) => ({
    index: c.index,
    ok: c.ok,
  }));
}

/**
 * Full pipeline: receive → problem metadata → run harness (compile/execute/evaluate) → verdict + stats.
 */
export async function runOnlineJudge({ problemId, language, code }) {
  const meta = getJudgeProblemMeta(problemId);
  const showCaseDetails = String(process.env.JUDGE_SHOW_CASE_DETAILS || "").toLowerCase() === "true";

  const raw = attachCompileHint(
    await runDsaTests({ problemId, language, code: code || "" }),
    language
  );

  const { verdict, verdictLabel, reason } = deriveVerdict(raw);
  const pipeline = buildPipelineStages(raw, meta);

  const passed = Number(raw.passed) || 0;
  const total = Number(raw.total) || 0;
  const stats = {
    passed,
    total,
    passRate: total > 0 ? Math.round((passed / total) * 1000) / 1000 : null,
  };

  const base = sanitizeRunResultForClient(raw);
  return {
    ...base,
    verdict,
    verdictLabel,
    verdictReason: reason,
    problemConstraints: meta
      ? {
          timeLimitMs: meta.timeLimitMs,
          memoryLimitMb: meta.memoryLimitMb,
          testCount: meta.testCount,
        }
      : null,
    stats,
    pipeline,
    cases: sanitizeCasesForClient(raw.cases, showCaseDetails),
    timeLimitExceeded: Boolean(raw.timeLimitExceeded),
  };
}
