-- Descrição: Criação da tabela para armazenar consultas dos agentes de IA vinculadas aos pacientes
-- Data: 2025-10-05
-- Autor: Sistema MedX

-- ============================================================================
-- TABELA: agent_consultations (Consultas dos Agentes de IA)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.agent_consultations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  doctor_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  agent_type TEXT NOT NULL CHECK (agent_type IN ('cid', 'medication', 'protocol', 'exams')),
  
  -- Dados da consulta (JSON para flexibilidade entre diferentes agentes)
  consultation_input JSONB NOT NULL,  -- Entrada fornecida (termo, idade, sexo, etc)
  consultation_output JSONB NOT NULL, -- Resposta completa do agente
  
  -- Campos específicos para Agent CID (para facilitar buscas)
  cid_code TEXT,          -- Código CID encontrado
  cid_description TEXT,   -- Descrição do CID
  confidence_level TEXT,  -- Nível de confiança
  
  -- Metadados
  consultation_date TIMESTAMPTZ DEFAULT NOW(),
  notes TEXT,             -- Notas adicionais do médico
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para busca rápida
CREATE INDEX IF NOT EXISTS idx_agent_consultations_patient ON public.agent_consultations(patient_id);
CREATE INDEX IF NOT EXISTS idx_agent_consultations_doctor ON public.agent_consultations(doctor_id);
CREATE INDEX IF NOT EXISTS idx_agent_consultations_agent_type ON public.agent_consultations(agent_type);
CREATE INDEX IF NOT EXISTS idx_agent_consultations_date ON public.agent_consultations(consultation_date);
CREATE INDEX IF NOT EXISTS idx_agent_consultations_cid_code ON public.agent_consultations(cid_code);

-- ============================================================================
-- TRIGGER para atualização automática de updated_at
-- ============================================================================
CREATE TRIGGER update_agent_consultations_updated_at
  BEFORE UPDATE ON public.agent_consultations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================================
ALTER TABLE public.agent_consultations ENABLE ROW LEVEL SECURITY;

-- Políticas para AGENT_CONSULTATIONS
CREATE POLICY "Médicos e owners podem ver consultas dos agentes"
ON public.agent_consultations FOR SELECT
USING (
  auth.uid() IN (
    SELECT auth_user_id FROM public.profiles WHERE role IN ('owner', 'doctor', 'secretary')
  )
);

CREATE POLICY "Médicos podem criar consultas dos agentes"
ON public.agent_consultations FOR INSERT
WITH CHECK (
  doctor_id IN (
    SELECT id FROM public.profiles WHERE auth_user_id = auth.uid() AND role IN ('doctor', 'owner')
  )
);

CREATE POLICY "Médicos podem atualizar suas consultas"
ON public.agent_consultations FOR UPDATE
USING (
  doctor_id IN (
    SELECT id FROM public.profiles WHERE auth_user_id = auth.uid()
  ) OR auth.uid() IN (
    SELECT auth_user_id FROM public.profiles WHERE role = 'owner'
  )
);

CREATE POLICY "Owners podem deletar consultas dos agentes"
ON public.agent_consultations FOR DELETE
USING (
  auth.uid() IN (
    SELECT auth_user_id FROM public.profiles WHERE role = 'owner'
  )
);

-- ============================================================================
-- COMENTÁRIOS
-- ============================================================================
COMMENT ON TABLE public.agent_consultations IS 'Armazena consultas realizadas pelos agentes de IA (CID, Medicação, Protocolos, Exames) vinculadas aos pacientes';
COMMENT ON COLUMN public.agent_consultations.agent_type IS 'Tipo do agente: cid, medication, protocol, exams';
COMMENT ON COLUMN public.agent_consultations.consultation_input IS 'Dados de entrada fornecidos ao agente (formato JSON)';
COMMENT ON COLUMN public.agent_consultations.consultation_output IS 'Resposta completa do agente (formato JSON)';
COMMENT ON COLUMN public.agent_consultations.cid_code IS 'Código CID encontrado (para Agent CID)';
COMMENT ON COLUMN public.agent_consultations.cid_description IS 'Descrição do CID encontrado (para Agent CID)';
COMMENT ON COLUMN public.agent_consultations.confidence_level IS 'Nível de confiança da resposta (ALTA, MÉDIA, BAIXA)';
