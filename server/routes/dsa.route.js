import express from "express";
import isAuth from "../middlewares/isAuth.js";
import {
  fetchAllProblems,
  fetchJudgeCapabilitiesController,
  fetchProblems,
  fetchRandomProblem,
  runDsaTestsController,
} from "../controllers/dsa.controller.js";
import { rateLimiter } from "../middlewares/rateLimiter.js";

const dsaRouter = express.Router();

dsaRouter.use(isAuth);
dsaRouter.use(rateLimiter({ keyPrefix: "dsa", max: 80, windowMs: 60_000 }));

dsaRouter.get("/problem", fetchRandomProblem);
dsaRouter.get("/problems", fetchProblems);
dsaRouter.get("/all", fetchAllProblems);
dsaRouter.get("/capabilities", fetchJudgeCapabilitiesController);
dsaRouter.post("/run-tests", runDsaTestsController);

export default dsaRouter;
