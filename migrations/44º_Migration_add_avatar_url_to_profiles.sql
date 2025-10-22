-- Descrição: Adicionar campo avatar_url na tabela profiles para armazenar foto de perfil dos médicos e usuários
-- Data: 2025-10-21
-- Autor: Sistema MedX

-- Adicionar campo avatar_url à tabela profiles
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS avatar_url TEXT;

-- Comentário do novo campo
COMMENT ON COLUMN public.profiles.avatar_url IS 'URL da foto de perfil do usuário (médico, secretária, etc)';

-- Criar índice para facilitar consultas por avatar_url
CREATE INDEX IF NOT EXISTS idx_profiles_avatar_url 
ON public.profiles(avatar_url) WHERE avatar_url IS NOT NULL;

