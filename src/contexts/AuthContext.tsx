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
  isLoading: boolean;
  refreshUser: () => Promise<void>;
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
 * Mapeia um usuário do Supabase Auth para o formato da aplicação.
 * SEMPRE busca dados atualizados da tabela profiles para evitar problemas de cache.
 * Não confia em user_metadata que pode estar desatualizado.
 */
async function mapSupabaseUserToAppUser(supaUser: SupabaseUser): Promise<User> {
  // Suporta esquemas com chave em id ou auth_user_id
  const { data: profile, error } = await supabase
    .from('profiles')
    .select('name, role')
    .or(`id.eq.${supaUser.id},auth_user_id.eq.${supaUser.id}`)
    .maybeSingle();

  if (error) {
    console.error('Erro ao buscar perfil do usuário:', error);
    throw new Error('Não foi possível carregar os dados do perfil do usuário');
  }

  if (!profile) {
    console.error('Perfil não encontrado para o usuário:', supaUser.id);
    throw new Error('Perfil do usuário não encontrado. Entre em contato com o administrador.');
  }

  // Sempre usar dados do banco, nunca do metadata
  return {
    id: supaUser.id,
    email: supaUser.email || '',
    name: (profile as { name?: string }).name || supaUser.email || 'Usuário',
    role: (profile as { role?: UserRole }).role || 'doctor',
  };
}

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Função para atualizar os dados do usuário a partir do Supabase
  const refreshUser = async () => {
    try {
      const { data } = await supabase.auth.getSession();
      const currentUser = data.session?.user;
      
      if (currentUser) {
        const mapped = await mapSupabaseUserToAppUser(currentUser);
        setUser(mapped);
      } else {
        setUser(null);
      }
    } catch (error) {
      console.error('Erro ao atualizar dados do usuário:', error);
      // Em caso de erro, fazer logout para evitar estado inconsistente
      await supabase.auth.signOut();
      setUser(null);
    }
  };

  useEffect(() => {
    const init = async () => {
      setIsLoading(true);
      try {
        const { data } = await supabase.auth.getSession();
        const currentUser = data.session?.user;
        
        if (currentUser) {
          try {
            const mapped = await mapSupabaseUserToAppUser(currentUser);
            setUser(mapped);
          } catch (error) {
            console.error('Erro ao carregar perfil do usuário:', error);
            // Se o perfil não existe ou há erro, fazer logout
            await supabase.auth.signOut();
            setUser(null);
          }
        }
      } catch (error) {
        console.error('Erro ao inicializar autenticação:', error);
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    init();

    const { data: listener } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth state changed:', event);
      const currentUser = session?.user;
      
      if (currentUser && event !== 'SIGNED_OUT') {
        try {
          const mapped = await mapSupabaseUserToAppUser(currentUser);
          setUser(mapped);
        } catch (error) {
          console.error('Erro ao atualizar usuário após mudança de estado:', error);
          // Fazer logout em caso de erro para evitar estado inconsistente
          await supabase.auth.signOut();
          setUser(null);
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
    
    // Busca os dados do perfil ANTES de definir o usuário
    // Isso garante que sempre teremos a role correta
    try {
      const mapped = await mapSupabaseUserToAppUser(currentUser);
      setUser(mapped);
    } catch (error) {
      // Se falhar ao buscar o perfil, fazer logout e propagar o erro
      await supabase.auth.signOut();
      throw error;
    }
  };

  // Assina mudanças do perfil do usuário atual para refletir role/name em tempo real
  useEffect(() => {
    if (!user?.id) return;
    
    const channel = supabase
      .channel('realtime:profiles:self')
      .on(
        'postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'profiles', 
          filter: `auth_user_id=eq.${user.id}` 
        }, 
        async () => {
          console.log('Perfil alterado, atualizando dados do usuário...');
          await refreshUser();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id]);

  const logout = async () => {
    try {
      // Limpa o usuário imediatamente para melhor UX
      setUser(null);
      
      // Faz o signOut do Supabase (limpa sessionStorage)
      await supabase.auth.signOut();
      
      // Força limpeza de qualquer cache residual
      if (typeof window !== 'undefined') {
        // Limpa qualquer item relacionado ao Supabase no sessionStorage
        const keysToRemove: string[] = [];
        for (let i = 0; i < sessionStorage.length; i++) {
          const key = sessionStorage.key(i);
          if (key && key.startsWith('sb-')) {
            keysToRemove.push(key);
          }
        }
        keysToRemove.forEach(key => sessionStorage.removeItem(key));
      }
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
      // Garante que o usuário seja limpo mesmo em caso de erro
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
        isLoading,
        refreshUser,
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
