import { Navigate, Route, Routes } from "react-router-dom";

import DashboardPage from "./pages/DashboardPage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import GroupDetailPage from "./pages/GroupDetailPage";

function App() {
  const hasToken = Boolean(localStorage.getItem("access_token"));

  return (
    <Routes>
      <Route
        path="/"
        element={
          <Navigate to={hasToken ? "/dashboard" : "/login"} replace />
        }
      />

      <Route
        path="/login"
        element={
          hasToken ? <Navigate to="/dashboard" replace /> : <LoginPage />
        }
      />

      <Route
        path="/register"
        element={
          hasToken ? <Navigate to="/dashboard" replace /> : <RegisterPage />
        }
      />

      <Route
        path="/dashboard"
        element={
          hasToken ? <DashboardPage /> : <Navigate to="/login" replace />
        }
      />

      <Route
        path="/groups/:groupId"
        element={
          hasToken ? <GroupDetailPage /> : <Navigate to="/login" replace />
        }
      />

      <Route
        path="*"
        element={<Navigate to={hasToken ? "/dashboard" : "/login"} replace />}
      />
    </Routes>
  );
}

export default App;