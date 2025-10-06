# Auditoria da Página de Login, Autenticação e Conexão ao Banco

## Visão Geral
- **Stack**: React + TypeScript + Vite + Supabase Auth/DB
- **Página de Login**: `src/pages/Login.tsx`
- **Contexto de Autenticação**: `src/contexts/AuthContext.tsx`
- **Cliente Supabase**: `src/lib/supabaseClient.ts`
- **Template de Ambiente**: `TEMPLATE_ENV_LOCAL.txt`
- **Página de Teste de Conexão**: `src/pages/Connections.tsx`
- **RPC/Migration relevante**: `migrations/12º_Migration_create_get_current_user_profile_function.sql`

## Fluxo de Login e Redirecionamento
Trecho principal da página de login que aciona o `login` do contexto e redireciona por role:
```1:46:src/pages/Login.tsx
import { useAuth } from '@/contexts/AuthContext';
...
const { login, isAuthenticated, user } = useAuth();
...
if (isAuthenticated) {
  const roleToRoute: Record<string, string> = {
    owner: '/dashboard',
    doctor: '/agenda',
    secretary: '/agenda',
  };
  const defaultRoute = '/agenda';
  const target = roleToRoute[(user?.role || '')] || defaultRoute;
  return <Navigate to={target} replace />;
}
...
const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  setError('');
  setLoading(true);

  try {
    await login(email, password);
  } catch (err) {
    setError(err instanceof Error ? err.message : 'Erro ao fazer login');
  } finally {
    setLoading(false);
  }
};
```

- **Comportamento**: ao enviar o formulário, chama `login(email, password)`. Se já autenticado, redireciona conforme `role` do usuário: `owner → /dashboard`, `doctor/secretary → /agenda`.

## Autenticação: `AuthContext`
Trecho do método `login` com validação de env, timeout, e busca de perfil via RPC:
```180:226:src/contexts/AuthContext.tsx
const login = async (email: string, password: string) => {
  if (!isSupabaseConfigured) {
    throw new Error('Supabase não configurado. Defina VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY.');
  }
  console.log('[AuthContext] Iniciando login para:', email);
  try {
    const { data, error } = await withTimeout(
      supabase.auth.signInWithPassword({ email, password }),
      60000,
      'Tempo esgotado ao autenticar. Verifique sua conexão e tente novamente.'
    );
    if (error) {
      ... // mapeamento de mensagens amigáveis
    }
    const currentUser = data.user;
    if (!currentUser) {
      throw new Error('Sessão não inicializada');
    }
    const mapped = await mapSupabaseUserToAppUser(currentUser);
    setUser(mapped);
  } catch (error) {
    await supabase.auth.signOut();
    throw error;
  }
};
```

Assinaturas e inicialização de sessão:
```120:176:src/contexts/AuthContext.tsx
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
  const { data: listener } = supabase.auth.onAuthStateChange(async (event, session) => {
    const currentUser = session?.user;
    if (currentUser && event !== 'SIGNED_OUT') {
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
```

Mapeamento do perfil via RPC garantindo dados atualizados da tabela `profiles`:
```51:90:src/contexts/AuthContext.tsx
async function mapSupabaseUserToAppUser(supaUser: SupabaseUser): Promise<User> {
  const rpcPromise = supabase.rpc('get_current_user_profile');
  const { data: profiles, error } = await withTimeout(rpcPromise, 15000, 'Timeout ao buscar perfil do usuário');
  if (error) {
    throw new Error(`Erro ao buscar perfil: ${error.message}`);
  }
  const profile = profiles && profiles.length > 0 ? profiles[0] : null;
  if (!profile) {
    throw new Error('Seu perfil não foi encontrado no sistema. Entre em contato com o administrador.');
  }
  return {
    id: (profile as { id?: string }).id || supaUser.id,
    auth_id: supaUser.id,
    email: supaUser.email || '',
    name: (profile as { name?: string }).name || supaUser.email || 'Usuário',
    role: (profile as { role?: UserRole }).role || 'doctor',
  };
}
```

## Conexão com o Banco (Supabase) e Variáveis de Ambiente
Cliente Supabase e uso de `import.meta.env` (Vite exige prefixo `VITE_`):
```1:25:src/lib/supabaseClient.ts
import { createClient } from '@supabase/supabase-js';
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;
export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);
if (!isSupabaseConfigured) {
  console.warn('Variáveis VITE_SUPABASE_URL e/ou VITE_SUPABASE_ANON_KEY não configuradas. Verifique seu .env.local.');
}
export const supabase = createClient(supabaseUrl ?? '', supabaseAnonKey ?? '', {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    storage: typeof window !== 'undefined' ? window.localStorage : undefined,
  }
});
```

Template oficial do `.env.local` (como preencher):
```15:47:TEMPLATE_ENV_LOCAL.txt
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_ANON_KEY=sua-chave-anonima-aqui
VITE_ENABLE_COMPONENT_TAGGER=false
# ... instruções e avisos importantes ...
```

Página utilitária para testar a conexão com Supabase via variáveis do `.env.local`:
```38:76:src/pages/Connections.tsx
<h3 className="text-xl font-semibold text-foreground">Conexão com Supabase</h3>
<p className="text-muted-foreground mt-2">
  Use o botão abaixo para validar a conexão usando as variáveis
  <br />
  <code>VITE_SUPABASE_URL</code> e <code>VITE_SUPABASE_ANON_KEY</code>
</p>
<Button onClick={runTest} disabled={status === 'loading'}>
  {status === 'loading' ? 'Testando...' : 'Testar Conexão'}
</Button>
```

## RPC/Migration de Perfil utilizada no Login
A função RPC usada pelo frontend está documentada e versionada:
```1:47:migrations/12º_Migration_create_get_current_user_profile_function.sql
-- Descrição: Função RPC para obter o perfil do usuário autenticado atual
-- Data: 2025-10-06
-- Autor: Sistema MedX
...
CREATE OR REPLACE FUNCTION get_current_user_profile()
RETURNS TABLE(
  id UUID,
  auth_user_id UUID,
  name TEXT,
  role TEXT,
  email TEXT,
  phone TEXT,
  specialization TEXT,
  created_at TIMESTAMPTZ
) 
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    p.auth_user_id,
    p.name,
    p.role,
    p.email,
    p.phone,
    p.specialization,
    p.created_at
  FROM profiles p
  WHERE p.auth_user_id = auth.uid();
END;
$$;
GRANT EXECUTE ON FUNCTION get_current_user_profile() TO authenticated;
```

- Conforme regras do workspace: a migration inclui cabeçalho com descrição, data e autor, e está em `migrations/` para versionamento e replicação.

## Considerações de Segurança e Boas Práticas
- **Nunca usar service_role no frontend**: somente `VITE_SUPABASE_ANON_KEY`.
- **Prefixo VITE_ obrigatório** para variáveis de ambiente expostas ao frontend.
- **Persistência de sessão**: configurada com `localStorage` e `autoRefreshToken: true`.
- **Tratamento de erros** amigável no login e logout limpa chaves `sb-*` do storage.
- **RPC para perfil** evita depender de `user_metadata` e previne dados desatualizados.

## Checklist de Verificação Rápida
- [ ] `.env.local` criado na raiz seguindo `TEMPLATE_ENV_LOCAL.txt`
- [ ] `VITE_SUPABASE_URL` definida corretamente (sem aspas, sem espaços)
- [ ] `VITE_SUPABASE_ANON_KEY` definida (anon key, não service role)
- [ ] Página `/connections` retorna OK no teste de conexão
- [ ] Login realizado com usuário existente e perfil presente em `profiles`

## Pontos de Observação/Risco
- Se a tabela `profiles` não tiver registro correspondente ao `auth.uid()`, o login falha com “perfil não encontrado”.
- Lentidão de rede pode acionar o timeout de 60s; há logs no console para diagnóstico.
- Build/preview precisam das variáveis `VITE_` no ambiente de execução (Vite expõe em tempo de build).
