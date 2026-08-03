import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { apiService, User } from '@/services/api';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
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

// Seed user from localStorage so reload skips the auth spinner entirely
const getCachedUser = (): User | null => {
  try {
    const raw = localStorage.getItem('cached_user_info');
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
};

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const hasToken = apiService.isAuthenticated();
  const cachedUser = hasToken ? getCachedUser() : null;

  // If we have a cached user + token, start authenticated with no loading flash
  const [user, setUser] = useState<User | null>(cachedUser);
  const [isLoading, setIsLoading] = useState(!hasToken || !cachedUser);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        if (apiService.isAuthenticated()) {
          const userInfo = await apiService.getUserInfo();
          setUser(userInfo);
          localStorage.setItem('cached_user_info', JSON.stringify(userInfo));
        }
      } catch (error) {
        console.error('Auth check failed:', error);
        apiService.logout();
        setUser(null);
        localStorage.removeItem('cached_user_info');
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, []);

  const login = async (email: string, password: string) => {
    const response = await apiService.login({ email, password });
    setUser(response.user);
    localStorage.setItem('cached_user_info', JSON.stringify(response.user));
  };

  const logout = async () => {
    await apiService.logout();
    setUser(null);
    localStorage.removeItem('cached_user_info');
  };

  const value: AuthContextType = {
    user,
    isAuthenticated: !!user,
    isLoading,
    login,
    logout,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}; 
