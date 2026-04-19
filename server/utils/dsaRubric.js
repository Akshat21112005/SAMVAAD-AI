const GENERIC_NAMES = new Set([
  "a",
  "b",
  "c",
  "x",
  "y",
  "z",
  "tmp",
  "temp",
  "foo",
  "bar",
  "ans",
  "res",
  "ret",
  "data",
  "value",
  "obj",
  "thing",
]);

const KEYWORDS = new Set([
  "function",
  "return",
  "const",
  "let",
  "var",
  "if",
  "else",
  "for",
  "while",
  "class",
  "public",
  "private",
  "protected",
  "static",
  "new",
  "true",
  "false",
  "null",
  "pass",
  "def",
  "int",
  "long",
  "double",
  "float",
  "bool",
  "boolean",
  "string",
  "String",
  "vector",
  "List",
  "Map",
  "Set",
  "this",
]);

const COMPLEXITY_RANK = {
  "O(1)": 1,
  "O(log n)": 2,
  "O(n)": 3,
  "O(n log n)": 4,
  "O(n^2)": 5,
  "O(n^3)": 6,
};

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function collectDeclaredNames(code = "", language = "javascript") {
  const patterns = [];

  if (language === "javascript") {
    patterns.push(/\b(?:const|let|var)\s+([A-Za-z_][A-Za-z0-9_]*)/g);
    patterns.push(/\bfunction\s+([A-Za-z_][A-Za-z0-9_]*)/g);
  } else if (language === "python") {
    patterns.push(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=/gm);
    patterns.push(/\bdef\s+([A-Za-z_][A-Za-z0-9_]*)/g);
  } else {
    patterns.push(/\b(?:int|long|double|float|bool|boolean|String|string|char|auto)\s+([A-Za-z_][A-Za-z0-9_]*)/g);
    patterns.push(/\b(?:public|private|protected)?\s*(?:static\s+)?(?:int|long|double|float|bool|boolean|String|string|char|void)\s+([A-Za-z_][A-Za-z0-9_]*)\s*\(/g);
  }

  const names = [];
  for (const pattern of patterns) {
    let match = pattern.exec(code);
    while (match) {
      const name = match[1];
      if (name && !KEYWORDS.has(name)) names.push(name);
      match = pattern.exec(code);
    }
  }

  return [...new Set(names)];
}

export function analyzeCodeQuality(code = "", language = "javascript") {
  const cleaned = String(code || "");
  const names = collectDeclaredNames(cleaned, language);
  const lineCount = cleaned.split("\n").filter((line) => line.trim()).length;
  const commentCount = (cleaned.match(/\/\/|#|\/\*/g) || []).length;
  const guardCount = (cleaned.match(/\bif\b/g) || []).length;
  const helperFnCount =
    language === "python"
      ? Math.max(0, (cleaned.match(/\bdef\b/g) || []).length - 1)
      : Math.max(0, (cleaned.match(/\bfunction\b/g) || []).length - 1);

  const descriptiveNames = names.filter((name) => {
    if (GENERIC_NAMES.has(name)) return false;
    if (name.length <= 1) return false;
    return /[_A-Z]/.test(name) || name.length >= 4;
  }).length;
  const weakNames = names.filter((name) => GENERIC_NAMES.has(name) || name.length <= 1).length;
  const namingRatio = names.length ? descriptiveNames / names.length : 0.35;

  let namingScore = Math.round(12 * namingRatio) - weakNames;
  if (names.length === 0) namingScore = 3;
  namingScore = clamp(namingScore, 0, 12);

  let structureScore = 4;
  if (lineCount >= 8) structureScore += 2;
  if (guardCount >= 1) structureScore += 2;
  if (helperFnCount >= 1) structureScore += 2;
  if (commentCount >= 1) structureScore += 1;
  structureScore = clamp(structureScore, 0, 9);

  let edgeCaseSignal = 1;
  if (guardCount >= 2) edgeCaseSignal += 2;
  if (/length\s*===\s*0|len\(.+\)\s*==\s*0|empty\(\)|nullptr|null|None/.test(cleaned)) {
    edgeCaseSignal += 2;
  }
  edgeCaseSignal = clamp(edgeCaseSignal, 0, 4);

  const issues = [];
  if (weakNames >= Math.max(2, Math.ceil(names.length / 2))) {
    issues.push("Variable naming is too generic; clearer identifiers would improve readability.");
  }
  if (commentCount === 0 && lineCount > 20) {
    issues.push("The solution would benefit from one short comment explaining the core idea.");
  }
  if (guardCount === 0) {
    issues.push("There is no visible guard path for edge inputs or invalid states.");
  }

  return {
    namingScore,
    structureScore,
    edgeCaseSignal,
    issues,
  };
}

export function scoreComplexity(target, detected, maxScore) {
  if (!target) return Math.round(maxScore * 0.55);
  const targetRank = COMPLEXITY_RANK[target] || 4;
  const detectedRank = COMPLEXITY_RANK[detected] || targetRank + 1;
  if (detectedRank <= targetRank) return maxScore;
  if (detectedRank === targetRank + 1) return Math.round(maxScore * 0.7);
  return Math.round(maxScore * 0.4);
}

export function scoreTimeManagement({ difficulty = "medium", timeUsed = 0, timedOut = false }) {
  if (timedOut) return 0;

  const duration = 45 * 60;
  const ratio = duration > 0 ? Number(timeUsed || 0) / duration : 1;
  const thresholds = {
    easy: [0.35, 0.55, 0.78],
    medium: [0.45, 0.68, 0.88],
    hard: [0.55, 0.8, 0.95],
  };
  const [fast, solid, late] = thresholds[difficulty] || thresholds.medium;

  if (ratio <= fast) return 5;
  if (ratio <= solid) return 4;
  if (ratio <= late) return 3;
  return 1;
}
