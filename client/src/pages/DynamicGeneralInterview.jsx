import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
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

function getTurnLabel(question, currentIndex) {
  if (!question) return `Q${currentIndex + 1}`;
  if (question.turnType === "intro") return "intro";
  if (question.turnType === "follow-up") return "follow-up";
  return `Q${currentIndex + 1}`;
}

function DynamicGeneralInterview() {
  const { typeId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { userData } = useSelector((state) => state.user);
  const config = TYPE_CONFIG[typeId] || TYPE_CONFIG.hr;
  const theme = getInterviewTheme(typeId);
  const interviewConfig = useMemo(() => readInterviewConfig(location), [location]);

  const [sessionState, setSessionState] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [isFinishing, setIsFinishing] = useState(false);

  const currentQuestion = sessionState?.currentQuestion;
  const currentIndex = sessionState?.currentQuestionIndex || 0;
  const maxQuestions = sessionState?.maxQuestions || 10;
  const evaluations = sessionState?.evaluations || {};
  const sessionId = sessionState?.sessionId;

  const { progress, timeLeft, phase } = useTimer({
    active: Boolean(sessionId) && !isLoading && !isFinishing,
    duration: config.duration,
    onComplete: () => handleFinish(true),
  });

  const roomStyle = useMemo(
    () => ({
      "--interview-accent": theme.accent,
      "--interview-accent-soft": theme.accentSoft,
      "--interview-glow": theme.glow,
      "--interview-border": theme.border,
    }),
    [theme]
  );

  useEffect(() => {
    const startSession = async () => {
      try {
        setIsLoading(true);
        setLoadError("");
        const { data } = await api.post("/ai/interview/start", {
          interviewType: typeId,
          difficulty: interviewConfig.difficulty,
          jobRole: interviewConfig.jobRole,
        });
        setSessionState(data.session);
        dispatch(setCurrentSession(data.session));
      } catch (error) {
        console.error(error);
        setLoadError(
          getUserFacingApiMessage(
            error,
            "We could not start this interview session right now. Please try again."
          )
        );
      } finally {
        setIsLoading(false);
      }
    };

    startSession();
  }, [dispatch, interviewConfig.difficulty, interviewConfig.jobRole, typeId]);

  const completeAndNavigate = (payload) => {
    dispatch(
      completeSession({
        ...(payload.session || {}),
        feedback: payload.feedback,
      })
    );

    navigate(`/feedback/${payload.session?.sessionId || payload.sessionId}`, {
      state: {
        session: payload.session,
        type: typeId,
        feedback: payload.feedback,
      },
    });
  };

  async function handleFinish(timedOut = false) {
    if (!sessionId || isFinishing) return;

    try {
      setIsFinishing(true);
      const { data } = await api.post("/ai/interview/finish", {
        sessionId,
        timeTaken: config.duration - timeLeft,
        timedOut,
      });
      completeAndNavigate(data);
    } catch (error) {
      console.error(error);
    } finally {
      setIsFinishing(false);
    }
  }

  const handleAnswerSubmit = async (answerText) => {
    if (!currentQuestion || !sessionId) return;

    const answeredQuestion = currentQuestion;
    try {
      setIsEvaluating(true);
      const { data } = await api.post("/ai/interview/answer", {
        sessionId,
        answer: answerText,
        timeTaken: config.duration - timeLeft,
        timedOut: false,
      });

      dispatch(
        updateAnswer({
          questionId: answeredQuestion.id,
          answer: answerText,
          evaluation: data.evaluation,
        })
      );

      if (data.complete) {
        completeAndNavigate(data);
        return;
      }

      setSessionState(data.session);
      dispatch(setCurrentSession(data.session));
    } catch (error) {
      console.error(error);
    } finally {
      setIsEvaluating(false);
    }
  };

  const candidateName = sessionState?.candidateName || userData?.name || "there";
  const roleLabel = sessionState?.jobRole || interviewConfig.jobRole;
  const difficultyLabel = sessionState?.difficulty || interviewConfig.difficulty;
  const completionLabel = `${Object.keys(evaluations).length}/${maxQuestions} answered`;
  const turnLabel = getTurnLabel(currentQuestion, currentIndex).toUpperCase();

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
              SAMVAAD is building a role-aware question pool, opening interview memory, and
              preparing a personalized flow for {candidateName}.
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
                {currentQuestion.turnType === "intro"
                  ? `Let's begin, ${candidateName}`
                  : `Question ${Math.min(currentIndex + 1, maxQuestions)} of ${maxQuestions}`}
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

            <div className="grid gap-3 sm:grid-cols-2 xl:min-w-[420px]">
              <div className="interview-panel-soft rounded-[1.5rem] px-4 py-4">
                <p className="text-[10px] uppercase tracking-[0.28em] text-slate-400">Current turn</p>
                <p className="font-display mt-2 text-2xl font-semibold text-white">{turnLabel}</p>
              </div>
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
                    <span className="interview-chip rounded-full px-3 py-1.5">{turnLabel}</span>
                  </div>
                  <span>{formatMinutes(currentQuestion?.timeAllotted)}</span>
                </div>

                <h2 className="font-display mt-5 text-3xl font-semibold leading-tight text-white md:text-[2.2rem]">
                  {currentQuestion?.question}
                </h2>
              </div>

              <AnswerBox
                isEvaluating={isEvaluating}
                isFollowUp={currentQuestion?.turnType === "follow-up"}
                key={currentQuestion?.id}
                onSubmit={handleAnswerSubmit}
                placeholder={
                  currentQuestion?.turnType === "intro"
                    ? `Hi, I'm ${candidateName}...`
                    : currentQuestion?.turnType === "follow-up"
                      ? "Answer the follow-up directly and add missing detail."
                      : undefined
                }
                questionNumber={Math.min(currentIndex + 1, maxQuestions)}
                totalQuestions={maxQuestions}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default DynamicGeneralInterview;
