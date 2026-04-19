import { getProblems, getRandomProblem } from "../services/ai.service.js";
import { runOnlineJudge } from "../services/onlineJudge.service.js";
import { getJudgeCapabilities } from "../services/judgeCapabilities.service.js";

export const fetchRandomProblem = async (req, res) => {
  try {
    const problem = await getRandomProblem({
      difficulty: req.query.difficulty || "medium",
      topic: req.query.topic,
      source: req.query.source || "mixed",
      jobRole: req.query.jobRole || "Software Engineer",
      requireJudge: String(req.query.requireJudge || "").toLowerCase() === "true",
    });

    return res.status(200).json({ problem });
  } catch (error) {
    return res.status(500).json({
      message: "Unable to load a coding problem right now.",
    });
  }
};

export const fetchProblems = async (req, res) => {
  try {
    const problems = getProblems({ difficulty: req.query.difficulty });
    return res.status(200).json({
      problems,
      count: problems.length,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Unable to load coding problems right now.",
    });
  }
};

export const fetchAllProblems = async (req, res) => {
  const problems = getProblems({});
  return res.status(200).json({
    problems,
    count: problems.length,
  });
};

export const runDsaTestsController = async (req, res) => {
  try {
    const { problemId, language, code } = req.body || {};
    if (!problemId || !language) {
      return res.status(400).json({ message: "problemId and language are required." });
    }
    const result = await runOnlineJudge({ problemId, language, code: code || "" });
    return res.status(200).json(result);
  } catch (error) {
    return res.status(500).json({
      message: "Test run failed. Please try again.",
    });
  }
};

export const fetchJudgeCapabilitiesController = async (req, res) => {
  try {
    const capabilities = await getJudgeCapabilities();
    return res.status(200).json({ capabilities });
  } catch (error) {
    return res.status(500).json({
      message: "Judge capabilities are unavailable right now.",
    });
  }
};
