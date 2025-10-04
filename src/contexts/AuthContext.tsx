import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase, isSupabaseConfigured } from '@/lib/supabaseClient';
import { User as SupabaseUser } from '@supabase/supabase-js';

export type UserRole = 'owner' | 'doctor' | 'secretary';

export interface User {
  id: string; // ID do perfil (profiles.id) - usar para doctor_id, patient_id, etc
  auth_id: string; // ID do Supabase Auth (auth.uid()) - para referência
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
 * Usa RPC para melhor confiabilidade.
 */
async function mapSupabaseUserToAppUser(supaUser: SupabaseUser): Promise<User> {
  console.log('[AuthContext] Buscando perfil para usuário:', supaUser.id, supaUser.email);
  
  try {
    // Usa RPC (Remote Procedure Call) que é mais confiável e rápido
    const rpcPromise = supabase.rpc('get_current_user_profile');

    const { data: profiles, error } = await withTimeout(
      rpcPromise,
      15000, // 15 segundos deve ser suficiente para RPC
      'Timeout ao buscar perfil do usuário'
    );

    console.log('[AuthContext] Resposta da RPC:', { profiles, error });

    if (error) {
      console.error('[AuthContext] Erro ao buscar perfil:', error);
      throw new Error(`Erro ao buscar perfil: ${error.message}`);
    }

    // RPC retorna array, pega o primeiro (ou null se vazio)
    const profile = profiles && profiles.length > 0 ? profiles[0] : null;

    if (!profile) {
      console.error('[AuthContext] Perfil não encontrado para usuário:', supaUser.id);
      throw new Error('Seu perfil não foi encontrado no sistema. Entre em contato com o administrador.');
    }

    console.log('[AuthContext] Perfil encontrado:', profile);

    // Sempre usar dados do banco, nunca do metadata
    // IMPORTANTE: id = profiles.id (usar para FK), auth_id = auth.uid()
    return {
      id: (profile as { id?: string }).id || supaUser.id, // ID do perfil na tabela profiles
      auth_id: supaUser.id, // ID do Supabase Auth
      email: supaUser.email || '',
      name: (profile as { name?: string }).name || supaUser.email || 'Usuário',
      role: (profile as { role?: UserRole }).role || 'doctor',
    };
  } catch (error) {
    console.error('[AuthContext] Exceção ao buscar perfil:', error);
    throw error;
  }
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
      console.log('[AuthContext] Inicializando contexto de autenticação...');
      setIsLoading(true);
      try {
        const { data } = await supabase.auth.getSession();
        const currentUser = data.session?.user;
        
        if (currentUser) {
          console.log('[AuthContext] Sessão encontrada, carregando perfil...');
          try {
            const mapped = await mapSupabaseUserToAppUser(currentUser);
            setUser(mapped);
            console.log('[AuthContext] Perfil carregado com sucesso');
          } catch (error) {
            console.error('[AuthContext] Erro ao carregar perfil do usuário:', error);
            // Se o perfil não existe ou há erro, fazer logout
            await supabase.auth.signOut();
            setUser(null);
          }
        } else {
          console.log('[AuthContext] Nenhuma sessão ativa');
        }
      } catch (error) {
        console.error('[AuthContext] Erro ao inicializar autenticação:', error);
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    init();

    const { data: listener } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('[AuthContext] Mudança de estado de autenticação:', event);
      const currentUser = session?.user;
      
      if (currentUser && event !== 'SIGNED_OUT') {
        console.log('[AuthContext] Usuário autenticado, carregando perfil...');
        try {
          const mapped = await mapSupabaseUserToAppUser(currentUser);
          setUser(mapped);
          console.log('[AuthContext] Perfil atualizado após mudança de estado');
        } catch (error) {
          console.error('[AuthContext] Erro ao atualizar usuário após mudança de estado:', error);
          // Fazer logout em caso de erro para evitar estado inconsistente
          await supabase.auth.signOut();
          setUser(null);
        }
      } else {
        console.log('[AuthContext] Usuário deslogado');
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
    
    console.log('[AuthContext] Iniciando login para:', email);
    
    try {
      // Autenticação com timeout de 60 segundos (generoso)
      const { data, error } = await withTimeout(
        supabase.auth.signInWithPassword({ email, password }),
        60000,
        'Tempo esgotado ao autenticar. Verifique sua conexão e tente novamente.'
      );
      
      if (error) {
        console.error('[AuthContext] Erro na autenticação:', error);
        // Mensagens de erro mais amigáveis
        if (error.message.includes('Invalid login credentials')) {
          throw new Error('Email ou senha incorretos');
        } else if (error.message.includes('Email not confirmed')) {
          throw new Error('Email não confirmado. Verifique sua caixa de entrada.');
        } else {
          throw new Error(error.message || 'Falha ao autenticar');
        }
      }
      
      const currentUser = data.user;
      if (!currentUser) {
        throw new Error('Sessão não inicializada');
      }
      
      console.log('[AuthContext] Autenticação bem-sucedida, buscando perfil...');
      
      // Busca os dados do perfil ANTES de definir o usuário
      // Isso garante que sempre teremos a role correta
      const mapped = await mapSupabaseUserToAppUser(currentUser);
      setUser(mapped);
      
      console.log('[AuthContext] Login concluído com sucesso');
    } catch (error) {
      console.error('[AuthContext] Erro no login:', error);
      // Se falhar em qualquer etapa, fazer logout para garantir estado limpo
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
      
      // Faz o signOut do Supabase (limpa localStorage)
      await supabase.auth.signOut();
      
      // Força limpeza de qualquer cache residual (tanto localStorage quanto sessionStorage)
      if (typeof window !== 'undefined') {
        // Limpa qualquer item relacionado ao Supabase no localStorage
        const localKeysToRemove: string[] = [];
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && key.startsWith('sb-')) {
            localKeysToRemove.push(key);
          }
        }
        localKeysToRemove.forEach(key => localStorage.removeItem(key));
        
        // Também limpa sessionStorage por precaução
        const sessionKeysToRemove: string[] = [];
        for (let i = 0; i < sessionStorage.length; i++) {
          const key = sessionStorage.key(i);
          if (key && key.startsWith('sb-')) {
            sessionKeysToRemove.push(key);
          }
        }
        sessionKeysToRemove.forEach(key => sessionStorage.removeItem(key));
      }
      
      console.log('Logout realizado com sucesso');
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
