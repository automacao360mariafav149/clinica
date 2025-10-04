import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase, isSupabaseConfigured } from '@/lib/supabaseClient';
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

/**
 * Timeout util para evitar operações que podem ficar pendentes indefinidamente
 */
function withTimeout<T>(promise: Promise<T>, ms: number, timeoutMessage: string): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(timeoutMessage)), ms);
    promise
      .then((value) => {
        clearTimeout(timer);
        resolve(value);
      })
      .catch((err) => {
        clearTimeout(timer);
        reject(err);
      });
  });
}

/**
 * Cria um usuário "otimista" a partir do Supabase Auth sem depender da tabela profiles.
 * Isso evita travar o fluxo de login caso a consulta ao perfil esteja lenta.
 */
function buildOptimisticUserFromAuthUser(supaUser: SupabaseUser): User {
  const metadata = (supaUser.user_metadata || {}) as Record<string, unknown>;
  const fallbackName = (metadata.name as string | undefined) || supaUser.email || 'Usuário';
  const fallbackRole: UserRole = (metadata.role as UserRole | undefined) || 'doctor';

  return {
    id: supaUser.id,
    email: supaUser.email || '',
    name: fallbackName,
    role: fallbackRole,
  };
}

async function mapSupabaseUserToAppUser(supaUser: SupabaseUser): Promise<User> {
  // Suporta esquemas com chave em id ou auth_user_id
  const { data: profile } = await supabase
    .from('profiles')
    .select('name, role')
    .or(`id.eq.${supaUser.id},auth_user_id.eq.${supaUser.id}`)
    .maybeSingle();

  const metadata = (supaUser.user_metadata || {}) as Record<string, unknown>;
  const fallbackName = (metadata.name as string | undefined) || supaUser.email || 'Usuário';
  const metadataRole = (metadata.role as UserRole | undefined);
  const fallbackRole: UserRole = metadataRole || 'doctor';

  return {
    id: supaUser.id,
    email: supaUser.email || '',
    name: (profile as { name?: string } | null)?.name || fallbackName,
    role: ((profile as { role?: string } | null)?.role as UserRole | undefined) || fallbackRole,
  };
}

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const init = async () => {
      const { data } = await supabase.auth.getSession();
      const currentUser = data.session?.user;
      if (currentUser) {
        // Define usuário otimista imediatamente
        setUser(buildOptimisticUserFromAuthUser(currentUser));
        // Atualiza com dados do profile em segundo plano
        try {
          const mapped = await mapSupabaseUserToAppUser(currentUser);
          setUser(mapped);
        } catch (_err) {
          // Mantém usuário otimista caso mapping falhe
        }
      }
    };

    init();

    const { data: listener } = supabase.auth.onAuthStateChange(async (_event, session) => {
      const currentUser = session?.user;
      if (currentUser) {
        // Define usuário otimista de imediato para liberar UI
        setUser(buildOptimisticUserFromAuthUser(currentUser));
        // Mapeia perfil em segundo plano
        try {
          const mapped = await mapSupabaseUserToAppUser(currentUser);
          setUser(mapped);
        } catch (_err) {
          // Silencia erro e mantém otimista
        }
      } else {
        setUser(null);
      }
    });

    return () => {
      listener.subscription.unsubscribe();
    };
  }, []);

  const login = async (email: string, password: string) => {
    if (!isSupabaseConfigured) {
      throw new Error('Supabase não configurado. Defina VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY.');
    }
    const { data, error } = await withTimeout(
      supabase.auth.signInWithPassword({ email, password }),
      15000,
      'Tempo esgotado ao autenticar. Verifique sua conexão e tente novamente.'
    );
    if (error) {
      throw new Error(error.message || 'Falha ao autenticar');
    }
    const currentUser = data.user;
    if (!currentUser) {
      throw new Error('Sessão não inicializada');
    }
    // Define usuário otimista imediatamente para evitar travamento na UI
    setUser(buildOptimisticUserFromAuthUser(currentUser));
    // Mapeia em segundo plano; não bloqueia o retorno do login
    mapSupabaseUserToAppUser(currentUser)
      .then((mapped) => setUser(mapped))
      .catch(() => {
        // Mantém usuário otimista caso mapping falhe
      });
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
