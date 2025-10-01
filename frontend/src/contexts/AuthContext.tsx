import React, { createContext, useState, useContext, useEffect } from 'react';
import api from '../api/axios';
import socketService from '../api/socket';

interface User {
  id: number;
  email: string;
  name: string;
  userType: string;
  avatarUrl?: string;
  bio?: string;
  city?: string;
  vkUrl?: string;
  telegramUrl?: string;
  instagramUrl?: string;
  whatsapp?: string;
  consultationTypes?: string[];
  topics?: any[];
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string, userType: string) => Promise<void>;
  logout: () => void;
  updateUser: (userData: Partial<User>) => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (token) {
      fetchUser();
      socketService.connect(token);
    } else {
      setLoading(false);
    }

    return () => {
      socketService.disconnect();
    };
  }, [token]);

  const fetchUser = async () => {
    try {
      const response = await api.get('/users/me');
      setUser(response.data);
    } catch (error) {
      console.error('Ошибка загрузки пользователя:', error);
      logout();
    } finally {
      setLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    const response = await api.post('/auth/login', { email, password });
    const { token: newToken, user: userData } = response.data;
    
    localStorage.setItem('token', newToken);
    setToken(newToken);
    setUser(userData);
    socketService.connect(newToken);
  };

  const register = async (email: string, password: string, name: string, userType: string) => {
    const response = await api.post('/auth/register', {
      email,
      password,
      name,
      userType
    });
    const { token: newToken, user: userData } = response.data;
    
    localStorage.setItem('token', newToken);
    setToken(newToken);
    setUser(userData);
    socketService.connect(newToken);
  };

  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
    socketService.disconnect();
  };

  const updateUser = (userData: Partial<User>) => {
    setUser(prev => prev ? { ...prev, ...userData } : null);
  };

  return (
    <AuthContext.Provider value={{ user, token, login, register, logout, updateUser, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth должен использоваться внутри AuthProvider');
  }
  return context;
};
