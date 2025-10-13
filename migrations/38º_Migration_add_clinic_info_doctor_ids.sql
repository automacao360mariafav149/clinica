-- Descrição: Adicionar coluna doctor_ids (UUID[]) na tabela clinic_info para salvar equipe médica
-- Data: 2025-10-13
-- Autor: Assistente GPT-5

ALTER TABLE public.clinic_info
ADD COLUMN IF NOT EXISTS doctor_ids UUID[];

COMMENT ON COLUMN public.clinic_info.doctor_ids IS 'Lista de IDs de médicos (profiles.id) que compõem a equipe médica da clínica.';


