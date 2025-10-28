import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

if (!isSupabaseConfigured) {
  // Evita falhas silenciosas em tempo de dev
  console.warn(
    'Variáveis VITE_SUPABASE_URL e/ou VITE_SUPABASE_ANON_KEY não configuradas. Verifique seu .env.local.'
  );
}

// 🔥 Rate limiter para evitar spam de requisições
export const rateLimiter = {
  lastCall: {} as Record<string, number>,
  
  /**
   * Verifica se uma chamada pode ser feita baseado no intervalo mínimo
   * @param key Identificador único da operação (ex: 'profiles', 'auth')
   * @param minInterval Intervalo mínimo em ms entre chamadas (padrão: 500ms)
   * @returns true se pode fazer a chamada, false se deve esperar
   */
  canCall(key: string, minInterval = 500): boolean {
    const now = Date.now();
    const lastCall = this.lastCall[key] || 0;
    
    if (now - lastCall < minInterval) {
      console.log(`[RateLimit] 🚫 Bloqueando chamada: ${key} (aguardar ${minInterval - (now - lastCall)}ms)`);
      return false;
    }
    
    this.lastCall[key] = now;
    return true;
  },
  
  /**
   * Reseta o rate limiter para uma chave específica
   */
  reset(key: string): void {
    delete this.lastCall[key];
    console.log(`[RateLimit] 🔄 Rate limiter resetado para: ${key}`);
  },
  
  /**
   * Reseta todos os rate limiters
   */
  resetAll(): void {
    this.lastCall = {};
    console.log('[RateLimit] 🔄 Todos os rate limiters resetados');
  }
};

// Configuração do Supabase com localStorage (padrão)
// Persiste a sessão entre reloads e abas, mas com melhor gerenciamento de cache
export const supabase = createClient(supabaseUrl ?? '', supabaseAnonKey ?? '', {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    // Usa localStorage padrão do Supabase para persistir sessão
    storage: typeof window !== 'undefined' ? window.localStorage : undefined,
  },
  global: {
    // Intercepta todas as chamadas fetch para aplicar rate limiting
    fetch: (url, options = {}) => {
      const urlString = url.toString();
      
      // 🔥 CRÍTICO: NÃO aplicar rate limit durante operações de autenticação
      // Verifica se é uma operação de auth ou token refresh
      if (urlString.includes('/auth/v1/token') || 
          urlString.includes('/auth/v1/user') ||
          urlString.includes('grant_type=password')) {
        console.log('[RateLimit] ✅ Permitindo operação de autenticação (sem rate limit)');
        return fetch(url, options);
      }
      
      // 🔥 TEMPORARIAMENTE DESABILITADO - Para debug de login
      // Rate limit para profiles DESABILITADO durante testes
      if (urlString.includes('/profiles')) {
        console.log('[RateLimit] ⚠️ DEBUG MODE: Rate limit DESABILITADO para profiles');
        return fetch(url, options);
      }
      
      return fetch(url, options);
    },
  },
});

export async function testConnection() {
  const { data, error } = await supabase
    .from('teste_mcp')
    .select('*')
    .limit(1);

  return { data, error };
}



