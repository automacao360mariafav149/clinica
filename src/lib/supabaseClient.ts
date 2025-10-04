import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

if (!supabaseUrl || !supabaseAnonKey) {
  // Evita falhas silenciosas em tempo de dev
  console.warn(
    'Variáveis VITE_SUPABASE_URL e/ou VITE_SUPABASE_ANON_KEY não configuradas. Verifique seu .env.local.'
  );
}

export const supabase = createClient(supabaseUrl ?? '', supabaseAnonKey ?? '');

export async function testConnection() {
  const { data, error } = await supabase
    .from('teste_mcp')
    .select('*')
    .limit(1);

  return { data, error };
}



