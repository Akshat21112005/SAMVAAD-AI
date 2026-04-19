import { useEffect, useState } from "react";
import { motion } from "motion/react";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import Navbar from "../components/Navbar";
import AuthModel from "../components/AuthModel";
import InterviewVideoPanel from "../components/interview/InterviewVideoPanel";
import Aurora, { HERO_AURORA_STOPS } from "../components/effects/Aurora.jsx";
import { INTERVIEW_TYPES } from "../lib/constants";

function Home() {
  const navigate = useNavigate();
  const { userData } = useSelector((state) => state.user);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [heroMotionOk, setHeroMotionOk] = useState(true);
  const MotionDiv = motion.div;

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setHeroMotionOk(!mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  const handlePractice = () => {
    if (!userData) {
      setShowAuthModal(true);
      return;
    }
    navigate("/practice");
  };

  const waveFill = encodeURIComponent("#030712");

  return (
    <div className="relative min-h-screen overflow-hidden sam-page-bg">
      <div className="relative min-h-[78vh] overflow-hidden pb-32 text-white">
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-[#060d1f] via-[#0c1932] to-[#0a0f1c]" />

        {heroMotionOk ? (
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 z-[1] opacity-[0.88] mix-blend-screen"
          >
            <Aurora
              amplitude={1.22}
              blend={0.58}
              colorStops={HERO_AURORA_STOPS}
              speed={0.45}
            />
          </div>
        ) : null}

        <div className="pointer-events-none absolute inset-0 z-0 opacity-50">
          <div className="absolute -left-24 top-0 h-96 w-96 rounded-full bg-blue-500/25 blur-[100px]" />
          <div className="absolute right-0 top-20 h-80 w-80 rounded-full bg-blue-600/20 blur-[90px]" />
        </div>

        <div className="pointer-events-none absolute inset-0 z-[2] bg-[radial-gradient(ellipse_100%_70%_at_50%_-15%,rgba(96,165,250,0.16),transparent_55%),radial-gradient(ellipse_70%_50%_at_100%_30%,rgba(59,130,246,0.12),transparent_50%),linear-gradient(to_bottom,rgba(0,0,0,0.32),transparent_40%,transparent_62%,rgba(0,0,0,0.42))]" />

        <div className="relative z-10">
          <Navbar />

          <section className="relative mx-auto flex w-full max-w-7xl flex-col gap-14 px-4 pt-10 lg:flex-row lg:items-center lg:justify-between lg:pt-16">
          <MotionDiv
            animate={{ opacity: 1, y: 0 }}
            className="max-w-2xl"
            initial={{ opacity: 0, y: 22 }}
          >
            <div className="inline-flex rounded-full border border-blue-400/25 bg-blue-950/40 px-4 py-2 text-[10px] uppercase tracking-[0.38em] text-blue-200/90">
              Samvaad · AI interview studio
            </div>
            <h1 className="mt-8 text-5xl font-semibold leading-[0.95] tracking-[-0.055em] text-white md:text-7xl md:leading-[0.92]">
              Calm, focused
              <span className="mt-1 block bg-gradient-to-r from-white via-blue-200 to-blue-500 bg-clip-text text-transparent">
                interview mastery
              </span>
            </h1>
            <p className="mt-8 max-w-xl text-lg leading-8 text-blue-100/85">
              Timed tracks, interviewer video loop, voice capture, a private local code sandbox for
              all languages, hidden test suites, and Groq + LangChain coaching —               sapphire on a black-and-blue aurora canvas.
            </p>
            <div className="mt-10 flex flex-wrap gap-4">
              <button
                className="rounded-full bg-blue-600 px-8 py-4 text-base font-semibold text-white shadow-[0_20px_50px_rgba(37,99,235,0.35)] transition hover:bg-blue-500"
                onClick={handlePractice}
                type="button"
              >
                Enter practice room
              </button>
              <button
                className="rounded-full border border-blue-400/35 bg-blue-950/35 px-8 py-4 text-base text-blue-50 transition hover:border-blue-300/50 hover:bg-blue-950/55"
                onClick={() => document.getElementById("tracks")?.scrollIntoView({ behavior: "smooth" })}
                type="button"
              >
                View tracks
              </button>
            </div>
          </MotionDiv>

          <MotionDiv
            animate={{ opacity: 1, x: 0 }}
            className="relative w-full max-w-md"
            initial={{ opacity: 0, x: 28 }}
          >
            <InterviewVideoPanel />
          </MotionDiv>
          </section>
        </div>

        <div
          aria-hidden
          className="pointer-events-none absolute bottom-0 left-0 right-0 z-[8] h-20 text-[#030712]"
          style={{
            background: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1440 56' preserveAspectRatio='none'%3E%3Cpath fill='${waveFill}' d='M0 56V36c180-22 360-22 540-4s360 36 540 36 360-30 540-36 180 4 360-8v32H0z'/%3E%3C/svg%3E") center bottom / 100% 100% no-repeat`,
          }}
        />
      </div>

      <div className="relative z-20 -mt-8 pb-20">
        <nav className="sticky top-[88px] z-30 mx-auto flex w-[min(92vw,560px)] justify-center px-2">
          <div className="flex flex-wrap items-center justify-center gap-1 rounded-full border border-blue-500/25 bg-black/55 px-2 py-2 shadow-[0_20px_60px_rgba(0,0,0,0.45)] backdrop-blur-md">
            {["Tracks", "Credits", "Resources"].map((label) => (
              <button
                className="rounded-full px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-blue-200/90 transition hover:bg-blue-950/70 hover:text-white"
                key={label}
                onClick={() => {
                  const id = label.toLowerCase();
                  document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
                }}
                type="button"
              >
                {label}
              </button>
            ))}
          </div>
        </nav>

        <div className="mx-auto mt-20 w-full max-w-7xl px-4" id="tracks">
          <p className="text-[11px] uppercase tracking-[0.35em] text-blue-400/90">Tracks</p>
          <h2 className="mt-3 max-w-xl text-3xl font-semibold tracking-[-0.04em] text-white md:text-4xl">
            Pick the room that matches your next interview.
          </h2>
          <div className="mt-10 grid gap-4 md:grid-cols-2">
            {INTERVIEW_TYPES.map((type, index) => (
              <button
                className="group rounded-[1.75rem] border border-blue-500/25 bg-zinc-950/90 p-6 text-left shadow-[0_12px_48px_rgba(0,0,0,0.55)] backdrop-blur-sm transition hover:border-blue-400/45 hover:shadow-[0_16px_56px_rgba(37,99,235,0.18)]"
                key={type.id}
                onClick={() =>
                  navigate(
                    userData
                      ? type.id === "dsa"
                        ? "/interview/dsa"
                        : `/interview/${type.id}`
                      : "/auth"
                  )
                }
                type="button"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-[10px] uppercase tracking-[0.28em] text-blue-400/75">
                      Track {index + 1}
                    </p>
                    <h3 className="mt-2 text-xl font-semibold text-white">{type.title}</h3>
                    <p className="mt-3 text-sm leading-7 text-blue-100/75">{type.tagline}</p>
                  </div>
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-blue-500/40 bg-blue-950/70 text-sm font-semibold text-blue-300 shadow-[0_0_24px_rgba(37,99,235,0.25)]">
                    {index + 1}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        <div className="mx-auto mt-16 grid max-w-7xl gap-4 px-4 sm:grid-cols-3" id="credits">
          {[
            ["5+", "Interview tracks"],
            ["AI", "Scoring + coaching"],
            ["50", "Starter credits"],
          ].map(([value, label]) => (
            <div
              className="rounded-[1.75rem] border border-blue-500/20 bg-gradient-to-br from-zinc-950/95 to-blue-950/35 p-6 shadow-[0_12px_40px_rgba(0,0,0,0.4)]"
              key={label}
            >
              <div className="text-3xl font-semibold text-blue-400">{value}</div>
              <div className="mt-2 text-sm text-blue-100/75">{label}</div>
            </div>
          ))}
        </div>

        <div className="mx-auto mt-16 max-w-7xl px-4 text-center" id="resources">
          <button
            className="rounded-full border border-blue-500/40 bg-blue-950/45 px-8 py-3 text-sm font-semibold text-blue-50 shadow-[0_8px_32px_rgba(0,0,0,0.35)] transition hover:border-blue-400/60 hover:bg-blue-900/50"
            onClick={() => navigate("/resources")}
            type="button"
          >
            Open resources hub
          </button>
        </div>
      </div>

      <AuthModel open={showAuthModal} onClose={() => setShowAuthModal(false)} />
    </div>
  );
}

export default Home;
