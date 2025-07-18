import { ReactNode } from 'react';
import { Navigate } from 'react-router';
import { useAuth } from '../../context/AuthContext';

interface CreatorOnlyRouteProps {
  children: ReactNode;
  fallbackPath?: string;
}

export default function CreatorOnlyRoute({ 
  children, 
  fallbackPath = '/profile' 
}: CreatorOnlyRouteProps) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900 dark:border-white"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/signin" replace />;
  }

  if (user.role !== 'creator') {
    return <Navigate to={fallbackPath} replace />;
  }

  return <>{children}</>;
} 