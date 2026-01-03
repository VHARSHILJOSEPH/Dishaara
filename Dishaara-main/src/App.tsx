import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Dashboard from "./pages/Dashboard";
import { AdminDashboard as Admin } from "./components/admin/AdminDashboard";
import NotFound from "./pages/NotFound";
import Login from "./pages/Login";
import ProtectedRoute from "./components/ProtectedRoute";
import GuideDashboard from "./components/GuideDashboard"; // ✅ now default import
import { AuthProvider } from "./contexts/AuthContext";
import ErrorBoundary from "./components/ErrorBoundary";

const App = () => (
  <ErrorBoundary>
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Default → Login */}
          <Route path="/" element={<Navigate to="/login" replace />} />

          {/* Public login route */}
          <Route path="/login" element={<Login />} />

          {/* User Dashboard */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute allowedRole="user">
                <Dashboard />
              </ProtectedRoute>
            }
          />

          {/* Admin Page */}
          <Route
            path="/admin"
            element={
              <ProtectedRoute allowedRole="admin">
                <Admin onBack={() => window.history.back()} />
              </ProtectedRoute>
            }
          />

          {/* Guide Dashboard */}
          <Route
            path="/guidedashboard"
            element={
              <ProtectedRoute allowedRole="guide">
                <GuideDashboard onBack={() => window.history.back()} />
              </ProtectedRoute>
            }
          />

          {/* Catch-all */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  </ErrorBoundary>
);

export default App;
