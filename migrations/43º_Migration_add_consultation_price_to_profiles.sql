-- Descrição: Adicionar campo consultation_price na tabela profiles para armazenar o preço de consulta de cada médico
-- Data: 2025-10-20
-- Autor: Sistema MedX

-- Adicionar campo consultation_price à tabela profiles
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS consultation_price DECIMAL(10, 2) DEFAULT 0.00;

-- Comentário do novo campo
COMMENT ON COLUMN public.profiles.consultation_price IS 'Preço da consulta do médico (em reais)';

-- Criar índice para facilitar consultas por preço
CREATE INDEX IF NOT EXISTS idx_profiles_consultation_price 
ON public.profiles(consultation_price) WHERE role = 'doctor';

