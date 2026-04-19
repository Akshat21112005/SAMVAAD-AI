import { motion } from "motion/react";
import { Link } from "react-router-dom";

function AuthModel({
  open,
  title = "Sign in to continue",
  message = "Your interview workspace is ready. Connect your account to unlock practice sessions, credits, and history tracking.",
  confirmLabel = "Go to Sign In",
  confirmTo = "/auth",
  onClose,
}) {
  const MotionDiv = motion.div;

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4 backdrop-blur-md">
      <MotionDiv
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md rounded-[2.35rem] border border-blue-500/25 bg-zinc-950 p-8 shadow-[0_34px_90px_rgba(0,0,0,0.65)]"
        initial={{ opacity: 0, scale: 0.96 }}
      >
        <div className="mb-6 flex items-center gap-3">
          <div className="rounded-2xl border border-blue-400/30 bg-gradient-to-b from-blue-600 to-blue-900 p-2.5 text-white shadow-[0_10px_30px_rgba(37,99,235,0.3)]">
            <span className="block text-sm font-semibold">AI</span>
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.28em] text-blue-300/70">SAMVAAD-AI</p>
            <p className="mt-1 text-sm text-blue-100/90">Secure access required</p>
          </div>
        </div>
        <h3 className="text-3xl font-semibold tracking-[-0.04em] text-white">{title}</h3>
        <p className="mt-4 text-sm leading-7 text-blue-100/75">{message}</p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            className="rounded-full bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-[0_10px_28px_rgba(37,99,235,0.3)] transition hover:bg-blue-500"
            onClick={() => onClose?.()}
            to={confirmTo}
          >
            {confirmLabel}
          </Link>
          <button
            className="rounded-full border border-blue-500/35 bg-blue-950/50 px-5 py-3 text-sm text-blue-100 transition hover:border-blue-400/50"
            onClick={onClose}
            type="button"
          >
            Maybe later
          </button>
        </div>
      </MotionDiv>
    </div>
  );
}

export default AuthModel;
