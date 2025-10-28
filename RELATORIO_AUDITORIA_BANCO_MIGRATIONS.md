# 🔍 RELATÓRIO DE AUDITORIA: Banco de Dados vs Migrations

**Data:** 28 de Outubro de 2025  
**Projeto:** MedX  
**Banco:** xrzufxkdpfjbjkwyzvyb (PostgreSQL 17)

---

## ⚠️ RESUMO EXECUTIVO

**STATUS:** ⚠️ **CRÍTICO - INCONSISTÊNCIAS DETECTADAS**

### Estatísticas Gerais
- **Migrations aplicadas no banco:** 22
- **Migrations disponíveis localmente:** 51 arquivos
- **Migrations não aplicadas:** ~29 migrations
- **Seeds disponíveis:** 8 arquivos

---

## 📊 TABELAS NO BANCO DE DADOS (27 tabelas)

### ✅ Tabelas Principais - Sistema de Pacientes e Consultas
1. **profiles** - 7 registros, RLS ativo
2. **patients** - 1 registro, RLS ativo
3. **appointments** - 0 registros, RLS ativo
4. **follow_ups** - 0 registros, RLS ativo
5. **messages** - 0 registros, RLS ativo
6. **teleconsultations** - 0 registros, RLS ativo

### ✅ Tabelas de Prontuário e Histórico Médico
7. **medical_records** - 1 registro, RLS ativo
8. **anamnesis** - 0 registros, RLS ativo
9. **clinical_data** - 0 registros, RLS ativo
10. **exam_history** - 0 registros, RLS ativo
11. **medical_attachments** - 0 registros, RLS ativo

### ✅ Tabelas de Agendamento e Configurações
12. **profile_calendars** - 3 registros, RLS ativo
13. **patient_doctors** - 1 registro, RLS ativo
14. **doctor_schedules** - 3 registros, RLS ativo
15. **system_settings** - 6 registros, RLS ativo

### ✅ Tabelas de Convênios Médicos
16. **insurance_companies** - 11 registros, RLS ativo
17. **insurance_plans** - 42 registros, RLS ativo
18. **clinic_accepted_insurances** - 9 registros, RLS ativo
19. **doctors_insurance_summary** - 4 registros, RLS ativo *(Tabela Materializada)*

### ✅ Tabelas de Agentes IA
20. **agent_consultations** - 0 registros, RLS ativo

### ✅ Tabelas de Configuração da Clínica
21. **clinic_info** - 1 registro, RLS ativo
22. **followup_config** - 1 registro, RLS ativo

### ✅ Tabelas de Pré-Pacientes (Leads)
23. **pre_patients** - 0 registros, RLS ativo

### ⚠️ Tabelas Legadas/Auxiliares
24. **medx_history** - 14 registros, **RLS DESATIVADO**
25. **clientes_followup** - 1 registro, **RLS DESATIVADO**
26. **followup_history** - 0 registros, **RLS DESATIVADO**
27. **teste_mcp** - 0 registros, RLS ativo

---

## 📝 MIGRATIONS APLICADAS NO BANCO (22 migrations)

| # | Version | Nome da Migration |
|---|---------|-------------------|
| 1 | 20251004045730 | create_profile_calendars |
| 2 | 20251004051422 | add_profile_fields |
| 3 | 20251004052114 | create_teste_mcp_table |
| 4 | 20251004054156 | init_clinic_schema_v2 |
| 5 | 20251004055339 | enable_realtime_all_tables_exclude_temp |
| 6 | 20251004083738 | criar_funcao_buscar_perfil_usuario |
| 7 | 20251006010541 | add_health_insurance_and_reason |
| 8 | 20251006025504 | 11_restructure_doctor_schedules |
| 9 | 20251006040644 | create_system_settings_table |
| 10 | 20251009063932 | create_pre_patients_and_promotion |
| 11 | 20251009073735 | add_stage_columns_patients_pre_patients |
| 12 | 20251010023835 | 15º_Migration_add_data_e_hora_to_medx_history |
| 13 | 20251010030106 | 16º_Migration_update_promotion_keep_same_uuid |
| 14 | 20251010031145 | 17º_Migration_add_media_to_medx_history |
| 15 | 20251010031231 | 17º_Migration_add_media_to_medx_history *(DUPLICADA)* |
| 16 | 20251010031336 | 18º_Migration_change_media_to_text_link |
| 17 | 20251011032515 | fix_realtime_appointments_patients |
| 18 | 20251013090317 | add_last_appointment_date_to_patients |
| 19 | 20251028204502 | create_teste_mcp_table *(DUPLICADA)* |
| 20 | 20251028211334 | 25_create_dashboard_metrics_function |
| 21 | 20251028213250 | 26_fix_profiles_rls_recursion |
| 22 | 20251028213629 | 27_fix_profiles_rls_no_recursion |

---

## ❌ MIGRATIONS NÃO APLICADAS NO BANCO

### Migrations Críticas Faltantes:

1. **1º_Migration_habilitar_realtime_todas_tabelas.sql**
   - Habilita Realtime em todas as tabelas

2. **2º_Migration_create_doctor_schedules.sql**
   - Criação inicial da tabela de horários dos médicos

3. **12º_Migration_create_get_current_user_profile_function.sql**
   - Função importante para buscar perfil do usuário atual

4. **27º_Migration_create_insurance_tables.sql**
   - ⚠️ **CRÍTICO**: Criação das tabelas de convênios
   - **Paradoxo**: As tabelas existem no banco, mas a migration não foi aplicada via sistema

5. **28º_Migration_adjust_insurance_per_doctor.sql**
   - Ajusta convênios por médico

6. **29º_Migration_fix_insurance_rls_policy.sql**
   - Correção de políticas RLS de convênios

7. **30º_Migration_final_insurance_rls_working.sql**
   - Versão final das políticas RLS de convênios

8. **31º_Migration_create_doctors_insurance_views.sql**
   - Criação de views para resumo de convênios

9. **32º_Migration_fix_doctors_view_with_function.sql**
   - Correção da view com function

10. **33º_Migration_tabela_real_com_realtime.sql**
    - Conversão de view para tabela materializada

11. **34º_Migration_create_clinic_info.sql**
    - ⚠️ **CRÍTICO**: Criação da tabela clinic_info
    - **Paradoxo**: A tabela existe no banco, mas a migration não foi aplicada

12. **35º_Migration_fix_clinic_info_rls.sql**
    - Correção de RLS da clinic_info

13. **36º_Migration_fix_is_current_user_owner_row_security.sql**
    - Correção de segurança de linha

14. **37º_Migration_fix_clinic_info_rls_policies.sql**
    - Correção adicional de políticas RLS

15. **38º_Migration_add_clinic_info_doctor_ids.sql**
    - Adiciona array de IDs de médicos

16. **39º_Migration_add_clinic_info_doctor_team_json.sql**
    - Adiciona campo JSON da equipe médica

17. **41º_Migration_add_last_appointment_date_to_patients.sql**
    - Adiciona data da última consulta

18. **42º_Migration_sync_doctor_schedules_with_clinic_team.sql**
    - Sincronização de horários com equipe

19. **43º_Migration_add_consultation_price_to_profiles.sql**
    - Adiciona preço da consulta

20. **44º_Migration_add_avatar_url_to_profiles.sql**
    - Adiciona URL do avatar

21. **46º_Migration_fix_infinite_recursion_rls_profiles.sql**
    - Correção de recursão infinita em RLS

22. **46º_Migration_melhorias_foreign_key_cascade.sql**
    - ⚠️ **DUPLICADO**: Mesmo número da anterior

23. **47º_Migration_fix_all_recursive_rls_policies.sql**
    - Correção completa de políticas RLS recursivas

24. **48º_Migration_create_followup_config.sql**
    - ⚠️ **CRÍTICO**: Criação da tabela followup_config
    - **Paradoxo**: A tabela existe no banco, mas a migration não foi aplicada

25. **49º_Migration_fix_followup_config_rls.sql**
    - Correção de RLS do followup_config

26. **50º_Migration_followup_config_usar_segundos.sql**
    - Mudança para usar segundos

27. **51º_Migration_followup_config_usar_minutos.sql**
    - Mudança para usar minutos (versão final)

---

## 🚨 PROBLEMAS CRÍTICOS IDENTIFICADOS

### 1. **Paradoxo de Tabelas Existentes sem Migration Aplicada**

As seguintes tabelas **EXISTEM NO BANCO** mas suas migrations **NÃO foram aplicadas oficialmente**:

- `insurance_companies` (Migration 27)
- `insurance_plans` (Migration 27)
- `clinic_accepted_insurances` (Migration 27, 28)
- `doctors_insurance_summary` (Migrations 31-33)
- `clinic_info` (Migration 34)
- `followup_config` (Migration 48)

**Possíveis causas:**
- As tabelas foram criadas manualmente via SQL direto no banco
- As migrations foram aplicadas fora do sistema de migrations do Supabase
- Uso de ferramentas externas (pgAdmin, DBeaver, etc.)

**Impacto:**
- ⚠️ **Replicação impossível**: Outra pessoa não conseguirá replicar o banco apenas rodando as migrations
- ⚠️ **Histórico perdido**: Não há registro oficial de quando/como essas tabelas foram criadas
- ⚠️ **Rollback impossível**: Não é possível reverter essas alterações via migrations

### 2. **Migrations Duplicadas**

- **Migration 17** aplicada 2 vezes (timestamps diferentes)
- **Migration create_teste_mcp_table** aplicada 2 vezes
- **Migration 46** tem 2 arquivos diferentes com mesmo número

### 3. **Tabelas sem RLS (Potencial Vulnerabilidade de Segurança)**

As seguintes tabelas **NÃO TÊM RLS ATIVADO**:
- `medx_history` - 14 registros expostos
- `clientes_followup` - 1 registro exposto
- `followup_history` - Vazia, mas sem proteção

**Risco:** Todos os usuários autenticados podem acessar esses dados sem restrição.

### 4. **Inconsistência de Nomenclatura**

- Algumas migrations usam numeração (1º, 2º, 3º...)
- Outras usam timestamps do Supabase
- Nomenclatura misturada dificulta ordenação e rastreamento

### 5. **Seeds Não Verificados**

Não foi possível verificar se os seeds foram aplicados ao banco. Seeds disponíveis:

1. `1º_Seed_example_doctor_schedules.sql`
2. `1º_Seed_exemplo_avatar_medicos.sql` *(DUPLICADO)*
3. `2º_Seed_create_storage_bucket.sql`
4. `3º_Seed_followup_config_default.sql`
5. `3º_Seed_metrics_test_data.sql` *(DUPLICADO)*
6. `4º_Seed_example_doctor_schedules_horizontal.sql`
7. `5º_Seed_exemplo_convenios_medicos.sql`
8. `5º_Seed_initial_system_settings.sql` *(DUPLICADO)*
9. `6º_Seed_gemini_api_key.sql`
10. `7º_Seed_gemini_model_config.sql`
11. `8º_Seed_insurance_companies_and_plans.sql`

---

## ✅ RECOMENDAÇÕES PARA RESOLUÇÃO

### Prioridade ALTA (Resolver Imediatamente)

1. **Documentar Estado Atual do Banco**
   - ✅ Feito: Este relatório documenta o estado atual

2. **Criar Migrations de Reconciliação**
   - Criar uma migration que verifica se as tabelas já existem
   - Se existirem, apenas registrar a migration como aplicada
   - Se não existirem, criar as tabelas

3. **Ativar RLS nas Tabelas Legadas**
   - `medx_history`
   - `clientes_followup`
   - `followup_history`

4. **Consolidar e Reorganizar Migrations**
   - Eliminar duplicações
   - Criar uma sequência limpa de 1 a N
   - Usar apenas um sistema de numeração

### Prioridade MÉDIA

5. **Criar Script de Setup Completo**
   - Um script SQL único que cria todo o banco do zero
   - Incluir todas as tabelas, índices, RLS, functions, triggers
   - Testar em ambiente limpo

6. **Implementar Sistema de Validação**
   - Script que verifica se o banco está em conformidade com as migrations
   - Alerta sobre divergências

7. **Documentar Processo de Replicação**
   - Guia passo-a-passo para setup do banco
   - Lista de variáveis de ambiente necessárias
   - Processo de aplicação de seeds

### Prioridade BAIXA

8. **Limpeza de Tabelas de Teste**
   - Avaliar se `teste_mcp` ainda é necessária
   - Remover se não estiver em uso

9. **Padronização de Nomenclatura**
   - Definir padrão único para futuras migrations
   - Atualizar documentação

---

## 📋 CHECKLIST PARA REPLICAÇÃO DO PROJETO

Para que outra pessoa possa replicar o projeto, é necessário:

- [ ] Consolidar todas as migrations em ordem sequencial
- [ ] Criar migration de reconciliação para tabelas existentes
- [ ] Aplicar todas as migrations faltantes ao banco atual
- [ ] Ativar RLS em todas as tabelas
- [ ] Criar script SQL único de setup completo
- [ ] Documentar ordem de aplicação de seeds
- [ ] Testar replicação em ambiente limpo
- [ ] Criar guia de setup para novos desenvolvedores
- [ ] Configurar CI/CD para validação automática
- [ ] Implementar testes de integridade do banco

---

## 🎯 PRÓXIMOS PASSOS SUGERIDOS

### Opção 1: Reconciliação Progressiva (Recomendado)
1. Manter o banco atual funcionando
2. Criar migrations de reconciliação que detectam o estado atual
3. Aplicar apenas o que está faltando
4. Testar em paralelo em banco de desenvolvimento

### Opção 2: Reset Completo (Mais Arriscado)
1. Fazer backup completo do banco atual
2. Criar banco novo do zero
3. Aplicar todas as migrations em ordem
4. Migrar dados do banco antigo
5. Validar funcionalidade completa

### Opção 3: Script SQL Consolidado (Mais Rápido)
1. Gerar dump do schema atual
2. Limpar e organizar o SQL
3. Criar script único de setup
4. Testar em ambiente limpo
5. Documentar como migration inicial

---

## 📞 CONTATO E SUPORTE

Este relatório foi gerado automaticamente via MCP (Model Context Protocol) Supabase.

**Recomendação Final:** Antes de compartilhar o projeto com outra pessoa, é essencial resolver as inconsistências identificadas neste relatório. O estado atual do banco não é totalmente replicável apenas com as migrations disponíveis.

---

**Fim do Relatório de Auditoria**

