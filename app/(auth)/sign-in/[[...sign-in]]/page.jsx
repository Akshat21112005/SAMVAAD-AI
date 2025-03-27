import { SignIn } from "@clerk/nextjs";

export default function Page() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#1e1e2e] to-[#181825] px-4">
      <div className="w-full max-w-md bg-[#1e1e2e] p-8 rounded-3xl shadow-2xl border border-[#313244] text-white flex flex-col items-center">
        <h2 className="text-3xl font-bold text-center mb-3">Welcome Back 👋</h2>
        <p className="text-sm text-gray-400 text-center mb-6">
          Sign in to continue exploring your AI-powered interview platform.
        </p>
        
        {/* Wrapper to Center Clerk's Sign-In Component */}
        <div className="w-full flex justify-center">
          <div className="backdrop-blur-lg bg-white/5 rounded-2xl p-6 shadow-inner w-full flex justify-center">
            <SignIn />
          </div>
        </div>

        <p className="text-xs text-gray-500 text-center mt-4">
          By signing in, you agree to our{" "}
          <a href="#" className="text-blue-400 hover:underline">
            Terms of Service
          </a>{" "}
          and{" "}
          <a href="#" className="text-blue-400 hover:underline">
            Privacy Policy
          </a>
          .
        </p>
      </div>
    </div>
  );
}
