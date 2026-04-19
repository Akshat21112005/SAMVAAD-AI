import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import { api } from "../services/api";
import { hydrateHistory } from "../redux/interviewSlice";

function History() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { sessions } = useSelector((state) => state.interview);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const { data } = await api.get("/user/history");
        dispatch(hydrateHistory(data.sessions || []));
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, [dispatch]);

  return (
    <div className="min-h-screen sam-page-bg pb-16">
      <Navbar />
      <div className="mx-auto mt-10 w-full max-w-6xl px-4">
        <div className="max-w-2xl">
          <p className="text-xs uppercase tracking-[0.3em] text-blue-400/85">History</p>
          <h1 className="mt-4 text-4xl font-semibold tracking-[-0.03em] text-white">
            Your saved interview sessions.
          </h1>
          <p className="mt-4 text-sm leading-7 text-blue-100/75">
            Re-open any round to revisit scores, notes, and the final coaching summary.
          </p>
        </div>

        {loading ? (
          <div className="mt-12 text-sm text-blue-300/70">Loading session history...</div>
        ) : (
          <div className="mt-10 grid gap-5">
            {sessions.length === 0 && (
              <div className="rounded-[2rem] border border-blue-500/20 bg-zinc-950/90 p-8 text-sm text-blue-100/75 shadow-[0_20px_60px_rgba(0,0,0,0.4)]">
                No sessions yet. Start your first mock interview from the practice page.
              </div>
            )}

            {sessions.map((session) => (
              <button
                className="rounded-[2rem] border border-blue-500/20 bg-zinc-950/90 p-6 text-left shadow-[0_20px_60px_rgba(0,0,0,0.4)] transition hover:border-blue-400/40 hover:shadow-[0_24px_70px_rgba(37,99,235,0.12)]"
                key={session._id}
                onClick={() =>
                  navigate(`/feedback/${session._id}`, {
                    state: { session, type: session.type, feedback: session.feedback },
                  })
                }
                type="button"
              >
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                  <div>
                    <p className="text-xs uppercase tracking-[0.25em] text-blue-300/70">
                      {session.type} / {session.difficulty}
                    </p>
                    <h2 className="mt-3 text-2xl font-semibold text-white">
                      {session.jobRole || "Software Engineer"}
                    </h2>
                    <p className="mt-3 text-sm leading-7 text-blue-100/70">{session.feedback}</p>
                  </div>
                  <div className="grid min-w-52 gap-3 sm:grid-cols-3 lg:grid-cols-1">
                    <div className="rounded-[1.25rem] border border-blue-500/15 bg-blue-950/35 p-3">
                      <div className="text-xs uppercase tracking-[0.2em] text-blue-300/65">Score</div>
                      <div className="mt-2 text-xl font-semibold text-blue-400">
                        {Math.round(session.totalScore || 0)}/100
                      </div>
                    </div>
                    <div className="rounded-[1.25rem] border border-blue-500/15 bg-blue-950/35 p-3">
                      <div className="text-xs uppercase tracking-[0.2em] text-blue-300/65">
                        Questions
                      </div>
                      <div className="mt-2 text-xl font-semibold text-blue-400">
                        {session.questionsAnswered}
                      </div>
                    </div>
                    <div className="rounded-[1.25rem] border border-blue-500/15 bg-blue-950/35 p-3">
                      <div className="text-xs uppercase tracking-[0.2em] text-blue-300/65">Date</div>
                      <div className="mt-2 text-sm font-semibold text-blue-300">
                        {new Date(session.completedAt || session.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default History;
