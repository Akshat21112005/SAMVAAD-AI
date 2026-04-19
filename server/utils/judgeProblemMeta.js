import { DSA_TEST_SPECS } from "./dsaTestSpecs.js";

const DEFAULT_TIME_LIMIT_MS = 12_000;
const DEFAULT_MEMORY_LIMIT_MB = 256;

/** Optional per-problem overrides (time/memory). */
const OVERRIDES = {
  // "two-sum-signals": { timeLimitMs: 8000, memoryLimitMb: 128 },
};

/**
 * Problem metadata for the judge pipeline (constraints + test count).
 * Test vectors themselves stay in DSA_TEST_SPECS.
 */
export function getJudgeProblemMeta(problemId) {
  const spec = DSA_TEST_SPECS[problemId];
  if (!spec) return null;
  const o = OVERRIDES[problemId] || {};
  return {
    id: problemId,
    testCount: spec.tests.length,
    timeLimitMs: o.timeLimitMs ?? DEFAULT_TIME_LIMIT_MS,
    memoryLimitMb: o.memoryLimitMb ?? DEFAULT_MEMORY_LIMIT_MB,
  };
}

export function listJudgeProblemIds() {
  return Object.keys(DSA_TEST_SPECS);
}
