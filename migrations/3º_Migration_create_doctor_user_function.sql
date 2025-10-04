-- Descrição: Função para criar perfil de médico e vincular ao usuário auth
-- Data: 2025-10-04
-- Autor: Sistema MedX

-- Função para criar ou atualizar perfil vinculado ao auth_user_id
CREATE OR REPLACE FUNCTION create_or_update_doctor_profile(
  p_auth_user_id UUID,
  p_name TEXT,
  p_role TEXT DEFAULT 'doctor'
)
RETURNS UUID AS $$
DECLARE
  profile_id UUID;
BEGIN
  -- Verifica se já existe um perfil com esse auth_user_id
  SELECT id INTO profile_id
  FROM profiles
  WHERE auth_user_id = p_auth_user_id;

  -- Se existir, atualiza
  IF profile_id IS NOT NULL THEN
    UPDATE profiles
    SET name = p_name, role = p_role, updated_at = NOW()
    WHERE id = profile_id;
  ELSE
    -- Se não existir, cria novo
    INSERT INTO profiles (auth_user_id, name, role)
    VALUES (p_auth_user_id, p_name, p_role)
    RETURNING id INTO profile_id;
  END IF;

  RETURN profile_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função auxiliar para obter perfil por auth_user_id
CREATE OR REPLACE FUNCTION get_profile_by_auth_user_id(p_auth_user_id UUID)
RETURNS TABLE(id UUID, name TEXT, role TEXT, auth_user_id UUID, created_at TIMESTAMPTZ, updated_at TIMESTAMPTZ) AS $$
BEGIN
  RETURN QUERY
  SELECT p.id, p.name, p.role, p.auth_user_id, p.created_at, p.updated_at
  FROM profiles p
  WHERE p.auth_user_id = p_auth_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

