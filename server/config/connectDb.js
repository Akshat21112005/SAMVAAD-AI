import mongoose from "mongoose";
import { createLogger } from "../utils/logger.js";

let lastDbError = null;
let connectPromise = null;
const logger = createLogger("db");

mongoose.set("strictQuery", true);
mongoose.set("bufferCommands", false);

const readInt = (value, fallback) => {
    const parsed = Number.parseInt(value, 10);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
};

const buildMongoOptions = () => ({
    maxPoolSize: readInt(process.env.MONGO_MAX_POOL_SIZE, 120),
    minPoolSize: readInt(process.env.MONGO_MIN_POOL_SIZE, 10),
    maxIdleTimeMS: readInt(process.env.MONGO_MAX_IDLE_MS, 30_000),
    serverSelectionTimeoutMS: readInt(process.env.MONGO_SERVER_SELECTION_TIMEOUT_MS, 7_500),
    socketTimeoutMS: readInt(process.env.MONGO_SOCKET_TIMEOUT_MS, 45_000),
    autoIndex: String(process.env.MONGO_AUTO_INDEX || "false").toLowerCase() === "true",
});

let listenersBound = false;
const bindConnectionListeners = () => {
    if (listenersBound) return;
    listenersBound = true;

    mongoose.connection.on("error", (error) => {
        lastDbError = error;
        logger.error("mongodb:error", { error });
    });

    mongoose.connection.on("disconnected", () => {
        logger.warn("mongodb:disconnected");
    });

    mongoose.connection.on("reconnected", () => {
        lastDbError = null;
        logger.info("mongodb:reconnected", {
            host: mongoose.connection.host,
            name: mongoose.connection.name,
        });
    });
};

const connectDB = async () => {
    bindConnectionListeners();

    if (mongoose.connection.readyState === 1) {
        return mongoose.connection;
    }

    if (connectPromise) {
        return connectPromise;
    }

    try {
        const mongoUri = process.env.MONGO_URI || process.env.MONGO_URL;

        if (!mongoUri) {
            throw new Error("Missing MongoDB connection string. Set MONGO_URI or MONGO_URL in server/.env");
        }

        connectPromise = mongoose.connect(mongoUri, buildMongoOptions())
            .then((connection) => {
                lastDbError = null;
                logger.info("mongodb:connected", {
                    host: mongoose.connection.host,
                    name: mongoose.connection.name,
                    maxPoolSize: connection.connections?.[0]?.client?.options?.maxPoolSize || null,
                });
                return connection.connection;
            })
            .catch((error) => {
                lastDbError = error;
                logger.error("mongodb:connection_failed", { error });
                throw error;
            })
            .finally(() => {
                connectPromise = null;
            });

        return await connectPromise;
    } catch (error) {
        lastDbError = error;
        logger.error("mongodb:connection_failed", { error });
        throw error;
    }
};

export const isDbConnected = () => mongoose.connection.readyState === 1;

export const getLastDbError = () => lastDbError?.message || null;

export default connectDB;
