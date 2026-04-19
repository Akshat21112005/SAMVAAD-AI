import mongoose from "mongoose";

const questionSchema = new mongoose.Schema(
  {
    id: String,
    question: String,
    type: String,
    difficulty: String,
    weightage: Number,
    expectedKeyPoints: [String],
    timeAllotted: Number,
    followUpQuestions: [String],
    turnType: String,
    parentQuestionId: String,
    selectionReason: String,
  },
  { _id: false }
);

const evaluationSchema = new mongoose.Schema(
  {
    score: Number,
    percentageScore: Number,
    sentiment: String,
    keyStrengths: [String],
    missedPoints: [String],
    detailedFeedback: String,
    suggestedIdealAnswer: String,
    voiceScript: String,
    correctness: Number,
    timeComplexityScore: Number,
    spaceComplexityScore: Number,
    codeQuality: Number,
    edgeCaseHandling: Number,
    timeManagementScore: Number,
    namingScore: Number,
    totalScore: Number,
    detectedTimeComplexity: String,
    detectedSpaceComplexity: String,
    correctnessVerdict: String,
    acceptedTestCases: Number,
    totalTestCases: Number,
    hasAutomatedJudge: Boolean,
    codeIssues: [String],
    improvements: [String],
    optimalApproach: String,
  },
  { _id: false, strict: false }
);

const dsaProblemSchema = new mongoose.Schema(
  {
    id: String,
    title: String,
    statement: String,
    difficulty: String,
    topics: [String],
    constraints: [String],
    sampleInput: String,
    sampleOutput: String,
    timeLimitSeconds: Number,
    starterCode: { type: Object, default: {} },
    hints: [String],
    companies: [String],
  },
  { _id: false }
);

const interviewSessionSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: ["dsa", "hr", "tech", "system-design", "behavioural", "aptitude"],
      required: true,
    },
    status: {
      type: String,
      enum: ["active", "completed", "abandoned"],
      default: "completed",
    },
    difficulty: {
      type: String,
      default: "medium",
    },
    jobRole: {
      type: String,
      default: "Software Engineer",
    },
    candidateName: {
      type: String,
      default: "",
    },
    maxQuestions: {
      type: Number,
      default: 10,
    },
    currentQuestionIndex: {
      type: Number,
      default: 0,
    },
    totalScore: {
      type: Number,
      default: 0,
    },
    timeTaken: {
      type: Number,
      default: 0,
    },
    timedOut: {
      type: Boolean,
      default: false,
    },
    questionCount: {
      type: Number,
      default: 0,
    },
    questionsAnswered: {
      type: Number,
      default: 0,
    },
    questions: {
      type: [questionSchema],
      default: [],
    },
    questionPool: {
      type: [questionSchema],
      default: [],
    },
    askedQuestionIds: {
      type: [String],
      default: [],
    },
    currentQuestion: {
      type: questionSchema,
      default: null,
    },
    answers: {
      type: Map,
      of: String,
      default: {},
    },
    evaluations: {
      type: Map,
      of: evaluationSchema,
      default: {},
    },
    roleResearch: {
      type: Object,
      default: {},
    },
    memory: {
      type: Object,
      default: {},
    },
    metadata: {
      type: Object,
      default: {},
    },
    feedback: {
      type: String,
      default: "",
    },
    voiceScript: {
      type: String,
      default: "",
    },
    audioUrl: {
      type: String,
      default: "",
    },
    problem: dsaProblemSchema,
    code: {
      type: String,
      default: "",
    },
    language: {
      type: String,
      default: "",
    },
    timeUsed: {
      type: Number,
      default: 0,
    },
    completedAt: Date,
  },
  { timestamps: true, versionKey: false }
);

interviewSessionSchema.index({ user: 1, status: 1, updatedAt: -1 });
interviewSessionSchema.index({ user: 1, completedAt: -1, createdAt: -1 });
interviewSessionSchema.index({ status: 1, updatedAt: -1 });

const InterviewSession = mongoose.model("InterviewSession", interviewSessionSchema);

export default InterviewSession;
