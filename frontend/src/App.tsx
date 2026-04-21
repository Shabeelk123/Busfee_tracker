import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';

// Pages
import LoginPage from './pages/LoginPage';
import AdminLayout from './pages/admin/AdminLayout';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminClasses from './pages/admin/AdminClasses';
import AdminTeachers from './pages/admin/AdminTeachers';
import AdminBuses from './pages/admin/AdminBuses';
import AdminStudents from './pages/admin/AdminStudents';
import AdminReports from './pages/admin/AdminReports';
import TeacherLayout from './pages/teacher/TeacherLayout';
import TeacherDashboard from './pages/teacher/TeacherDashboard';
import TeacherStudents from './pages/teacher/TeacherStudents';
import RegisterStudent from './pages/teacher/RegisterStudent';
import TeacherFees from './pages/teacher/TeacherFees';
import StudentDashboard from './pages/student/StudentDashboard';

// ─── Loader ───────────────────────────────────────────────
const Spinner = () => (
  <div className="flex h-screen items-center justify-center bg-navy-900">
    <div className="w-8 h-8 border-2 border-gold-500 border-t-transparent rounded-full animate-spin" />
  </div>
);

// ─── Root redirect based on role ─────────────────────────
const RoleRedirect = () => {
  const { user, loading } = useAuth();
  if (loading) return <Spinner />;
  if (!user) return <Navigate to="/login" replace />;
  if (user.role === 'ADMIN') return <Navigate to="/admin" replace />;
  if (user.role === 'TEACHER') return <Navigate to="/teacher" replace />;
  return <Navigate to="/student" replace />;
};

// ─── Protected route ─────────────────────────────────────
const ProtectedRoute = ({
  children,
  role,
}: {
  children: React.ReactNode;
  role: string | string[];
}) => {
  const { user, loading } = useAuth();
  if (loading) return <Spinner />;
  if (!user) return <Navigate to="/login" replace />;
  const allowed = Array.isArray(role) ? role.includes(user.role) : user.role === role;
  if (!allowed) return <Navigate to="/login" replace />;
  return <>{children}</>;
};

// ─── Guest-only route (redirect if already logged in) ────
const GuestRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();
  if (loading) return <Spinner />;
  if (user) return <RoleRedirect />;
  return <>{children}</>;
};

// ─── App routes ──────────────────────────────────────────
function AppRoutes() {
  return (
    <Routes>
      {/* Root */}
      <Route path="/" element={<RoleRedirect />} />

      {/* Login */}
      <Route
        path="/login"
        element={
          <GuestRoute>
            <LoginPage />
          </GuestRoute>
        }
      />

      {/* Admin Routes */}
      <Route
        path="/admin"
        element={
          <ProtectedRoute role="ADMIN">
            <AdminLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<AdminDashboard />} />
        <Route path="classes" element={<AdminClasses />} />
        <Route path="teachers" element={<AdminTeachers />} />
        <Route path="buses" element={<AdminBuses />} />
        <Route path="students" element={<AdminStudents />} />
        <Route path="reports" element={<AdminReports />} />
      </Route>

      {/* Teacher Routes */}
      <Route
        path="/teacher"
        element={
          <ProtectedRoute role="TEACHER">
            <TeacherLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<TeacherDashboard />} />
        <Route path="students" element={<TeacherStudents />} />
        <Route path="students/register" element={<RegisterStudent />} />
        <Route path="fees/:id" element={<TeacherFees />} />
      </Route>

      {/* Student Routes */}
      <Route
        path="/student"
        element={
          <ProtectedRoute role="STUDENT">
            <StudentDashboard />
          </ProtectedRoute>
        }
      />

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              background: '#0f1629',
              color: '#f1f5f9',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '0.75rem',
            },
            success: { iconTheme: { primary: '#f5a623', secondary: '#0f1629' } },
            error: { iconTheme: { primary: '#ef4444', secondary: '#0f1629' } },
          }}
        />
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  );
}
