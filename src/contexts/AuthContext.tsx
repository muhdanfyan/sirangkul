import React, { createContext, useContext, useState, useEffect } from 'react';

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
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Mock user data
const mockUsers: User[] = [
  { id: '1', name: 'Admin Sistem', email: 'admin@sirangkul.com', role: 'Administrator' },
  { id: '2', name: 'Ahmad Fauzi', email: 'ahmad@madrasah.com', role: 'Pengusul' },
  { id: '3', name: 'Siti Nurhaliza', email: 'siti@madrasah.com', role: 'Verifikator' },
  { id: '4', name: 'Dr. H. Muhammad', email: 'kepala@madrasah.com', role: 'Kepala Madrasah' },
  { id: '5', name: 'Fatimah S.Pd', email: 'bendahara@madrasah.com', role: 'Bendahara' },
  { id: '6', name: 'H. Abdullah', email: 'komite@madrasah.com', role: 'Komite Madrasah' },
];

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const storedUser = localStorage.getItem('sirangkul_user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    // Mock authentication - in real app, this would call an API
    const foundUser = mockUsers.find(u => u.email === email);
    if (foundUser) {
      setUser(foundUser);
      localStorage.setItem('sirangkul_user', JSON.stringify(foundUser));
      return true;
    }
    return false;
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('sirangkul_user');
  };

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
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