import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function ProtectedRoute({ children, allowedRoles }) {
  const { user } = useAuth();

  if (!user) return <Navigate to="/login" replace />;
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    const role = user.role === 'student_all' ? 'student' : user.role;
    return <Navigate to={`/${role}/dashboard`} replace />;
  }

  return children;
}
