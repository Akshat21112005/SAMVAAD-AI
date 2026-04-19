import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "motion/react";
import Navbar from "../components/Navbar";
import { DIFFICULTY_OPTIONS, INTERVIEW_TYPES } from "../lib/constants";

function Practice() {
  const navigate = useNavigate();
  const [difficulty, setDifficulty] = useState("medium");
  const [jobRole, setJobRole] = useState("Software Engineer");
  const [dsaProblemSource, setDsaProblemSource] = useState("mixed");
  const MotionButton = motion.button;

  const startTrack = (typeId) => {
    const params = new URLSearchParams({
      difficulty,
      jobRole,
      ...(typeId === "dsa" ? { problemSource: dsaProblemSource } : {}),
    });
    const pathname = typeId === "dsa" ? "/interview/dsa" : `/interview/${typeId}`;

    navigate({
      pathname,
      search: `?${params.toString()}`,
    }, {
      state: {
        difficulty,
        jobRole,
        typeId,
        ...(typeId === "dsa" ? { problemSource: dsaProblemSource } : {}),
      },
    });
  };

  return (
    <div className="min-h-screen sam-page-bg pb-16">
      <Navbar />
      <div className="mx-auto mt-10 w-full max-w-7xl px-4">
        <div className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr]">
          <section className="rounded-[2.2rem] border border-blue-500/20 bg-zinc-950/90 p-8 shadow-[0_24px_70px_rgba(0,0,0,0.45)] backdrop-blur-sm">
            <p className="text-xs uppercase tracking-[0.3em] text-blue-400/85">Interview setup</p>
            <h1 className="mt-4 text-4xl font-semibold tracking-[-0.03em] text-white">
              Choose the pressure environment you want to train in.
            </h1>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-blue-100/75">
              Each track uses credits differently because question generation, scoring, DSA
              evaluation, and final coaching are all AI-powered flows.
            </p>

            <div className="mt-8 grid gap-6 md:grid-cols-2">
              <div>
                <label className="text-xs uppercase tracking-[0.25em] text-blue-300/70">
                  Difficulty
                </label>
                <div className="mt-3 flex flex-wrap gap-3">
                  {DIFFICULTY_OPTIONS.map((option) => (
                    <button
                      className={`rounded-full px-4 py-2 text-sm transition ${
                        option === difficulty
                          ? "bg-blue-600 font-semibold text-white shadow-[0_8px_22px_rgba(37,99,235,0.35)]"
                          : "border border-blue-500/25 bg-blue-950/40 text-blue-100 hover:border-blue-400/40"
                      }`}
                      key={option}
                      onClick={() => setDifficulty(option)}
                      type="button"
                    >
                      {option}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs uppercase tracking-[0.25em] text-blue-300/70">
                  Target role
                </label>
                <input
                  className="mt-3 w-full rounded-full border border-blue-500/25 bg-zinc-950/80 px-4 py-3 text-sm text-white outline-none transition placeholder:text-blue-300/40 focus:border-blue-400/50 focus:ring-2 focus:ring-blue-500/20"
                  onChange={(event) => setJobRole(event.target.value)}
                  value={jobRole}
                />
              </div>
            </div>
          </section>

          <section className="rounded-[2.2rem] border border-blue-500/20 bg-gradient-to-br from-blue-950/40 to-zinc-950/95 p-8 shadow-[0_24px_70px_rgba(0,0,0,0.4)]">
            <p className="text-xs uppercase tracking-[0.3em] text-blue-400/85">Session blueprint</p>
            <div className="mt-6 space-y-4 text-sm leading-7 text-blue-100/80">
              <p>1. Pick a track and difficulty.</p>
              <p>2. Complete a timed round with text or voice answers.</p>
              <p>3. Get weighted scoring and a final coaching summary.</p>
              <p>4. Revisit everything in your saved session history.</p>
            </div>
          </section>
        </div>

        <section className="mt-8 rounded-[2rem] border border-blue-500/20 bg-zinc-950/85 p-6 shadow-[0_12px_40px_rgba(0,0,0,0.35)]">
          <p className="text-xs uppercase tracking-[0.28em] text-blue-400/85">DSA problem pool</p>
          <p className="mt-2 text-sm text-blue-100/75">
            Applies when you start <strong className="text-white">DSA Arena</strong>: mix local tested challenges, curated GFG
            metadata, or live Codeforces picks (rating-filtered).
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            {[
              ["mixed", "Mixed (recommended)"],
              ["local", "Local + tested harness"],
              ["gfg", "Curated GFG list"],
              ["codeforces", "Codeforces API"],
            ].map(([id, label]) => (
              <button
                className={`rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-[0.12em] transition ${
                  dsaProblemSource === id
                    ? "bg-blue-600 text-white shadow"
                    : "border border-blue-500/25 bg-blue-950/40 text-blue-100 hover:border-blue-400/40"
                }`}
                key={id}
                onClick={() => setDsaProblemSource(id)}
                type="button"
              >
                {label}
              </button>
            ))}
          </div>
        </section>

        <section className="mt-10 grid gap-6 lg:grid-cols-2 xl:grid-cols-3">
          {INTERVIEW_TYPES.map((type) => (
            <MotionButton
              className="rounded-[2rem] border border-blue-500/20 bg-zinc-950/90 p-6 text-left shadow-[0_20px_60px_rgba(0,0,0,0.45)] transition hover:-translate-y-1 hover:border-blue-400/40 hover:shadow-[0_24px_70px_rgba(37,99,235,0.15)]"
              key={type.id}
              onClick={() => startTrack(type.id)}
              type="button"
              whileHover={{ y: -4 }}
            >
              <div className="flex items-center justify-between">
                <p className="text-xs uppercase tracking-[0.25em] text-blue-300/70">
                  {type.durationLabel}
                </p>
                <div className="h-3 w-3 rounded-full bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.55)]" />
              </div>
              <h3 className="mt-4 text-2xl font-semibold text-white">{type.title}</h3>
              <p className="mt-3 text-sm leading-7 text-blue-100/75">{type.tagline}</p>
              <div className="mt-6 inline-flex rounded-full border border-blue-500/35 bg-blue-950/50 px-4 py-2 text-xs font-semibold uppercase tracking-[0.25em] text-blue-300">
                Start track
              </div>
            </MotionButton>
          ))}
        </section>
      </div>
    </div>
  );
}

export default Practice;
