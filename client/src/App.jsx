import { useEffect, useState } from "react";
import { Route, Routes } from "react-router-dom";
import { useDispatch } from "react-redux";
import Home from "./pages/Home";
import Auth from "./pages/Auth";
import Practice from "./pages/Practice";
import DSAInterview from "./pages/DSAInterview";
import GeneralInterview from "./pages/DynamicGeneralInterview";
import FeedbackPage from "./pages/FeedbackPage";
import History from "./pages/History";
import Resources from "./pages/Resources";
import Pricing from "./pages/Pricing";
import ProtectedRoute from "./components/ProtectedRoute";
import AuthModel from "./components/AuthModel";
import AuroraBackdrop from "./components/effects/AuroraBackdrop.jsx";
import { api } from "./services/api";
import { setAuthChecked, setUserData } from "./redux/userSlice.js";

function App() {
  const dispatch = useDispatch();
  const [creditsModal, setCreditsModal] = useState({
    open: false,
    message: "",
  });

  useEffect(() => {
    const getUser = async () => {
      try {
        const result = await api.get("/user/current-user");
        dispatch(setUserData(result.data));
      } catch {
        dispatch(setUserData(null));
      } finally {
        dispatch(setAuthChecked(true));
      }
    };

    getUser();
  }, [dispatch]);

  useEffect(() => {
    const handleCreditsExhausted = (event) => {
      setCreditsModal({
        open: true,
        message:
          event.detail?.message ||
          "You do not have enough credits to continue this AI interview flow.",
      });
    };

    window.addEventListener("credits-exhausted", handleCreditsExhausted);
    return () =>
      window.removeEventListener("credits-exhausted", handleCreditsExhausted);
  }, []);

  return (
    <div className="relative min-h-screen font-sans antialiased text-slate-100">
      <AuroraBackdrop />
      <div className="relative z-10 min-h-screen">
      <Routes>
        <Route element={<Home />} path="/" />
        <Route element={<Auth />} path="/auth" />
        <Route
          element={
            <ProtectedRoute>
              <Practice />
            </ProtectedRoute>
          }
          path="/practice"
        />
        <Route
          element={
            <ProtectedRoute>
              <DSAInterview />
            </ProtectedRoute>
          }
          path="/interview/dsa"
        />
        <Route
          element={
            <ProtectedRoute>
              <GeneralInterview />
            </ProtectedRoute>
          }
          path="/interview/:typeId"
        />
        <Route
          element={
            <ProtectedRoute>
              <FeedbackPage />
            </ProtectedRoute>
          }
          path="/feedback/:sessionId"
        />
        <Route
          element={
            <ProtectedRoute>
              <History />
            </ProtectedRoute>
          }
          path="/history"
        />
        <Route
          element={
            <ProtectedRoute>
              <Resources />
            </ProtectedRoute>
          }
          path="/resources"
        />
        <Route
          element={
            <ProtectedRoute>
              <Pricing />
            </ProtectedRoute>
          }
          path="/pricing"
        />
      </Routes>
      </div>

      <AuthModel
        confirmLabel="Open pricing"
        confirmTo="/pricing"
        message={creditsModal.message}
        onClose={() => setCreditsModal({ open: false, message: "" })}
        open={creditsModal.open}
        title="Credits required"
      />
    </div>
  );
}

export default App;
