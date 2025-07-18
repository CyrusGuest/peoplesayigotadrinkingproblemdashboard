import { useAuth } from '../context/AuthContext';

export const useRole = () => {
  const { user } = useAuth();

  const isAdmin = user?.role === 'admin';
  const isCreator = user?.role === 'creator';
  const isAuthenticated = !!user;

  const hasRole = (roles: ('admin' | 'creator')[]) => {
    return user ? roles.includes(user.role) : false;
  };

  const requireRole = (role: 'admin' | 'creator') => {
    return user?.role === role;
  };

  return {
    user,
    isAdmin,
    isCreator,
    isAuthenticated,
    hasRole,
    requireRole,
  };
}; 