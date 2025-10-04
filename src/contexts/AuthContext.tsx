import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export type UserRole = 'owner' | 'doctor' | 'secretary';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Mock users (sem backend)
const MOCK_USERS: Record<string, User & { password: string }> = {
  'owner@clinic.com': {
    id: '1',
    email: 'owner@clinic.com',
    password: 'owner123',
    name: 'Dono da Clínica',
    role: 'owner',
  },
  'doctor@clinic.com': {
    id: '2',
    email: 'doctor@clinic.com',
    password: 'doctor123',
    name: 'Dr. Silva',
    role: 'doctor',
  },
  'secretary@clinic.com': {
    id: '3',
    email: 'secretary@clinic.com',
    password: 'secretary123',
    name: 'Secretária Ana',
    role: 'secretary',
  },
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    // Recupera usuário do localStorage
    const storedUser = localStorage.getItem('clinic_user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  const login = async (email: string, password: string) => {
    const mockUser = MOCK_USERS[email];
    
    if (!mockUser || mockUser.password !== password) {
      throw new Error('Email ou senha incorretos');
    }

    const { password: _, ...userWithoutPassword } = mockUser;
    setUser(userWithoutPassword);
    localStorage.setItem('clinic_user', JSON.stringify(userWithoutPassword));
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('clinic_user');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        logout,
        isAuthenticated: !!user,
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
