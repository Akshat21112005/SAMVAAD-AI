import express from "express";
import isAuth from "../middlewares/isAuth.js";
import {
  evaluateDsaSolutionController,
  evaluateSingleAnswerController,
  finishInterviewSessionController,
  generateInterviewQuestionsController,
  generateSessionFeedbackController,
  startInterviewSessionController,
  submitInterviewAnswerController,
} from "../controllers/ai.controller.js";
import { postTts } from "../controllers/tts.controller.js";
import { creditsMiddleware } from "../middlewares/credits.middleware.js";
import { rateLimiter } from "../middlewares/rateLimiter.js";

const aiRouter = express.Router();

aiRouter.use(isAuth);
aiRouter.use(rateLimiter({ keyPrefix: "ai", max: 25, windowMs: 60_000 }));

aiRouter.post(
  "/interview/start",
  creditsMiddleware("interview-start"),
  startInterviewSessionController
);
aiRouter.post(
  "/interview/answer",
  creditsMiddleware("interview-answer"),
  submitInterviewAnswerController
);
aiRouter.post(
  "/interview/finish",
  creditsMiddleware("interview-finish"),
  finishInterviewSessionController
);
aiRouter.post(
  "/generate-questions",
  creditsMiddleware("generate-questions"),
  generateInterviewQuestionsController
);
aiRouter.post(
  "/evaluate-answer",
  creditsMiddleware("evaluate-answer"),
  evaluateSingleAnswerController
);
aiRouter.post(
  "/evaluate-dsa",
  creditsMiddleware("evaluate-dsa"),
  evaluateDsaSolutionController
);
aiRouter.post(
  "/session-feedback",
  creditsMiddleware("session-feedback"),
  generateSessionFeedbackController
);
aiRouter.post("/tts", postTts);

export default aiRouter;
