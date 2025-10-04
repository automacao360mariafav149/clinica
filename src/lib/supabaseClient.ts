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

// Configuração do Supabase com localStorage (padrão)
// Persiste a sessão entre reloads e abas, mas com melhor gerenciamento de cache
export const supabase = createClient(supabaseUrl ?? '', supabaseAnonKey ?? '', {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    // Usa localStorage padrão do Supabase para persistir sessão
    storage: typeof window !== 'undefined' ? window.localStorage : undefined,
  }
});

export async function testConnection() {
  const { data, error } = await supabase
    .from('teste_mcp')
    .select('*')
    .limit(1);

  return { data, error };
}



