-- Descrição: Criação da tabela clinic_info para armazenar informações da clínica (endereço, horários e políticas)
-- Data: 2025-10-13
-- Autor: Assistente GPT-5

-- Criar extensão necessária para UUID, caso não exista
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Tabela principal com informações da clínica
CREATE TABLE IF NOT EXISTS public.clinic_info (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    address_line TEXT,              -- Endereço (logradouro)
    address_number TEXT,            -- Número
    neighborhood TEXT,              -- Bairro
    city TEXT,                      -- Cidade
    state TEXT,                     -- Estado (UF)
    zip_code TEXT,                  -- CEP
    opening_hours TEXT,             -- Horário de atendimento (descrição livre)
    policy_scheduling TEXT,         -- Política de agendamento
    policy_rescheduling TEXT,       -- Política de reagendamento
    policy_cancellation TEXT,       -- Política de cancelamento
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE public.clinic_info IS 'Informações da clínica: endereço, horários e políticas de atendimento.';
COMMENT ON COLUMN public.clinic_info.address_line IS 'Endereço (logradouro)';
COMMENT ON COLUMN public.clinic_info.address_number IS 'Número do endereço';
COMMENT ON COLUMN public.clinic_info.neighborhood IS 'Bairro';
COMMENT ON COLUMN public.clinic_info.city IS 'Cidade';
COMMENT ON COLUMN public.clinic_info.state IS 'Estado (UF)';
COMMENT ON COLUMN public.clinic_info.zip_code IS 'CEP';
COMMENT ON COLUMN public.clinic_info.opening_hours IS 'Horário de atendimento da clínica';
COMMENT ON COLUMN public.clinic_info.policy_scheduling IS 'Política de agendamento';
COMMENT ON COLUMN public.clinic_info.policy_rescheduling IS 'Política de reagendamento';
COMMENT ON COLUMN public.clinic_info.policy_cancellation IS 'Política de cancelamento';

-- Índices úteis
CREATE INDEX IF NOT EXISTS idx_clinic_info_city ON public.clinic_info(city);
CREATE INDEX IF NOT EXISTS idx_clinic_info_state ON public.clinic_info(state);

-- Trigger para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION public.update_clinic_info_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_clinic_info_updated_at
  BEFORE UPDATE ON public.clinic_info
  FOR EACH ROW
  EXECUTE FUNCTION public.update_clinic_info_updated_at();

-- Habilitar RLS
ALTER TABLE public.clinic_info ENABLE ROW LEVEL SECURITY;

-- Política: leitura permitida a usuários autenticados (e opcionalmente anônimos, ajuste conforme necessidade)
DROP POLICY IF EXISTS "Leitura pública de clinic_info" ON public.clinic_info;
CREATE POLICY "Leitura pública de clinic_info"
ON public.clinic_info
FOR SELECT
USING (true);

-- Política: somente OWNER pode inserir/atualizar/deletar
-- Considera-se que a tabela profiles possui auth_user_id e role ('owner' | 'doctor' | 'secretary')
DROP POLICY IF EXISTS "Somente owner pode modificar clinic_info" ON public.clinic_info;
CREATE POLICY "Somente owner pode modificar clinic_info"
ON public.clinic_info
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.auth_user_id = auth.uid() AND p.role = 'owner'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.auth_user_id = auth.uid() AND p.role = 'owner'
  )
);

-- Habilitar Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.clinic_info;


