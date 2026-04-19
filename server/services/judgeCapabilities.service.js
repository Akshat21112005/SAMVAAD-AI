import { spawn } from "child_process";

const CACHE_TTL_MS = 5 * 60 * 1000;

let cached = null;
let cachedAt = 0;

function runVersionCheck(command, args = ["--version"]) {
  return new Promise((resolve) => {
    const child = spawn(command, args, {
      windowsHide: true,
      env: { ...process.env, NODE_OPTIONS: "" },
    });

    let stderr = "";
    let stdout = "";

    child.stdout?.on("data", (data) => {
      stdout += data.toString();
    });
    child.stderr?.on("data", (data) => {
      stderr += data.toString();
    });

    child.on("error", () => resolve(false));
    child.on("close", (code) => resolve(code === 0 || Boolean(stdout || stderr)));
  });
}

async function detectPython() {
  for (const cmd of [["py", "-3", "--version"], ["python", "--version"], ["python3", "--version"]]) {
    // eslint-disable-next-line no-await-in-loop
    if (await runVersionCheck(cmd[0], cmd.slice(1))) return true;
  }
  return false;
}

export async function getJudgeCapabilities() {
  const now = Date.now();
  if (cached && now - cachedAt < CACHE_TTL_MS) return cached;

  const [python, cpp, javac, java] = await Promise.all([
    detectPython(),
    runVersionCheck("g++"),
    runVersionCheck("javac"),
    runVersionCheck("java"),
  ]);

  cached = {
    javascript: true,
    python,
    cpp,
    java: javac && java,
  };
  cachedAt = now;
  return cached;
}
