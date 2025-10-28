# 🚨 TABELAS SEM MIGRATION DE CRIAÇÃO

**Data:** 28 de Outubro de 2025  
**Análise:** Tabelas que existem no banco mas não têm migration de criação documentada

---

## ❌ TABELAS SEM MIGRATION (10 tabelas)

### 1. **profiles** ⚠️ CRÍTICO
**Status no banco:** ✅ Existe (7 registros)  
**Migration de criação:** ❌ NÃO EXISTE  
**Gravidade:** 🔴 ALTA (tabela central do sistema)

**Campos:**
- id, auth_user_id, name, role, email, phone, specialization
- consultation_price, avatar_url, created_at, updated_at

**Migrations que modificam:**
- 5º - Adiciona email, phone, specialization
- 43º - Adiciona consultation_price
- 44º - Adiciona avatar_url
- 26º, 46º, 47º - Correções de RLS

**✅ SOLUÇÃO:** Migration 0 criada agora

---

### 2. **follow_ups** ⚠️ CRÍTICO
**Status no banco:** ✅ Existe (0 registros)  
**Migration de criação:** ❌ NÃO EXISTE  
**Gravidade:** 🔴 ALTA (sistema de acompanhamento)

**Campos esperados:**
- id, patient_id, assigned_to, due_date, status, notes
- created_at

**Usado para:** Acompanhamento pós-consulta de pacientes

---

### 3. **messages** ⚠️ CRÍTICO
**Status no banco:** ✅ Existe (0 registros)  
**Migration de criação:** ❌ NÃO EXISTE  
**Gravidade:** 🔴 ALTA (comunicação WhatsApp)

**Campos esperados:**
- id, patient_id, sender_id, direction, channel
- content, sent_at, created_at

**Usado para:** Sistema de mensagens WhatsApp

---

### 4. **teleconsultations** ⚠️ MÉDIA
**Status no banco:** ✅ Existe (0 registros)  
**Migration de criação:** ❌ NÃO EXISTE  
**Gravidade:** 🟡 MÉDIA (teleconsultas)

**Campos esperados:**
- id, appointment_id, start_time, end_time
- status, meeting_url, created_at

**Usado para:** Sistema de teleconsultas

---

### 5. **medx_history** ⚠️ LEGADA
**Status no banco:** ✅ Existe (14 registros)  
**Migration de criação:** ❌ NÃO EXISTE  
**Gravidade:** 🟡 MÉDIA (tabela legada)  
**RLS:** ✅ Ativado (Migration 52)

**Campos:**
- id, session_id, message, data_e_hora, media

**Usado para:** Histórico de conversas (sistema legado)

---

### 6. **clientes_followup** ⚠️ LEGADA
**Status no banco:** ✅ Existe (1 registro)  
**Migration de criação:** ❌ NÃO EXISTE  
**Gravidade:** 🟡 MÉDIA (tabela legada)  
**RLS:** ✅ Ativado (Migration 52)

**Campos:**
- id, nome, numero, ultima_atividade, sessionid
- follow-up1, data_envio1, mensagem1
- follow-up2, data_envio2, mensagem2
- follow-up3, data_envio3, mensagem3
- situacao, followup

**Usado para:** Sistema de follow-up antigo

---

### 7. **followup_history** ⚠️ LEGADA
**Status no banco:** ✅ Existe (0 registros)  
**Migration de criação:** ❌ NÃO EXISTE  
**Gravidade:** 🟢 BAIXA (tabela vazia legada)  
**RLS:** ✅ Ativado (Migration 52)

**Campos:**
- id, session_id, message

**Usado para:** Histórico de follow-ups (sistema legado)

---

### 8. **teste_mcp** ⚠️ TESTE
**Status no banco:** ✅ Existe (0 registros)  
**Migration de criação:** ❓ Parcial (migrations aplicadas mas sem CREATE)  
**Gravidade:** 🟢 BAIXA (apenas testes)

**Campos:**
- id, nome, descricao, ativo, created_at, updated_at

**Usado para:** Testes de conexão MCP (pode ser removida)

---

## ✅ TABELAS COM MIGRATION (17 tabelas)

### Sistema de Pacientes (Migration 6)
- ✅ patients
- ✅ patient_doctors
- ✅ medical_records
- ✅ appointments
- ✅ anamnesis
- ✅ clinical_data
- ✅ exam_history
- ✅ medical_attachments

### Sistema de Agentes IA (Migration 7, 8, 9)
- ✅ agent_consultations

### Sistema de Configurações
- ✅ doctor_schedules (Migration 2)
- ✅ system_settings (Migration 13)
- ✅ profile_calendars (Migration 4)

### Sistema de Convênios (Migration 27, 33)
- ✅ insurance_companies
- ✅ insurance_plans
- ✅ clinic_accepted_insurances
- ✅ doctors_insurance_summary

### Sistema de Clínica (Migration 34, 48)
- ✅ clinic_info
- ✅ followup_config

### Leads (Migration 14)
- ✅ pre_patients

---

## 📊 ESTATÍSTICAS

```
Total de tabelas no banco: 27
✅ Com migration documentada: 17 (63%)
❌ Sem migration documentada: 10 (37%)

Gravidade:
🔴 Alta (críticas): 4 tabelas
🟡 Média (legadas): 4 tabelas
🟢 Baixa (testes): 2 tabelas
```

---

## 🎯 PLANO DE AÇÃO

### Prioridade ALTA (Fazer Urgente)

#### 1. Criar Migration para Tabelas Críticas

**Migration 0.1: create_communication_tables.sql**
- Criar `messages`
- Criar `follow_ups`
- Criar `teleconsultations`

**Migration 0.2: create_base_schema_profiles.sql**
- ✅ JÁ CRIADA!

### Prioridade MÉDIA (Documentar)

#### 2. Documentar Tabelas Legadas

**Migration 0.3: document_legacy_tables.sql**
- Documentar `medx_history`
- Documentar `clientes_followup`
- Documentar `followup_history`

### Prioridade BAIXA (Limpeza)

#### 3. Avaliar Tabelas de Teste

- Decidir se mantém ou remove `teste_mcp`
- Se manter, documentar
- Se remover, criar migration de remoção

---

## 🔧 MIGRATIONS A CRIAR

### Migration 0.1 - Tabelas de Comunicação

```sql
-- Descrição: Criação das tabelas de comunicação e follow-up
-- Data: 2025-10-28
-- Autor: Sistema MedX (Retroativa)

-- Tabela: messages
CREATE TABLE IF NOT EXISTS public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  sender_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  direction TEXT NOT NULL CHECK (direction IN ('in', 'out')),
  channel TEXT NOT NULL CHECK (channel = 'whatsapp'),
  content TEXT NOT NULL,
  sent_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela: follow_ups
CREATE TABLE IF NOT EXISTS public.follow_ups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  assigned_to UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  due_date DATE NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('pending', 'done')),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela: teleconsultations
CREATE TABLE IF NOT EXISTS public.teleconsultations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  appointment_id UUID NOT NULL REFERENCES public.appointments(id) ON DELETE CASCADE,
  start_time TIMESTAMPTZ,
  end_time TIMESTAMPTZ,
  status TEXT NOT NULL CHECK (status IN ('scheduled', 'completed', 'cancelled')),
  meeting_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices, RLS, etc...
```

### Migration 0.3 - Tabelas Legadas (Documentação)

```sql
-- Descrição: Documentação das tabelas legadas existentes
-- Data: 2025-10-28
-- Autor: Sistema MedX (Retroativa)

-- NOTA: Estas tabelas já existem no banco, esta migration apenas documenta

-- medx_history (já existe)
COMMENT ON TABLE public.medx_history IS 
'Histórico de conversas com pacientes - Sistema Legado. Mantida para compatibilidade.';

-- clientes_followup (já existe)
COMMENT ON TABLE public.clientes_followup IS 
'Clientes em processo de follow-up - Sistema Legado. Será substituída por follow_ups.';

-- followup_history (já existe)
COMMENT ON TABLE public.followup_history IS 
'Histórico de follow-ups realizados - Sistema Legado. Mantida para auditoria.';
```

---

## 🚨 IMPACTO PARA REPLICAÇÃO

**Status Atual:** ⚠️ **PARCIALMENTE REPLICÁVEL**

Alguém tentando replicar o projeto do zero **NÃO conseguirá** criar:
- ❌ Sistema de mensagens (`messages`)
- ❌ Sistema de follow-ups (`follow_ups`)
- ❌ Teleconsultas (`teleconsultations`)
- ❌ Perfis de usuários (`profiles`)
- ❌ Tabelas legadas (se necessário)

**Após criar as migrations 0.1, 0.2 e 0.3:**
✅ Projeto será **100% replicável**

---

## ✅ PRÓXIMOS PASSOS

1. **Urgente (hoje):**
   - [x] Criar Migration 0 para profiles ✅ FEITO
   - [ ] Criar Migration 0.1 para messages, follow_ups, teleconsultations

2. **Esta semana:**
   - [ ] Criar Migration 0.3 para documentar tabelas legadas
   - [ ] Testar replicação completa em banco novo

3. **Este mês:**
   - [ ] Decidir sobre teste_mcp (manter ou remover)
   - [ ] Consolidar numeração das migrations
   - [ ] Atualizar guia de replicação

---

## 📋 CHECKLIST DE REPLICAÇÃO ATUALIZADO

Para que o projeto seja 100% replicável:

- [x] ✅ Migration 0 (profiles) - CRIADA
- [ ] ⏳ Migration 0.1 (messages, follow_ups, teleconsultations) - PENDENTE
- [ ] ⏳ Migration 0.3 (documentar legadas) - PENDENTE
- [ ] ⏳ Testar em banco limpo - PENDENTE

---

**🎯 CONCLUSÃO:** Identificadas **10 tabelas sem migration**, sendo **4 críticas** que impedem a replicação completa do projeto. Ação imediata necessária!

