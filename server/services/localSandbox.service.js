import { spawn } from "child_process";
import { mkdtemp, rm, writeFile } from "fs/promises";
import { tmpdir } from "os";
import { join } from "path";

const MAX_OUT_BYTES = 280_000;
const DEFAULT_TIMEOUT_MS = 12_000;

const isWin = process.platform === "win32";

function runCommand(command, args, { cwd, timeoutMs = DEFAULT_TIMEOUT_MS, env } = {}) {
  return new Promise((resolve) => {
    const child = spawn(command, args, {
      cwd,
      env: { ...process.env, ...env, NODE_OPTIONS: "" },
      windowsHide: true,
    });

    let stdout = "";
    let stderr = "";
    let killed = false;
    const timer = setTimeout(() => {
      killed = true;
      child.kill("SIGKILL");
    }, timeoutMs);

    const cap = (chunk, acc) => {
      const next = acc + chunk;
      return next.length > MAX_OUT_BYTES ? next.slice(0, MAX_OUT_BYTES) + "\n[truncated]" : next;
    };

    child.stdout?.on("data", (d) => {
      stdout = cap(d.toString(), stdout);
    });
    child.stderr?.on("data", (d) => {
      stderr = cap(d.toString(), stderr);
    });

    child.on("error", (err) => {
      clearTimeout(timer);
      resolve({ ok: false, stdout, stderr: stderr || String(err.message), code: -1, signal: null, killed });
    });

    child.on("close", (code, signal) => {
      clearTimeout(timer);
      resolve({ ok: !killed && code === 0, stdout, stderr, code, signal, killed });
    });
  });
}

function pickNodeCmd() {
  return [process.execPath];
}

async function runInTempFile({ ext, source, run }) {
  const dir = await mkdtemp(join(tmpdir(), "samvaad-"));
  const base = join(dir, `main.${ext}`);
  await writeFile(base, source, "utf8");
  try {
    return await run(dir, base);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
}

export async function runJavascriptSource(source) {
  return runInTempFile({
    ext: "js",
    source,
    run: async (dir, file) => {
      const [nodeBin] = pickNodeCmd();
      const res = await runCommand(nodeBin, [file], { cwd: dir });
      return parseHarnessOutput(res);
    },
  });
}

export async function runPythonSource(source) {
  return runInTempFile({
    ext: "py",
    source,
    run: async (dir, file) => {
      const attempts = isWin
        ? [
            ["py", "-3", file],
            ["python", file],
            ["python3", file],
          ]
        : [
            ["python3", file],
            ["python", file],
          ];
      const missing = (err) =>
        /not recognized|No such file|ENOENT|cannot find|was not found|not found/i.test(String(err || ""));
      let last = { stderr: "", stdout: "", code: -1, signal: null, killed: false };
      for (const [cmd, ...args] of attempts) {
        const res = await runCommand(cmd, args, { cwd: dir });
        last = res;
        if (!missing(res.stderr) && res.code !== -1) {
          return parseHarnessOutput(res);
        }
      }
      return parseHarnessOutput(last);
    },
  });
}

function parseHarnessOutput({ stdout, stderr, code, killed }) {
  if (killed) {
    return {
      ok: false,
      passed: 0,
      total: 0,
      skipped: false,
      compileError: false,
      timeLimitExceeded: true,
      error: "Time limit exceeded",
      stderr,
      exitCode: code,
    };
  }
  const line = stdout.trim().split("\n").filter(Boolean).pop() || "";
  try {
    const parsed = JSON.parse(line);
    return {
      ok: Boolean(parsed.ok),
      passed: Number(parsed.passed) || 0,
      total: Number(parsed.total) || 0,
      skipped: false,
      cases: parsed.cases || [],
      error: parsed.error || null,
      stderr: stderr || undefined,
      exitCode: code,
      timeLimitExceeded: false,
    };
  } catch {
    return {
      ok: false,
      passed: 0,
      total: 0,
      skipped: false,
      rawStdout: stdout,
      stderr: stderr || "Could not parse judge output.",
      exitCode: code,
      timeLimitExceeded: false,
    };
  }
}

export async function runCppSource(fullSource) {
  const dir = await mkdtemp(join(tmpdir(), "samvaad-"));
  const src = join(dir, "main.cpp");
  const out = join(dir, isWin ? "main.exe" : "main");
  await writeFile(src, fullSource, "utf8");
  try {
    const compile = await runCommand("g++", ["-std=c++17", "-O2", "-pipe", "-o", out, src], {
      cwd: dir,
      timeoutMs: 20_000,
    });
    if (!compile.ok) {
      return {
        ok: false,
        passed: 0,
        total: 0,
        skipped: false,
        compileError: true,
        stderr: compile.stderr || compile.stdout || "g++ failed (install MinGW / build-essential)",
      };
    }
    const run = await runCommand(out, [], { cwd: dir });
    return parseHarnessOutput(run);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
}

export async function runJavaSource(fullSource) {
  const dir = await mkdtemp(join(tmpdir(), "samvaad-"));
  const file = join(dir, "Main.java");
  await writeFile(file, fullSource, "utf8");
  try {
    const compile = await runCommand("javac", ["--release", "17", "Main.java"], {
      cwd: dir,
      timeoutMs: 20_000,
    });
    if (!compile.ok) {
      return {
        ok: false,
        passed: 0,
        total: 0,
        skipped: false,
        compileError: true,
        stderr: compile.stderr || compile.stdout || "javac failed (install JDK 17+)",
      };
    }
    const run = await runCommand("java", ["Main"], { cwd: dir });
    return parseHarnessOutput(run);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
}
