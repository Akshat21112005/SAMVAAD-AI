import { useState } from "react";
import { BsCoin } from "react-icons/bs";
import { HiOutlineLogout } from "react-icons/hi";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { motion } from "motion/react";
import { useDispatch, useSelector } from "react-redux";
import { api } from "../services/api";
import { setUserData } from "../redux/userSlice.js";

const links = [
  ["Practice", "/practice"],
  ["History", "/history"],
  ["Resources", "/resources"],
];

function Navbar() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { userData } = useSelector((state) => state.user);
  const [showCreditPopup, setShowCreditPopup] = useState(false);
  const [showUserPopup, setShowUserPopup] = useState(false);
  const MotionDiv = motion.div;

  const handleLogout = async () => {
    try {
      await api.get("/auth/logout");
      dispatch(setUserData(null));
      setShowCreditPopup(false);
      setShowUserPopup(false);
      navigate("/");
    } catch (error) {
      console.log(error);
    }
  };

  return (
    <div className="sticky top-0 z-40 px-4 pt-5">
      <MotionDiv
        animate={{ opacity: 1, y: 0 }}
        className="mx-auto flex w-full max-w-7xl items-center justify-between rounded-[2rem] border border-blue-500/20 bg-zinc-950/80 px-5 py-4 text-slate-100 shadow-[0_24px_80px_rgba(0,0,0,0.55)] backdrop-blur-xl"
        initial={{ opacity: 0, y: -18 }}
      >
        <button
          className="flex items-center gap-3"
          onClick={() => navigate("/")}
          type="button"
        >
          <div className="flex h-11 w-11 items-center justify-center overflow-hidden rounded-[1.15rem] border border-blue-400/30 bg-gradient-to-br from-blue-600 to-blue-900 shadow-[0_12px_32px_rgba(37,99,235,0.35)]">
            <img
              alt=""
              className="h-9 w-9"
              height={36}
              src="/assets/samvaad-mark.svg"
              width={36}
            />
          </div>
          <div className="text-left">
            <div className="text-sm font-semibold tracking-[0.28em] text-blue-400">SAMVAAD</div>
            <div className="text-xs text-blue-200/65">AI interview studio</div>
          </div>
        </button>

        <div className="hidden items-center gap-6 lg:flex">
          {(userData ? links : links.filter(([label]) => label !== "History")).map(([label, to]) => (
            <NavLink
              className={({ isActive }) =>
                `text-sm font-semibold transition ${
                  isActive
                    ? "!text-white underline decoration-blue-500/60 decoration-2 underline-offset-8"
                    : "!text-blue-200/80 hover:!text-white"
                }`
              }
              key={to}
              to={to}
            >
              {label}
            </NavLink>
          ))}
        </div>

        <div className="flex items-center gap-3">
          {userData ? (
            <>
              <div className="relative">
                <button
                  className="flex items-center gap-2 rounded-full border border-blue-500/35 bg-blue-950/50 px-4 py-2 text-sm text-blue-100 transition hover:border-blue-400/50 hover:bg-blue-950/80"
                  onClick={() => {
                    setShowCreditPopup((current) => !current);
                    setShowUserPopup(false);
                  }}
                  type="button"
                >
                  <BsCoin className="text-blue-400" />
                  {userData.credits ?? 0}
                </button>

                {showCreditPopup && (
                  <div className="absolute right-0 top-[calc(100%+12px)] w-64 rounded-[1.8rem] border border-blue-500/25 bg-zinc-950 p-4 shadow-[0_24px_70px_rgba(0,0,0,0.65)]">
                    <p className="text-sm leading-6 text-blue-100/85">
                      Credits power AI-generated interviews, scoring, and end-of-session coaching.
                    </p>
                    <button
                      className="mt-4 w-full rounded-full bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-500"
                      onClick={() => navigate("/pricing")}
                      type="button"
                    >
                      Recharge credits
                    </button>
                  </div>
                )}
              </div>

              <div className="relative">
                <button
                  className="flex h-10 w-10 items-center justify-center rounded-full border border-blue-500/30 bg-gradient-to-br from-blue-600 to-blue-900 text-sm font-bold text-white shadow-[0_12px_28px_rgba(37,99,235,0.35)]"
                  onClick={() => {
                    setShowUserPopup((current) => !current);
                    setShowCreditPopup(false);
                  }}
                  type="button"
                >
                  {userData.name?.slice(0, 1)?.toUpperCase() || "S"}
                </button>

                {showUserPopup && (
                  <div className="absolute right-0 top-[calc(100%+12px)] w-72 rounded-[1.8rem] border border-blue-500/25 bg-zinc-950 p-4 shadow-[0_24px_70px_rgba(0,0,0,0.65)]">
                    <div className="border-b border-blue-500/15 pb-3">
                      <p className="text-sm font-semibold text-white">
                        {userData.name || "SAMVAAD User"}
                      </p>
                      <p className="mt-1 break-all text-xs text-blue-200/60">{userData.email}</p>
                    </div>
                    <div className="space-y-2 py-3">
                      <button
                        className="w-full rounded-2xl px-3 py-2 text-left text-sm text-blue-100/90 transition hover:bg-blue-950/80"
                        onClick={() => navigate("/history")}
                        type="button"
                      >
                        Interview history
                      </button>
                      <button
                        className="w-full rounded-2xl px-3 py-2 text-left text-sm text-blue-100/90 transition hover:bg-blue-950/80"
                        onClick={() => navigate("/resources")}
                        type="button"
                      >
                        Resources hub
                      </button>
                    </div>
                    <button
                      className="flex w-full items-center gap-2 rounded-2xl border border-blue-500/20 px-3 py-2 text-sm text-blue-100/90 transition hover:bg-blue-950/60"
                      onClick={handleLogout}
                      type="button"
                    >
                      <HiOutlineLogout size={16} />
                      Logout
                    </button>
                  </div>
                )}
              </div>
            </>
          ) : (
            <>
              <NavLink
                className={({ isActive }) =>
                  `hidden text-sm font-semibold transition sm:inline-flex ${
                    isActive ? "!text-white" : "!text-blue-200/80 hover:!text-white"
                  }`
                }
                to="/resources"
              >
                Resources
              </NavLink>
              <Link
                className="rounded-full border border-blue-500/35 bg-zinc-900/90 px-4 py-2 text-sm text-blue-100 shadow-sm transition hover:border-blue-400/50"
                to="/auth"
              >
                Sign in
              </Link>
              <button
                className="rounded-full bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-[0_10px_28px_rgba(37,99,235,0.35)] transition hover:bg-blue-500"
                onClick={() => navigate("/auth")}
                type="button"
              >
                Start prep
              </button>
            </>
          )}
        </div>
      </MotionDiv>
    </div>
  );
}

export default Navbar;
