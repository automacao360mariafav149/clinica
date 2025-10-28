# 🚀 GUIA DE REPLICAÇÃO COMPLETA DO PROJETO MedX

**Versão:** 1.0  
**Data:** 28 de Outubro de 2025  
**Status:** ✅ Pronto para Replicação

---

## 📋 PRÉ-REQUISITOS

Antes de começar, certifique-se de ter:

- ✅ Conta Supabase ativa (https://supabase.com)
- ✅ Node.js 18+ instalado
- ✅ npm ou bun instalado
- ✅ Git instalado
- ✅ Editor de código (VS Code recomendado)
- ✅ Chave da API do Google Gemini (para features de IA)

---

## 🎯 PARTE 1: SETUP DO PROJETO SUPABASE

### Passo 1.1: Criar Novo Projeto no Supabase

1. Acesse https://supabase.com/dashboard
2. Clique em **"New Project"**
3. Preencha os campos:
   ```
   Nome: MedX (ou outro nome de sua escolha)
   Database Password: [escolha uma senha FORTE - mínimo 12 caracteres]
   Region: us-east-2 (ou a mais próxima de você)
   Pricing Plan: Free (ou Pro conforme necessidade)
   ```
4. Clique em **"Create new project"**
5. Aguarde ~2 minutos para o projeto ser criado

### Passo 1.2: Obter Credenciais do Projeto

1. No dashboard do seu projeto, vá em **Settings** → **API**
2. Anote os seguintes valores:
   ```
   Project URL: https://[seu-project-ref].supabase.co
   API Key (anon/public): eyJhb...
   Project Ref: [seu-project-ref]
   ```

---

## 💻 PARTE 2: SETUP DO CÓDIGO FONTE



### Passo 2.2: Instalar Dependências

```bash
# Usando npm
npm install

# OU usando bun (mais rápido)
bun install
```

### Passo 2.3: Configurar Variáveis de Ambiente

1. Copie o arquivo de template:
   ```bash
   cp TEMPLATE_ENV_LOCAL.txt .env.local
   ```

2. Edite o arquivo `.env.local` com suas credenciais:
   ```env
   VITE_SUPABASE_URL=https://[seu-project-ref].supabase.co
   VITE_SUPABASE_ANON_KEY=eyJhb...
   
   # Opcional - Para features de IA
   VITE_GEMINI_API_KEY=sua-chave-gemini-aqui
   ```

3. Salve o arquivo

---

## 🗄️ PARTE 3: SETUP DO BANCO DE DADOS

### Passo 3.1: Instalar Supabase CLI (Opcional mas Recomendado)

```bash
# No Windows
scoop install supabase

# No macOS
brew install supabase/tap/supabase


```

### Passo 3.2: Conectar ao Projeto

```bash
# Login no Supabase
supabase login

# Conectar ao projeto
supabase link --project-ref [seu-project-ref]
```

### Passo 3.3: Aplicar Migrations (MÉTODO 1 - Via CLI)

```bash
# Aplicar todas as migrations de uma vez
supabase db push
```

### Passo 3.4: Aplicar Migrations (MÉTODO 2 - Via Dashboard)

Se preferir aplicar manualmente via dashboard:

1. Acesse **SQL Editor** no dashboard do Supabase
2. Aplique as migrations **NA ORDEM CORRETA**:

#### Migrations Essenciais (Aplicar nesta ordem):

```
✅ 1. init_clinic_schema_v2 (cria estrutura base)
✅ 2. create_profile_calendars (calendários dos médicos)
✅ 3. add_profile_fields (campos adicionais em profiles)
✅ 4. create_patient_tables (sistema de pacientes completo)
✅ 5. create_agent_consultations (IA e agentes)
✅ 6. add_health_insurance_and_reason (convênios)
✅ 7. restructure_doctor_schedules (horários dos médicos)
✅ 8. create_system_settings_table (configurações)
✅ 9. create_pre_patients_and_promotion (leads/pré-pacientes)
✅ 10. 52_ativar_rls_tabelas_legadas_v2 (segurança)
✅ 11. 53_reconciliacao_estado_atual (reconciliação)
```

Para aplicar cada migration:
1. Abra o arquivo da migration em `migrations/[nome].sql`
2. Copie todo o conteúdo SQL
3. Cole no SQL Editor do Supabase
4. Clique em **"Run"**
5. Verifique se não houve erros
6. Passe para a próxima migration

---

## 🌱 PARTE 4: APLICAR SEEDS (DADOS INICIAIS)

### Passo 4.1: Seeds Obrigatórios

Aplique os seeds na ordem abaixo via SQL Editor:

```sql
-- 1. Criar bucket de storage para arquivos
-- Arquivo: seeds/2º_Seed_create_storage_bucket.sql
```

```sql
-- 2. Configurações iniciais do sistema
-- Arquivo: seeds/5º_Seed_initial_system_settings.sql
```

```sql
-- 3. Configurar chave da API Gemini
-- Arquivo: seeds/6º_Seed_gemini_api_key.sql
-- IMPORTANTE: Edite este arquivo e insira sua chave da API Gemini
```

```sql
-- 4. Operadoras e planos de saúde (dados de exemplo)
-- Arquivo: seeds/8º_Seed_insurance_companies_and_plans.sql
```

### Passo 4.2: Seeds Opcionais (Dados de Teste)

```sql
-- Horários de exemplo para médicos
-- Arquivo: seeds/4º_Seed_example_doctor_schedules_horizontal.sql
```

```sql
-- Convênios de exemplo vinculados a médicos
-- Arquivo: seeds/5º_Seed_exemplo_convenios_medicos.sql
```

---

## 👤 PARTE 5: CRIAR PRIMEIRO USUÁRIO

### Passo 5.1: Criar Usuário Owner via Dashboard

1. No dashboard do Supabase, vá em **Authentication** → **Users**
2. Clique em **"Add user"** → **"Create new user"**
3. Preencha:
   ```
   Email: seu-email@exemplo.com
   Password: [escolha uma senha forte]
   Auto Confirm User: ✅ SIM (marque esta opção)
   ```
4. Clique em **"Create user"**

### Passo 5.2: Adicionar Role de Owner

1. Clique no usuário recém-criado
2. Role até **"User Metadata"**
3. Clique em **"Edit user metadata"**
4. Adicione o seguinte JSON:
   ```json
   {
     "role": "owner"
   }
   ```
5. Salve

### Passo 5.3: Criar Profile Manualmente (Via SQL Editor)

```sql
-- Substitua os valores abaixo
INSERT INTO public.profiles (auth_user_id, name, role, email)
VALUES (
  '[id-do-usuario-criado]',
  'Seu Nome',
  'owner',
  'seu-email@exemplo.com'
);
```

---

## 🚀 PARTE 6: INICIAR A APLICAÇÃO

### Passo 6.1: Iniciar Servidor de Desenvolvimento

```bash
# Usando npm
npm run dev

# OU usando bun
bun run dev
```

### Passo 6.2: Acessar a Aplicação

1. Abra o navegador em: http://localhost:5173
2. Faça login com o email e senha criados
3. Você deve ver o dashboard principal

---

## ✅ PARTE 7: VALIDAÇÃO DA INSTALAÇÃO

### Checklist de Validação:

Execute os seguintes testes para garantir que tudo está funcionando:

- [ ] **Login funciona** - Consegue fazer login com o usuário owner
- [ ] **Dashboard carrega** - Vê a tela principal com menus
- [ ] **Criar paciente** - Consegue criar um novo paciente
- [ ] **Criar médico** - Pode adicionar um novo médico
- [ ] **Upload de arquivo** - Consegue fazer upload de imagens/documentos
- [ ] **Realtime funciona** - Abre 2 abas e vê atualizações automáticas
- [ ] **Sistema de convênios** - Visualiza operadoras e planos
- [ ] **Configurações** - Acessa menu de configurações da clínica

### Script de Validação SQL

Execute no SQL Editor para verificar o estado do banco:

```sql
-- Copie o conteúdo de: scripts/validar_estado_banco.sql
```

Resultado esperado:
- ✅ Todas as tabelas principais existem
- ✅ Todas as tabelas têm RLS ativado
- ✅ Políticas RLS configuradas
- ✅ Realtime habilitado

---

## 🔧 PARTE 8: CONFIGURAÇÕES ADICIONAIS

### 8.1: Configurar Storage (Políticas de Acesso)

1. Vá em **Storage** no dashboard
2. Clique no bucket **"medical-attachments"**
3. Vá em **Policies**
4. Adicione as seguintes políticas:

**Política de Upload:**
```sql
CREATE POLICY "Usuários autenticados podem fazer upload"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'medical-attachments' AND
  auth.uid() IS NOT NULL
);
```

**Política de Download:**
```sql
CREATE POLICY "Usuários autenticados podem fazer download"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'medical-attachments' AND
  auth.uid() IS NOT NULL
);
```

### 8.2: Configurar Email Authentication (Opcional)

1. Vá em **Authentication** → **Providers** → **Email**
2. Configure:
   - Enable Email provider: ✅ SIM
   - Confirm email: ✅ SIM (recomendado para produção)
   - Secure email change: ✅ SIM

### 8.3: Configurar Rate Limiting (Produção)

Para produção, configure rate limiting no dashboard:
1. **Settings** → **API** → **Rate Limiting**
2. Configure conforme necessidade da clínica

---

## 🆘 TROUBLESHOOTING (SOLUÇÃO DE PROBLEMAS)

### Problema: "Failed to fetch" ao fazer login

**Solução:**
1. Verifique se o `VITE_SUPABASE_URL` está correto no `.env.local`
2. Verifique se o projeto Supabase está ativo
3. Limpe o cache: `Ctrl+Shift+Delete` → Clear cache

### Problema: "Row Level Security" error

**Solução:**
1. Verifique se todas as migrations foram aplicadas
2. Execute a migration 52 (RLS)
3. Verifique se o usuário tem role definida no user metadata

### Problema: Realtime não funciona

**Solução:**
1. Verifique se a migration 1 (enable_realtime) foi aplicada
2. No SQL Editor, execute:
   ```sql
   SELECT schemaname, tablename
   FROM pg_publication_tables
   WHERE pubname = 'supabase_realtime';
   ```
3. Se faltar alguma tabela, adicione manualmente:
   ```sql
   ALTER PUBLICATION supabase_realtime ADD TABLE public.[nome_tabela];
   ```

### Problema: Storage não funciona

**Solução:**
1. Verifique se o bucket foi criado (seed 2)
2. Verifique políticas de storage
3. Confirme que o bucket é público ou tem políticas RLS corretas

---

## 📊 PARTE 9: DADOS DE EXEMPLO (OPCIONAL)

Se quiser popular o banco com dados de teste:

```sql
-- Inserir médicos de exemplo
INSERT INTO public.profiles (auth_user_id, name, role, email, specialization, consultation_price)
VALUES 
  (gen_random_uuid(), 'Dr. João Silva', 'doctor', 'joao@clinica.com', 'Cardiologia', 250.00),
  (gen_random_uuid(), 'Dra. Maria Santos', 'doctor', 'maria@clinica.com', 'Pediatria', 200.00);

-- Inserir pacientes de exemplo
INSERT INTO public.patients (name, email, phone, birth_date, gender)
VALUES 
  ('Pedro Costa', 'pedro@email.com', '11999998888', '1990-05-15', 'M'),
  ('Ana Oliveira', 'ana@email.com', '11988887777', '1985-08-22', 'F');
```

---

## 📚 RECURSOS ADICIONAIS

### Documentação do Projeto

- 📄 **RELATORIO_AUDITORIA_BANCO_MIGRATIONS.md** - Auditoria completa do banco
- 📄 **PLANO_ACAO_CORRECAO_MIGRATIONS.md** - Plano de correção e manutenção
- 📄 **ESTRUTURA_PRONTUARIOS.md** - Documentação do sistema de prontuários
- 📄 **README_CONVENIOS.md** - Documentação do sistema de convênios

### Arquivos Importantes

```
medx/
├── migrations/          ← Todas as migrations SQL
├── seeds/              ← Dados iniciais
├── scripts/            ← Scripts de validação
├── src/                ← Código fonte React
│   ├── components/     ← Componentes React
│   ├── contexts/       ← Contexts (Auth, etc)
│   ├── lib/           ← Configurações e utilities
│   └── pages/         ← Páginas da aplicação
└── .env.local         ← Variáveis de ambiente
```

---

## 🎓 PRÓXIMOS PASSOS

Após concluir a instalação:

1. **Personalizar Configurações da Clínica**
   - Menu: Configurações → Informações da Clínica
   - Preencha endereço, horários e políticas

2. **Adicionar Equipe Médica**
   - Criar usuários para médicos e secretárias
   - Configurar horários de atendimento
   - Vincular convênios aceitos

3. **Configurar Integrações**
   - WhatsApp (se disponível)
   - Google Calendar
   - API do Gemini para IA

4. **Testar Funcionalidades**
   - Criar prontuários
   - Agendar consultas
   - Testar follow-ups
   - Verificar relatórios

---

## 🔒 SEGURANÇA E BACKUP

### Recomendações:

1. **Backup Regular**
   ```bash
   # Fazer backup do banco (semanal)
   pg_dump -h [seu-host].supabase.co -U postgres > backup_$(date +%Y%m%d).sql
   ```

2. **Variáveis de Ambiente**
   - NUNCA commite o arquivo `.env.local` no Git
   - Use secrets em produção (Vercel, Netlify, etc)

3. **Senhas Fortes**
   - Use senhas com mínimo 12 caracteres
   - Ative 2FA no Supabase

4. **Monitoramento**
   - Configure alertas no Supabase
   - Monitore uso de API
   - Verifique logs regularmente

---

## 📞 SUPORTE

Se encontrar problemas:

1. Consulte a documentação oficial:
   - Supabase: https://supabase.com/docs
   - React: https://react.dev
   - Vite: https://vitejs.dev

2. Verifique os arquivos de troubleshooting do projeto

3. Revise os logs do console do navegador (F12)

---

## ✅ CHECKLIST FINAL

Antes de considerar a instalação completa:

- [ ] Projeto Supabase criado e ativo
- [ ] Dependências instaladas (`node_modules` existe)
- [ ] Arquivo `.env.local` configurado
- [ ] Todas as migrations aplicadas
- [ ] Seeds obrigatórios aplicados
- [ ] Primeiro usuário owner criado
- [ ] Login funciona
- [ ] Dashboard carrega corretamente
- [ ] Pode criar pacientes
- [ ] Pode criar médicos
- [ ] Realtime funciona
- [ ] Storage funciona
- [ ] Script de validação executado com sucesso

---

**🎉 PARABÉNS! Seu sistema MedX está pronto para uso!**

---

**Versão do Guia:** 1.0  
**Última Atualização:** 28 de Outubro de 2025  
**Autor:** Sistema MedX Documentation

