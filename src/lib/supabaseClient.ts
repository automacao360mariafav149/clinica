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

// Configuração do Supabase com sessionStorage para evitar cache entre sessões
// e permitir melhor controle sobre a persistência de dados
export const supabase = createClient(supabaseUrl ?? '', supabaseAnonKey ?? '', {
  auth: {
    storage: typeof window !== 'undefined' ? window.sessionStorage : undefined,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
});

export async function testConnection() {
  const { data, error } = await supabase
    .from('teste_mcp')
    .select('*')
    .limit(1);

  return { data, error };
}



