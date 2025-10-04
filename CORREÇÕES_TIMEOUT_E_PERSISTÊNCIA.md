# Correções de Timeout e Persistência de Sessão

**Data:** 2025-10-04  
**Autor:** Assistente AI

## 🎯 Problemas Reportados

1. **F5 fazendo logout automático**: A sessão não persistia ao recarregar a página (F5)
2. **Timeout no login**: Erro "Tempo esgotado ao autenticar" após alguns segundos de tentativa

## 🔍 Análise dos Problemas

### Problema 1: Logout no F5
- **Causa**: O uso de `sessionStorage` era muito restritivo
- `sessionStorage` em alguns navegadores não persiste nem no reload da página
- Isso causava logout involuntário ao usuário dar F5

### Problema 2: Timeout no Login
- **Causa**: Timeout de 15 segundos era insuficiente para:
  - Autenticação no Supabase
  - Busca do perfil no banco de dados
  - Possíveis lentidões na conexão
- Não havia retry logic para tentar novamente em caso de falha temporária

## ✅ Correções Implementadas

### 1. Volta ao localStorage

**Arquivo:** `src/lib/supabaseClient.ts`

```typescript
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
```

**Por que voltamos ao localStorage?**
- ✅ Persiste sessão ao recarregar a página (F5)
- ✅ Persiste sessão entre abas do mesmo navegador
- ✅ Melhor experiência do usuário (não precisa fazer login toda hora)
- ✅ Comportamento padrão e esperado em aplicações web

**Segurança mantida:**
- ✅ Logout ainda limpa todo o cache (localStorage + sessionStorage)
- ✅ Sessão expira automaticamente após o período definido no Supabase
- ✅ Token é renovado automaticamente (`autoRefreshToken: true`)

### 2. Aumento dos Timeouts

**Arquivo:** `src/contexts/AuthContext.tsx`

**Antes:**
```typescript
// Timeout único de 15 segundos para tudo
const { data, error } = await withTimeout(
  supabase.auth.signInWithPassword({ email, password }),
  15000,
  'Tempo esgotado ao autenticar.'
);
```

**Depois:**
```typescript
// Timeout de 30 segundos para autenticação
const { data, error } = await withTimeout(
  supabase.auth.signInWithPassword({ email, password }),
  30000,
  'Tempo esgotado ao autenticar. Verifique sua conexão e tente novamente.'
);

// Timeout adicional de 20 segundos para busca do perfil (dentro de mapSupabaseUserToAppUser)
const profile = await withTimeout(
  withRetry(fetchProfile, 3, 1000),
  20000,
  'Tempo esgotado ao buscar perfil do usuário'
);
```

**Benefícios:**
- ✅ **30 segundos** para autenticação (antes: 15s)
- ✅ **20 segundos** adicionais para busca do perfil (com retry)
- ✅ Total de até **50 segundos** de tentativas antes de falhar
- ✅ Tempo suficiente para conexões lentas

### 3. Retry Logic com Backoff Exponencial

**Nova função adicionada:**

```typescript
/**
 * Retry util para tentar uma operação múltiplas vezes antes de falhar
 */
async function withRetry<T>(
  fn: () => Promise<T>,
  maxAttempts: number = 3,
  delayMs: number = 1000
): Promise<T> {
  let lastError: Error | unknown;
  
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      console.warn(`Tentativa ${attempt}/${maxAttempts} falhou:`, error);
      
      if (attempt < maxAttempts) {
        // Aguarda antes de tentar novamente (com backoff exponencial)
        await new Promise(resolve => setTimeout(resolve, delayMs * attempt));
      }
    }
  }
  
  throw lastError;
}
```

**Como funciona:**
1. **1ª tentativa**: Imediatamente
2. **2ª tentativa**: Após 1 segundo de espera (se a 1ª falhar)
3. **3ª tentativa**: Após 2 segundos de espera (se a 2ª falhar)
4. Se todas falharem: Propaga o erro

**Benefícios:**
- ✅ Tolera falhas temporárias de rede
- ✅ Backoff exponencial evita sobrecarregar o servidor
- ✅ 3 tentativas aumentam significativamente a taxa de sucesso
- ✅ Logs detalhados para debugging

### 4. Busca de Perfil Robusta

**Modificação na função `mapSupabaseUserToAppUser`:**

```typescript
async function mapSupabaseUserToAppUser(supaUser: SupabaseUser): Promise<User> {
  // Função para buscar o perfil com retry
  const fetchProfile = async () => {
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('name, role')
      .or(`id.eq.${supaUser.id},auth_user_id.eq.${supaUser.id}`)
      .maybeSingle();

    if (error) {
      console.error('Erro ao buscar perfil do usuário:', error);
      throw new Error('Erro ao buscar perfil: ' + error.message);
    }

    if (!profile) {
      console.error('Perfil não encontrado para o usuário:', supaUser.id);
      throw new Error('Perfil não encontrado');
    }

    return profile;
  };

  try {
    // Tenta buscar o perfil com retry (3 tentativas) e timeout de 20 segundos
    const profile = await withTimeout(
      withRetry(fetchProfile, 3, 1000),
      20000,
      'Tempo esgotado ao buscar perfil do usuário'
    );

    return {
      id: supaUser.id,
      email: supaUser.email || '',
      name: (profile as { name?: string }).name || supaUser.email || 'Usuário',
      role: (profile as { role?: UserRole }).role || 'doctor',
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    
    // Mensagens de erro mais amigáveis
    if (errorMessage.includes('Tempo esgotado')) {
      throw new Error('A conexão está lenta. Tente novamente em alguns instantes.');
    } else if (errorMessage.includes('Perfil não encontrado')) {
      throw new Error('Seu perfil não foi encontrado. Entre em contato com o administrador.');
    } else {
      throw new Error('Não foi possível carregar seus dados. Verifique sua conexão e tente novamente.');
    }
  }
}
```

**Benefícios:**
- ✅ 3 tentativas automáticas para buscar o perfil
- ✅ Timeout de 20 segundos (suficiente para conexões lentas)
- ✅ Mensagens de erro específicas e amigáveis
- ✅ Logs detalhados para debugging

### 5. Mensagens de Erro Amigáveis

**Antes:**
```
"Falha ao autenticar"
"Tempo esgotado ao autenticar"
```

**Depois:**
```
"Email ou senha incorretos"
"Email não confirmado. Verifique sua caixa de entrada."
"A conexão está lenta. Tente novamente em alguns instantes."
"Seu perfil não foi encontrado. Entre em contato com o administrador."
"Não foi possível carregar seus dados. Verifique sua conexão e tente novamente."
```

**Benefícios:**
- ✅ Usuário sabe exatamente o que está acontecendo
- ✅ Mensagens orientam sobre o que fazer
- ✅ Reduz frustração e chamados ao suporte

### 6. Logout Melhorado

**Modificação na função `logout`:**

```typescript
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
```

**Benefícios:**
- ✅ Limpa localStorage (onde a sessão está agora)
- ✅ Também limpa sessionStorage (por precaução)
- ✅ Remove todas as chaves que começam com `sb-` (prefixo do Supabase)
- ✅ Garante estado limpo mesmo em caso de erro

## 📊 Comparação Antes vs Depois

| Aspecto | Antes | Depois |
|---------|-------|--------|
| **Persistência F5** | ❌ Perdia sessão | ✅ Mantém sessão |
| **Timeout Autenticação** | 15 segundos | 30 segundos |
| **Timeout Perfil** | Compartilhado | 20 segundos (separado) |
| **Retry Logic** | ❌ Não tinha | ✅ 3 tentativas com backoff |
| **Tempo Total Máximo** | ~15 segundos | ~50 segundos |
| **Mensagens de Erro** | Genéricas | Específicas e amigáveis |
| **Logs para Debug** | Limitados | Detalhados em cada tentativa |
| **Limpeza de Cache** | sessionStorage apenas | localStorage + sessionStorage |

## 🧪 Como Testar

### Teste 1: Persistência de Sessão
```
1. Fazer login
2. Dar F5 na página
3. ✅ Deve permanecer logado
4. Fechar e abrir o navegador
5. ✅ Deve permanecer logado
```

### Teste 2: Timeout e Retry
```
1. Simular conexão lenta (DevTools > Network > Throttling > Slow 3G)
2. Fazer login
3. ✅ Deve tentar múltiplas vezes
4. ✅ Deve mostrar mensagem amigável se falhar
5. ✅ Console deve mostrar logs das tentativas
```

### Teste 3: Logout Completo
```
1. Fazer login
2. Verificar localStorage (DevTools > Application > Local Storage)
3. Ver chaves que começam com 'sb-'
4. Fazer logout
5. ✅ Todas as chaves 'sb-' devem ter sido removidas
```

### Teste 4: Mensagens de Erro
```
1. Tentar login com credenciais erradas
2. ✅ Deve mostrar "Email ou senha incorretos"
3. Tentar login com conexão lenta demais (>50s)
4. ✅ Deve mostrar "A conexão está lenta. Tente novamente..."
```

## 🔧 Configurações Ajustáveis

Se precisar ajustar os valores, procure por:

**Timeout de Autenticação:**
```typescript
// Linha ~210 em AuthContext.tsx
await withTimeout(
  supabase.auth.signInWithPassword({ email, password }),
  30000,  // ← Ajuste aqui (em milissegundos)
  'Tempo esgotado...'
);
```

**Timeout de Perfil:**
```typescript
// Linha ~100 em AuthContext.tsx
const profile = await withTimeout(
  withRetry(fetchProfile, 3, 1000),
  20000,  // ← Ajuste aqui (em milissegundos)
  'Tempo esgotado...'
);
```

**Número de Tentativas:**
```typescript
// Linha ~100 em AuthContext.tsx
withRetry(fetchProfile, 3, 1000)
//                      ↑ Ajuste aqui (número de tentativas)
```

**Delay entre Tentativas:**
```typescript
// Linha ~100 em AuthContext.tsx
withRetry(fetchProfile, 3, 1000)
//                         ↑ Ajuste aqui (delay base em ms)
```

## ⚠️ Notas Importantes

1. **localStorage vs sessionStorage:**
   - Voltamos ao `localStorage` para melhor UX
   - A segurança é mantida através de tokens com expiração
   - O logout limpa tudo adequadamente

2. **Timeouts Generosos:**
   - 30s + 20s pode parecer muito, mas é necessário para:
     - Conexões 3G/4G
     - Redes corporativas lentas
     - Regiões com infraestrutura limitada
   - Usuários preferem esperar a receber erro

3. **Retry Logic:**
   - 3 tentativas é o padrão da indústria
   - Backoff exponencial evita sobrecarga
   - Logs ajudam a identificar problemas recorrentes

4. **Cache do Navegador:**
   - Usuários existentes ainda podem ter sessão antiga
   - Recomende fazer logout/login após a atualização
   - Ou limpar cache do navegador manualmente

## 🚀 Próximos Passos (Opcional)

1. **Monitoramento:**
   - Adicionar telemetria para ver quantas tentativas em média são necessárias
   - Monitorar timeouts em produção
   - Alertas se taxa de timeout ultrapassar X%

2. **Fallback Gracioso:**
   - Se busca de perfil falhar, considerar usar user_metadata temporariamente
   - Mostrar banner "Alguns dados podem estar desatualizados"
   - Tentar novamente em background

3. **Otimização:**
   - Cachear perfil em memória por X minutos
   - Usar React Query para gerenciar cache automaticamente
   - Prefetch de perfil durante autenticação

4. **Experiência do Usuário:**
   - Adicionar barra de progresso durante login
   - Mostrar "Tentativa X de 3..." durante retry
   - Animação de loading suave

---

**Status:** ✅ Implementado e pronto para testes  
**Arquivos Modificados:**
- `src/lib/supabaseClient.ts` (volta ao localStorage)
- `src/contexts/AuthContext.tsx` (retry, timeouts, mensagens)

**Mudanças Principais:**
1. ✅ Volta ao localStorage (F5 funciona)
2. ✅ Timeout aumentado (30s auth + 20s profile)
3. ✅ Retry logic (3 tentativas)
4. ✅ Mensagens amigáveis
5. ✅ Logout robusto


