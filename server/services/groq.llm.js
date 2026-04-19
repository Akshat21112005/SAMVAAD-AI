import { ChatGroq } from "@langchain/groq";
import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import { createLogger, previewText } from "../utils/logger.js";

const logger = createLogger("groq-llm");
const clientCache = new Map();
const waitQueue = [];
let activeCalls = 0;

const MAX_CONCURRENCY = Number(process.env.GROQ_MAX_CONCURRENCY || 24);
const MAX_QUEUE_SIZE = Number(process.env.GROQ_MAX_QUEUE_SIZE || 300);
const REQUEST_TIMEOUT_MS = Number(process.env.GROQ_TIMEOUT_MS || 18_000);

class QueueSaturatedError extends Error {
  constructor() {
    super("Groq queue is saturated");
    this.name = "QueueSaturatedError";
  }
}

const toText = (content) => {
  if (typeof content === "string") return content;
  if (Array.isArray(content)) {
    return content.map((c) => (typeof c === "string" ? c : c?.text || "")).join("");
  }
  return String(content ?? "");
};

const getGroqClient = ({ apiKey, modelName, maxTokens }) => {
  const cacheKey = `${modelName}:${maxTokens}`;
  if (!clientCache.has(cacheKey)) {
    clientCache.set(
      cacheKey,
      new ChatGroq({
        apiKey,
        model: modelName,
        temperature: 0.2,
        maxTokens,
      })
    );
  }
  return clientCache.get(cacheKey);
};

const releaseQueueSlot = () => {
  activeCalls = Math.max(0, activeCalls - 1);
  const next = waitQueue.shift();
  if (next) next();
};

const acquireQueueSlot = async () => {
  if (activeCalls < MAX_CONCURRENCY) {
    activeCalls += 1;
    return;
  }

  if (waitQueue.length >= MAX_QUEUE_SIZE) {
    throw new QueueSaturatedError();
  }

  await new Promise((resolve) => waitQueue.push(resolve));
  activeCalls += 1;
};

const withTimeout = (promise, timeoutMs) =>
  new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error(`Groq request timed out after ${timeoutMs}ms`));
    }, timeoutMs);

    promise
      .then((value) => {
        clearTimeout(timer);
        resolve(value);
      })
      .catch((error) => {
        clearTimeout(timer);
        reject(error);
      });
  });

export const invokeGroqText = async ({ system, prompt, maxTokens = 2000 }) => {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    logger.warn("groq:missing_api_key");
    return null;
  }

  const modelName = process.env.GROQ_MODEL || "llama-3.3-70b-versatile";
  const startedAt = Date.now();

  logger.debug("groq:invoke_start", {
    model: modelName,
    maxTokens,
    systemPreview: previewText(system),
    promptPreview: previewText(prompt),
    activeCalls,
    queuedCalls: waitQueue.length,
  });

  let acquired = false;
  try {
    await acquireQueueSlot();
    acquired = true;
    const model = getGroqClient({ apiKey, modelName, maxTokens });
    const response = await withTimeout(
      model.invoke([new SystemMessage(system), new HumanMessage(prompt)]),
      REQUEST_TIMEOUT_MS
    );
    const text = toText(response.content);
    logger.debug("groq:invoke_success", {
      model: modelName,
      durationMs: Date.now() - startedAt,
      outputPreview: previewText(text),
    });
    return text;
  } catch (error) {
    logger.error("groq:invoke_failed", {
      model: modelName,
      durationMs: Date.now() - startedAt,
      error,
    });
    throw error;
  } finally {
    if (acquired) {
      releaseQueueSlot();
    }
  }
};

export { QueueSaturatedError };
