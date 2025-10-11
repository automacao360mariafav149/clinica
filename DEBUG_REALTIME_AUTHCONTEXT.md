# Debug do Realtime - AuthContext

## 📋 Problema Identificado

Os menus não atualizam automaticamente quando há mudanças no perfil do usuário. É necessário dar F5 para ver as atualizações.

## ✅ Correções Implementadas

### 1. Dependência do useEffect Corrigida

**ANTES:**
```typescript
}, [user?.id]); // ❌ Dependia do ID do perfil
```

**DEPOIS:**
```typescript
}, [user?.auth_id]); // ✅ Depende do auth_id correto
```

**Motivo:** O canal deve ser recriado quando o `auth_id` muda, não o `id` do perfil.

### 2. Logs de Debug Adicionados

Foram adicionados logs detalhados em 3 pontos críticos:

#### A. Criação do Canal Realtime
```typescript
console.log('[Realtime] Criando canal para auth_id:', user.auth_id);
console.log('[Realtime] Dados do user:', { id, auth_id, name, role });
```

#### B. Status da Subscription
```typescript
.subscribe((status) => {
  console.log('[Realtime] Status da subscription:', status);
  if (status === 'SUBSCRIBED') {
    console.log('[Realtime] ✅ Canal ativo e escutando mudanças');
  }
  // ... outros status
});
```

#### C. Detecção de Mudanças
```typescript
(payload) => {
  console.log('[Realtime] ✅ Mudança detectada no perfil!');
  console.log('[Realtime] Payload:', payload);
  console.log('[Realtime] Chamando refreshUser...');
  refreshUser();
}
```

#### D. Função refreshUser
```typescript
console.log('[AuthContext] 🔄 refreshUser chamado');
console.log('[AuthContext] Buscando sessão atual...');
console.log('[AuthContext] ✅ Perfil mapeado:', mapped);
console.log('[AuthContext] ✅ Estado atualizado com sucesso!');
```

### 3. Validação do auth_id

```typescript
if (!user?.auth_id) {
  console.log('[Realtime] Sem user.auth_id, não criando canal');
  return;
}
```

## 🔍 Como Fazer Debug

### Passo 1: Abrir o Console do Navegador

1. Faça login na aplicação
2. Abra o DevTools (F12)
3. Vá na aba "Console"

### Passo 2: Verificar Logs de Inicialização

Você deve ver:
```
[Realtime] Criando canal para auth_id: 5b0e5376-06e3-4a86-8a3f-45f1b42c3148
[Realtime] Dados do user: { id: "f4ce2a8e-...", auth_id: "5b0e5376-...", name: "...", role: "..." }
[Realtime] Status da subscription: SUBSCRIBED
[Realtime] ✅ Canal ativo e escutando mudanças
```

✅ **Se você vê isso:** O realtime está configurado corretamente

❌ **Se não vê:** Veja a seção "Possíveis Problemas" abaixo

### Passo 3: Testar Mudança no Perfil

1. Com o console aberto, vá no Supabase Dashboard
2. Abra a tabela `profiles`
3. Edite o nome ou role do seu usuário
4. Salve

### Passo 4: Verificar Logs da Mudança

Você deve ver:
```
[Realtime] ✅ Mudança detectada no perfil!
[Realtime] Payload: { ... }
[Realtime] Chamando refreshUser...
[AuthContext] 🔄 refreshUser chamado
[AuthContext] Buscando sessão atual...
[AuthContext] Sessão encontrada, mapeando perfil...
[AuthContext] ✅ Perfil mapeado: { ... }
[AuthContext] Atualizando estado do user...
[AuthContext] ✅ Estado atualizado com sucesso!
[AuthContext] refreshUser finalizado
```

✅ **Se você vê isso:** O realtime está funcionando perfeitamente!

❌ **Se não vê a mudança detectada:** Veja "Possíveis Problemas"

## 🐛 Possíveis Problemas e Soluções

### Problema 1: "Sem user.auth_id"

**Log:**
```
[Realtime] Sem user.auth_id, não criando canal
```

**Causa:** O objeto `user` não tem `auth_id`

**Solução:** Verificar a função `mapSupabaseUserToAppUser` nas linhas 30-59

---

### Problema 2: Status não é "SUBSCRIBED"

**Log:**
```
[Realtime] Status da subscription: CHANNEL_ERROR
```
ou
```
[Realtime] Status da subscription: TIMED_OUT
```

**Possíveis Causas:**
1. Realtime não habilitado no Supabase
2. Problemas de conexão
3. RLS (Row Level Security) bloqueando

**Solução:**

#### A. Verificar Realtime no Supabase

1. Vá no Supabase Dashboard
2. Settings > Database > Replication
3. Verifique se a tabela `profiles` está com Realtime habilitado

#### B. Verificar RLS

Execute no SQL Editor do Supabase:
```sql
-- Ver políticas da tabela profiles
SELECT * FROM pg_policies WHERE tablename = 'profiles';
```

Deve existir uma política que permita SELECT para o próprio usuário:
```sql
CREATE POLICY "Users can view their own profile"
ON profiles FOR SELECT
USING (auth.uid() = auth_user_id);
```

---

### Problema 3: Mudança não detectada

**O que você vê:**
- Canal criado ✅
- Status: SUBSCRIBED ✅
- Mas ao editar o perfil, nenhum log aparece ❌

**Causa:** O filtro do realtime pode estar incorreto

**Verificação:**

No console, após ver os logs de criação, execute:
```javascript
// Copie o auth_id do log
const auth_id = "5b0e5376-06e3-4a86-8a3f-45f1b42c3148"; // SEU auth_id

// Busque no Supabase
const { data } = await supabase
  .from('profiles')
  .select('*')
  .eq('auth_user_id', auth_id);

console.log('Perfil encontrado:', data);
```

Se não retornar nada, o `auth_user_id` na tabela está diferente do `auth_id` do usuário.

---

### Problema 4: refreshUser bloqueado por debounce

**Log:**
```
[Realtime] ✅ Mudança detectada no perfil!
[AuthContext] Refresh ignorado (debounce)
```

**Causa:** O debounce de 500ms está impedindo a atualização

**Solução Temporária:** Aguarde 1 segundo e teste novamente

**Solução Permanente:** Se isso acontecer sempre, pode ser necessário ajustar o debounce ou remover para mudanças via realtime.

---

### Problema 5: Estado não atualiza na interface

**O que você vê:**
- Todos os logs aparecem corretamente ✅
- refreshUser finaliza com sucesso ✅
- Mas a interface não atualiza ❌

**Causa:** Os componentes não estão usando o contexto corretamente

**Verificação:**

No componente que deveria atualizar (ex: menu lateral), verifique:
```typescript
const { user } = useAuth(); // ✅ Correto
// ou
const user = useAuth().user; // ✅ Correto

// ❌ ERRADO - não vai reagir a mudanças
const [localUser] = useState(useAuth().user);
```

## 📝 Checklist de Verificação

Use este checklist para diagnosticar o problema:

- [ ] **Logs de inicialização aparecem?**
  - [ ] "Criando canal para auth_id"
  - [ ] "Dados do user"
  - [ ] "Status da subscription: SUBSCRIBED"
  - [ ] "Canal ativo e escutando mudanças"

- [ ] **Ao editar perfil no Supabase:**
  - [ ] "Mudança detectada no perfil!" aparece?
  - [ ] "Payload" é logado?
  - [ ] "Chamando refreshUser..." aparece?

- [ ] **Dentro do refreshUser:**
  - [ ] "refreshUser chamado" aparece?
  - [ ] "Buscando sessão atual..." aparece?
  - [ ] "Perfil mapeado" aparece com dados corretos?
  - [ ] "Estado atualizado com sucesso!" aparece?

- [ ] **Na interface:**
  - [ ] O menu/componente atualiza automaticamente?
  - [ ] Não precisa dar F5?

## 🎯 Próximos Passos

1. **Testar agora:**
   - Faça login
   - Abra o console
   - Verifique os logs de inicialização
   - Edite seu perfil no Supabase
   - Verifique se a interface atualiza

2. **Se não funcionar:**
   - Copie TODOS os logs do console
   - Identifique em qual passo parou
   - Use a seção "Possíveis Problemas" para diagnosticar

3. **Se funcionar:**
   - Teste com diferentes tipos de mudanças (nome, role, etc)
   - Teste com múltiplos usuários/abas abertas
   - Documente se há alguma situação específica onde não funciona

## 📌 Arquivos Modificados

- `src/contexts/AuthContext.tsx`
  - Linha 73-115: Função `refreshUser` com logs detalhados
  - Linha 221-263: useEffect do realtime com logs e correções

## 🔗 Referências

- [Supabase Realtime Documentation](https://supabase.com/docs/guides/realtime)
- [Postgres Changes Filter Syntax](https://supabase.com/docs/guides/realtime/postgres-changes#available-filters)

