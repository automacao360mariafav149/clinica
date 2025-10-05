# Migration: Agent Consultations

## Descrição
Esta migration cria a tabela `agent_consultations` para armazenar consultas realizadas pelos agentes de IA (CID, Medicação, Protocolos, Exames) vinculadas aos pacientes.

## Como Executar

### Opção 1: Via Supabase Dashboard
1. Acesse o [Supabase Dashboard](https://app.supabase.com)
2. Selecione seu projeto
3. Vá em **SQL Editor**
4. Copie e cole o conteúdo do arquivo `7º_Migration_create_agent_consultations.sql`
5. Clique em **Run** para executar

### Opção 2: Via Supabase CLI
```bash
supabase db push
```

## Estrutura da Tabela

### agent_consultations
| Campo | Tipo | Descrição |
|-------|------|-----------|
| id | UUID | Identificador único |
| patient_id | UUID | Referência ao paciente |
| doctor_id | UUID | Referência ao médico |
| agent_type | TEXT | Tipo do agente (cid, medication, protocol, exams) |
| consultation_input | JSONB | Dados de entrada fornecidos |
| consultation_output | JSONB | Resposta completa do agente |
| cid_code | TEXT | Código CID encontrado (Agent CID) |
| cid_description | TEXT | Descrição do CID |
| confidence_level | TEXT | Nível de confiança (ALTA, MÉDIA, BAIXA) |
| consultation_date | TIMESTAMPTZ | Data da consulta |
| notes | TEXT | Notas adicionais do médico |
| created_at | TIMESTAMPTZ | Data de criação |
| updated_at | TIMESTAMPTZ | Data de atualização |

## Funcionalidades

### Agent CID
Quando um médico usa o Agent CID e vincula o resultado a um paciente, os seguintes dados são salvos:

**consultation_input:**
```json
{
  "termo": "febre",
  "idade": 35,
  "sexo": "masculino"
}
```

**consultation_output:**
```json
{
  "codigo_cid": "R50",
  "descricao": "Febre de origem desconhecida",
  "categoria": "Sintomas, sinais e achados...",
  "confianca": "ALTA",
  "observacoes": "O termo 'febre' é um sintoma...",
  "processo_pensamento": "Identifiquei 'febre' como..."
}
```

**Campos específicos extraídos:**
- `cid_code`: "R50"
- `cid_description`: "Febre de origem desconhecida"
- `confidence_level`: "ALTA"

## Permissões (RLS)

- **SELECT**: Médicos, Owners e Secretárias podem visualizar
- **INSERT**: Apenas Médicos e Owners podem criar
- **UPDATE**: Médicos podem atualizar suas próprias consultas, Owners podem atualizar todas
- **DELETE**: Apenas Owners podem deletar

## Índices

A tabela possui índices otimizados para:
- Busca por paciente
- Busca por médico
- Busca por tipo de agente
- Busca por data de consulta
- Busca por código CID

## Integração com o Frontend

O componente `AgentCIDModal` automaticamente:
1. Busca o CID no endpoint
2. Exibe o resultado formatado
3. Permite vincular ao paciente
4. Salva na tabela `agent_consultations`

## Próximos Passos

Esta estrutura está pronta para suportar os outros agentes:
- Agent de Cálculo de Medicação
- Agent Protocolo Clínico
- Agent de Exames

Cada um usará o mesmo sistema, mudando apenas o `agent_type` e os campos JSON.
