import React, { createContext, useContext, useState, useEffect } from 'react';

export interface User {
  id: string;
  email: string;
  name: string;
  role: 'USER' | 'ADMIN';
  createdAt: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<boolean>;
  signup: (name: string, email: string, password: string) => Promise<boolean>;
  loginWithOAuth: (provider: 'google' | 'github') => Promise<boolean>;
  forgotPassword: (email: string) => Promise<boolean>;
  resetPassword: (password: string) => Promise<boolean>;
  logout: () => void;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Restore session on boot
  useEffect(() => {
    const savedToken = localStorage.getItem('subvault_auth_token');
    const savedUser = localStorage.getItem('subvault_auth_user');

    if (savedToken && savedUser) {
      try {
        setToken(savedToken);
        setUser(JSON.parse(savedUser));
      } catch (e) {
        console.warn("Failed to parse saved user credentials from localStorage, clearing session...", e);
        localStorage.removeItem('subvault_auth_token');
        localStorage.removeItem('subvault_auth_user');
      }
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    setIsLoading(true);
    setError(null);

    try {
      // Connect to express server if available
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      }).catch(() => null);

      if (response && response.ok) {
        const data = await response.json();
        setUser(data.user);
        setToken(data.token);
        localStorage.setItem('subvault_auth_token', data.token);
        localStorage.setItem('subvault_auth_user', JSON.stringify(data.user));
        setIsLoading(false);
        return true;
      }

      // Mock fallback: Enable mock logins so the dashboard is fully testable without running DB
      await new Promise((resolve) => setTimeout(resolve, 800));

      // Force admin role for this specific email
      const role: 'ADMIN' | 'USER' = email.toLowerCase() === 'admin@saascorp.com' ? 'ADMIN' : 'USER';
      const mockUser: User = {
        id: `usr_${Math.random().toString(36).substring(2, 7)}`,
        email,
        name: email.split('@')[0].toUpperCase(),
        role,
        createdAt: new Date().toISOString().split('T')[0],
      };

      const mockToken = 'mock_jwt_token_' + Math.random().toString(36).substring(2);
      setUser(mockUser);
      setToken(mockToken);
      localStorage.setItem('subvault_auth_token', mockToken);
      localStorage.setItem('subvault_auth_user', JSON.stringify(mockUser));
      setIsLoading(false);
      return true;
    } catch (err: any) {
      setError(err.message || 'Authentication failed');
      setIsLoading(false);
      return false;
    }
  };

  const signup = async (name: string, email: string, password: string): Promise<boolean> => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password }),
      }).catch(() => null);

      if (response && response.ok) {
        const data = await response.json();
        setUser(data.user);
        setToken(data.token);
        localStorage.setItem('subvault_auth_token', data.token);
        localStorage.setItem('subvault_auth_user', JSON.stringify(data.user));
        setIsLoading(false);
        return true;
      }

      // Mock fallback
      await new Promise((resolve) => setTimeout(resolve, 800));
      const role: 'ADMIN' | 'USER' = email.toLowerCase() === 'admin@saascorp.com' ? 'ADMIN' : 'USER';
      const mockUser: User = {
        id: `usr_${Math.random().toString(36).substring(2, 7)}`,
        email,
        name: name,
        role,
        createdAt: new Date().toISOString().split('T')[0],
      };

      const mockToken = 'mock_jwt_token_' + Math.random().toString(36).substring(2);
      setUser(mockUser);
      setToken(mockToken);
      localStorage.setItem('subvault_auth_token', mockToken);
      localStorage.setItem('subvault_auth_user', JSON.stringify(mockUser));
      setIsLoading(false);
      return true;
    } catch (err: any) {
      setError(err.message || 'Account registration failed');
      setIsLoading(false);
      return false;
    }
  };

  const loginWithOAuth = async (provider: 'google' | 'github'): Promise<boolean> => {
    setIsLoading(true);
    setError(null);
    await new Promise((resolve) => setTimeout(resolve, 1000));
    const mockUser: User = {
      id: `usr_oauth_${Math.random().toString(36).substring(2, 5)}`,
      email: `oauth.${provider}@example.com`,
      name: `${provider.toUpperCase()} Developer`,
      role: 'USER',
      createdAt: new Date().toISOString().split('T')[0],
    };
    const mockToken = 'mock_oauth_jwt_token_' + Math.random().toString(36).substring(2);
    setUser(mockUser);
    setToken(mockToken);
    localStorage.setItem('subvault_auth_token', mockToken);
    localStorage.setItem('subvault_auth_user', JSON.stringify(mockUser));
    setIsLoading(false);
    return true;
  };

  const forgotPassword = async (email: string): Promise<boolean> => {
    setIsLoading(true);
    setError(null);
    await new Promise((resolve) => setTimeout(resolve, 800));
    setIsLoading(false);
    return true;
  };

  const resetPassword = async (password: string): Promise<boolean> => {
    setIsLoading(true);
    setError(null);
    await new Promise((resolve) => setTimeout(resolve, 800));
    setIsLoading(false);
    return true;
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('subvault_auth_token');
    localStorage.removeItem('subvault_auth_user');
  };

  const clearError = () => setError(null);

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!token,
        isLoading,
        error,
        login,
        signup,
        loginWithOAuth,
        forgotPassword,
        resetPassword,
        logout,
        clearError,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
