function indentBlock(code, spaces) {
  const pad = " ".repeat(spaces);
  return code
    .split("\n")
    .map((line) => (line.trim() ? pad + line : line))
    .join("\n");
}

/* ---------- C++ ---------- */

function escapeCppStr(s) {
  return String(s).replace(/\\/g, "\\\\").replace(/"/g, '\\"');
}

export function toCppExpr(value) {
  if (typeof value === "number" && Number.isFinite(value)) return String(value);
  if (typeof value === "boolean") return value ? "true" : "false";
  if (typeof value === "string") return `string("${escapeCppStr(value)}")`;
  if (!Array.isArray(value)) throw new Error("Unsupported value for C++ harness");

  if (value.length === 0) return "vector<int>{}";

  if (typeof value[0] === "number") {
    return `vector<int>{${value.join(",")}}`;
  }
  if (Array.isArray(value[0])) {
    const inner = value.map((row) => `{${row.join(",")}}`).join(",");
    return `vector<vector<int>>{${inner}}`;
  }
  if (typeof value[0] === "string") {
    return `vector<string>{${value.map((x) => `"${escapeCppStr(x)}"`).join(",")}}`;
  }
  throw new Error("Unsupported array shape for C++ harness");
}

export function buildCppHarness(userCode, fnName, tests) {
  const n = tests.length;
  const checks = tests
    .map((t, i) => {
      const argNames = t.args.map((_, idx) => `__arg_${i}_${idx}`);
      const argDeclarations = t.args
        .map((arg, idx) => `    auto ${argNames[idx]} = ${toCppExpr(arg)};`)
        .join("\n");
      const argList = argNames.join(", ");
      const exp = toCppExpr(t.expected);
      return `
  {
${argDeclarations}
    auto __got = s.${fnName}(${argList});
    auto __exp = ${exp};
    if (!(__got == __exp)) {
      std::cout << "{\\"ok\\":false,\\"passed\\":${i},\\"total\\":${n}}" << std::endl;
      return 0;
    }
  }`;
    })
    .join("");

  return `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
${indentBlock(userCode.trim(), 2)}
};

int main() {
  ios::sync_with_stdio(false);
  cin.tie(nullptr);
  Solution s;
${checks}
  std::cout << "{\\"ok\\":true,\\"passed\\":${n},\\"total\\":${n}}" << std::endl;
  return 0;
}
`;
}

/* ---------- Java ---------- */

function escapeJavaStr(s) {
  return String(s).replace(/\\/g, "\\\\").replace(/"/g, '\\"');
}

export function toJavaExpr(value, ctx = {}) {
  if (typeof value === "number" && Number.isFinite(value)) return String(value);
  if (typeof value === "boolean") return String(value);
  if (typeof value === "string") return `"${escapeJavaStr(value)}"`;
  if (!Array.isArray(value)) throw new Error("Unsupported value for Java harness");

  if (value.length === 0) {
    return "new int[]{}";
  }

  if (typeof value[0] === "number") {
    return `new int[]{${value.join(",")}}`;
  }

  if (Array.isArray(value[0])) {
    const rows = value.map((row) => `new int[]{${row.join(",")}}`).join(", ");
    return `new int[][]{${rows}}`;
  }

  if (typeof value[0] === "string") {
    if (ctx.asList) {
      return `java.util.Arrays.asList(${value.map((x) => `"${escapeJavaStr(x)}"`).join(", ")})`;
    }
    return `new String[]{${value.map((x) => `"${escapeJavaStr(x)}"`).join(", ")}}`;
  }

  throw new Error("Unsupported array shape for Java harness");
}

function javaCompareCondition(expectedSample) {
  if (typeof expectedSample === "number" || typeof expectedSample === "boolean") {
    return `__got != __exp`;
  }
  if (typeof expectedSample === "string") {
    return `!__got.equals(__exp)`;
  }
  if (Array.isArray(expectedSample)) {
    if (expectedSample.length === 0) {
      return `!java.util.Arrays.equals(__got, __exp)`;
    }
    if (typeof expectedSample[0] === "number") {
      return `!java.util.Arrays.equals(__got, __exp)`;
    }
    if (Array.isArray(expectedSample[0])) {
      return `!java.util.Arrays.deepEquals(__got, __exp)`;
    }
    if (typeof expectedSample[0] === "string") {
      return `!java.util.Arrays.equals(__got, __exp)`;
    }
  }
  return `!java.util.Objects.deepEquals(__got, __exp)`;
}

export function buildJavaHarness(userCode, fnName, tests) {
  const n = tests.length;
  const checks = tests
    .map((t, i) => {
      const args = t.args.map((a, idx) => {
        const needsList =
          fnName === "ladderLength" && idx === 2 && Array.isArray(a) && a.length && typeof a[0] === "string";
        return toJavaExpr(a, { asList: needsList });
      });
      const argList = args.join(", ");
      const exp = toJavaExpr(t.expected, {});
      const cond = javaCompareCondition(t.expected);
      return `
    {
      var __got = s.${fnName}(${argList});
      var __exp = ${exp};
      if (${cond}) {
        System.out.println("{\\"ok\\":false,\\"passed\\":${i},\\"total\\":${n}}");
        return;
      }
    }`;
    })
    .join("");

  return `
import java.util.*;

${userCode.trim()}

public class Main {
  public static void main(String[] args) {
    Solution s = new Solution();
${checks}
    System.out.println("{\\"ok\\":true,\\"passed\\":${n},\\"total\\":${n}}");
  }
}
`.trim();
}
