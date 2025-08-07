import { ReactNode } from 'react';
import { Navigate } from 'react-router';
import { useAuth } from '../../context/AuthContext';

interface RoleBasedRouteProps {
  adminComponent: ReactNode;
  creatorComponent: ReactNode;
  fallbackPath?: string;
}

export default function RoleBasedRoute({ 
  adminComponent, 
  creatorComponent, 
  fallbackPath = '/signin' 
}: RoleBasedRouteProps) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to={fallbackPath} replace />;
  }

  if (user.role === 'admin') {
    return <>{adminComponent}</>;
  }

  if (user.role === 'creator') {
    return <>{creatorComponent}</>;
  }

  // Fallback for unknown roles
  return <Navigate to={fallbackPath} replace />;
} 