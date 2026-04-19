import { createLogger, makeRequestId, previewMeta } from "../utils/logger.js";

const requestLogger = createLogger("http");

const summarizeBody = (body = {}) => {
  if (!body || typeof body !== "object") return body;

  const summarized = { ...body };

  if (typeof body.answer === "string") {
    summarized.answer = { length: body.answer.length };
  }
  if (typeof body.code === "string") {
    summarized.code = { length: body.code.length };
  }
  if (Array.isArray(body.questions)) {
    summarized.questions = { count: body.questions.length };
  }
  if (body.answers && typeof body.answers === "object") {
    summarized.answers = { count: Object.keys(body.answers).length };
  }
  if (body.evaluations && typeof body.evaluations === "object") {
    summarized.evaluations = { count: Object.keys(body.evaluations).length };
  }

  return summarized;
};

export const attachRequestContext = (req, res, next) => {
  const requestId = req.headers["x-request-id"] || makeRequestId();
  req.requestId = requestId;
  res.setHeader("X-Request-Id", requestId);
  next();
};

export const logHttpRequests = (req, res, next) => {
  const startedAt = Date.now();

    requestLogger.info("request:start", {
      requestId: req.requestId,
      method: req.method,
      path: req.originalUrl,
      query: previewMeta(req.query || {}),
      body: previewMeta(summarizeBody(req.body || {})),
      userId: req.userId || null,
    });

  res.on("finish", () => {
    requestLogger.info("request:finish", {
      requestId: req.requestId,
      method: req.method,
      path: req.originalUrl,
      statusCode: res.statusCode,
      durationMs: Date.now() - startedAt,
      userId: req.userId || null,
    });
  });

  next();
};
