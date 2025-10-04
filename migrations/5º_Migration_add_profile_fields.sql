-- Descrição: Adicionar campos email, telefone e especialização na tabela profiles
-- Data: 2025-01-04
-- Autor: Sistema MedX

-- Adicionar novos campos à tabela profiles
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS email TEXT,
ADD COLUMN IF NOT EXISTS phone TEXT,
ADD COLUMN IF NOT EXISTS specialization TEXT;

-- Criar índice para busca rápida por email
CREATE INDEX IF NOT EXISTS idx_profiles_email 
ON public.profiles(email);

-- Criar índice para busca por telefone
CREATE INDEX IF NOT EXISTS idx_profiles_phone 
ON public.profiles(phone);

-- Comentários dos novos campos
COMMENT ON COLUMN public.profiles.email IS 'Email de contato do usuário';
COMMENT ON COLUMN public.profiles.phone IS 'Telefone de contato do usuário';
COMMENT ON COLUMN public.profiles.specialization IS 'Especialização médica (para médicos)';

