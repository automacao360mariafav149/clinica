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
  logout: () => Promise<void>;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

async function mapSupabaseUserToAppUser(supaUser: SupabaseUser): Promise<User> {
  // Busca perfil por auth_user_id na tabela profiles para obter role e nome
  const { data: profile } = await supabase
    .from('profiles')
    .select('name, role')
    .eq('auth_user_id', supaUser.id)
    .maybeSingle();

  const metadata = (supaUser.user_metadata || {}) as Record<string, unknown>;
  const fallbackName = (metadata.name as string | undefined) || supaUser.email || 'Usuário';
  const fallbackRole: UserRole = 'doctor';

  return {
    id: supaUser.id,
    email: supaUser.email || '',
    name: profile?.name || fallbackName,
    role: (profile?.role as UserRole | undefined) || fallbackRole,
  };
}

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const init = async () => {
      const { data } = await supabase.auth.getSession();
      const currentUser = data.session?.user;
      if (currentUser) {
        const mapped = await mapSupabaseUserToAppUser(currentUser);
        setUser(mapped);
      }
    };

    init();

    const { data: listener } = supabase.auth.onAuthStateChange(async (_event, session) => {
      const currentUser = session?.user;
      if (currentUser) {
        const mapped = await mapSupabaseUserToAppUser(currentUser);
        setUser(mapped);
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
    const mapped = await mapSupabaseUserToAppUser(currentUser);
    setUser(mapped);
  };

  // Assina mudanças do perfil do usuário atual para refletir role/name em tempo real
  useEffect(() => {
    if (!user?.id) return;
    const channel = supabase
      .channel('realtime:profiles:self')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles', filter: `auth_user_id=eq.${user.id}` }, async () => {
        const { data: session } = await supabase.auth.getSession();
        const currentUser = session.session?.user;
        if (currentUser) {
          const mapped = await mapSupabaseUserToAppUser(currentUser);
          setUser(mapped);
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id]);

  const logout = async () => {
    try {
      await supabase.auth.signOut();
    } finally {
      setUser(null);
    }
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
