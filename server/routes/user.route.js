import express from "express";
import isAuth from "../middlewares/isAuth.js";
import {
  addCredits,
  getCurrentUser,
  getInterviewHistory,
  getInterviewSession,
} from "../controllers/user.controller.js";

const userRouter = express.Router();

userRouter.get("/current-user", isAuth, getCurrentUser);
userRouter.get("/history", isAuth, getInterviewHistory);
userRouter.get("/history/:sessionId", isAuth, getInterviewSession);
userRouter.post("/credits/topup", isAuth, addCredits);

export default userRouter;
