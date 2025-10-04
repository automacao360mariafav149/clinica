import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { User as SupabaseUser } from '@supabase/supabase-js';

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

function mapSupabaseUserToAppUser(supaUser: SupabaseUser): User {
  const metadata = (supaUser.user_metadata || {}) as Record<string, unknown>;
  const roleFromMetadata = (metadata.role as UserRole | undefined) || 'doctor';
  const nameFromMetadata = (metadata.name as string | undefined) || supaUser.email || 'Usuário';

  return {
    id: supaUser.id,
    email: supaUser.email || '',
    name: nameFromMetadata,
    role: roleFromMetadata,
  };
}

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const init = async () => {
      const { data } = await supabase.auth.getSession();
      const currentUser = data.session?.user;
      if (currentUser) {
        setUser(mapSupabaseUserToAppUser(currentUser));
      }
    };

    init();

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      const currentUser = session?.user;
      if (currentUser) {
        setUser(mapSupabaseUserToAppUser(currentUser));
      } else {
        setUser(null);
      }
    });

    return () => {
      listener.subscription.unsubscribe();
    };
  }, []);

  const login = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      throw new Error(error.message || 'Falha ao autenticar');
    }
    const currentUser = data.user;
    if (!currentUser) {
      throw new Error('Sessão não inicializada');
    }
    setUser(mapSupabaseUserToAppUser(currentUser));
  };

  const logout = () => {
    supabase.auth.signOut().finally(() => setUser(null));
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
