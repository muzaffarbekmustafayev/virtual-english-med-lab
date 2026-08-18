import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { LanguageProvider } from './contexts/LanguageContext';

// Auth
import LoginPage    from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';

// Student
import StudentDashboard  from './pages/student/StudentDashboard';
import ModulesPage       from './pages/student/ModulesPage';
import ModuleDetailPage  from './pages/student/ModuleDetailPage';
import GrammarCheckerPage from './pages/student/GrammarCheckerPage';
import ForumPage         from './pages/student/ForumPage';
import ProfilePage       from './pages/student/ProfilePage';

// Teacher
import TeacherDashboard from './pages/teacher/TeacherDashboard';
import GroupsPage       from './pages/teacher/GroupsPage';
import ReportsPage      from './pages/teacher/ReportsPage';
import TeacherForumPage from './pages/student/ForumPage'; // shared forum

// Admin
import AdminOverview    from './pages/admin/AdminOverview';
import UsersPage        from './pages/admin/UsersPage';
import AdminGroupsPage  from './pages/admin/AdminGroupsPage';
import ContentManager   from './pages/admin/ContentManager';

import ProtectedRoute from './components/ProtectedRoute';
import './index.css';

function RoleRedirect() {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  return <Navigate to={`/${user.role}/dashboard`} replace />;
}

export default function App() {
  return (
    <AuthProvider>
      <LanguageProvider>
        <Toaster position="top-right" toastOptions={{ duration: 3500, style: { background: '#1e293b', color: '#fff', borderRadius: '10px' } }} />
        <BrowserRouter>
        <Routes>
          {/* Public */}
          <Route path="/login"    element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/"         element={<RoleRedirect />} />

          {/* ─── STUDENT ────────────────────────────────── */}
          <Route path="/student/dashboard" element={
            <ProtectedRoute allowedRoles={['student']}><StudentDashboard /></ProtectedRoute>
          }/>
          <Route path="/student/modules" element={
            <ProtectedRoute allowedRoles={['student']}><ModulesPage /></ProtectedRoute>
          }/>
          <Route path="/student/modules/:id" element={
            <ProtectedRoute allowedRoles={['student']}><ModuleDetailPage /></ProtectedRoute>
          }/>
          <Route path="/student/grammar" element={
            <ProtectedRoute allowedRoles={['student']}><GrammarCheckerPage /></ProtectedRoute>
          }/>
          <Route path="/student/grammar/:tab" element={
            <ProtectedRoute allowedRoles={['student']}><GrammarCheckerPage /></ProtectedRoute>
          }/>
          <Route path="/student/forum" element={
            <ProtectedRoute allowedRoles={['student']}><ForumPage /></ProtectedRoute>
          }/>
          <Route path="/student/profile" element={
            <ProtectedRoute allowedRoles={['student']}><ProfilePage /></ProtectedRoute>
          }/>

          {/* ─── TEACHER ────────────────────────────────── */}
          <Route path="/teacher/dashboard" element={
            <ProtectedRoute allowedRoles={['teacher']}><TeacherDashboard /></ProtectedRoute>
          }/>
          <Route path="/teacher/groups" element={
            <ProtectedRoute allowedRoles={['teacher']}><GroupsPage /></ProtectedRoute>
          }/>
          <Route path="/teacher/reports" element={
            <ProtectedRoute allowedRoles={['teacher']}><ReportsPage /></ProtectedRoute>
          }/>
          <Route path="/teacher/forum" element={
            <ProtectedRoute allowedRoles={['teacher']}><TeacherForumPage /></ProtectedRoute>
          }/>

          {/* ─── ADMIN ──────────────────────────────────── */}
          <Route path="/admin/dashboard" element={<Navigate to="/admin/overview" replace />}/>
          <Route path="/admin/overview" element={
            <ProtectedRoute allowedRoles={['admin']}><AdminOverview /></ProtectedRoute>
          }/>
          <Route path="/admin/users" element={
            <ProtectedRoute allowedRoles={['admin']}><UsersPage /></ProtectedRoute>
          }/>
          <Route path="/admin/groups" element={
            <ProtectedRoute allowedRoles={['admin']}><AdminGroupsPage /></ProtectedRoute>
          }/>
          <Route path="/admin/content/:tab" element={
            <ProtectedRoute allowedRoles={['admin']}><ContentManager /></ProtectedRoute>
          }/>
          <Route path="/admin/content" element={<Navigate to="/admin/content/grammar" replace />}/>

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/login" replace />}/>
        </Routes>
      </BrowserRouter>
      </LanguageProvider>
    </AuthProvider>
  );
}
