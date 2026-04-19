import InterviewSession from "../models/session.model.js";
import User from "../models/user.model.js";
import {
  areQuestionsTooSimilar,
  buildInterviewQuestionPool,
  chooseNextInterviewQuestion,
  evaluateAnswer,
  generateSessionFeedback,
  summarizeIntroMemory,
} from "./ai.service.js";
import { createLogger, previewText } from "../utils/logger.js";

const MAX_DYNAMIC_QUESTIONS = 10;
const logger = createLogger("interview-flow");

const toPlainMap = (value) => {
  if (!value) return {};
  if (value instanceof Map) return Object.fromEntries(value.entries());
  if (typeof value.toObject === "function") return value.toObject();
  return { ...value };
};

const unique = (items = []) => [...new Set(items.filter(Boolean))];

const buildIntroQuestion = ({ candidateName, jobRole, interviewType }) => ({
  id: `${interviewType}-intro-1`,
  type: interviewType,
  difficulty: "warmup",
  weightage: 8,
  timeAllotted: 180,
  turnType: "intro",
  question: `Let's start with you, ${candidateName}. Give me a concise introduction, the kind of work you've been doing recently, and why ${jobRole} is the right next step for you.`,
  expectedKeyPoints: [
    "Current role or recent experience",
    "Relevant strengths",
    "Motivation for this role",
  ],
  followUpQuestions: [
    `Which part of your background is most relevant to ${jobRole}?`,
    "What should I remember most about your profile?",
  ],
});

const buildFollowUpQuestion = ({ baseQuestion, followUpQuestion, questionIndex }) => ({
  id: `${baseQuestion.id}-followup-${questionIndex + 1}`,
  type: baseQuestion.type,
  difficulty: baseQuestion.difficulty,
  weightage: Math.max(4, Math.round((baseQuestion.weightage || 8) * 0.45)),
  timeAllotted: Math.max(90, Math.round((baseQuestion.timeAllotted || 150) * 0.65)),
  expectedKeyPoints: baseQuestion.expectedKeyPoints || [],
  followUpQuestions: [],
  turnType: "follow-up",
  parentQuestionId: baseQuestion.id,
  question: followUpQuestion,
});

const countWords = (value = "") => String(value).trim().split(/\s+/).filter(Boolean).length;

const updatePendingFocusAreas = ({ memory = {}, evaluation, currentQuestion, roleResearch = {} }) => {
  const pending = unique([
    ...(memory.pendingFocusAreas || []),
    ...(roleResearch.focusAreas || []),
  ]);

  const strengths = unique([
    ...(evaluation?.keyStrengths || []),
    currentQuestion?.question || "",
  ]).join(" ").toLowerCase();
  const nextPending = pending.filter((item) => !strengths.includes(String(item).toLowerCase()));

  return unique([...nextPending, ...(evaluation?.missedPoints || [])]).slice(0, 8);
};

const formatSessionForClient = (session) => ({
  sessionId: session._id,
  type: session.type,
  status: session.status,
  difficulty: session.difficulty,
  jobRole: session.jobRole,
  candidateName: session.candidateName,
  maxQuestions: session.maxQuestions,
  currentQuestionIndex: session.currentQuestionIndex,
  currentQuestion: session.currentQuestion,
  questions: session.questions,
  roleResearch: session.roleResearch,
  memory: session.memory,
  metadata: session.metadata,
  answers: toPlainMap(session.answers),
  evaluations: toPlainMap(session.evaluations),
  totalScore: session.totalScore,
  feedback: session.feedback,
});

async function finalizeInterviewSession(session, { timeTaken = 0, timedOut = false } = {}) {
  const answers = toPlainMap(session.answers);
  const evaluations = toPlainMap(session.evaluations);
  const rawScore = Object.values(evaluations).reduce(
    (sum, item) => sum + (Number(item?.score) || 0),
    0
  );
  const answeredQuestionIds = new Set(Object.keys(answers));
  const maxPossibleScore =
    (session.questions || [])
      .filter((question) => answeredQuestionIds.has(question.id))
      .reduce((sum, question) => sum + (Number(question?.weightage) || 0), 0) || 1;
  const totalScore = Math.round((rawScore / maxPossibleScore) * 100);

  const feedback = await generateSessionFeedback({
    type: session.type,
    totalScore,
    questionsAnswered: Object.keys(answers).length,
    timeTaken: Math.round((timeTaken || 0) / 60),
    evaluations,
  });

  session.status = "completed";
  session.currentQuestion = null;
  session.timedOut = timedOut;
  session.timeTaken = timeTaken;
  session.totalScore = totalScore;
  session.feedback = feedback;
  session.voiceScript = feedback;
  session.questionCount = session.questions.length;
  session.questionsAnswered = Object.keys(answers).length;
  session.completedAt = new Date();
  await session.save();
  logger.info("interview_session:finalized", {
    sessionId: session._id,
    userId: session.user,
    totalScore,
    timeTaken,
    timedOut,
    questionsAnswered: Object.keys(answers).length,
  });

  return {
    complete: true,
    feedback,
    session: formatSessionForClient(session),
  };
}

export async function startInterviewSession({
  userId,
  interviewType = "hr",
  difficulty = "medium",
  jobRole = "Software Engineer",
}) {
  logger.info("interview_session:start_requested", {
    userId,
    interviewType,
    difficulty,
    jobRole,
  });
  const user = await User.findById(userId).select("name email").lean();
  if (!user) {
    logger.warn("interview_session:user_missing", { userId });
    throw new Error("User not found");
  }

  const { questionPool, roleResearch, metadata } = await buildInterviewQuestionPool({
    interviewType,
    difficulty,
    jobRole,
    desiredPoolSize: 18,
  });

  const introQuestion = buildIntroQuestion({
    candidateName: user.name || "there",
    jobRole,
    interviewType,
  });

  const session = await InterviewSession.create({
    user: userId,
    candidateName: user.name || "",
    type: interviewType,
    status: "active",
    difficulty,
    jobRole,
    maxQuestions: MAX_DYNAMIC_QUESTIONS,
    currentQuestionIndex: 0,
    questionPool,
    currentQuestion: introQuestion,
    askedQuestionIds: [introQuestion.id],
    questions: [introQuestion],
    answers: {},
    evaluations: {},
    roleResearch,
    memory: {
      introSummary: "",
      introSignals: {},
      pendingFocusAreas: (roleResearch?.focusAreas || []).slice(0, 6),
      interviewHighlights: [],
    },
    metadata,
  });
  logger.info("interview_session:started", {
    sessionId: session._id,
    userId,
    interviewType,
    difficulty,
    jobRole,
    questionPoolSize: questionPool.length,
    searchProvider: metadata?.searchProvider,
  });

  return {
    complete: false,
    session: formatSessionForClient(session),
  };
}

export async function submitInterviewAnswer({
  userId,
  sessionId,
  answer,
  timeTaken = 0,
  timedOut = false,
}) {
  logger.info("interview_session:answer_received", {
    userId,
    sessionId,
    timeTaken,
    timedOut,
    answerPreview: previewText(answer),
  });
  const session = await InterviewSession.findOne({
    _id: sessionId,
    user: userId,
    status: "active",
  });

  if (!session) {
    logger.warn("interview_session:active_session_missing", { userId, sessionId });
    throw new Error("Active interview session not found");
  }

  const currentQuestion = session.currentQuestion;
  if (!currentQuestion?.id) {
    logger.warn("interview_session:missing_current_question", { sessionId });
    throw new Error("No active interview question found");
  }

  const evaluation = await evaluateAnswer({
    question: currentQuestion.question,
    answer,
    interviewType: session.type,
    jobRole: session.jobRole,
    questionWeightage: currentQuestion.weightage || 10,
    expectedKeyPoints: currentQuestion.expectedKeyPoints || [],
    plannedFollowUps: currentQuestion.followUpQuestions || [],
  });

  session.answers.set(currentQuestion.id, answer);
  session.evaluations.set(currentQuestion.id, evaluation);
  session.questionsAnswered = session.answers.size;
  session.timeTaken = timeTaken;

  const memory = { ...(session.memory || {}) };
  if (currentQuestion.turnType === "intro") {
    const introSignals = await summarizeIntroMemory({
      candidateName: session.candidateName,
      answer,
      jobRole: session.jobRole,
    });
    memory.introSummary = introSignals.summary;
    memory.introSignals = introSignals;
  }

  memory.pendingFocusAreas = updatePendingFocusAreas({
    memory,
    evaluation,
    currentQuestion,
    roleResearch: session.roleResearch || {},
  });
  memory.interviewHighlights = unique([
    ...(memory.interviewHighlights || []),
    ...(evaluation.keyStrengths || []).slice(0, 2),
    ...(evaluation.missedPoints || []).slice(0, 2),
  ]).slice(0, 10);
  session.memory = memory;
  logger.info("interview_session:answer_evaluated", {
    sessionId,
    currentQuestionId: currentQuestion.id,
    currentQuestionPreview: previewText(currentQuestion.question, 220),
    percentageScore: evaluation?.percentageScore,
    score: evaluation?.score,
    missedPoints: evaluation?.missedPoints || [],
  });

  if (timedOut || session.questionsAnswered >= (session.maxQuestions || MAX_DYNAMIC_QUESTIONS)) {
    logger.info("interview_session:finishing_after_answer", {
      sessionId,
      timedOut,
      questionsAnswered: session.questionsAnswered,
    });
    return finalizeInterviewSession(session, { timeTaken, timedOut });
  }

  let nextQuestion = null;
  const answerWordCount = countWords(answer);
  const followUpPrompt = evaluation?.followUpQuestion || currentQuestion?.followUpQuestions?.[0];
  const shouldAskFollowUp =
    currentQuestion.turnType !== "follow-up" &&
    Number(evaluation?.percentageScore || 0) < 72 &&
    Number(evaluation?.percentageScore || 0) >= 35 &&
    answerWordCount >= 10 &&
    followUpPrompt &&
    !areQuestionsTooSimilar(followUpPrompt, currentQuestion.question);

  if (shouldAskFollowUp) {
    nextQuestion = buildFollowUpQuestion({
      baseQuestion: currentQuestion,
      followUpQuestion: followUpPrompt,
      questionIndex: session.questionsAnswered,
    });
    logger.info("interview_session:followup_selected", {
      sessionId,
      fromQuestionId: currentQuestion.id,
      nextQuestionId: nextQuestion.id,
      nextQuestionPreview: previewText(nextQuestion.question, 220),
    });
  } else {
    const selection = await chooseNextInterviewQuestion({
      questionPool: session.questionPool || [],
      askedQuestionIds: session.askedQuestionIds || [],
      askedQuestions: session.questions || [],
      memory,
      roleResearch: session.roleResearch || {},
      evaluations: toPlainMap(session.evaluations),
      currentQuestionIndex: session.questionsAnswered,
      difficulty: session.difficulty,
      jobRole: session.jobRole,
    });

    if (selection?.question) {
      nextQuestion = {
        ...selection.question,
        turnType: selection.question.turnType || "primary",
        selectionReason: selection.reason || "",
      };
      logger.info("interview_session:next_question_selected", {
        sessionId,
        nextQuestionId: nextQuestion.id,
        nextQuestionPreview: previewText(nextQuestion.question, 220),
        selectionReason: nextQuestion.selectionReason,
      });
    }
  }

  if (!nextQuestion) {
    logger.warn("interview_session:no_next_question", {
      sessionId,
      questionsAnswered: session.questionsAnswered,
    });
    return finalizeInterviewSession(session, { timeTaken, timedOut });
  }

  session.currentQuestion = nextQuestion;
  session.currentQuestionIndex = session.questionsAnswered;
  session.askedQuestionIds = unique([...(session.askedQuestionIds || []), nextQuestion.id]);
  session.questions = [...(session.questions || []), nextQuestion];
  await session.save();
  logger.info("interview_session:advanced", {
    sessionId,
    currentQuestionIndex: session.currentQuestionIndex,
    askedQuestionIds: session.askedQuestionIds,
  });

  return {
    complete: false,
    evaluation,
    session: formatSessionForClient(session),
  };
}

export async function finishInterviewSession({
  userId,
  sessionId,
  timeTaken = 0,
  timedOut = false,
}) {
  logger.info("interview_session:finish_requested", {
    userId,
    sessionId,
    timeTaken,
    timedOut,
  });
  const session = await InterviewSession.findOne({
    _id: sessionId,
    user: userId,
    status: "active",
  });

  if (!session) {
    logger.warn("interview_session:finish_missing_session", { userId, sessionId });
    throw new Error("Active interview session not found");
  }

  return finalizeInterviewSession(session, { timeTaken, timedOut });
}
