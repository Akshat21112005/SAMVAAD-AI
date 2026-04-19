import { useEffect, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import Navbar from "../components/Navbar";
import ScoreCard from "../components/interview/ScoreCard";
import FeedbackPanel from "../components/interview/FeedbackPanel";
import { api, getUserFacingApiMessage } from "../services/api";

function FeedbackPage() {
  const { sessionId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const [loadError, setLoadError] = useState("");
  const [pdfLoading, setPdfLoading] = useState(false);
  const session = location.state?.session;
  const evaluation = location.state?.evaluation;
  const feedbackText = location.state?.feedback || session?.feedback || "";

  useEffect(() => {
    if (!feedbackText || location.state?.session?.audioUrl) return;
    if (!window.speechSynthesis) return;

    const utterance = new SpeechSynthesisUtterance(feedbackText);
    utterance.rate = 0.98;
    utterance.pitch = 1;
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utterance);

    return () => window.speechSynthesis.cancel();
  }, [feedbackText, location.state?.session?.audioUrl]);

  useEffect(() => {
    if (session) return;
    const fetchSession = async () => {
      try {
        setLoadError("");
        const { data } = await api.get(`/user/history/${sessionId}`);
        navigate(`/feedback/${sessionId}`, {
          replace: true,
          state: { session: data, type: data.type, feedback: data.feedback },
        });
      } catch (error) {
        console.error(error);
        setLoadError(getUserFacingApiMessage(error, "We could not load this feedback report right now."));
      }
    };
    fetchSession();
  }, [navigate, session, sessionId]);

  const normalizedEvaluations = session?.evaluations
    ? Object.values(session.evaluations)
    : [];

  if (!session && !evaluation && !loadError) {
    return (
      <div className="min-h-screen sam-page-bg text-blue-100/75">
        <Navbar />
        <div className="flex min-h-[70vh] items-center justify-center text-sm">
          Loading your feedback report...
        </div>
      </div>
    );
  }

  if (loadError && !session && !evaluation) {
    return (
      <div className="min-h-screen sam-page-bg pb-16">
        <Navbar />
        <div className="mx-auto mt-12 w-full max-w-3xl px-4">
          <div className="rounded-[2rem] border border-blue-500/20 bg-zinc-950/95 p-8 shadow-[0_24px_70px_rgba(0,0,0,0.5)]">
            <p className="text-xs uppercase tracking-[0.3em] text-blue-400/85">Session feedback</p>
            <h1 className="mt-4 text-3xl font-semibold text-white">Report unavailable</h1>
            <p className="mt-4 text-sm leading-7 text-blue-100/75">{loadError}</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <button
                className="rounded-full bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-[0_10px_28px_rgba(37,99,235,0.3)] transition hover:bg-blue-500"
                onClick={() => navigate("/history")}
                type="button"
              >
                Open history
              </button>
              <button
                className="rounded-full border border-blue-500/35 bg-blue-950/50 px-5 py-3 text-sm text-blue-100 transition hover:border-blue-400/50"
                onClick={() => navigate("/practice")}
                type="button"
              >
                Start another round
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const totalScore = session?.totalScore || evaluation?.totalScore || 0;
  const primaryEvaluation = evaluation || normalizedEvaluations[0] || {};
  const strengths =
    primaryEvaluation.keyStrengths ||
    normalizedEvaluations.flatMap((item) => item.keyStrengths || []).slice(0, 4);
  const improvements =
    primaryEvaluation.improvements ||
    primaryEvaluation.missedPoints ||
    normalizedEvaluations.flatMap((item) => item.missedPoints || []).slice(0, 4);

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadServerPdf = async () => {
    if (!sessionId) return;
    try {
      setPdfLoading(true);
      const res = await api.get(`/report/${sessionId}/pdf`, { responseType: "blob" });
      const url = window.URL.createObjectURL(new Blob([res.data], { type: "application/pdf" }));
      const a = document.createElement("a");
      a.href = url;
      a.download = `samvaad-report-${sessionId}.pdf`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error(error);
    } finally {
      setPdfLoading(false);
    }
  };

  return (
    <div className="min-h-screen sam-page-bg pb-16">
      <Navbar />
      <div className="mx-auto mt-8 w-full max-w-6xl px-4">
        <div className="rounded-[2rem] border border-blue-500/20 bg-zinc-950/95 p-8 shadow-[0_24px_70px_rgba(0,0,0,0.5)]">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-blue-400/85">Session feedback</p>
              <h1 className="mt-4 text-4xl font-semibold tracking-[-0.03em] text-white">
                {session?.type?.toUpperCase?.() || "INTERVIEW"} performance report
              </h1>
              <p className="mt-4 max-w-3xl text-sm leading-7 text-blue-100/75">{feedbackText}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                className="rounded-full border border-blue-500/35 bg-blue-950/50 px-5 py-3 text-sm font-semibold text-blue-100 transition hover:border-blue-400/50"
                onClick={handlePrint}
                type="button"
              >
                Print (browser)
              </button>
              <button
                className="rounded-full bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-[0_10px_28px_rgba(37,99,235,0.3)] transition hover:bg-blue-500 disabled:opacity-50"
                disabled={pdfLoading || !sessionId}
                onClick={handleDownloadServerPdf}
                type="button"
              >
                {pdfLoading ? "Preparing PDF…" : "Download PDF (server)"}
              </button>
            </div>
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-3">
            <ScoreCard label="Total score" score={`${Math.round(totalScore)}/100`} />
            <ScoreCard
              label="Questions answered"
              score={session?.questionsAnswered || (session?.type === "dsa" ? 1 : 0)}
            />
            <ScoreCard label="Timed out" score={session?.timedOut ? "Yes" : "No"} />
          </div>

          <div className="mt-8 grid gap-4 lg:grid-cols-2">
            <FeedbackPanel items={strengths} title="Strengths" />
            <FeedbackPanel items={improvements} title="Focus next" />
          </div>

          {session?.type === "dsa" ? (
            <div className="mt-8 space-y-6">
              <div>
                <p className="text-xs uppercase tracking-[0.25em] text-blue-400/85">Score breakdown</p>
                <div className="mt-4 space-y-3">
                  {[
                    ["Correctness", primaryEvaluation.correctness],
                    ["Time complexity", primaryEvaluation.timeComplexityScore],
                    ["Space complexity", primaryEvaluation.spaceComplexityScore],
                    ["Code quality", primaryEvaluation.codeQuality],
                    ["Edge cases", primaryEvaluation.edgeCaseHandling],
                    ["Time management", primaryEvaluation.timeManagementScore],
                    ["Naming", primaryEvaluation.namingScore],
                  ].map(([label, value]) => {
                    const v = Math.min(100, Math.max(0, Number(value) || 0));
                    return (
                      <div key={label}>
                        <div className="mb-1 flex justify-between text-sm text-blue-100/85">
                          <span>{label}</span>
                          <span className="font-semibold text-blue-400">{Math.round(v)}</span>
                        </div>
                        <div className="h-2.5 overflow-hidden rounded-full bg-blue-950/80">
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-[#1e40af] to-blue-500 transition-all"
                            style={{ width: `${v}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
                {[
                  ["Correctness", primaryEvaluation.correctness],
                  ["Time", primaryEvaluation.timeComplexityScore],
                  ["Space", primaryEvaluation.spaceComplexityScore],
                  ["Quality", primaryEvaluation.codeQuality],
                  ["Edge cases", primaryEvaluation.edgeCaseHandling],
                  [
                    "Accepted",
                    primaryEvaluation.totalTestCases
                      ? `${primaryEvaluation.acceptedTestCases || 0}/${primaryEvaluation.totalTestCases}`
                      : "n/a",
                  ],
                  ["Time mgmt", primaryEvaluation.timeManagementScore ?? 0],
                ].map(([label, value]) => (
                  <ScoreCard key={`card-${label}`} label={label} score={value ?? 0} />
                ))}
              </div>
            </div>
          ) : (
            <div className="mt-8 space-y-4">
              {(session?.questions || []).map((question) => {
                const item = session.evaluations?.[question.id];
                return (
                  <div
                    className="rounded-[1.5rem] border border-blue-500/20 bg-blue-950/25 p-5"
                    key={question.id}
                  >
                    <div className="flex items-center justify-between gap-4">
                      <h3 className="text-lg font-semibold text-white">{question.question}</h3>
                      <span className="text-sm font-semibold text-blue-400">
                        {Math.round(item?.percentageScore || 0)}%
                      </span>
                    </div>
                    <p className="mt-3 text-sm leading-7 text-blue-100/75">{item?.detailedFeedback}</p>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default FeedbackPage;
