import { randomUUID } from "crypto";

const LEVEL_ORDER = {
  debug: 10,
  info: 20,
  warn: 30,
  error: 40,
};

const ACTIVE_LEVEL = String(process.env.LOG_LEVEL || "debug").toLowerCase();
const MAX_TEXT_PREVIEW = Number(process.env.LOG_TEXT_LIMIT || 600);
const MAX_OBJECT_PREVIEW = Number(process.env.LOG_OBJECT_LIMIT || 2500);
const FULL_TEXT = String(process.env.LOG_FULL_TEXT || "false").toLowerCase() === "true";

const getLevelWeight = (level) => LEVEL_ORDER[level] || LEVEL_ORDER.info;

const shouldLog = (level) => getLevelWeight(level) >= getLevelWeight(ACTIVE_LEVEL);

export const makeRequestId = () => randomUUID().slice(0, 12);

export const previewText = (value, limit = MAX_TEXT_PREVIEW) => {
  const text = String(value ?? "").replace(/\s+/g, " ").trim();
  if (FULL_TEXT || text.length <= limit) return text;
  return `${text.slice(0, limit)}...<truncated>`;
};

const summarizeValue = (value, depth = 0) => {
  if (value == null) return value;
  if (typeof value === "string") return previewText(value);
  if (typeof value === "number" || typeof value === "boolean") return value;
  if (value instanceof Error) {
    return {
      name: value.name,
      message: value.message,
      stack: previewText(value.stack || "", 1200),
    };
  }
  if (Array.isArray(value)) {
    if (depth >= 2) return `[array:${value.length}]`;
    return value.slice(0, 8).map((item) => summarizeValue(item, depth + 1));
  }
  if (typeof value === "object") {
    if (depth >= 2) return "[object]";
    const entries = Object.entries(value).slice(0, 20);
    return Object.fromEntries(entries.map(([key, entryValue]) => [key, summarizeValue(entryValue, depth + 1)]));
  }
  return String(value);
};

export const previewMeta = (meta = {}) => {
  const summarized = summarizeValue(meta);
  const text = JSON.stringify(summarized);
  if (text.length <= MAX_OBJECT_PREVIEW) return summarized;
  return {
    preview: `${text.slice(0, MAX_OBJECT_PREVIEW)}...<truncated>`,
  };
};

const writeLog = (level, scope, message, meta = {}) => {
  if (!shouldLog(level)) return;

  const entry = {
    timestamp: new Date().toISOString(),
    level,
    scope,
    message,
    ...previewMeta(meta),
  };

  const serialized = JSON.stringify(entry);
  if (level === "error") {
    console.error(serialized);
    return;
  }
  if (level === "warn") {
    console.warn(serialized);
    return;
  }
  console.log(serialized);
};

export const createLogger = (scope) => ({
  debug: (message, meta) => writeLog("debug", scope, message, meta),
  info: (message, meta) => writeLog("info", scope, message, meta),
  warn: (message, meta) => writeLog("warn", scope, message, meta),
  error: (message, meta) => writeLog("error", scope, message, meta),
});
