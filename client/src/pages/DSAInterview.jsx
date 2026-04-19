import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import Navbar from "../components/Navbar";
import DsaWorkspaceStudio from "../components/interview/DsaWorkspaceStudio";
import InterviewTimer from "../components/interview/InterviewTimer";
import { useTimer } from "../hooks/useTimer";
import { getInterviewTheme } from "../lib/interviewThemes";
import { api, getUserFacingApiMessage } from "../services/api";
import { clearSession, setCurrentSession } from "../redux/interviewSlice";

const DSA_DURATION = 45 * 60;
const DEFAULT_LANGUAGES = ["javascript"];

function readInterviewConfig(location) {
  const params = new URLSearchParams(location.search);

  return {
    difficulty: location.state?.difficulty || params.get("difficulty") || "medium",
    jobRole: location.state?.jobRole || params.get("jobRole") || "Software Engineer",
    problemSource: location.state?.problemSource || params.get("problemSource") || "mixed",
  };
}

function DSAInterview() {
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const theme = getInterviewTheme("dsa");
  const interviewConfig = useMemo(() => readInterviewConfig(location), [location]);
  const [problem, setProblem] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [language, setLanguage] = useState("javascript");
  const [supportedLanguages, setSupportedLanguages] = useState(DEFAULT_LANGUAGES);
  const [code, setCode] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [runResult, setRunResult] = useState(null);
  const skipNextLocalStorageWrite = useRef(false);

  const { progress, timeLeft, phase } = useTimer({
    active: Boolean(problem) && !isSubmitting,
    duration: DSA_DURATION,
    onComplete: () => handleSubmit(true),
  });

  const storageKey = useMemo(
    () => (problem ? `samvaad:dsa:${problem.id}:${language}` : ""),
    [language, problem]
  );

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
    const fetchProblem = async () => {
      try {
        setIsLoading(true);
        setLoadError("");
        const [problemResponse, capabilityResponse] = await Promise.allSettled([
          api.get("/dsa/problem", {
            params: {
              difficulty: interviewConfig.difficulty,
              source: interviewConfig.problemSource,
              jobRole: interviewConfig.jobRole,
              requireJudge: true,
            },
          }),
          api.get("/dsa/capabilities"),
        ]);

        if (problemResponse.status !== "fulfilled") {
          throw problemResponse.reason;
        }

        const nextProblem = problemResponse.value.data.problem;
        const capabilities =
          capabilityResponse.status === "fulfilled"
            ? capabilityResponse.value.data?.capabilities || {}
            : { javascript: true };
        const starterLanguages = Object.keys(nextProblem?.starterCode || {});
        const detectedLanguages = starterLanguages.filter((item) => capabilities[item] !== false);
        const nextLanguages = detectedLanguages.length ? detectedLanguages : DEFAULT_LANGUAGES;
        const initialLanguage = nextLanguages[0] || "javascript";

        setSupportedLanguages(nextLanguages);
        setProblem(nextProblem);
        const draft = window.localStorage.getItem(
          `samvaad:dsa:${nextProblem.id}:${initialLanguage}`
        );
        setCode(draft !== null ? draft : nextProblem.starterCode?.[initialLanguage] || "");
        setLanguage(initialLanguage);
        setRunResult(null);
      } catch (error) {
        console.error(error);
        setLoadError(
          getUserFacingApiMessage(
            error,
            "We could not load a coding challenge right now. Please try again."
          )
        );
      } finally {
        setIsLoading(false);
      }
    };

    fetchProblem();
    dispatch(clearSession());
  }, [dispatch, interviewConfig.difficulty, interviewConfig.jobRole, interviewConfig.problemSource]);

  useEffect(() => {
    if (!problem) return;
    skipNextLocalStorageWrite.current = true;
    const key = `samvaad:dsa:${problem.id}:${language}`;
    const draft = window.localStorage.getItem(key);
    const starter = problem.starterCode?.[language] || "";
    setCode(draft !== null ? draft : starter);
    setRunResult(null);
  }, [language, problem]);

  useEffect(() => {
    if (!storageKey) return;
    if (skipNextLocalStorageWrite.current) {
      skipNextLocalStorageWrite.current = false;
      return;
    }
    window.localStorage.setItem(storageKey, code);
  }, [code, storageKey]);

  const handleRun = async () => {
    if (!problem) return;
    if (!supportedLanguages.includes(language)) {
      setRunResult({
        ok: false,
        message: "This language is not available on the judge server right now.",
        passed: 0,
        total: 0,
      });
      return;
    }
    try {
      setIsRunning(true);
      setRunResult(null);
      const { data } = await api.post("/dsa/run-tests", {
        problemId: problem.id,
        language,
        code,
      });
      setRunResult(data);
    } catch (error) {
      console.error(error);
      setRunResult({
        ok: false,
        message: getUserFacingApiMessage(error, "Run failed. Try again."),
        passed: 0,
        total: 0,
      });
    } finally {
      setIsRunning(false);
    }
  };

  const handleSubmit = async (timedOut = false) => {
    if (!problem || isSubmitting) return;

    try {
      setIsSubmitting(true);
      const timeUsed = DSA_DURATION - timeLeft;
      dispatch(
        setCurrentSession({
          type: "dsa",
          problem,
          code,
          language,
          timeUsed,
          timedOut,
        })
      );

      const { data } = await api.post("/ai/evaluate-dsa", {
        problem,
        code,
        language,
        timeUsed,
        timedOut,
        difficulty: interviewConfig.difficulty || problem.difficulty,
        jobRole: interviewConfig.jobRole,
      });

      navigate(`/feedback/${data.sessionId}`, {
        state: {
          session: data.session,
          evaluation: data.evaluation,
          feedback: data.feedback,
          type: "dsa",
        },
      });
    } catch (error) {
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="interview-room min-h-screen sam-page-bg text-slate-100/80" style={roomStyle}>
        <Navbar />
        <div className="mx-auto flex min-h-[72vh] w-full max-w-5xl items-center justify-center px-4">
          <div className="interview-panel w-full max-w-2xl rounded-[2rem] px-8 py-10 text-center">
            <p className="text-[11px] uppercase tracking-[0.32em] text-slate-400">{theme.eyebrow}</p>
            <h1 className="font-display mt-4 text-4xl font-semibold text-white">
              Loading your coding challenge
            </h1>
            <p className="mt-4 text-sm leading-7 text-slate-300/78">
              SAMVAAD is preparing the prompt, checking judge capabilities, and restoring your
              editing workspace.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (loadError || !problem) {
    return (
      <div className="interview-room min-h-screen sam-page-bg pb-12" style={roomStyle}>
        <Navbar />
        <div className="mx-auto mt-12 w-full max-w-3xl px-4">
          <div className="interview-panel rounded-[2rem] p-8">
            <p className="text-xs uppercase tracking-[0.25em] interview-accent-text">DSA interview</p>
            <h1 className="font-display mt-4 text-3xl font-semibold text-white">
              Challenge unavailable
            </h1>
            <p className="mt-4 text-sm leading-7 text-slate-300/78">
              {loadError || "This session could not be prepared."}
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
    <div className="interview-room min-h-screen sam-page-bg text-slate-50" style={roomStyle}>
      <Navbar />

      <div className="mx-auto mt-8 w-full max-w-[1600px] px-4 pb-12">
        <div className="interview-panel rounded-[2.2rem] p-6 md:p-8">
          <div className="flex flex-col gap-6 xl:flex-row xl:items-start xl:justify-between">
            <div className="max-w-4xl">
              <p className="text-[11px] uppercase tracking-[0.34em] interview-accent-text">
                {theme.eyebrow}
              </p>
              <h1 className="font-display mt-4 text-4xl font-semibold tracking-[-0.05em] text-white md:text-5xl">
                {problem.title}
              </h1>
              <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-300/78 md:text-[15px]">
                {theme.briefing}
              </p>
              <div className="mt-5 flex flex-wrap gap-2 text-[11px] uppercase tracking-[0.24em]">
                <span className="interview-chip rounded-full px-3 py-1.5">DSA round</span>
                <span className="interview-chip rounded-full px-3 py-1.5">
                  {interviewConfig.jobRole}
                </span>
                <span className="interview-chip rounded-full px-3 py-1.5">{problem.difficulty}</span>
                <span className="interview-chip rounded-full px-3 py-1.5">
                  {supportedLanguages.length} languages
                </span>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-3 xl:min-w-[620px]">
              <div className="interview-panel-soft rounded-[1.5rem] px-4 py-4">
                <p className="text-[10px] uppercase tracking-[0.28em] text-slate-400">Judge mode</p>
                <p className="font-display mt-2 text-2xl font-semibold text-white">Hidden tests</p>
                <p className="mt-1 text-xs text-slate-300/70">
                  run validates on the API server before AI scoring
                </p>
              </div>
              <div className="interview-panel-soft rounded-[1.5rem] px-4 py-4">
                <p className="text-[10px] uppercase tracking-[0.28em] text-slate-400">Workspace</p>
                <p className="font-display mt-2 text-2xl font-semibold text-white">Monaco</p>
                <p className="mt-1 text-xs text-slate-300/70">
                  local draft recovery is enabled per language
                </p>
              </div>
              <InterviewTimer label="Round timer" phase={phase} progress={progress} timeLeft={timeLeft} />
            </div>
          </div>

          <div className="mt-8 overflow-hidden rounded-[1.8rem]">
            <DsaWorkspaceStudio
              code={code}
              isRunning={isRunning}
              isSubmitting={isSubmitting}
              language={language}
              languages={supportedLanguages}
              onCodeChange={setCode}
              onLanguageChange={setLanguage}
              onRun={handleRun}
              onSubmit={() => handleSubmit(false)}
              problem={problem}
              roleLabel={interviewConfig.jobRole}
              runResult={runResult}
              theme={theme}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export default DSAInterview;
