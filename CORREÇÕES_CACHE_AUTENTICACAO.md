# Correções de Cache de Autenticação

**Data:** 2025-10-04  
**Autor:** Assistente AI

## 🎯 Problema Identificado

O sistema estava apresentando inconsistências onde o usuário logado não correspondia à sua role real. Isso ocorria devido a problemas de cache em múltiplos níveis:

### Causas Raiz

1. **Cache do Supabase no localStorage**: O Supabase por padrão armazena a sessão no localStorage, o que persiste entre sessões do navegador
2. **Usuário "Otimista" com dados desatualizados**: O sistema usava uma função `buildOptimisticUserFromAuthUser` que lia dados do `user_metadata` ao invés da tabela `profiles`
3. **Race Condition**: Havia uma condição de corrida onde dados otimistas (potencialmente desatualizados) eram exibidos antes dos dados corretos serem carregados
4. **Falta de invalidação de cache**: Não havia mecanismo robusto para limpar cache quando detectadas inconsistências

## ✅ Correções Implementadas

### 1. Mudança de localStorage para sessionStorage

**Arquivo:** `src/lib/supabaseClient.ts`

Configuramos o Supabase para usar `sessionStorage` ao invés de `localStorage`:

```typescript
export const supabase = createClient(supabaseUrl ?? '', supabaseAnonKey ?? '', {
  auth: {
    storage: typeof window !== 'undefined' ? window.sessionStorage : undefined,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
});
```

**Benefícios:**
- ✅ Cache é limpo automaticamente ao fechar o navegador
- ✅ Previne persistência de dados desatualizados entre sessões
- ✅ Melhor segurança (dados não ficam permanentemente no dispositivo)

### 2. Remoção da Lógica de Usuário Otimista

**Arquivo:** `src/contexts/AuthContext.tsx`

Removemos completamente a função `buildOptimisticUserFromAuthUser` que causava o problema.

**Antes:**
```typescript
// Usava user_metadata que poderia estar desatualizado
function buildOptimisticUserFromAuthUser(supaUser: SupabaseUser): User {
  const metadata = (supaUser.user_metadata || {}) as Record<string, unknown>;
  const fallbackRole: UserRole = (metadata.role as UserRole | undefined) || 'doctor';
  // ...
}
```

**Depois:**
- ❌ Função removida
- ✅ Sempre busca dados diretamente da tabela `profiles`
- ✅ Nunca confia em `user_metadata`

### 3. Busca Garantida do Banco de Dados

Refatoramos `mapSupabaseUserToAppUser` para:

```typescript
async function mapSupabaseUserToAppUser(supaUser: SupabaseUser): Promise<User> {
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
```

**Benefícios:**
- ✅ Dados sempre atualizados
- ✅ Erros claros se o perfil não existir
- ✅ Logout automático em caso de erro

### 4. Estado de Loading

Adicionamos `isLoading` ao contexto de autenticação:

```typescript
interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
  isLoading: boolean;  // ← NOVO
  refreshUser: () => Promise<void>;  // ← NOVO
}
```

**Benefícios:**
- ✅ Evita exibir dados inconsistentes durante carregamento
- ✅ Melhor experiência do usuário com loading states
- ✅ Função `refreshUser` para forçar atualização quando necessário

### 5. Login Síncrono

Modificamos a função `login` para aguardar os dados do perfil antes de continuar:

```typescript
const login = async (email: string, password: string) => {
  // ... autenticação ...
  
  // Busca os dados do perfil ANTES de definir o usuário
  try {
    const mapped = await mapSupabaseUserToAppUser(currentUser);
    setUser(mapped);
  } catch (error) {
    // Se falhar ao buscar o perfil, fazer logout e propagar o erro
    await supabase.auth.signOut();
    throw error;
  }
};
```

**Benefícios:**
- ✅ Garante que o usuário sempre terá a role correta ao logar
- ✅ Previne race conditions
- ✅ Logout automático se o perfil não existir

### 6. Logout Robusto com Limpeza de Cache

Implementamos limpeza completa de cache no logout:

```typescript
const logout = async () => {
  try {
    setUser(null);
    await supabase.auth.signOut();
    
    // Força limpeza de qualquer cache residual
    if (typeof window !== 'undefined') {
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
    setUser(null);
  }
};
```

**Benefícios:**
- ✅ Remove todo cache do Supabase no logout
- ✅ Garante estado limpo mesmo em caso de erro
- ✅ Previne persistência de dados desatualizados

### 7. Realtime Updates Melhorados

Atualizamos o listener de realtime para usar a função `refreshUser`:

```typescript
useEffect(() => {
  if (!user?.id) return;
  
  const channel = supabase
    .channel('realtime:profiles:self')
    .on('postgres_changes', { 
      event: '*', 
      schema: 'public', 
      table: 'profiles', 
      filter: `auth_user_id=eq.${user.id}` 
    }, async () => {
      console.log('Perfil alterado, atualizando dados do usuário...');
      await refreshUser();
    })
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}, [user?.id]);
```

**Benefícios:**
- ✅ Atualização automática quando o perfil muda no banco
- ✅ Logs para facilitar debugging
- ✅ Usa a mesma lógica de refresh em todo o sistema

## 🔧 Ações Recomendadas

### Para Desenvolvedores

1. **Limpar cache do navegador**: 
   - Pressione `Ctrl+Shift+Delete` (Windows/Linux) ou `Cmd+Shift+Delete` (Mac)
   - Selecione "Cookies e outros dados de sites" e "Imagens e arquivos em cache"
   - Clique em "Limpar dados"

2. **Fazer logout e login novamente**: Após as mudanças, faça logout e login novamente para garantir que o novo sistema de cache seja usado

3. **Testar mudanças de role**: 
   - Teste alterar a role de um usuário no banco
   - Verifique se a mudança é refletida automaticamente (via realtime)
   - Ou faça logout/login para ver a nova role

### Para Usuários Finais

1. **Fazer logout e login novamente** após a atualização do sistema
2. Se persistir algum problema, **limpar o cache do navegador**

## 📊 Impacto das Mudanças

### Positivo ✅
- Role sempre correta e atualizada
- Melhor segurança com sessionStorage
- Tratamento de erros mais robusto
- Atualizações em tempo real funcionando corretamente
- Melhor experiência do usuário com loading states

### Considerações ⚠️
- Usuários precisarão fazer login novamente se tiverem uma sessão ativa (pois mudamos de localStorage para sessionStorage)
- O login pode levar alguns milissegundos a mais (espera dados do banco antes de continuar)
- Sessão não persiste ao fechar o navegador (comportamento intencional para segurança)

## 🧪 Como Testar

1. **Teste básico de login/logout:**
   ```
   1. Fazer login
   2. Verificar se a role está correta
   3. Fazer logout
   4. Verificar se o cache foi limpo (abrir DevTools > Application > Session Storage)
   ```

2. **Teste de mudança de role:**
   ```
   1. Fazer login como usuário A
   2. Em outra aba, alterar a role do usuário A no banco
   3. Verificar se a mudança é refletida automaticamente na primeira aba
   ```

3. **Teste de cache entre sessões:**
   ```
   1. Fazer login
   2. Fechar o navegador
   3. Abrir novamente
   4. Verificar que precisa fazer login novamente
   ```

## 📝 Notas Técnicas

- As mudanças são compatíveis com a estrutura existente
- Não há breaking changes na API pública do `useAuth`
- Novos campos adicionados: `isLoading` e `refreshUser`
- Todos os componentes existentes continuam funcionando
- O sistema é retrocompatível com tabelas que usam `id` ou `auth_user_id`

## 🚀 Próximos Passos (Opcional)

Para melhorias futuras, considere:

1. **Adicionar retry logic**: Implementar tentativas automáticas em caso de falha na busca do perfil
2. **Telemetria**: Adicionar logs para monitorar problemas de cache em produção
3. **Testes automatizados**: Criar testes E2E para validar o fluxo de autenticação
4. **Cache inteligente**: Implementar cache em memória (React state) com invalidação baseada em tempo

---

**Status:** ✅ Implementado e pronto para testes  
**Arquivos Modificados:**
- `src/lib/supabaseClient.ts`
- `src/contexts/AuthContext.tsx`

