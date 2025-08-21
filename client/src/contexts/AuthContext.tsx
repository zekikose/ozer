import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import axios from 'axios';

interface User {
  id: number;
  username: string;
  email: string;
  full_name: string;
  role: 'admin' | 'manager' | 'stock_keeper' | 'viewer';
  created_at: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
  hasPermission: (permission: string) => boolean;
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

  // Set up axios interceptor
  useEffect(() => {
    const interceptor = axios.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem('token');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    return () => {
      axios.interceptors.request.eject(interceptor);
    };
  }, []);

  // Check if user is logged in on app start
  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('token');
      if (token) {
        try {
          const response = await axios.get('/api/auth/me');
          setUser(response.data.user);
        } catch (error) {
          localStorage.removeItem('token');
          delete axios.defaults.headers.common['Authorization'];
        }
      }
      setLoading(false);
    };

    checkAuth();
  }, []);

  const login = async (username: string, password: string) => {
    try {
      const response = await axios.post('/api/auth/login', {
        username,
        password,
      });

      const { token, user } = response.data;
      localStorage.setItem('token', token);
      setUser(user);
    } catch (error: any) {
      throw new Error(error.response?.data?.error || 'Login failed');
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
  };



  const hasPermission = (permission: string): boolean => {
    if (!user) return false;
    
    const permissions = {
      admin: [
        'dashboard:read',
        'products:read', 'products:create', 'products:update', 'products:delete',
        'categories:read', 'categories:create', 'categories:update', 'categories:delete',
        'suppliers:read', 'suppliers:create', 'suppliers:update', 'suppliers:delete',
        'customers:read', 'customers:create', 'customers:update', 'customers:delete',
        'warehouses:read', 'warehouses:create', 'warehouses:update', 'warehouses:delete',
        'stock:read', 'stock:in', 'stock:out', 'stock:adjustment',
        'users:read', 'users:create', 'users:update', 'users:delete',
        'reports:read', 'settings:read', 'settings:update'
      ],
      manager: [
        'dashboard:read',
        'products:read', 'products:create', 'products:update',
        'categories:read', 'categories:create', 'categories:update',
        'suppliers:read', 'suppliers:create', 'suppliers:update',
        'customers:read', 'customers:create', 'customers:update',
        'warehouses:read', 'warehouses:create', 'warehouses:update',
        'stock:read', 'stock:in', 'stock:out', 'stock:adjustment',
        'reports:read', 'settings:read'
      ],
      stock_keeper: [
        'dashboard:read',
        'products:read',
        'categories:read',
        'suppliers:read',
        'customers:read',
        'warehouses:read',
        'stock:read', 'stock:in', 'stock:out'
      ],
      viewer: [
        'dashboard:read',
        'products:read',
        'categories:read',
        'suppliers:read',
        'customers:read',
        'warehouses:read',
        'stock:read'
      ]
    };

    return permissions[user.role]?.includes(permission) || false;
  };

  const value: AuthContextType = {
    user,
    loading,
    login,
    logout,
    hasPermission,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}; 