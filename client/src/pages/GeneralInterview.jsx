import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { useDispatch } from "react-redux";
import Navbar from "../components/Navbar";
import AnswerBox from "../components/interview/AnswerBox";
import InterviewTimer from "../components/interview/InterviewTimer";
import InterviewVideoPanel from "../components/interview/InterviewVideoPanel";
import { useTimer } from "../hooks/useTimer";
import { getInterviewTheme } from "../lib/interviewThemes";
import { api, getUserFacingApiMessage } from "../services/api";
import { completeSession, setCurrentSession, updateAnswer } from "../redux/interviewSlice";

const TYPE_CONFIG = {
  hr: {
    duration: 30 * 60,
    label: "HR Story Round",
    modeLabel: "STAR response mode",
    paceHint: "Anchor your answer in one real story with context, ownership, and outcome.",
  },
  tech: {
    duration: 40 * 60,
    label: "Technical Concepts",
    modeLabel: "Tradeoff explanation mode",
    paceHint: "Define the concept, compare options, and use a concrete engineering example.",
  },
  "system-design": {
    duration: 60 * 60,
    label: "System Design",
    modeLabel: "Architecture walkthrough mode",
    paceHint: "Clarify assumptions, sketch the baseline design, then scale it intentionally.",
  },
  behavioural: {
    duration: 25 * 60,
    label: "Behavioural Deep Dive",
    modeLabel: "Leadership story mode",
    paceHint: "Surface the tension, your decision, and the learning that changed later behavior.",
  },
  aptitude: {
    duration: 35 * 60,
    label: "Aptitude & Core CS",
    modeLabel: "Precision answer mode",
    paceHint: "Keep answers compact, accurate, and explicit about the core principle in play.",
  },
};

function formatMinutes(seconds) {
  if (!seconds) return "Flexible";
  const minutes = Math.max(1, Math.round(seconds / 60));
  return `${minutes} min suggested`;
}

function readInterviewConfig(location) {
  const params = new URLSearchParams(location.search);

  return {
    difficulty: location.state?.difficulty || params.get("difficulty") || "medium",
    jobRole: location.state?.jobRole || params.get("jobRole") || "Software Engineer",
  };
}

function GeneralInterview() {
  const { typeId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const config = TYPE_CONFIG[typeId] || TYPE_CONFIG.hr;
  const theme = getInterviewTheme(typeId);
  const interviewConfig = useMemo(() => readInterviewConfig(location), [location]);
  const [questions, setQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [evaluations, setEvaluations] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [isFinishing, setIsFinishing] = useState(false);
  const [followUpQuestion, setFollowUpQuestion] = useState(null);
  const [mainEvaluation, setMainEvaluation] = useState(null);

  const { progress, timeLeft, phase } = useTimer({
    active: !isLoading,
    duration: config.duration,
    onComplete: () => handleFinish(true),
  });

  const currentQuestion = questions[currentIndex];
  useEffect(() => {
    const generateQuestions = async () => {
      try {
        setIsLoading(true);
        setLoadError("");
        const { data } = await api.post("/ai/generate-questions", {
          interviewType: typeId,
          difficulty: interviewConfig.difficulty,
          jobRole: interviewConfig.jobRole,
        });
        const nextQuestions = data.questions || [];
        setQuestions(nextQuestions);
        if (nextQuestions.length === 0) {
          setLoadError("No interview questions were generated for this track.");
          return;
        }
        dispatch(
          setCurrentSession({
            type: typeId,
            questions: nextQuestions,
            difficulty: interviewConfig.difficulty,
            jobRole: interviewConfig.jobRole,
          })
        );
      } catch (error) {
        console.error(error);
        setLoadError(
          getUserFacingApiMessage(
            error,
            "We could not generate your interview sequence right now. Please try again."
          )
        );
      } finally {
        setIsLoading(false);
      }
    };

    generateQuestions();
  }, [dispatch, interviewConfig.difficulty, interviewConfig.jobRole, typeId]);

  const advanceOrFinish = (nextAnswers, nextEvaluations) => {
    setFollowUpQuestion(null);
    setMainEvaluation(null);
    if (currentIndex === questions.length - 1) {
      handleFinish(false, nextAnswers, nextEvaluations);
    } else {
      setCurrentIndex((value) => value + 1);
    }
  };

  const handleAnswerSubmit = async (answerText) => {
    if (!currentQuestion) return;

    try {
      setIsEvaluating(true);

      if (followUpQuestion && mainEvaluation) {
        const bonusWeight = Math.max(3, Math.round(currentQuestion.weightage * 0.35));
        const { data } = await api.post("/ai/evaluate-answer", {
          question: followUpQuestion,
          answer: answerText,
          interviewType: typeId,
          jobRole: interviewConfig.jobRole,
          questionWeightage: bonusWeight,
          expectedKeyPoints: currentQuestion.expectedKeyPoints || [],
          plannedFollowUps: [],
        });

        const combinedAnswer = `${answers[currentQuestion.id]}\n\n-- Follow-up --\nQ: ${followUpQuestion}\nA: ${answerText}`;
        const fu = data.evaluation;
        const mergedEval = {
          ...mainEvaluation,
          followUpQuestion,
          followUpAnswer: answerText,
          followUpEvaluation: fu,
          score: Math.min(
            currentQuestion.weightage,
            (mainEvaluation.score || 0) + (fu.score || 0)
          ),
          percentageScore: Math.round(
            (mainEvaluation.percentageScore || 0) * 0.72 + (fu.percentageScore || 0) * 0.28
          ),
          detailedFeedback: `${mainEvaluation.detailedFeedback || ""}\n\nFollow-up coaching: ${fu.detailedFeedback || ""}`,
        };

        const nextAnswers = { ...answers, [currentQuestion.id]: combinedAnswer };
        const nextEvaluations = { ...evaluations, [currentQuestion.id]: mergedEval };

        setAnswers(nextAnswers);
        setEvaluations(nextEvaluations);
        dispatch(
          updateAnswer({
            questionId: currentQuestion.id,
            answer: combinedAnswer,
            evaluation: mergedEval,
          })
        );
        advanceOrFinish(nextAnswers, nextEvaluations);
        return;
      }

      const { data } = await api.post("/ai/evaluate-answer", {
        question: currentQuestion.question,
        answer: answerText,
        interviewType: typeId,
        jobRole: interviewConfig.jobRole,
        questionWeightage: currentQuestion.weightage,
        expectedKeyPoints: currentQuestion.expectedKeyPoints || [],
        plannedFollowUps: currentQuestion.followUpQuestions || [],
      });

      const ev = data.evaluation;
      const plannedFollowUp = currentQuestion.followUpQuestions?.[0];
      const shouldAskPlannedFollowUp =
        Boolean(plannedFollowUp) &&
        ((ev?.percentageScore || 0) < 85 || answerText.trim().split(/\s+/).length < 45);
      const fu = shouldAskPlannedFollowUp ? plannedFollowUp : null;

      if (fu) {
        setMainEvaluation(ev);
        setFollowUpQuestion(fu);
        const nextAnswers = { ...answers, [currentQuestion.id]: answerText };
        setAnswers(nextAnswers);
        dispatch(
          updateAnswer({ questionId: currentQuestion.id, answer: answerText, evaluation: ev })
        );
        return;
      }

      const nextAnswers = { ...answers, [currentQuestion.id]: answerText };
      const nextEvaluations = { ...evaluations, [currentQuestion.id]: ev };

      setAnswers(nextAnswers);
      setEvaluations(nextEvaluations);
      dispatch(updateAnswer({ questionId: currentQuestion.id, answer: answerText, evaluation: ev }));

      if (currentIndex === questions.length - 1) {
        handleFinish(false, nextAnswers, nextEvaluations);
      } else {
        setCurrentIndex((value) => value + 1);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsEvaluating(false);
    }
  };

  const handleFinish = async (timedOut = false, nextAnswers = answers, nextEvaluations = evaluations) => {
    if (isFinishing) return;

    try {
      setIsFinishing(true);
      const timeTaken = config.duration - timeLeft;
      const { data } = await api.post("/ai/session-feedback", {
        type: typeId,
        difficulty: interviewConfig.difficulty,
        jobRole: interviewConfig.jobRole,
        questions,
        answers: nextAnswers,
        evaluations: nextEvaluations,
        timeTaken,
        timedOut,
      });

      dispatch(
        completeSession({
          ...data.session,
          feedback: data.feedback,
        })
      );

      navigate(`/feedback/${data.sessionId}`, {
        state: {
          session: data.session,
          type: typeId,
          feedback: data.feedback,
        },
      });
    } catch (error) {
      console.error(error);
    } finally {
      setIsFinishing(false);
    }
  };

  const roomStyle = useMemo(
    () => ({
      "--interview-accent": theme.accent,
      "--interview-accent-soft": theme.accentSoft,
      "--interview-glow": theme.glow,
      "--interview-border": theme.border,
    }),
    [theme]
  );

  const roleLabel = interviewConfig.jobRole;
  const difficultyLabel = interviewConfig.difficulty;
  const answeredCount = Object.keys(evaluations).length;
  const completionLabel = `${answeredCount}/${questions.length || 0} scored`;

  if (isLoading) {
    return (
      <div className="interview-room min-h-screen sam-page-bg text-slate-100/80" style={roomStyle}>
        <Navbar />
        <div className="mx-auto flex min-h-[72vh] w-full max-w-5xl items-center justify-center px-4">
          <div className="interview-panel w-full max-w-2xl rounded-[2rem] px-8 py-10 text-center">
            <p className="text-[11px] uppercase tracking-[0.32em] text-slate-400">{theme.eyebrow}</p>
            <h1 className="font-display mt-4 text-4xl font-semibold text-white">
              Preparing the interview room
            </h1>
            <p className="mt-4 text-sm leading-7 text-slate-300/78">
              SAMVAAD is generating questions, sequencing the round, and calibrating the scoring
              rubric for {roleLabel}.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (loadError || !currentQuestion) {
    return (
      <div className="interview-room min-h-screen sam-page-bg pb-12" style={roomStyle}>
        <Navbar />
        <div className="mx-auto mt-12 w-full max-w-3xl px-4">
          <div className="interview-panel rounded-[2rem] p-8">
            <p className="text-xs uppercase tracking-[0.25em] interview-accent-text">{config.label}</p>
            <h1 className="font-display mt-4 text-3xl font-semibold text-white">
              Interview unavailable
            </h1>
            <p className="mt-4 text-sm leading-7 text-slate-300/78">
              {loadError || "This interview session could not be prepared."}
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <button
                className="rounded-full px-5 py-3 text-sm font-semibold text-white transition"
                onClick={() => window.location.reload()}
                style={{
                  background:
                    "linear-gradient(120deg, var(--interview-accent) 0%, color-mix(in srgb, var(--interview-accent-soft) 84%, white 16%) 100%)",
                }}
                type="button"
              >
                Retry
              </button>
              <button
                className="rounded-full border bg-slate-950/55 px-5 py-3 text-sm text-slate-100 transition"
                onClick={() => navigate("/practice")}
                style={{ borderColor: "var(--interview-border)" }}
                type="button"
              >
                Back to practice
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="interview-room min-h-screen sam-page-bg pb-12" style={roomStyle}>
      <Navbar />
      <div className="mx-auto mt-8 w-full max-w-[1500px] px-4">
        <div className="interview-panel rounded-[2.2rem] p-6 md:p-8">
          <div className="flex flex-col gap-6 xl:flex-row xl:items-start xl:justify-between">
            <div className="max-w-4xl">
              <p className="text-[11px] uppercase tracking-[0.34em] interview-accent-text">
                {theme.eyebrow}
              </p>
              <h1 className="font-display mt-4 text-4xl font-semibold tracking-[-0.05em] text-white md:text-5xl">
                Question {currentIndex + 1} of {questions.length}
              </h1>
              <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-300/78 md:text-[15px]">
                {theme.briefing}
              </p>
              <div className="mt-5 flex flex-wrap gap-2 text-[11px] uppercase tracking-[0.24em]">
                <span className="interview-chip rounded-full px-3 py-1.5">{config.label}</span>
                <span className="interview-chip rounded-full px-3 py-1.5">{roleLabel}</span>
                <span className="interview-chip rounded-full px-3 py-1.5">{difficultyLabel}</span>
                <span className="interview-chip rounded-full px-3 py-1.5">{completionLabel}</span>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-1 xl:min-w-[260px]">
              <InterviewTimer label="Round timer" phase={phase} progress={progress} timeLeft={timeLeft} />
            </div>
          </div>

          <div className="mt-8 grid gap-6 xl:grid-cols-[340px_minmax(0,1fr)] xl:items-start">
            <aside className="xl:sticky xl:top-28">
              <InterviewVideoPanel subtitle={theme.eyebrow} theme={theme} title={theme.label} />
            </aside>

            <div className="space-y-5">
              <div className="interview-panel rounded-[1.9rem] p-5 md:p-6">
                <div className="flex flex-wrap items-center justify-between gap-3 text-[11px] uppercase tracking-[0.25em] text-slate-400">
                  <div className="flex flex-wrap gap-2">
                    <span className="interview-chip rounded-full px-3 py-1.5">
                      {followUpQuestion ? "follow-up prompt" : `Q${currentIndex + 1}`}
                    </span>
                  </div>
                  <span>{formatMinutes(currentQuestion?.timeAllotted)}</span>
                </div>

                <h2 className="font-display mt-5 text-3xl font-semibold leading-tight text-white md:text-[2.2rem]">
                  {followUpQuestion ? "Interviewer follow-up" : currentQuestion?.question}
                </h2>

                {followUpQuestion ? (
                  <p className="mt-4 text-lg leading-8 text-slate-100/88">{followUpQuestion}</p>
                ) : null}
              </div>

              <AnswerBox
                isEvaluating={isEvaluating}
                isFollowUp={Boolean(followUpQuestion)}
                key={followUpQuestion ? `${currentQuestion?.id}-fu` : currentQuestion?.id}
                onSubmit={handleAnswerSubmit}
                placeholder={
                  followUpQuestion
                    ? "Respond to the follow-up. Correct weak spots and add specifics."
                    : undefined
                }
                questionNumber={currentIndex + 1}
                totalQuestions={questions.length}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default GeneralInterview;
