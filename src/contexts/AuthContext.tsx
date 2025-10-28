import { createContext, useContext, useState, useEffect, useRef, ReactNode } from 'react';
import { supabase, isSupabaseConfigured } from '@/lib/supabaseClient';
import { User as SupabaseUser } from '@supabase/supabase-js';

export type UserRole = 'owner' | 'doctor' | 'secretary';

export interface User {
  id: string;
  auth_id: string;
  email: string;
  name: string;
  role: UserRole;
  avatar_url?: string;
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

async function mapSupabaseUserToAppUser(supaUser: SupabaseUser): Promise<User> {
  console.log('[AuthContext] 🔍 Buscando perfil do usuário:', supaUser.id);
  console.log('[AuthContext] 📡 Iniciando query para profiles...');
  
  try {
    // Cria uma Promise com timeout de 10 segundos para a query
    const queryPromise = supabase
      .from('profiles')
      .select('*')
      .eq('auth_user_id', supaUser.id)
      .maybeSingle();
    
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => {
        reject(new Error('Timeout na query de profiles após 10s'));
      }, 10000);
    });
    
    console.log('[AuthContext] ⏳ Aguardando resposta da query...');
    const { data: profile, error } = await Promise.race([
      queryPromise,
      timeoutPromise
    ]).catch((err) => {
      console.error('[AuthContext] ❌ Query falhou ou deu timeout:', err);
      return { data: null, error: err };
    }) as any;
    
    console.log('[AuthContext] 📊 Resposta da query:', { 
      hasProfile: !!profile, 
      hasError: !!error,
      errorMessage: error?.message,
      errorCode: error?.code 
    });
    
    if (error) {
      console.error('[AuthContext] ❌ Erro na query:', error);
      
      // Verifica se é erro de timeout
      if (error.message && error.message.includes('Timeout na query')) {
        console.error('[AuthContext] ⚠️⚠️⚠️ QUERY DEU TIMEOUT! Possível problema de RLS ou conexão lenta.');
        console.error('[AuthContext] 💡 DICA: Verifique as políticas RLS da tabela profiles no Supabase');
        
        // Retorna usuário básico para permitir login mesmo com erro
        console.warn('[AuthContext] 🚨 Retornando usuário com dados básicos para permitir login');
        return {
          id: supaUser.id,
          auth_id: supaUser.id,
          email: supaUser.email || '',
          name: supaUser.email || 'Usuário',
          role: 'doctor' as UserRole,
        };
      }
      
      // Verifica se é erro de rate limit
      if (error.message && error.message.includes('Rate limited')) {
        console.warn('[AuthContext] ⚠️ Rate limit detectado, aguardando e tentando novamente...');
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        const { data: retryProfile, error: retryError } = await supabase
          .from('profiles')
          .select('*')
          .eq('auth_user_id', supaUser.id)
          .maybeSingle();
        
        if (retryError) {
          console.error('[AuthContext] ❌ Erro na segunda tentativa:', retryError);
        } else if (retryProfile) {
          console.log('[AuthContext] ✅ Perfil encontrado após retry:', retryProfile);
          return {
            id: retryProfile.id || supaUser.id,
            auth_id: supaUser.id,
            email: supaUser.email || '',
            name: retryProfile.name || supaUser.email || 'Usuário',
            role: retryProfile.role || 'doctor',
            avatar_url: retryProfile.avatar_url || undefined,
          };
        }
      } else if (error.code !== 'PGRST116') {
        console.error('[AuthContext] ❌ Erro desconhecido:', error);
      }
    }

    if (profile) {
      console.log('[AuthContext] ✅ Perfil encontrado:', profile);
    } else {
      console.warn('[AuthContext] ⚠️ Perfil não encontrado, usando dados básicos');
    }

    // Sempre retorna um usuário, mesmo que seja com dados básicos
    return {
      id: profile?.id || supaUser.id,
      auth_id: supaUser.id,
      email: supaUser.email || '',
      name: profile?.name || supaUser.email || 'Usuário',
      role: profile?.role || 'doctor',
      avatar_url: profile?.avatar_url || undefined,
    };
  } catch (error) {
    console.error('[AuthContext] ❌ Erro inesperado:', error);
    
    // Se for erro de rate limit, mostra mensagem específica
    if (error instanceof Error && error.message.includes('Rate limited')) {
      console.error('[AuthContext] ❌ ERRO: Sistema sobrecarregado. Por favor, aguarde alguns segundos e tente novamente.');
    }
    
    // Fallback completo em caso de erro
    return {
      id: supaUser.id,
      auth_id: supaUser.id,
      email: supaUser.email || '',
      name: supaUser.email || 'Usuário',
      role: 'doctor' as UserRole,
    };
  }
}

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  const isProcessingRef = useRef(false);
  const lastProcessedTimeRef = useRef(0);
  const isMountedRef = useRef(true); // Nova flag para verificar se está montado
  const timeoutIdRef = useRef<NodeJS.Timeout | null>(null); // Ref para o timeout
  
  const DEBOUNCE_MS = 500;

  // Cleanup ao desmontar
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      if (timeoutIdRef.current) {
        clearTimeout(timeoutIdRef.current);
      }
    };
  }, []);
  
  // 🔥 MONITOR: Detecta quando user muda
  useEffect(() => {
    if (user) {
      console.log('[AuthContext] ✅ User SETADO:', { 
        id: user.id, 
        name: user.name, 
        role: user.role,
        email: user.email 
      });
    } else {
      console.warn('[AuthContext] ⚠️ User REMOVIDO (ficou null)');
      console.warn('[AuthContext] Stack trace:', new Error().stack);
    }
  }, [user]);

  const refreshUser = async () => {
    console.log('[AuthContext] 🔄 refreshUser chamado');
    
    // Verifica se componente ainda está montado
    if (!isMountedRef.current) {
      console.log('[AuthContext] Componente desmontado, cancelando refresh');
      return;
    }
    
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
    
    // 🔥 TIMEOUT DE SEGURANÇA - CRÍTICO!
    if (timeoutIdRef.current) {
      clearTimeout(timeoutIdRef.current);
    }
    
    timeoutIdRef.current = setTimeout(() => {
      console.error('[AuthContext] ⚠️ Timeout de segurança ativado - liberando flag após 30s');
      isProcessingRef.current = false;
      timeoutIdRef.current = null;
    }, 30000); // 30 segundos de timeout (para conexões lentas)
    
    try {
      console.log('[AuthContext] Buscando sessão atual...');
      const { data } = await supabase.auth.getSession();
      const currentUser = data.session?.user;
      
      if (!isMountedRef.current) {
        console.log('[AuthContext] Componente desmontado durante operação');
        return;
      }
      
      if (currentUser) {
        console.log('[AuthContext] Sessão encontrada, mapeando perfil...');
        const mapped = await mapSupabaseUserToAppUser(currentUser);
        
        if (!isMountedRef.current) {
          console.log('[AuthContext] Componente desmontado antes de setar user');
          return;
        }
        
        console.log('[AuthContext] ✅ Perfil mapeado:', mapped);
        setUser(mapped);
      } else {
        console.log('[AuthContext] ⚠️ Nenhuma sessão ativa');
        if (isMountedRef.current) {
          setUser(null);
        }
      }
    } catch (error) {
      console.error('[AuthContext] ❌ Erro ao atualizar dados do usuário:', error);
      // Não faz nada, mantém o estado atual
    } finally {
      // Limpa o timeout e reseta a flag
      if (timeoutIdRef.current) {
        clearTimeout(timeoutIdRef.current);
        timeoutIdRef.current = null;
      }
      isProcessingRef.current = false;
      console.log('[AuthContext] refreshUser finalizado - flag liberada');
    }
  };

  // Carregamento inicial da sessão
  useEffect(() => {
    const init = async () => {
      if (!isMountedRef.current) return;
      
      try {
        const { data } = await supabase.auth.getSession();
        const currentUser = data.session?.user;
        
        if (currentUser && isMountedRef.current) {
          const mapped = await mapSupabaseUserToAppUser(currentUser);
          if (isMountedRef.current) {
            setUser(mapped);
          }
        }
      } catch (error) {
        console.error('[AuthContext] Erro ao carregar sessão inicial:', error);
      } finally {
        if (isMountedRef.current) {
          setIsLoading(false);
        }
      }
    };

    init();

    // Listener de mudanças de autenticação
    const { data: listener } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('[AuthContext] 📡 Auth event recebido:', event);
      console.log('[AuthContext] 📡 Session:', session ? 'existe' : 'null');
      console.log('[AuthContext] 📡 Stack trace:', new Error().stack);
      
      if (!isMountedRef.current) {
        console.log('[AuthContext] ⚠️ Evento ignorado - componente desmontado');
        return;
      }
      
      // Processa TOKEN_REFRESHED sem recarregar o perfil
      if (event === 'TOKEN_REFRESHED') {
        console.log('[AuthContext] ✅ Token renovado - sessão mantida');
        return;
      }
      
      // 🔥 LOG ESPECIAL PARA SIGNED_OUT
      if (event === 'SIGNED_OUT') {
        console.error('[AuthContext] 🚨🚨🚨 SIGNED_OUT DETECTADO!');
        console.error('[AuthContext] Isso pode indicar:');
        console.error('[AuthContext] 1. Token expirado');
        console.error('[AuthContext] 2. Logout chamado de outro lugar');
        console.error('[AuthContext] 3. Sessão invalidada pelo Supabase');
        console.error('[AuthContext] Stack trace:', new Error().stack);
      }
      
      // Processa apenas SIGNED_IN e SIGNED_OUT
      if (event !== 'SIGNED_IN' && event !== 'SIGNED_OUT') {
        console.log('[AuthContext] ⚠️ Evento ignorado:', event);
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
      
      // Timeout de segurança para eventos (30 segundos para conexões lentas)
      const eventTimeoutId = setTimeout(() => {
        console.error('[AuthContext] ⚠️ Timeout no processamento de evento após 30s');
        isProcessingRef.current = false;
      }, 30000);

      try {
        if (event === 'SIGNED_IN' && session?.user) {
          console.log('[AuthContext] SIGNED_IN: Carregando perfil...');
          const mapped = await mapSupabaseUserToAppUser(session.user);
          if (isMountedRef.current) {
            setUser(mapped);
          }
        } else if (event === 'SIGNED_OUT') {
          console.log('[AuthContext] SIGNED_OUT: Limpando usuário');
          if (isMountedRef.current) {
            setUser(null);
          }
        }
      } catch (error) {
        console.error('[AuthContext] Erro ao processar mudança de autenticação:', error);
      } finally {
        clearTimeout(eventTimeoutId);
        isProcessingRef.current = false;
      }
    });

    return () => {
      listener.subscription.unsubscribe();
    };
  }, []);

  // 🔥 TEMPORARIAMENTE DESABILITADO - Para debug de logout automático
  // Listener realtime DESABILITADO durante testes
  useEffect(() => {
    if (!user?.auth_id) {
      console.log('[Realtime] ⚠️ DEBUG MODE: Listener realtime DESABILITADO');
      return;
    }
    
    console.log('[Realtime] ⚠️ DEBUG MODE: Listener realtime DESABILITADO para evitar logouts automáticos');
    console.log('[Realtime] User atual:', { 
      id: user.id,
      auth_id: user.auth_id, 
      name: user.name, 
      role: user.role, 
      avatar_url: user.avatar_url 
    });
    
    // DESABILITADO: não cria canal realtime
    // const channel = supabase.channel(...)
    
    return () => {
      console.log('[Realtime] Cleanup (listener estava desabilitado)');
    };
  }, [user?.auth_id]); // Dependência mínima

  const login = async (email: string, password: string) => {
    if (!isSupabaseConfigured) {
      throw new Error('Supabase não configurado. Defina VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY.');
    }
    
    console.log('[AuthContext] Iniciando login para:', email);
    
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      
      if (error) {
        console.error('[AuthContext] Erro na autenticação:', error);
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
      
      const mapped = await mapSupabaseUserToAppUser(currentUser);
      if (isMountedRef.current) {
        setUser(mapped);
      }
      
      console.log('[AuthContext] Login concluído com sucesso');
    } catch (error) {
      console.error('[AuthContext] Erro no login:', error);
      await supabase.auth.signOut();
      throw error;
    }
  };

  const logout = async () => {
    // 🔥 LOG DETALHADO: Identifica quem chamou o logout
    console.log('[AuthContext] 🚨 LOGOUT CHAMADO!');
    console.log('[AuthContext] Stack trace:', new Error().stack);
    console.log('[AuthContext] User atual:', user);
    
    try {
      console.log('[AuthContext] Iniciando logout...');
      
      if (isMountedRef.current) {
        console.log('[AuthContext] Limpando user (setUser(null))');
        setUser(null);
      } else {
        console.warn('[AuthContext] ⚠️ Componente desmontado durante logout');
      }
      
      console.log('[AuthContext] Chamando supabase.auth.signOut()');
      await supabase.auth.signOut();
      
      console.log('[AuthContext] ✅ Logout realizado com sucesso');
    } catch (error) {
      console.error('[AuthContext] ❌ Erro ao fazer logout:', error);
      if (isMountedRef.current) {
        setUser(null);
      }
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
