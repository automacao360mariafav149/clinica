-- Descrição: Adiciona campos específicos para Agent de Exames na tabela agent_consultations
-- Data: 2025-10-05
-- Autor: Sistema MedX

-- ============================================================================
-- ADICIONAR CAMPOS ESPECÍFICOS PARA AGENT DE EXAMES
-- ============================================================================

-- Campos para armazenar informações específicas de análises de exames
ALTER TABLE public.agent_consultations 
ADD COLUMN IF NOT EXISTS exam_type TEXT,              -- Tipo de exame (laboratory, imaging, etc)
ADD COLUMN IF NOT EXISTS exam_result_summary TEXT,    -- Resumo do resultado do exame
ADD COLUMN IF NOT EXISTS exam_file_name TEXT,         -- Nome do arquivo do exame analisado
ADD COLUMN IF NOT EXISTS exam_analysis_date TIMESTAMPTZ DEFAULT NOW(); -- Data da análise

-- ============================================================================
-- ÍNDICE PARA FACILITAR BUSCAS
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_agent_consultations_exam_type 
ON public.agent_consultations(exam_type);

CREATE INDEX IF NOT EXISTS idx_agent_consultations_exam_analysis_date 
ON public.agent_consultations(exam_analysis_date);

-- ============================================================================
-- COMENTÁRIOS
-- ============================================================================
COMMENT ON COLUMN public.agent_consultations.exam_type IS 'Tipo de exame analisado pelo Agent de Exames (laboratory, imaging, etc)';
COMMENT ON COLUMN public.agent_consultations.exam_result_summary IS 'Resumo da análise do exame realizada pelo Agent';
COMMENT ON COLUMN public.agent_consultations.exam_file_name IS 'Nome do arquivo PDF do exame que foi analisado';
COMMENT ON COLUMN public.agent_consultations.exam_analysis_date IS 'Data em que a análise do exame foi realizada';

-- ============================================================================
-- MENSAGEM DE SUCESSO
-- ============================================================================
DO $$ 
BEGIN 
  RAISE NOTICE 'Migration 9: Campos de Agent de Exames adicionados com sucesso!';
END $$;
