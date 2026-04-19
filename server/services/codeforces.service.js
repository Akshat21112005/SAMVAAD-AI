/**
 * Codeforces public API — problem statements for DSA practice.
 * https://codeforces.com/api/help
 */

function ratingRangeForDifficulty(difficulty) {
  const d = String(difficulty || "medium").toLowerCase();
  if (d === "easy") return [800, 1200];
  if (d === "hard") return [1601, 2400];
  return [1201, 1800];
}

function genericStarters(title) {
  const safe = String(title || "Solution").replace(/"/g, '\\"');
  return {
    javascript: `// ${safe}\n// Read problem on Codeforces; implement per statement.\nfunction solve() {\n}\n`,
    python: `# ${safe}\ndef solve():\n    pass\n`,
    cpp: `// ${safe}\n#include <bits/stdc++.h>\nusing namespace std;\nint main() {\n  ios::sync_with_stdio(false);\n  cin.tie(nullptr);\n  return 0;\n}\n`,
    java: `// ${safe}\nimport java.util.*;\npublic class Main {\n  public static void main(String[] args) {\n    Scanner sc = new Scanner(System.in);\n  }\n}\n`,
  };
}

/**
 * Fetch a random problem with full statement. Returns null on failure.
 */
export async function fetchRandomCodeforcesProblem(difficulty) {
  const [minR, maxR] = ratingRangeForDifficulty(difficulty);
  try {
    const listRes = await fetch("https://codeforces.com/api/problemset.problems", {
      headers: { Accept: "application/json" },
    });
    const listJson = await listRes.json();
    if (listJson.status !== "OK" || !listJson.result?.problems?.length) {
      return null;
    }

    const candidates = listJson.result.problems.filter((p) => {
      const r = p.rating;
      if (r == null) return false;
      return r >= minR && r <= maxR && p.type === "PROGRAMMING";
    });

    if (candidates.length === 0) return null;

    const pick = candidates[Math.floor(Math.random() * candidates.length)];
    const { contestId, index } = pick;

    const title = pick.name || "Codeforces";
    const tags = (pick.tags || []).map((t) => String(t).toLowerCase());

    const id = `cf-${contestId}${index}`;
    const url = `https://codeforces.com/problemset/problem/${contestId}/${index}`;
    const statement = `Solve the Codeforces problem **${title}** (contest ${contestId}, problem ${index}).\n\nTags: ${tags.join(", ") || "see page"}. Estimated difficulty rating: ${pick.rating ?? "unknown"}.\n\nOpen the official problem page for the full statement, samples, constraints, and limits. Your editor here is for drafting; align your solution with the published specification.`;

    return {
      id,
      title: `${title} (CF ${contestId}${index})`,
      difficulty:
        pick.rating <= 1200 ? "easy" : pick.rating <= 1800 ? "medium" : "hard",
      topics: tags.length ? tags : ["competitive"],
      statement,
      constraints: [`Codeforces rating (approx): ${pick.rating ?? "unknown"}`],
      sampleInput: "See problem page for official samples.",
      sampleOutput: "",
      timeLimitSeconds: 2700,
      hints: ["Read samples on the Codeforces page", "Mind time and memory limits"],
      companies: [],
      starterCode: genericStarters(title),
      problemSource: "codeforces",
      externalUrl: url,
      codeforcesMeta: { contestId, index, rating: pick.rating },
      hasAutomatedTests: false,
    };
  } catch {
    return null;
  }
}
