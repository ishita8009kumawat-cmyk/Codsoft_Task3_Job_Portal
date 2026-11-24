import { Navigate, Route, Routes } from "react-router-dom";
import { AuthProvider, useAuth } from "./AuthContext";
import Layout from "./components/Layout";
import Login from "./pages/Login";

import RecruiterDashboard from "./pages/recruiter/RecruiterDashboard";
import MyJobs from "./pages/recruiter/MyJobs";
import Pipeline from "./pages/recruiter/Pipeline";
import CompanyProfile from "./pages/recruiter/CompanyProfile";

import CandidateDashboard from "./pages/candidate/CandidateDashboard";
import BrowseJobs from "./pages/candidate/BrowseJobs";
import MyApplications from "./pages/candidate/MyApplications";
import CandidateProfile from "./pages/candidate/CandidateProfile";

function RequireAuth({ children }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

function RoleRoutes() {
  const { user } = useAuth();

  if (user.role === "recruiter") {
    return (
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<RecruiterDashboard />} />
          <Route path="jobs" element={<MyJobs />} />
          <Route path="pipeline" element={<Pipeline />} />
          <Route path="company" element={<CompanyProfile />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    );
  }

  // candidate
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<CandidateDashboard />} />
        <Route path="jobs" element={<BrowseJobs />} />
        <Route path="applications" element={<MyApplications />} />
        <Route path="profile" element={<CandidateProfile />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function AppRoutes() {
  const { user } = useAuth();

  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/" replace /> : <Login />} />
      <Route
        path="/*"
        element={
          <RequireAuth>
            <RoleRoutes />
          </RequireAuth>
        }
      />
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  );
}
