import "dotenv/config";
import express from "express";
import mongoose from "mongoose";
import connectDB, { isDbConnected } from "./config/connectDb.js";
import cookieParser from "cookie-parser";
import cors from "cors";
import authRouter from "./routes/auth.route.js";
import userRouter from "./routes/user.route.js";
import aiRouter from "./routes/ai.route.js";
import dsaRouter from "./routes/dsa.route.js";
import reportRouter from "./routes/report.route.js";
import { rateLimiter } from "./middlewares/rateLimiter.js";
import { attachRequestContext, logHttpRequests } from "./middlewares/requestLogger.js";
import { createLogger } from "./utils/logger.js";

const app = express();
const logger = createLogger("server");
const PORT = Number(process.env.PORT || 8000);
const CLIENT_URL = process.env.CLIENT_URL || "http://localhost:5173";
const JSON_LIMIT = process.env.JSON_LIMIT || "512kb";

app.disable("x-powered-by");
app.set("trust proxy", 1);

app.use(cors({
    origin: CLIENT_URL,
    credentials: true
}));

app.use((req, res, next) => {
    res.setHeader("X-Frame-Options", "DENY");
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
    next();
});

app.use(rateLimiter({ keyPrefix: "global", max: 150, windowMs: 60_000 }));
app.use(express.json({ limit: JSON_LIMIT }));
app.use(express.urlencoded({ extended: true, limit: JSON_LIMIT }));
app.use(cookieParser());
app.use(attachRequestContext);
app.use(logHttpRequests);

app.get("/health", (req, res) => {
    return res.status(isDbConnected() ? 200 : 503).json({
        ok: isDbConnected(),
        uptimeSeconds: Math.round(process.uptime()),
    });
});

app.use("/api/auth", authRouter);
app.use("/api/user", userRouter);
app.use("/api/ai", aiRouter);
app.use("/api/dsa", dsaRouter);
app.use("/api/report", reportRouter);

app.get("/", (req, res) => {
    return res.json({ message: "Server is running!" });
});

app.use((error, req, res, next) => {
    logger.error("server:unhandled_error", {
        requestId: req?.requestId || null,
        path: req?.originalUrl || null,
        error,
    });

    if (res.headersSent) {
        return next(error);
    }

    return res.status(500).json({
        message: "Internal server error",
        requestId: req?.requestId || null,
    });
});

const shutdown = async (server, signal) => {
    logger.info("server:shutdown_started", { signal });
    await new Promise((resolve) => server.close(resolve));
    await mongoose.connection.close();
    logger.info("server:shutdown_complete", { signal });
    process.exit(0);
};

const bootstrap = async () => {
    await connectDB();

    const server = app.listen(PORT, () => {
        logger.info("server:listening", { port: PORT, clientUrl: CLIENT_URL, jsonLimit: JSON_LIMIT });
    });

    server.keepAliveTimeout = Number(process.env.KEEP_ALIVE_TIMEOUT_MS || 65_000);
    server.headersTimeout = Number(process.env.HEADERS_TIMEOUT_MS || 66_000);
    server.requestTimeout = Number(process.env.REQUEST_TIMEOUT_MS || 30_000);

    process.on("SIGTERM", () => {
        shutdown(server, "SIGTERM").catch((error) => {
            logger.error("server:shutdown_failed", { signal: "SIGTERM", error });
            process.exit(1);
        });
    });

    process.on("SIGINT", () => {
        shutdown(server, "SIGINT").catch((error) => {
            logger.error("server:shutdown_failed", { signal: "SIGINT", error });
            process.exit(1);
        });
    });
};

bootstrap().catch((error) => {
    logger.error("server:bootstrap_failed", { error });
    process.exit(1);
});
