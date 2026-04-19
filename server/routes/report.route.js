import express from "express";
import isAuth from "../middlewares/isAuth.js";
import { getSessionReportPdf } from "../controllers/report.controller.js";
import { rateLimiter } from "../middlewares/rateLimiter.js";

const reportRouter = express.Router();

reportRouter.use(isAuth);
reportRouter.use(rateLimiter({ keyPrefix: "report", max: 20, windowMs: 60_000 }));
reportRouter.get("/:sessionId/pdf", getSessionReportPdf);

export default reportRouter;
