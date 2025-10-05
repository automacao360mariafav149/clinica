-- Descrição: Adiciona campos específicos para Agent de Medicação na tabela agent_consultations
-- Data: 2025-10-05
-- Autor: Sistema MedX

-- ============================================================================
-- ADICIONAR CAMPOS ESPECÍFICOS PARA MEDICAÇÃO
-- ============================================================================
ALTER TABLE public.agent_consultations
ADD COLUMN IF NOT EXISTS medication_name TEXT,
ADD COLUMN IF NOT EXISTS medication_dosage TEXT,
ADD COLUMN IF NOT EXISTS medication_frequency TEXT;

-- ============================================================================
-- CRIAR ÍNDICES PARA BUSCA RÁPIDA
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_agent_consultations_medication_name 
ON public.agent_consultations(medication_name);

-- ============================================================================
-- COMENTÁRIOS
-- ============================================================================
COMMENT ON COLUMN public.agent_consultations.medication_name IS 'Nome do medicamento calculado (para Agent Medicação)';
COMMENT ON COLUMN public.agent_consultations.medication_dosage IS 'Dosagem calculada do medicamento (para Agent Medicação)';
COMMENT ON COLUMN public.agent_consultations.medication_frequency IS 'Frequência de administração do medicamento (para Agent Medicação)';

