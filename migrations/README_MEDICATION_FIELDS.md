# Migration 8: Campos de Medicação para Agent Consultations

**Data:** 2025-10-05  
**Autor:** Sistema MedX  
**Status:** Implementado

## Objetivo

Adicionar campos específicos para o Agent de Cálculo de Medicação na tabela `agent_consultations`, permitindo buscas rápidas e filtros por medicamento.

## Alterações na Estrutura do Banco

### Novos Campos Adicionados

A tabela `agent_consultations` recebeu os seguintes campos:

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `medication_name` | TEXT | Nome do medicamento calculado |
| `medication_dosage` | TEXT | Dosagem calculada do medicamento |
| `medication_frequency` | TEXT | Frequência de administração |

### Índices Criados

- **idx_agent_consultations_medication_name**: Permite busca rápida por nome de medicamento

## Uso nos Agentes

### Agent de Medicação

Quando um cálculo de medicação é vinculado a um paciente, os seguintes dados são salvos:

```typescript
{
  agent_type: 'medication',
  medication_name: 'Levotiroxina',
  medication_dosage: '50 mcg a 100 mcg por dia',
  medication_frequency: '1x ao dia',
  consultation_input: {
    medicamento: 'Levotiroxina',
    idade: 30,
    peso: 70.5,
    via_administracao: 'oral',
    condicoes_especiais: ['problema_renal', 'gestante']
  },
  consultation_output: { /* Resposta completa da API */ }
}
```

## Estrutura Completa da Tabela agent_consultations

Após esta migration, a tabela possui:

### Campos Gerais
- `id`: UUID (Primary Key)
- `patient_id`: UUID (Foreign Key → patients)
- `doctor_id`: UUID (Foreign Key → profiles)
- `agent_type`: TEXT ('cid' | 'medication' | 'protocol' | 'exams')
- `consultation_input`: JSONB
- `consultation_output`: JSONB
- `notes`: TEXT
- `consultation_date`: TIMESTAMPTZ
- `created_at`: TIMESTAMPTZ
- `updated_at`: TIMESTAMPTZ

### Campos Específicos do Agent CID
- `cid_code`: TEXT
- `cid_description`: TEXT
- `confidence_level`: TEXT

### Campos Específicos do Agent Medicação (NOVOS)
- `medication_name`: TEXT
- `medication_dosage`: TEXT
- `medication_frequency`: TEXT

## Exemplos de Consultas

### Buscar todos os cálculos de um medicamento específico

```sql
SELECT 
  ac.id,
  ac.patient_id,
  p.name as patient_name,
  ac.medication_name,
  ac.medication_dosage,
  ac.medication_frequency,
  ac.consultation_date
FROM agent_consultations ac
JOIN patients p ON p.id = ac.patient_id
WHERE ac.agent_type = 'medication'
  AND ac.medication_name ILIKE '%levotiroxina%'
ORDER BY ac.consultation_date DESC;
```

### Buscar histórico de medicamentos de um paciente

```sql
SELECT 
  ac.medication_name,
  ac.medication_dosage,
  ac.medication_frequency,
  ac.consultation_date,
  prof.name as doctor_name
FROM agent_consultations ac
JOIN profiles prof ON prof.id = ac.doctor_id
WHERE ac.patient_id = 'uuid-do-paciente'
  AND ac.agent_type = 'medication'
ORDER BY ac.consultation_date DESC;
```

### Verificar medicamentos mais prescritos

```sql
SELECT 
  medication_name,
  COUNT(*) as total_prescricoes
FROM agent_consultations
WHERE agent_type = 'medication'
  AND medication_name IS NOT NULL
GROUP BY medication_name
ORDER BY total_prescricoes DESC
LIMIT 20;
```

## Compatibilidade

Esta migration é **backward compatible** pois:

- ✅ Adiciona apenas novos campos (não modifica existentes)
- ✅ Campos são opcionais (permitem NULL)
- ✅ Não quebra consultas existentes
- ✅ Mantém todas as políticas RLS existentes

## Execução da Migration

### No Supabase Dashboard

1. Acesse o SQL Editor
2. Cole o conteúdo do arquivo `8º_Migration_add_medication_fields_agent_consultations.sql`
3. Execute

### Via CLI (se disponível)

```bash
supabase migration up
```

## Dependências

Esta migration depende de:
- ✅ `7º_Migration_create_agent_consultations.sql` (tabela base)

## Próximos Passos

1. ✅ Migration aplicada
2. ✅ Código do frontend atualizado
3. ✅ Documentação completa
4. 🔄 Testar vinculação de medicações
5. 🔄 Implementar filtros no prontuário
6. 🔄 Adicionar alertas de interações medicamentosas

## Notas Importantes

⚠️ **Atenção:**
- Os campos de medicação só são preenchidos quando `agent_type = 'medication'`
- Para outros tipos de agentes, estes campos ficarão NULL
- Sempre validar o `agent_type` ao fazer queries específicas
- O campo `consultation_output` contém TODOS os dados, os campos específicos são para facilitar buscas

## Rollback (se necessário)

Para reverter esta migration:

```sql
-- Remover índice
DROP INDEX IF EXISTS idx_agent_consultations_medication_name;

-- Remover campos
ALTER TABLE public.agent_consultations
DROP COLUMN IF EXISTS medication_name,
DROP COLUMN IF EXISTS medication_dosage,
DROP COLUMN IF EXISTS medication_frequency;
```

