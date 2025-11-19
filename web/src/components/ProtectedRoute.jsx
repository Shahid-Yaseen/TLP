import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import RedDotLoader from './common/RedDotLoader';

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return <RedDotLoader fullScreen={true} size="large" />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

export default ProtectedRoute;
