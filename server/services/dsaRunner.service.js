import { DSA_TEST_SPECS } from "../utils/dsaTestSpecs.js";
import { buildCppHarness, buildJavaHarness } from "../utils/nativeHarnessBuilders.js";
import {
  runCppSource,
  runJavascriptSource,
  runJavaSource,
  runPythonSource,
} from "./localSandbox.service.js";
function buildJavascriptHarness(userCode, fnName, tests) {
  const testsJson = JSON.stringify(tests);
  return `
${userCode}

const __tests__ = ${testsJson};
function __deepEqual(a, b) {
  if (a === b) return true;
  if (a == null || b == null) return false;
  if (typeof a !== typeof b) return false;
  if (typeof a !== "object") return false;
  if (Array.isArray(a) !== Array.isArray(b)) return false;
  if (Array.isArray(a)) {
    if (a.length !== b.length) return false;
    for (let i = 0; i < a.length; i += 1) {
      if (!__deepEqual(a[i], b[i])) return false;
    }
    return true;
  }
  const ka = Object.keys(a);
  const kb = Object.keys(b);
  if (ka.length !== kb.length) return false;
  return ka.every((k) => __deepEqual(a[k], b[k]));
}
const __fn__ = typeof ${fnName} === "function" ? ${fnName} : null;
if (!__fn__) {
  console.log(JSON.stringify({ ok: false, error: "Function ${fnName} is not defined", passed: 0, total: __tests__.length, cases: [] }));
  process.exit(0);
}
const __cases = [];
for (let i = 0; i < __tests__.length; i += 1) {
  const t = __tests__[i];
  try {
    const got = __fn__(...t.args);
    const ok = __deepEqual(got, t.expected);
    __cases.push({ index: i, ok, expected: t.expected, got });
    if (!ok) {
      console.log(JSON.stringify({ ok: false, passed: __cases.filter((c) => c.ok).length, total: __tests__.length, cases: __cases }));
      process.exit(0);
    }
  } catch (e) {
    console.log(JSON.stringify({ ok: false, error: String(e && e.message ? e.message : e), passed: i, total: __tests__.length, cases: __cases }));
    process.exit(0);
  }
}
console.log(JSON.stringify({ ok: true, passed: __tests__.length, total: __tests__.length, cases: __cases }));
`;
}

function buildPythonHarness(userCode, fnName, tests) {
  const testsEncoded = JSON.stringify(JSON.stringify(tests));
  return `
import json
import sys

${userCode}

__tests__ = json.loads(${testsEncoded})

def __deep_eq(a, b):
    if a is b:
        return True
    if a is None or b is None:
        return False
    if type(a) != type(b):
        return False
    if isinstance(a, list):
        if len(a) != len(b):
            return False
        return all(__deep_eq(x, y) for x, y in zip(a, b))
    if isinstance(a, dict):
        if len(a) != len(b):
            return False
        return all(k in b and __deep_eq(a[k], b[k]) for k in a)
    return a == b

__fn = globals().get("${fnName}")
if not callable(__fn):
    print(json.dumps({"ok": False, "error": "Function ${fnName} is not defined", "passed": 0, "total": len(__tests__), "cases": []}))
    sys.exit(0)

__cases = []
for i, t in enumerate(__tests__):
    try:
        got = __fn(*t["args"])
        ok = __deep_eq(got, t["expected"])
        __cases.append({"index": i, "ok": ok, "expected": t["expected"], "got": got})
        if not ok:
            print(json.dumps({"ok": False, "passed": sum(1 for c in __cases if c["ok"]), "total": len(__tests__), "cases": __cases}))
            sys.exit(0)
    except Exception as e:
        print(json.dumps({"ok": False, "error": str(e), "passed": i, "total": len(__tests__), "cases": __cases}))
        sys.exit(0)

print(json.dumps({"ok": True, "passed": len(__tests__), "total": len(__tests__), "cases": __cases}))
`;
}

/**
 * Build full harness source for a problem + language (local sandbox).
 */
export function buildHarnessSource({ problemId, language, code }) {
  const spec = DSA_TEST_SPECS[problemId];
  if (!spec) return { error: "No test spec for this problem." };
  const trimmed = String(code || "").trim();
  if (!trimmed) return { error: "Empty submission" };

  const tests = spec.tests;
  if (language === "javascript") {
    const fnName = spec.fn.javascript;
    if (!fnName) return { error: "No JavaScript harness." };
    return { source: buildJavascriptHarness(trimmed, fnName, tests), language: "javascript" };
  }
  if (language === "python") {
    const fnName = spec.fn.python;
    if (!fnName) return { error: "No Python harness." };
    return { source: buildPythonHarness(trimmed, fnName, tests), language: "python" };
  }
  if (language === "cpp") {
    const fnName = spec.fn.cpp || spec.fn.javascript;
    if (!fnName) return { error: "No C++ harness." };
    return { source: buildCppHarness(trimmed, fnName, tests), language: "cpp" };
  }
  if (language === "java") {
    const fnName = spec.fn.java || spec.fn.javascript;
    if (!fnName) return { error: "No Java harness." };
    return { source: buildJavaHarness(trimmed, fnName, tests), language: "java" };
  }
  return { error: "Unsupported language." };
}

export function sanitizeRunResultForClient(result) {
  if (!result || typeof result !== "object") return result;
  return {
    ok: result.ok,
    passed: result.passed,
    total: result.total,
    skipped: result.skipped,
    compileError: result.compileError,
    error: result.error,
    message: result.message,
    stderr: typeof result.stderr === "string" ? result.stderr.slice(0, 2000) : result.stderr,
    executionBackend: result.executionBackend,
    executionHint: "Executed in the local sandbox (temp dir + child process).",
  };
}

async function runLocalHarness({ problemId, language, code }) {
  const spec = DSA_TEST_SPECS[problemId];
  if (!spec) {
    return {
      skipped: true,
      message: "No automated tests for this challenge (AI will review your submission).",
      passed: 0,
      total: 0,
    };
  }

  const trimmed = String(code || "").trim();
  if (!trimmed) {
    return {
      skipped: false,
      ok: false,
      passed: 0,
      total: spec.tests.length,
      error: "Empty submission",
    };
  }

  const tests = spec.tests;
  const total = tests.length;

  if (language === "javascript") {
    const fnName = spec.fn.javascript;
    if (!fnName) {
      return { skipped: true, message: "No JavaScript harness.", passed: 0, total };
    }
    const src = buildJavascriptHarness(trimmed, fnName, tests);
    const r = await runJavascriptSource(src);
    return { ...r, executionBackend: "local" };
  }

  if (language === "python") {
    const fnName = spec.fn.python;
    if (!fnName) {
      return { skipped: true, message: "No Python harness.", passed: 0, total };
    }
    const src = buildPythonHarness(trimmed, fnName, tests);
    const r = await runPythonSource(src);
    return { ...r, executionBackend: "local" };
  }

  if (language === "cpp") {
    const fnName = spec.fn.cpp || spec.fn.javascript;
    if (!fnName) {
      return { skipped: true, message: "No C++ harness.", passed: 0, total };
    }
    const src = buildCppHarness(trimmed, fnName, tests);
    const r = await runCppSource(src);
    return { ...r, executionBackend: "local" };
  }

  if (language === "java") {
    const fnName = spec.fn.java || spec.fn.javascript;
    if (!fnName) {
      return { skipped: true, message: "No Java harness.", passed: 0, total };
    }
    const src = buildJavaHarness(trimmed, fnName, tests);
    const r = await runJavaSource(src);
    return { ...r, executionBackend: "local" };
  }

  return {
    skipped: true,
    message: "Unsupported language.",
    passed: 0,
    total,
  };
}

export async function runDsaTests({ problemId, language, code }) {
  const spec = DSA_TEST_SPECS[problemId];

  if (!spec) {
    return {
      skipped: true,
      message: "No automated tests for this challenge (AI will review your submission).",
      passed: 0,
      total: 0,
    };
  }

  const total = spec.tests.length;

  try {
    return await runLocalHarness({ problemId, language, code });
  } catch (err) {
    return {
      ok: false,
      passed: 0,
      total,
      skipped: false,
      compileError: false,
      error: String(err?.message || err),
      executionBackend: "local",
    };
  }
}
