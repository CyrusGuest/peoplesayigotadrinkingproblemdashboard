import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { apiService, User, LoginData, SignupData, AuthResponse } from '../services/api';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  error: string | null;
  login: (data: LoginData) => Promise<boolean>;
  signup: (data: SignupData) => Promise<boolean>;
  completePassword: (email: string, newPassword: string, session: string) => Promise<boolean>;
  confirmSignUp: (email: string, confirmationCode: string, password: string) => Promise<boolean>;
  resendConfirmationCode: (email: string) => Promise<boolean>;
  logout: () => void;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Check if user is already authenticated on app load
  useEffect(() => {
    const checkAuth = async () => {
      try {
        if (apiService.isAuthenticated()) {
          const userData = await apiService.getCurrentUser();
          setUser(userData);
        }
      } catch (err) {
        console.error('Auth check failed:', err);
        apiService.clearTokens();
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  const login = async (data: LoginData): Promise<boolean> => {
    try {
      setLoading(true);
      setError(null);
      
      const response: AuthResponse = await apiService.login(data);
      
      if (response.success && response.tokens) {
        apiService.setTokens(response.tokens);
        // Get user data after successful login
        const userData = await apiService.getCurrentUser();
        setUser(userData);
        return true;
      } else if (response.challenge === 'NEW_PASSWORD_REQUIRED') {
        // Handle new password challenge
        setError('New password required');
        return false;
      } else {
        setError(response.error || 'Login failed');
        return false;
      }
    } catch (err: any) {
      setError(err.message || 'Login failed');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const signup = async (data: SignupData): Promise<boolean> => {
    try {
      setLoading(true);
      setError(null);
      
      const response: AuthResponse = await apiService.signup(data);
      
      if (response.success) {
        setError(null);
        return true;
      } else {
        setError(response.error || 'Signup failed');
        return false;
      }
    } catch (err: any) {
      setError(err.message || 'Signup failed');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const completePassword = async (email: string, newPassword: string, session: string): Promise<boolean> => {
    try {
      setLoading(true);
      setError(null);
      
      const response: AuthResponse = await apiService.completePassword(email, newPassword, session);
      
      if (response.success && response.tokens) {
        apiService.setTokens(response.tokens);
        const userData = await apiService.getCurrentUser();
        setUser(userData);
        return true;
      } else {
        setError(response.error || 'Password update failed');
        return false;
      }
    } catch (err: any) {
      setError(err.message || 'Password update failed');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const confirmSignUp = async (email: string, confirmationCode: string, password: string): Promise<boolean> => {
    try {
      setLoading(true);
      setError(null);
      
      const response: AuthResponse = await apiService.confirmSignUp(email, confirmationCode, password);
      
      if (response.success && response.tokens) {
        apiService.setTokens(response.tokens);
        const userData = await apiService.getCurrentUser();
        setUser(userData);
        return true;
      } else {
        setError(response.error || 'Email verification failed');
        return false;
      }
    } catch (err: any) {
      setError(err.message || 'Email verification failed');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const resendConfirmationCode = async (email: string): Promise<boolean> => {
    try {
      setLoading(true);
      setError(null);
      
      const response: AuthResponse = await apiService.resendConfirmationCode(email);
      
      if (response.success) {
        setError(null);
        return true;
      } else {
        setError(response.error || 'Failed to resend code');
        return false;
      }
    } catch (err: any) {
      setError(err.message || 'Failed to resend code');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    apiService.clearTokens();
    setUser(null);
    setError(null);
  };

  const clearError = () => {
    setError(null);
  };

  const value: AuthContextType = {
    user,
    loading,
    error,
    login,
    signup,
    completePassword,
    confirmSignUp,
    resendConfirmationCode,
    logout,
    clearError,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}; 