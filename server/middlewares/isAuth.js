import jwt from "jsonwebtoken";

const isAuth = (req, res, next) => {
    const token = req.cookies?.token;
    const jwtSecret = process.env.JWT_SECRET;

    if (!token) {
        return res.status(401).json({
            message: "Authentication required"
        });
    }

    if (!jwtSecret) {
        return res.status(500).json({
            message: "Authentication service unavailable"
        });
    }

    try {
        const verifyToken = jwt.verify(token, jwtSecret);

        if (!verifyToken?.userId) {
            return res.status(401).json({
                message: "Invalid authentication token"
            });
        }

        req.userId = verifyToken.userId;

        return next();
    } catch (error) {
        return res.status(401).json({
            message: "Invalid or expired authentication token"
        });
    }
};

export default isAuth;
