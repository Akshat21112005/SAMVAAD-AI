import jwt from "jsonwebtoken";
import { createLogger } from "../utils/logger.js";

const logger = createLogger("auth-token");
const genToken = (userId) => {
    const jwtSecret = process.env.JWT_SECRET;

    if (!jwtSecret) {
        const error = new Error("JWT secret is missing");
        logger.error("token:missing_secret", { userId, error });
        throw error;
    }

    try {
        return jwt.sign({ userId }, jwtSecret, { expiresIn: "7d" });
    } catch (error) {
        logger.error("token:sign_failed", { userId, error });
        throw error;
    }
};

export default genToken;
