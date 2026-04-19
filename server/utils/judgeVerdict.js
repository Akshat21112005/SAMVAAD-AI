/**
 * Standard online-judge verdict codes (LeetCode-style abbreviations).
 */
export const VERDICT = {
  AC: "AC",
  WA: "WA",
  CE: "CE",
  TLE: "TLE",
  RE: "RE",
  SKIP: "SKIP",
  IE: "IE",
};

export const VERDICT_LABEL = {
  AC: "Accepted",
  WA: "Wrong Answer",
  CE: "Compilation Error",
  TLE: "Time Limit Exceeded",
  RE: "Runtime Error",
  SKIP: "Skipped",
  IE: "Internal Error",
};

/**
 * Normalize program output for strict comparison (stdin/stdout judges).
 */
export function normalizeOutput(s) {
  if (s == null) return "";
  return String(s)
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .replace(/\s+$/m, "")
    .trim();
}

/**
 * Strict string equality after normalization.
 */
export function outputsEqual(actual, expected) {
  return normalizeOutput(actual) === normalizeOutput(expected);
}
