import { createContext, useContext, useState, useEffect, useRef, ReactNode } from 'react';
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
 * Mapeia um usuário do Supabase Auth para o formato da aplicação.
 * Usa query direta na tabela profiles para evitar timeouts com RPC.
 */
async function mapSupabaseUserToAppUser(supaUser: SupabaseUser): Promise<User> {
  console.log('[AuthContext] Buscando perfil do usuário:', supaUser.id);
  
  // Query simples e direta na tabela profiles
  const { data: profile, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('auth_user_id', supaUser.id)
    .single();
  
  if (error) {
    console.error('[AuthContext] Erro ao buscar perfil:', error);
    throw new Error(`Erro ao buscar perfil: ${error.message}`);
  }

  if (!profile) {
    console.error('[AuthContext] Nenhum perfil encontrado');
    throw new Error('Seu perfil não foi encontrado no sistema. Entre em contato com o administrador.');
  }

  console.log('[AuthContext] Perfil encontrado:', profile);

  return {
    id: profile.id || supaUser.id,
    auth_id: supaUser.id,
    email: supaUser.email || '',
    name: profile.name || supaUser.email || 'Usuário',
    role: profile.role || 'doctor',
  };
}

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // useRef para persistir flag entre renders e evitar race conditions
  const isProcessingRef = useRef(false);
  const lastProcessedTimeRef = useRef(0);
  
  // Debounce de 500ms para evitar múltiplas chamadas simultâneas
  const DEBOUNCE_MS = 500;

  // Função para atualizar os dados do usuário a partir do Supabase
  const refreshUser = async () => {
    console.log('[AuthContext] 🔄 refreshUser chamado');
    
    // Debounce
    const now = Date.now();
    if (now - lastProcessedTimeRef.current < DEBOUNCE_MS) {
      console.log('[AuthContext] Refresh ignorado (debounce)');
      return;
    }
    
    if (isProcessingRef.current) {
      console.log('[AuthContext] Refresh já em andamento, ignorando...');
      return;
    }
    
    isProcessingRef.current = true;
    lastProcessedTimeRef.current = now;
    
    try {
      console.log('[AuthContext] Buscando sessão atual...');
      const { data } = await supabase.auth.getSession();
      const currentUser = data.session?.user;
      
      if (currentUser) {
        console.log('[AuthContext] Sessão encontrada, mapeando perfil...');
        const mapped = await mapSupabaseUserToAppUser(currentUser);
        console.log('[AuthContext] ✅ Perfil mapeado:', mapped);
        console.log('[AuthContext] Atualizando estado do user...');
        setUser(mapped);
        console.log('[AuthContext] ✅ Estado atualizado com sucesso!');
      } else {
        console.log('[AuthContext] ⚠️ Nenhuma sessão ativa');
        setUser(null);
      }
    } catch (error) {
      console.error('[AuthContext] ❌ Erro ao atualizar dados do usuário:', error);
      // NÃO fazer logout automático em caso de erro - pode ser apenas timeout temporário
      // Apenas logar o erro e manter o estado atual
    } finally {
      isProcessingRef.current = false;
      console.log('[AuthContext] refreshUser finalizado');
    }
  };

  useEffect(() => {
    const init = async () => {
      if (isProcessingRef.current) return;
      isProcessingRef.current = true;
  
      try {
        const { data } = await supabase.auth.getSession();
        const currentUser = data.session?.user;
        if (currentUser) {
          const mapped = await mapSupabaseUserToAppUser(currentUser);
          setUser(mapped);
        }
      } catch (error) {
        console.error('[AuthContext] Erro ao carregar sessão inicial:', error);
      } finally {
        setIsLoading(false);
        isProcessingRef.current = false;
      }
    };
  
    init();
  
    // onAuthStateChange simplificado: apenas SIGNED_IN e SIGNED_OUT
    const { data: listener } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('[AuthContext] Auth event:', event);
      
      // Ignorar eventos que não sejam SIGNED_IN ou SIGNED_OUT
      if (event !== 'SIGNED_IN' && event !== 'SIGNED_OUT') {
        console.log('[AuthContext] Evento ignorado:', event);
        return;
      }
      
      // Debounce
      const now = Date.now();
      if (now - lastProcessedTimeRef.current < DEBOUNCE_MS) {
        console.log('[AuthContext] Evento ignorado (debounce)');
        return;
      }
      
      if (isProcessingRef.current) {
        console.log('[AuthContext] Processamento já em andamento, ignorando evento');
        return;
      }
      
      isProcessingRef.current = true;
      lastProcessedTimeRef.current = now;
  
      try {
        if (event === 'SIGNED_IN' && session?.user) {
          console.log('[AuthContext] SIGNED_IN: Carregando perfil...');
          const mapped = await mapSupabaseUserToAppUser(session.user);
          setUser(mapped);
        } else if (event === 'SIGNED_OUT') {
          console.log('[AuthContext] SIGNED_OUT: Limpando usuário');
          setUser(null);
        }
      } catch (error) {
        console.error('[AuthContext] Erro ao processar mudança de autenticação:', error);
        // NÃO limpar usuário em caso de erro - pode ser timeout temporário
      } finally {
        isProcessingRef.current = false;
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
      // Autenticação sem timeout - deixar o Supabase gerenciar
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      
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
    if (!user?.auth_id) {
      console.log('[Realtime] Sem user.auth_id, não criando canal');
      return;
    }
    
    console.log('[Realtime] Criando canal para auth_id:', user.auth_id);
    console.log('[Realtime] Dados do user:', { id: user.id, auth_id: user.auth_id, name: user.name, role: user.role });
    
    const channel = supabase
      .channel('realtime:profiles:self')
      .on(
        'postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'profiles', 
          filter: `auth_user_id=eq.${user.auth_id}` 
        }, 
        (payload) => {
          console.log('[Realtime] ✅ Mudança detectada no perfil!');
          console.log('[Realtime] Payload:', payload);
          console.log('[Realtime] Chamando refreshUser...');
          refreshUser();
        }
      )
      .subscribe((status) => {
        console.log('[Realtime] Status da subscription:', status);
        if (status === 'SUBSCRIBED') {
          console.log('[Realtime] ✅ Canal ativo e escutando mudanças');
        } else if (status === 'CHANNEL_ERROR') {
          console.error('[Realtime] ❌ Erro no canal');
        } else if (status === 'TIMED_OUT') {
          console.error('[Realtime] ❌ Timeout na conexão');
        }
      });

    return () => {
      console.log('[Realtime] Removendo canal');
      supabase.removeChannel(channel);
    };
  }, [user?.auth_id]); // Dependência correta: user.auth_id

  const logout = async () => {
    try {
      console.log('[AuthContext] Iniciando logout...');
      
      // Limpa o usuário imediatamente para melhor UX
      setUser(null);
      
      // Faz o signOut do Supabase (ele já gerencia a limpeza do storage)
      await supabase.auth.signOut();
      
      console.log('[AuthContext] Logout realizado com sucesso');
    } catch (error) {
      console.error('[AuthContext] Erro ao fazer logout:', error);
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
