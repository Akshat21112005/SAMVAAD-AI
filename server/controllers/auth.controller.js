import genToken from "../config/token.js";
import { getLastDbError, isDbConnected } from "../config/connectDb.js";
import User from "../models/user.model.js";

const isProduction = () => process.env.NODE_ENV === "production";

export const googleAuth = async (req, res) => {
    try {
        if (!isDbConnected()) {
            return res.status(500).json({
                message: "Database connection failed",
                dbError: getLastDbError() || "MongoDB is not connected"
            });
        }

        const { name, email } = req.body;

        if (!name || !email) {
            return res.status(400).json({
                message: "Name and email are required"
            });
        }

        const user = await User.findOneAndUpdate(
            { email },
            {
                $set: { name },
                $setOnInsert: { email }
            },
            {
                returnDocument: "after",
                upsert: true
            }
        );

        const token = genToken(user._id);

        res.cookie("token", token, {
            httpOnly: true,
            secure: isProduction(),
            sameSite: isProduction() ? "none" : "strict",
            maxAge: 7 * 24 * 60 * 60 * 1000
        });

        return res.status(200).json(user);
    } catch (error) {
        return res.status(500).json({
            message: "Sign-in failed. Please try again.",
            dbError: getLastDbError()
        });
    }
};

export const logOut = async (req, res) => {
    try {
        res.clearCookie("token");
        return res.status(200).json({ message: "LogOut Successfully" });
    } catch (error) {
        return res.status(500).json({
            message: `Google logout error ${error.message || error}`
        });
    }
};
