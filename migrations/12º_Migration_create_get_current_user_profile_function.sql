-- Descrição: Função RPC para obter o perfil do usuário autenticado atual
-- Data: 2025-10-06
-- Autor: Sistema MedX

-- Esta função é chamada pelo frontend durante o login para buscar os dados do perfil
-- Usa auth.uid() para pegar o ID do usuário autenticado automaticamente
-- Retorna os dados do perfil vinculado ao usuário autenticado

CREATE OR REPLACE FUNCTION get_current_user_profile()
RETURNS TABLE(
  id UUID,
  auth_user_id UUID,
  name TEXT,
  role TEXT,
  email TEXT,
  phone TEXT,
  specialization TEXT,
  created_at TIMESTAMPTZ
) 
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  -- Busca o perfil do usuário atualmente autenticado
  -- auth.uid() retorna o ID do usuário do Supabase Auth
  RETURN QUERY
  SELECT 
    p.id,
    p.auth_user_id,
    p.name,
    p.role,
    p.email,
    p.phone,
    p.specialization,
    p.created_at
  FROM profiles p
  WHERE p.auth_user_id = auth.uid();
END;
$$;

-- Permite que usuários autenticados executem esta função
GRANT EXECUTE ON FUNCTION get_current_user_profile() TO authenticated;

-- Comentário para documentação
COMMENT ON FUNCTION get_current_user_profile() IS 
'Retorna o perfil do usuário atualmente autenticado. Usado durante o login e refresh de sessão.';

