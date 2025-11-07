import React, { createContext, useContext, useState, useEffect } from 'react';
import { apiService, LoginResponse } from '../services/api';

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'Administrator' | 'Pengusul' | 'Verifikator' | 'Kepala Madrasah' | 'Bendahara' | 'Komite Madrasah';
  avatar?: string;
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Helper function to map API role to frontend role
const mapApiRoleToFrontendRole = (apiRole: string): User['role'] => {
  const roleMap: Record<string, User['role']> = {
    'administrator': 'Administrator',
    'pengusul': 'Pengusul',
    'verifikator': 'Verifikator',
    'kepala_madrasah': 'Kepala Madrasah',
    'bendahara': 'Bendahara',
    'komite_madrasah': 'Komite Madrasah',
  };
  
  return roleMap[apiRole.toLowerCase()] || 'Pengusul';
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const storedUser = localStorage.getItem('sirangkul_user');
    const storedToken = localStorage.getItem('sirangkul_token');
    
    if (storedUser && storedToken) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (error) {
        console.error('Failed to parse stored user:', error);
        // Clear invalid data
        localStorage.removeItem('sirangkul_user');
        localStorage.removeItem('sirangkul_token');
      }
    }
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    setIsLoading(true);
    try {
      console.log('Attempting login for:', email);
      
      const response: LoginResponse = await apiService.login({ email, password });
      
      // Map API response to frontend user format
      const user: User = {
        id: response.user.id,
        name: response.user.full_name,
        email: email,
        role: mapApiRoleToFrontendRole(response.user.role),
      };

      console.log('Login successful, setting user:', user);
      
      // Store user data and token
      setUser(user);
      localStorage.setItem('sirangkul_user', JSON.stringify(user));
      localStorage.setItem('sirangkul_token', response.token);
      
      return true;
    } catch (error) {
      console.error('Login failed:', error);
      return false;
    } finally {
      setIsLoading(false);
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

// @refresh reset
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}