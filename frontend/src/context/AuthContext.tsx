import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, UserRole } from '../types';
import { authService } from '../services/api';

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<User>;
  register: (data: any) => Promise<User>;
  logout: () => void;
  getRoleRedirectPath: (role?: UserRole) => string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('lifelane_token'));
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const initAuth = async () => {
      const savedToken = localStorage.getItem('lifelane_token');
      const savedUser = localStorage.getItem('lifelane_user');
      
      if (savedToken && savedUser) {
        try {
          setUser(JSON.parse(savedUser));
          setToken(savedToken);
        } catch (e) {
          localStorage.removeItem('lifelane_token');
          localStorage.removeItem('lifelane_user');
        }
      }
      setLoading(false);
    };
    initAuth();
  }, []);

  const getRoleRedirectPath = (role?: UserRole): string => {
    const userRole = role || user?.role;
    switch (userRole) {
      case 'driver':
        return '/driver';
      case 'traffic_officer':
        return '/traffic';
      case 'hospital_admin':
        return '/hospital';
      case 'admin':
        return '/admin';
      default:
        return '/';
    }
  };

  const login = async (email: string, password: string): Promise<User> => {
    const res = await authService.login({ email, password });
    localStorage.setItem('lifelane_token', res.access_token);
    localStorage.setItem('lifelane_user', JSON.stringify(res.user));
    setToken(res.access_token);
    setUser(res.user);
    return res.user;
  };

  const register = async (data: any): Promise<User> => {
    const res = await authService.register(data);
    localStorage.setItem('lifelane_token', res.access_token);
    localStorage.setItem('lifelane_user', JSON.stringify(res.user));
    setToken(res.access_token);
    setUser(res.user);
    return res.user;
  };

  const logout = () => {
    authService.logout().catch(() => {});
    localStorage.removeItem('lifelane_token');
    localStorage.removeItem('lifelane_user');
    setUser(null);
    setToken(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, logout, getRoleRedirectPath }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
