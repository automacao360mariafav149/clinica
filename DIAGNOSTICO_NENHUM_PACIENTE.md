# Diagnóstico: "Nenhum Paciente Cadastrado"

**Problema:** Ao tentar vincular medicação, aparece "Nenhum paciente cadastrado"  
**Data:** 2025-10-05

## Possíveis Causas

### 1. ⚠️ Realmente Não Há Pacientes Cadastrados

**Verificação:**

1. Abra o console do navegador (F12)
2. Veja a mensagem de log:
   ```
   ✅ 0 paciente(s) carregado(s): []
   ```

**Solução:**
- Cadastre pelo menos um paciente na página de Pacientes
- Após cadastrar, tente vincular novamente

**Como cadastrar um paciente:**
```
1. Ir para menu "Pacientes"
2. Clicar em "Novo Paciente"
3. Preencher dados obrigatórios:
   - Nome
   - CPF
   - Email
   - Telefone (importante para envio!)
4. Salvar
```

---

### 2. 🔒 Problema com RLS (Row Level Security)

**Verificação:**

Console mostra erro como:
```
Erro do Supabase: new row violates row-level security policy
```

**Causa:**
- Usuário logado não tem permissão para ver pacientes
- Políticas RLS muito restritivas

**Solução:**

Execute no SQL Editor do Supabase:

```sql
-- Verificar políticas atuais
SELECT * FROM pg_policies WHERE tablename = 'patients';

-- Verificar se RLS está ativado
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'patients';

-- Testar manualmente se consegue ver pacientes
SELECT id, name, phone FROM patients LIMIT 5;
```

**Se não conseguir ver pacientes:**

```sql
-- Opção 1: Criar política mais permissiva para SELECT
CREATE POLICY "Médicos podem ver todos os pacientes"
ON public.patients FOR SELECT
USING (
  auth.uid() IN (
    SELECT auth_user_id 
    FROM public.profiles 
    WHERE role IN ('owner', 'doctor', 'secretary')
  )
);

-- Opção 2: Verificar se user está autenticado
SELECT auth.uid(); -- Deve retornar UUID, não NULL
```

---

### 3. 🗄️ Tabela Patients Não Existe ou Está Vazia

**Verificação:**

No SQL Editor do Supabase:

```sql
-- Verificar se tabela existe
SELECT EXISTS (
  SELECT FROM information_schema.tables 
  WHERE table_schema = 'public' 
  AND table_name = 'patients'
);

-- Contar pacientes
SELECT COUNT(*) FROM patients;

-- Ver estrutura da tabela
\d patients;
-- ou
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'patients';
```

**Solução:**

Se a tabela não existe, execute a migration:
```sql
-- Ver em: migrations/6º_Migration_create_patient_tables.sql
-- Executar todo o conteúdo do arquivo
```

---

### 4. 🔌 Problema de Conexão com Supabase

**Verificação:**

Console mostra:
```
Erro ao carregar pacientes: TypeError: Failed to fetch
```

**Causa:**
- URL do Supabase incorreta
- API Key inválida
- Problema de rede

**Solução:**

1. Verificar arquivo `.env` ou configuração:

```typescript
// src/lib/supabaseClient.ts
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
```

2. Testar conexão manualmente:

```typescript
// No console do navegador:
const { data, error } = await supabase
  .from('patients')
  .select('*')
  .limit(1);
  
console.log('Teste de conexão:', { data, error });
```

---

### 5. 🔑 Campo `phone` Não Existe na Tabela

**Verificação:**

Console mostra erro:
```
column "phone" does not exist
```

**Causa:**
- Tabela patients foi criada sem o campo phone
- Migration desatualizada

**Solução:**

```sql
-- Adicionar campo phone se não existir
ALTER TABLE patients 
ADD COLUMN IF NOT EXISTS phone TEXT;

-- Verificar campos da tabela
SELECT column_name FROM information_schema.columns 
WHERE table_name = 'patients';
```

---

## Diagnóstico Rápido (Passo a Passo)

### Passo 1: Abrir Console
```
Pressione F12 → Aba Console
```

### Passo 2: Limpar Console
```
Clique no ícone de limpar 🗑️
```

### Passo 3: Tentar Vincular Novamente
```
1. Calcular medicação
2. Clicar em "Vincular a um Paciente"
3. Observar mensagens no console
```

### Passo 4: Interpretar Log

**Se ver:**
```
Carregando pacientes...
✅ 0 paciente(s) carregado(s): []
⚠️ Nenhum paciente encontrado no banco de dados
```
→ **Solução:** Cadastrar pacientes

**Se ver:**
```
Carregando pacientes...
Erro do Supabase ao carregar pacientes: {...}
```
→ **Solução:** Verificar erro específico e seguir seção correspondente acima

**Se ver:**
```
Carregando pacientes...
✅ 3 paciente(s) carregado(s): [{...}, {...}, {...}]
```
→ **Sucesso!** Pacientes carregados corretamente

---

## Teste Manual no Supabase

### 1. Acessar Supabase Dashboard

```
https://app.supabase.com/project/[seu-projeto]/editor
```

### 2. Executar Query de Teste

```sql
-- Teste 1: Ver todos os pacientes
SELECT id, name, email, phone, created_at 
FROM patients 
ORDER BY created_at DESC;

-- Teste 2: Contar pacientes
SELECT COUNT(*) as total FROM patients;

-- Teste 3: Ver pacientes com telefone
SELECT id, name, phone 
FROM patients 
WHERE phone IS NOT NULL AND phone != '';

-- Teste 4: Inserir paciente de teste (se necessário)
INSERT INTO patients (name, email, phone, birth_date, gender)
VALUES (
  'Paciente Teste',
  'teste@example.com',
  '5511987654321',
  '1990-01-01',
  'Outro'
)
RETURNING *;
```

### 3. Verificar Políticas RLS

```sql
-- Ver todas as políticas da tabela patients
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'patients';
```

---

## Solução Definitiva: Criar Paciente de Teste

Se realmente não há pacientes, crie um de teste no SQL Editor:

```sql
INSERT INTO public.patients (
  name,
  email,
  cpf,
  phone,
  birth_date,
  gender,
  address,
  city,
  state,
  zip_code
) VALUES (
  'João Silva Teste',
  'joao.teste@example.com',
  '12345678900',
  '5511987654321',
  '1985-05-15',
  'Masculino',
  'Rua Teste, 123',
  'São Paulo',
  'SP',
  '01234-567'
)
RETURNING id, name, phone;
```

**Depois:**
1. Recarregar a página
2. Tentar vincular novamente
3. Deve aparecer "João Silva Teste" na lista

---

## Checklist de Verificação

- [ ] Console aberto (F12)
- [ ] Tentar vincular e observar logs
- [ ] Verificar se aparece: "✅ X paciente(s) carregado(s)"
- [ ] Se X = 0, cadastrar paciente
- [ ] Se erro, verificar mensagem específica
- [ ] Testar query manual no Supabase
- [ ] Verificar RLS se necessário
- [ ] Criar paciente de teste se necessário
- [ ] Recarregar página após mudanças

---

## Melhorias no Código (Já Implementadas)

✅ **Logs detalhados:**
```typescript
console.log('Carregando pacientes...');
console.log(`✅ ${data?.length || 0} paciente(s) carregado(s):`, data);
console.warn('⚠️ Nenhum paciente encontrado no banco de dados');
```

✅ **Toast informativo:**
```typescript
toast.info('Nenhum paciente cadastrado. Cadastre um paciente primeiro.');
toast.error(`Erro ao carregar pacientes: ${error.message}`);
```

✅ **Tratamento de erros:**
```typescript
if (error) {
  console.error('Erro do Supabase:', error);
  toast.error(`Erro: ${error.message}`);
}
```

---

## Próximos Passos

1. **Execute o diagnóstico rápido** (passos acima)
2. **Copie e cole aqui a mensagem do console**
3. **Seguiremos com a solução específica**

Exemplo de mensagens úteis:
```
Carregando pacientes...
✅ 0 paciente(s) carregado(s): []
```

Ou:
```
Erro do Supabase ao carregar pacientes: {code: "...", message: "..."}
```

---

**Status:** Aguardando logs do console para diagnóstico preciso 🔍

