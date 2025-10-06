# 🔐 Função RPC: get_current_user_profile

## ⚠️ MIGRATION OBRIGATÓRIA

**Arquivo:** `12º_Migration_create_get_current_user_profile_function.sql`

Esta migration **DEVE** ser executada no Supabase para que o sistema de login funcione corretamente.

---

## 🎯 Por Que Esta Migration é Essencial?

Sem esta função RPC, o sistema **NÃO CONSEGUE FAZER LOGIN** e você verá:

❌ **Erro:** "Tempo esgotado ao autenticar"  
❌ **Timeout** de 15 segundos ao tentar fazer login  
❌ Sistema fica tentando buscar perfil mas a função não existe

---

## 🚀 Como Executar

### **Passo 1: Acessar o Supabase**

1. Acesse: https://app.supabase.com/
2. Selecione seu projeto
3. Vá em **SQL Editor** no menu lateral

### **Passo 2: Executar a Migration**

1. Clique em **New Query**
2. Copie TODO o conteúdo de: `12º_Migration_create_get_current_user_profile_function.sql`
3. Cole no editor
4. Clique em **Run** (Executar)
5. Aguarde a confirmação de sucesso ✅

### **Passo 3: Verificar**

Execute este SQL para confirmar que a função foi criada:

```sql
SELECT routine_name 
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name = 'get_current_user_profile';
```

✅ Deve retornar 1 linha com o nome da função

---

## 📋 O Que Esta Função Faz?

```sql
CREATE OR REPLACE FUNCTION get_current_user_profile()
RETURNS TABLE(...) AS $$
BEGIN
  -- Busca o perfil do usuário atualmente autenticado
  RETURN QUERY
  SELECT ... FROM profiles WHERE auth_user_id = auth.uid();
END;
$$;
```

**Funcionalidade:**
- Usa `auth.uid()` para pegar automaticamente o ID do usuário autenticado
- Busca os dados do perfil na tabela `profiles`
- Retorna: id, nome, role (função), CRM, especialidade, etc.
- É chamada durante o **login** e **refresh de sessão**

**Segurança:**
- `SECURITY DEFINER`: Executa com privilégios do criador (seguro)
- `SET search_path = public`: Previne SQL injection
- `GRANT EXECUTE TO authenticated`: Apenas usuários autenticados podem chamar

---

## 🔍 Quando Esta Função é Chamada?

### 1. **Durante o Login**
```typescript
// src/contexts/AuthContext.tsx
const mapped = await mapSupabaseUserToAppUser(currentUser);

// Que chama:
const { data: profiles } = await supabase.rpc('get_current_user_profile');
```

### 2. **Durante o Refresh de Sessão**
Quando o usuário:
- Dá F5 na página
- Volta ao site após um tempo
- Abre uma nova aba do site

### 3. **Para Verificar Role Atualizada**
Quando o perfil do usuário é atualizado, esta função é chamada para pegar os dados mais recentes.

---

## 🐛 Problemas se Esta Migration Não For Executada

### ❌ **Login com Timeout**
```
Tempo esgotado ao autenticar. Verifique sua conexão e tente novamente.
```

**Causa:** Sistema tentando chamar `get_current_user_profile()` que não existe

### ❌ **Console do Navegador**
```javascript
Error: function get_current_user_profile() does not exist
```

### ❌ **Impossível Fazer Login**
Mesmo com credenciais corretas, o login não funciona.

---

## ✅ Após Executar Esta Migration

✅ Login funciona instantaneamente  
✅ Não há mais timeout  
✅ Perfil do usuário é carregado corretamente  
✅ Sistema funciona em dev e produção  

---

## 📚 Migrations Relacionadas

Esta migration depende de:

1. **`6º_Migration_create_patient_tables.sql`**
   - Cria a tabela `profiles`
   - Define estrutura: id, auth_user_id, name, role, etc.

2. **`3º_Migration_create_doctor_user_function.sql`**
   - Cria funções auxiliares de perfil
   - `create_or_update_doctor_profile()`
   - `get_profile_by_auth_user_id()`

**Ordem de Execução:**
```
1º → 2º → 3º → ... → 6º → ... → 12º (ESTA MIGRATION)
```

---

## 🆘 Troubleshooting

### Erro: "function get_current_user_profile() does not exist"

**Solução:** Execute esta migration no Supabase SQL Editor

### Erro: "relation profiles does not exist"

**Solução:** Execute primeiro a `6º_Migration_create_patient_tables.sql`

### Erro: "permission denied for function"

**Solução:** Verifique se o `GRANT EXECUTE` foi executado:
```sql
GRANT EXECUTE ON FUNCTION get_current_user_profile() TO authenticated;
```

---

## 📖 Documentação Completa

Para mais detalhes sobre como resolver erro de timeout, leia:

👉 **`RESOLVER_ERRO_TIMEOUT.md`** (na raiz do projeto)

---

**Data de Criação:** 2025-10-06  
**Autor:** Sistema MedX  
**Prioridade:** 🔴 CRÍTICA - Obrigatória para login funcionar

