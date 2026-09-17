import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { User, StudentProfile } from '../types';
import * as authService from '../services/auth';
import * as progressService from '../services/progress';
import { getAccessToken } from '../services/api';

interface AuthContextType {
  isAuthenticated: boolean;
  user: User | null;
  profile: StudentProfile | null;
  activeCourse: string;
  setActiveCourse: (course: string) => void;
  login: (username: string, password?: string) => Promise<void>;
  demoLogin: () => Promise<void>;
  register: (payload: authService.RegisterPayload) => Promise<void>;
  logout: () => void;
  refreshProfile: () => Promise<void>;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<StudentProfile | null>(null);
  const [activeCourse, setActiveCourseState] = useState<string>('Data Structures & Algorithms (CS201)');
  const [loading, setLoading] = useState<boolean>(true);

  const refreshProfile = useCallback(async () => {
    const token = getAccessToken();
    if (!token) {
      setIsAuthenticated(false);
      setUser(null);
      setProfile(null);
      return;
    }

    try {
      const data = await progressService.fetchProfile();
      setProfile(data);
      if (data.target_topic) {
        setActiveCourseState(data.target_topic);
      }
    } catch (err: any) {
      console.error('Failed to refresh profile:', err);
      if (err?.status === 401) {
        authService.logout();
        setIsAuthenticated(false);
        setUser(null);
        setProfile(null);
      }
    }
  }, []);

  // Listen for unauthorized events dispatched on unrecoverable 401
  useEffect(() => {
    const handleUnauthorized = () => {
      authService.logout();
      setIsAuthenticated(false);
      setUser(null);
      setProfile(null);
    };

    window.addEventListener('sage:unauthorized', handleUnauthorized);
    return () => window.removeEventListener('sage:unauthorized', handleUnauthorized);
  }, []);

  // Check initial login state
  useEffect(() => {
    const token = getAccessToken();
    const storedUser = localStorage.getItem('sage_username');
    if (token) {
      refreshProfile()
        .then(() => {
          setIsAuthenticated(true);
          setUser({ username: storedUser || 'Student' });
        })
        .catch(() => {
          authService.logout();
          setIsAuthenticated(false);
          setUser(null);
          setProfile(null);
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [refreshProfile]);

  const login = async (username: string, password?: string) => {
    setLoading(true);
    try {
      const res = await authService.login(username, password);
      setIsAuthenticated(true);
      setUser({ username: res.username || username });
      await refreshProfile();
    } finally {
      setLoading(false);
    }
  };

  const demoLogin = async () => {
    setLoading(true);
    try {
      const res = await authService.demoLogin();
      setIsAuthenticated(true);
      setUser({ username: res.username || 'demo_student' });
      await refreshProfile();
    } finally {
      setLoading(false);
    }
  };

  const register = async (payload: authService.RegisterPayload) => {
    setLoading(true);
    try {
      const res = await authService.register(payload);
      setIsAuthenticated(true);
      setUser({ username: res.username || payload.username });
      await refreshProfile();
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    authService.logout();
    setIsAuthenticated(false);
    setUser(null);
    setProfile(null);
  };

  const setActiveCourse = async (course: string) => {
    setActiveCourseState(course);
    try {
      await progressService.updateProfile({ target_topic: course });
      await refreshProfile();
    } catch (err) {
      console.error('Failed to sync course selection to profile:', err);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        user,
        profile,
        activeCourse,
        setActiveCourse,
        login,
        demoLogin,
        register,
        logout,
        refreshProfile,
        loading,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
