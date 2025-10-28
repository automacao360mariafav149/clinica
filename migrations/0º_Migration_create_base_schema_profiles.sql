-- Descrição: Criação da tabela base de profiles (usuários do sistema)
-- Data: 2025-10-04 (Retroativa - documentando estrutura existente)
-- Autor: Sistema MedX

-- ============================================================================
-- EXTENSÕES NECESSÁRIAS
-- ============================================================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================================
-- TABELA: profiles (Usuários do Sistema)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_user_id UUID UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('owner', 'doctor', 'secretary')),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- ÍNDICES
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_profiles_auth_user_id ON public.profiles(auth_user_id);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);

-- ============================================================================
-- TRIGGER PARA ATUALIZAR updated_at
-- ============================================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Política: Todos os usuários autenticados podem ver todos os profiles
CREATE POLICY "Profiles visíveis para usuários autenticados"
ON public.profiles FOR SELECT
TO authenticated
USING (true);

-- Política: Usuários podem atualizar seu próprio profile
CREATE POLICY "Usuários podem atualizar seu próprio profile"
ON public.profiles FOR UPDATE
TO authenticated
USING (auth_user_id = auth.uid())
WITH CHECK (auth_user_id = auth.uid());

-- Política: Apenas owners podem criar profiles
CREATE POLICY "Apenas owners podem criar profiles"
ON public.profiles FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM auth.users
    WHERE auth.users.id = auth.uid()
    AND auth.users.raw_user_meta_data->>'role' = 'owner'
  )
);

-- Política: Apenas owners podem deletar profiles
CREATE POLICY "Apenas owners podem deletar profiles"
ON public.profiles FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM auth.users
    WHERE auth.users.id = auth.uid()
    AND auth.users.raw_user_meta_data->>'role' = 'owner'
  )
);

-- ============================================================================
-- COMENTÁRIOS
-- ============================================================================
COMMENT ON TABLE public.profiles IS 'Perfis de usuários do sistema (médicos, secretárias, owners)';
COMMENT ON COLUMN public.profiles.id IS 'ID único do perfil';
COMMENT ON COLUMN public.profiles.auth_user_id IS 'ID do usuário na tabela auth.users do Supabase';
COMMENT ON COLUMN public.profiles.name IS 'Nome completo do usuário';
COMMENT ON COLUMN public.profiles.role IS 'Papel do usuário no sistema (owner, doctor, secretary)';

-- ============================================================================
-- HABILITAR REALTIME
-- ============================================================================
ALTER PUBLICATION supabase_realtime ADD TABLE public.profiles;

