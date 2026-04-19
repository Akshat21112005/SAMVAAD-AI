const buckets = new Map();
const MAX_BUCKETS = Number(process.env.RATE_LIMIT_MAX_BUCKETS || 50_000);
let lastSweepAt = 0;

const readClientIp = (req) => {
  const forwarded = req.headers["x-forwarded-for"];
  if (typeof forwarded === "string" && forwarded.trim()) {
    return forwarded.split(",")[0].trim();
  }
  return req.ip || req.socket?.remoteAddress || "unknown";
};

const sweepExpiredBuckets = (now) => {
  if (now - lastSweepAt < 60_000) return;
  lastSweepAt = now;

  for (const [key, value] of buckets.entries()) {
    if (!value || now > value.resetAt) {
      buckets.delete(key);
    }
  }

  if (buckets.size <= MAX_BUCKETS) return;

  const overflow = buckets.size - MAX_BUCKETS;
  let removed = 0;
  for (const [key, value] of buckets.entries()) {
    if (!value || now > value.resetAt) {
      buckets.delete(key);
      removed += 1;
    }
    if (removed >= overflow) break;
  }
};

export const rateLimiter = ({ keyPrefix = "global", windowMs = 60_000, max = 60 } = {}) => {
  return (req, res, next) => {
    const now = Date.now();
    sweepExpiredBuckets(now);

    const identity = `${keyPrefix}:${readClientIp(req)}:${req.userId || "guest"}`;
    const current = buckets.get(identity);

    if (!current || now > current.resetAt) {
      buckets.set(identity, {
        count: 1,
        resetAt: now + windowMs,
      });
      res.setHeader("X-RateLimit-Limit", max);
      res.setHeader("X-RateLimit-Remaining", Math.max(0, max - 1));
      res.setHeader("X-RateLimit-Reset", now + windowMs);
      return next();
    }

    if (current.count >= max) {
      res.setHeader("Retry-After", Math.ceil((current.resetAt - now) / 1000));
      return res.status(429).json({
        message: "Too many requests, please slow down.",
        retryAfterMs: current.resetAt - now,
      });
    }

    current.count += 1;
    buckets.set(identity, current);
    res.setHeader("X-RateLimit-Limit", max);
    res.setHeader("X-RateLimit-Remaining", Math.max(0, max - current.count));
    res.setHeader("X-RateLimit-Reset", current.resetAt);
    return next();
  };
};
