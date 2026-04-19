import { useState } from "react";
import { useDispatch } from "react-redux";
import Navbar from "../components/Navbar";
import { api } from "../services/api";
import { setUserData } from "../redux/userSlice";

const plans = [
  {
    id: "starter",
    name: "Starter",
    credits: 25,
    price: 99,
    copy: "A lightweight recharge for focused prep.",
  },
  {
    id: "growth",
    name: "Growth",
    credits: 60,
    price: 199,
    copy: "Best fit for weekly interview simulation.",
  },
  {
    id: "pro",
    name: "Pro",
    credits: 150,
    price: 399,
    copy: "Heavy AI usage for serious placement season.",
  },
];

function Pricing() {
  const dispatch = useDispatch();
  const [loadingId, setLoadingId] = useState("");

  const handleRecharge = async (packageId) => {
    try {
      setLoadingId(packageId);
      const { data } = await api.post("/user/credits/topup", { packageId });
      dispatch(setUserData(data.user));
    } catch (error) {
      console.error(error);
    } finally {
      setLoadingId("");
    }
  };

  return (
    <div className="min-h-screen sam-page-bg pb-16">
      <Navbar />
      <div className="mx-auto mt-10 w-full max-w-6xl px-4">
        <div className="max-w-2xl">
          <p className="text-xs uppercase tracking-[0.3em] text-blue-400/85">Credits</p>
          <h1 className="mt-4 text-4xl font-semibold tracking-[-0.03em] text-white">
            Recharge your interview engine.
          </h1>
          <p className="mt-4 text-sm leading-7 text-blue-100/75">
            This workspace uses a simple demo top-up flow so you can keep testing end to end
            without integrating payments first.
          </p>
        </div>

        <div className="mt-10 grid gap-6 md:grid-cols-3">
          {plans.map((plan) => (
            <div
              className="rounded-[2rem] border border-blue-500/20 bg-zinc-950/90 p-6 shadow-[0_20px_60px_rgba(0,0,0,0.45)] backdrop-blur-sm"
              key={plan.id}
            >
              <p className="text-xs uppercase tracking-[0.25em] text-blue-300/70">{plan.name}</p>
              <div className="mt-4 text-4xl font-semibold text-blue-400">Rs. {plan.price}</div>
              <div className="mt-2 text-sm font-medium text-blue-100/85">{plan.credits} credits</div>
              <p className="mt-4 text-sm leading-7 text-blue-100/70">{plan.copy}</p>
              <button
                className="mt-8 w-full rounded-full bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-[0_10px_28px_rgba(37,99,235,0.3)] transition hover:bg-blue-500"
                onClick={() => handleRecharge(plan.id)}
                type="button"
              >
                {loadingId === plan.id ? "Adding credits..." : "Add credits"}
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default Pricing;
