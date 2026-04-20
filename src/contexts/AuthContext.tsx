import React, { createContext, useContext, useState, useEffect } from 'react';
import { apiService as api } from '../services/api';

export interface BidangInfo {
  id: string;
  name: string;
  description?: string | null;
  color?: string | null;
  sort_order?: number;
}

export interface User {
  id: string;
  name?: string;
  full_name?: string;
  email: string;
  role: string;
  avatar?: string;
  status?: string;
  is_active?: boolean;
  bidang_id?: string | null;
  bidang?: BidangInfo | null;
  created_at?: string;
  updated_at?: string;
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Map API role to frontend role
const mapRole = (apiRole: string): string => {
  const roleMap: { [key: string]: string } = {
    'administrator': 'Administrator',
    'pengusul': 'Pengusul',
    'verifikator': 'Verifikator',
    'kepala_madrasah': 'Kepala Madrasah',
    'bendahara': 'Bendahara',
    'komite_madrasah': 'Komite Madrasah',
  };
  return roleMap[apiRole.toLowerCase()] || apiRole;
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const storedUser = localStorage.getItem('sirangkul_user');
    const storedToken = localStorage.getItem('sirangkul_token');
    if (storedUser && storedToken) {
      setUser(JSON.parse(storedUser));
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      const response = await api.login({ email, password });
      
      if (response.token && response.user) {
        const mappedRole = mapRole(response.user.role);
        const userData: User = {
          id: response.user.id,
          name: response.user.full_name,
          full_name: response.user.full_name,
          email: response.user.email || email,
          role: mappedRole,
          status: response.user.status,
          is_active: response.user.is_active,
          bidang_id: response.user.bidang_id ?? null,
          bidang: response.user.bidang ?? null,
        };
        
        localStorage.setItem('sirangkul_token', response.token);
        localStorage.setItem('sirangkul_user', JSON.stringify(userData));
        setUser(userData);
        return true;
      }
      return false;
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error('Login failed:', error);
      }
      return false;
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('sirangkul_user');
    localStorage.removeItem('sirangkul_token');
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
