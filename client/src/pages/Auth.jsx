import { BsRobot } from "react-icons/bs";
import { FcGoogle } from "react-icons/fc";
import { IoSparkles } from "react-icons/io5";
import { signInWithPopup } from "firebase/auth";
import { motion } from "motion/react";
import { useDispatch } from "react-redux";
import { useLocation, useNavigate } from "react-router-dom";
import { auth, provider } from "../utils/firebase";
import { setUserData } from "../redux/userSlice.js";
import { api } from "../services/api";

function Auth() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const MotionButton = motion.button;
  const MotionDiv = motion.div;

  const handleGoogleAuth = async () => {
    try {
      const response = await signInWithPopup(auth, provider);
      const user = response.user;
      const name = user.displayName;
      const email = user.email;
      const result = await api.post(`/auth/google`, { name, email });
      dispatch(setUserData(result.data));
      const fromLocation = location.state?.from;
      navigate(`${fromLocation?.pathname || "/practice"}${fromLocation?.search || ""}`, {
        replace: true,
        state: fromLocation?.state,
      });
    } catch (error) {
      console.error("Google auth failed:", error.response?.data || error.message);
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden sam-page-bg px-6 py-20">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(37,99,235,0.18),transparent_35%),radial-gradient(circle_at_85%_15%,rgba(59,130,246,0.12),transparent_25%)]" />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-blue-950/40 to-transparent" />

      <MotionDiv
        animate={{ opacity: 1, y: 0 }}
        className="relative z-10 min-h-[620px] w-full max-w-[34rem] rounded-[2.5rem] border border-blue-500/25 bg-zinc-950/95 p-8 shadow-[0_36px_100px_rgba(0,0,0,0.55)] backdrop-blur-md md:p-12"
        initial={{ opacity: 0, y: 40 }}
        transition={{ duration: 0.75 }}
      >
        <div className="mx-auto mb-10 flex w-fit items-center gap-4 rounded-full border border-blue-500/20 bg-blue-950/40 px-5 py-3">
          <div className="rounded-2xl border border-blue-400/30 bg-gradient-to-b from-blue-600 to-blue-900 p-2 text-white shadow-[0_10px_30px_rgba(37,99,235,0.3)]">
            <BsRobot size={18} />
          </div>
          <h2 className="text-lg font-semibold tracking-[-0.03em] text-blue-400">SAMVAAD-AI</h2>
        </div>

        <div className="text-center">
          <h1 className="text-4xl font-semibold tracking-[-0.06em] text-white md:text-[3.1rem]">
            Continue with
          </h1>
          <span className="mt-5 inline-flex items-center gap-2 rounded-full border border-blue-500/30 bg-blue-950/50 px-5 py-3 text-[1.05rem] font-semibold text-blue-100">
            <IoSparkles size={16} />
            AI Smart Interview
          </span>
        </div>

        <p className="mx-auto mb-12 mt-8 max-w-md text-center text-base leading-8 text-blue-100/80">
          Sign in to start AI-powered mock interviews, track your progress, and unlock detailed
          performance insights.
        </p>

        <MotionButton
          className="mx-auto flex w-full max-w-[27rem] items-center justify-center gap-3 rounded-full border border-blue-500/30 bg-blue-950/80 px-6 py-4 text-base font-medium text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] transition hover:bg-blue-900"
          onClick={handleGoogleAuth}
          whileHover={{ scale: 1.01, y: -3 }}
          whileTap={{ opacity: 1, scale: 0.98 }}
        >
          <FcGoogle size={20} />
          Continue with Google
        </MotionButton>

        <div className="mt-10 text-center text-sm text-blue-300/65">
          One click access. No clutter. Just your interview workspace.
        </div>
      </MotionDiv>
    </div>
  );
}

export default Auth;
