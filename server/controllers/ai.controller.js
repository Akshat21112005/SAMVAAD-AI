import { nanoid } from "nanoid";
import {
  evaluateAnswer,
  evaluateDsaSolution,
  generateInterviewQuestions,
  generateSessionFeedback,
  persistSession,
} from "../services/ai.service.js";
import {
  finishInterviewSession,
  startInterviewSession,
  submitInterviewAnswer,
} from "../services/interviewFlow.service.js";
import { runOnlineJudge } from "../services/onlineJudge.service.js";
import { createLogger, previewText } from "../utils/logger.js";

const logger = createLogger("ai-controller");

export const generateInterviewQuestionsController = async (req, res) => {
  try {
    const { interviewType = "hr", difficulty = "medium", jobRole = "Software Engineer" } = req.body;
    logger.info("generate_questions:start", {
      requestId: req.requestId,
      userId: req.userId,
      interviewType,
      difficulty,
      jobRole,
    });
    const questions = await generateInterviewQuestions(interviewType, difficulty, jobRole);

    logger.info("generate_questions:success", {
      requestId: req.requestId,
      count: questions.length,
    });
    return res.status(200).json({
      questions,
      creditsRemaining: req.updatedUser?.credits,
    });
  } catch (error) {
    logger.error("generate_questions:failed", { requestId: req.requestId, error });
    return res.status(500).json({
      message: "Unable to generate interview questions right now.",
    });
  }
};

export const startInterviewSessionController = async (req, res) => {
  try {
    const { interviewType = "hr", difficulty = "medium", jobRole = "Software Engineer" } = req.body;
    logger.info("interview_start:start", {
      requestId: req.requestId,
      userId: req.userId,
      interviewType,
      difficulty,
      jobRole,
    });
    const result = await startInterviewSession({
      userId: req.userId,
      interviewType,
      difficulty,
      jobRole,
    });

    logger.info("interview_start:success", {
      requestId: req.requestId,
      sessionId: result?.session?.sessionId,
      questionPoolSize: result?.session?.questionPool?.length,
    });
    return res.status(200).json({
      ...result,
      creditsRemaining: req.updatedUser?.credits,
    });
  } catch (error) {
    logger.error("interview_start:failed", { requestId: req.requestId, error });
    return res.status(500).json({
      message: "Unable to start the interview session right now.",
    });
  }
};

export const submitInterviewAnswerController = async (req, res) => {
  try {
    const { sessionId, answer = "", timeTaken = 0, timedOut = false } = req.body;
    logger.info("interview_answer:start", {
      requestId: req.requestId,
      userId: req.userId,
      sessionId,
      timeTaken,
      timedOut,
      answerPreview: previewText(answer),
    });
    const result = await submitInterviewAnswer({
      userId: req.userId,
      sessionId,
      answer,
      timeTaken,
      timedOut,
    });

    logger.info("interview_answer:success", {
      requestId: req.requestId,
      sessionId,
      complete: result?.complete,
      nextQuestionId: result?.session?.currentQuestion?.id || null,
    });
    return res.status(200).json({
      ...result,
      creditsRemaining: req.updatedUser?.credits,
    });
  } catch (error) {
    logger.error("interview_answer:failed", { requestId: req.requestId, error, sessionId: req.body?.sessionId });
    return res.status(500).json({
      message: "Unable to submit this answer right now.",
    });
  }
};

export const finishInterviewSessionController = async (req, res) => {
  try {
    const { sessionId, timeTaken = 0, timedOut = false } = req.body;
    logger.info("interview_finish:start", {
      requestId: req.requestId,
      userId: req.userId,
      sessionId,
      timeTaken,
      timedOut,
    });
    const result = await finishInterviewSession({
      userId: req.userId,
      sessionId,
      timeTaken,
      timedOut,
    });

    logger.info("interview_finish:success", {
      requestId: req.requestId,
      sessionId,
      totalScore: result?.session?.totalScore,
    });
    return res.status(200).json({
      ...result,
      creditsRemaining: req.updatedUser?.credits,
    });
  } catch (error) {
    logger.error("interview_finish:failed", { requestId: req.requestId, error, sessionId: req.body?.sessionId });
    return res.status(500).json({
      message: "Unable to finish the interview session right now.",
    });
  }
};

export const evaluateSingleAnswerController = async (req, res) => {
  try {
    const {
      question,
      answer,
      interviewType = "hr",
      jobRole = "Software Engineer",
      questionWeightage = 10,
      expectedKeyPoints = [],
      plannedFollowUps = [],
    } = req.body;

    logger.info("evaluate_answer:start", {
      requestId: req.requestId,
      userId: req.userId,
      interviewType,
      jobRole,
      questionPreview: previewText(question),
      answerPreview: previewText(answer),
    });
    const evaluation = await evaluateAnswer({
      question,
      answer,
      interviewType,
      jobRole,
      questionWeightage,
      expectedKeyPoints,
      plannedFollowUps,
    });

    logger.info("evaluate_answer:success", {
      requestId: req.requestId,
      percentageScore: evaluation?.percentageScore,
      score: evaluation?.score,
    });
    return res.status(200).json({
      evaluation,
      creditsRemaining: req.updatedUser?.credits,
    });
  } catch (error) {
    logger.error("evaluate_answer:failed", { requestId: req.requestId, error });
    return res.status(500).json({
      message: "Unable to evaluate the answer right now.",
    });
  }
};

export const evaluateDsaSolutionController = async (req, res) => {
  try {
    const {
      problem,
      code,
      language,
      timeUsed = 0,
      timedOut = false,
      difficulty = problem?.difficulty || "medium",
      jobRole = "Software Engineer",
    } = req.body;

    logger.info("evaluate_dsa:start", {
      requestId: req.requestId,
      userId: req.userId,
      language,
      difficulty,
      jobRole,
      problemId: problem?.id,
      problemTitle: problem?.title,
      timeUsed,
      timedOut,
    });
    const testRun = await runOnlineJudge({
      problemId: problem?.id,
      language,
      code,
    });

    const evaluation = await evaluateDsaSolution({
      problem,
      code,
      language,
      timeUsed,
      timedOut,
      testRun,
    });

    const feedback = await generateSessionFeedback({
      type: "dsa",
      totalScore: evaluation.totalScore,
      questionsAnswered: 1,
      timeTaken: Math.round((timeUsed || 0) / 60),
      evaluations: { dsa: evaluation },
    });

    const session = await persistSession({
      user: req.userId,
      type: "dsa",
      status: "completed",
      difficulty,
      jobRole,
      totalScore: evaluation.totalScore,
      timeTaken: timeUsed,
      timeUsed,
      timedOut,
      questionCount: 1,
      questionsAnswered: 1,
      questions: [],
      answers: {},
      evaluations: { dsa: evaluation },
      feedback,
      voiceScript: evaluation.voiceScript || feedback,
      audioUrl: "",
      problem,
      code,
      language,
      completedAt: new Date(),
    });

    logger.info("evaluate_dsa:success", {
      requestId: req.requestId,
      sessionId: session?._id,
      totalScore: evaluation?.totalScore,
      passed: evaluation?.automatedTestsPassed,
      total: evaluation?.automatedTestsTotal,
    });
    return res.status(200).json({
      evaluation,
      feedback,
      sessionId: session._id,
      session,
      creditsRemaining: req.updatedUser?.credits,
    });
  } catch (error) {
    logger.error("evaluate_dsa:failed", { requestId: req.requestId, error });
    return res.status(500).json({
      message: "Unable to evaluate the DSA solution right now.",
    });
  }
};

export const generateSessionFeedbackController = async (req, res) => {
  try {
    const {
      type = "hr",
      difficulty = "medium",
      jobRole = "Software Engineer",
      questions = [],
      answers = {},
      evaluations = {},
      timeTaken = 0,
      timedOut = false,
    } = req.body;

    logger.info("session_feedback:start", {
      requestId: req.requestId,
      userId: req.userId,
      type,
      difficulty,
      jobRole,
      questionCount: questions.length,
      answerCount: Object.keys(answers || {}).length,
      timedOut,
    });
    const totalScore = Object.values(evaluations || {}).reduce(
      (sum, item) => sum + (Number(item?.score) || 0),
      0
    );

    const feedback = await generateSessionFeedback({
      type,
      totalScore,
      questionsAnswered: Object.keys(answers || {}).length,
      timeTaken: Math.round((timeTaken || 0) / 60),
      evaluations,
    });

    const session = await persistSession({
      user: req.userId,
      type,
      status: "completed",
      difficulty,
      jobRole,
      totalScore,
      timeTaken,
      timedOut,
      questionCount: questions.length,
      questionsAnswered: Object.keys(answers || {}).length,
      questions,
      answers,
      evaluations,
      feedback,
      voiceScript: feedback,
      audioUrl: "",
      completedAt: new Date(),
    });

    logger.info("session_feedback:success", {
      requestId: req.requestId,
      sessionId: session?._id,
      totalScore,
    });
    return res.status(200).json({
      sessionId: session._id || nanoid(),
      feedback,
      session,
      creditsRemaining: req.updatedUser?.credits,
    });
  } catch (error) {
    logger.error("session_feedback:failed", { requestId: req.requestId, error });
    return res.status(500).json({
      message: "Unable to generate feedback right now.",
    });
  }
};
