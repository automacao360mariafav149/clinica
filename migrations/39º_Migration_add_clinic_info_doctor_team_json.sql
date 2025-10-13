-- Descrição: Adicionar coluna doctor_team (JSONB) com nome e especialidade dos médicos na clinic_info
-- Data: 2025-10-13
-- Autor: Assistente GPT-5

ALTER TABLE public.clinic_info
ADD COLUMN IF NOT EXISTS doctor_team JSONB; -- Ex.: [{"name":"Dr. João","specialization":"Cardiologia"}]

COMMENT ON COLUMN public.clinic_info.doctor_team IS 'Lista (JSONB) de médicos com nome e especialização.';


