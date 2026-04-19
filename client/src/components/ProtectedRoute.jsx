import { Navigate, useLocation } from "react-router-dom";
import { useSelector } from "react-redux";

function ProtectedRoute({ children }) {
  const location = useLocation();
  const { authChecked, userData } = useSelector((state) => state.user);

  if (!authChecked) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center text-sm text-slate-300">
        Loading your SAMVAAD workspace...
      </div>
    );
  }

  if (!userData) {
    return <Navigate replace state={{ from: location }} to="/auth" />;
  }

  return children;
}

export default ProtectedRoute;
