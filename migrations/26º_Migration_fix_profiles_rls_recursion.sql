-- Descrição: Corrigir recursão infinita nas políticas RLS da tabela profiles
-- Data: 2025-10-28
-- Autor: Sistema MedX
-- Problema: A função get_user_role() causa recursão ao buscar em profiles, que tem RLS usando get_user_role()

-- ==============================================================================
-- SOLUÇÃO: Usar auth.uid() diretamente nas políticas de profiles
-- ==============================================================================

-- 1. DROPAR políticas antigas que causam recursão
DROP POLICY IF EXISTS select_profiles_authenticated ON profiles;
DROP POLICY IF EXISTS update_profiles_own_or_owner ON profiles;
DROP POLICY IF EXISTS insert_profiles_owner_only ON profiles;
DROP POLICY IF EXISTS delete_profiles_owner_only ON profiles;

-- ==============================================================================
-- 2. CRIAR POLÍTICAS SEM RECURSÃO
-- ==============================================================================

-- SELECT: Todos os usuários autenticados podem ver todos os profiles
-- (Necessário para o sistema funcionar - médicos precisam ver outros médicos, etc)
CREATE POLICY "profiles_select_all_authenticated"
ON profiles FOR SELECT
TO authenticated
USING (true);

-- UPDATE: Pode editar seu próprio perfil OU é owner (verificação direta sem recursão)
CREATE POLICY "profiles_update_own_or_is_owner"
ON profiles FOR UPDATE
TO authenticated
USING (
  auth_user_id = auth.uid() 
  OR 
  EXISTS (
    SELECT 1 FROM profiles p
    WHERE p.auth_user_id = auth.uid()
    AND p.role = 'owner'
  )
)
WITH CHECK (
  auth_user_id = auth.uid()
  OR
  EXISTS (
    SELECT 1 FROM profiles p
    WHERE p.auth_user_id = auth.uid()
    AND p.role = 'owner'
  )
);

-- INSERT: Apenas owners podem criar novos perfis
CREATE POLICY "profiles_insert_owner_only"
ON profiles FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles p
    WHERE p.auth_user_id = auth.uid()
    AND p.role = 'owner'
  )
);

-- DELETE: Apenas owners podem deletar perfis
CREATE POLICY "profiles_delete_owner_only"
ON profiles FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles p
    WHERE p.auth_user_id = auth.uid()
    AND p.role = 'owner'
  )
);

-- ==============================================================================
-- 3. ADICIONAR ÍNDICE PARA PERFORMANCE (se não existir)
-- ==============================================================================

-- Índice na coluna auth_user_id para queries rápidas
CREATE INDEX IF NOT EXISTS idx_profiles_auth_user_id ON profiles(auth_user_id);

-- Índice na coluna role para filtros por role
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);

-- Índice composto para queries que filtram por ambos
CREATE INDEX IF NOT EXISTS idx_profiles_auth_user_id_role ON profiles(auth_user_id, role);

-- ==============================================================================
-- 4. ATUALIZAR FUNÇÃO get_user_role() PARA SER MAIS EFICIENTE
-- ==============================================================================

-- Recriar a função com melhor performance e sem causar problemas de RLS
CREATE OR REPLACE FUNCTION get_user_role()
RETURNS text
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  user_role TEXT;
BEGIN
  -- Usa o índice idx_profiles_auth_user_id
  SELECT role INTO user_role
  FROM profiles
  WHERE auth_user_id = auth.uid()
  LIMIT 1;
  
  RETURN COALESCE(user_role, '');
END;
$$;

-- Comentário explicativo
COMMENT ON FUNCTION get_user_role() IS 'Retorna o role do usuário autenticado sem causar recursão. Usa SECURITY DEFINER para bypassar RLS.';

-- ==============================================================================
-- 5. GARANTIR PERMISSÕES
-- ==============================================================================

-- Garantir que usuários autenticados podem executar a função
GRANT EXECUTE ON FUNCTION get_user_role() TO authenticated;

-- ==============================================================================
-- 6. VERIFICAÇÃO FINAL
-- ==============================================================================

-- Mostrar as políticas atuais de profiles
SELECT 
  'POLÍTICAS RLS DE PROFILES ATUALIZADAS:' as status,
  policyname,
  cmd as comando,
  roles
FROM pg_policies 
WHERE tablename = 'profiles'
ORDER BY cmd, policyname;

-- Mostrar os índices criados
SELECT 
  'ÍNDICES CRIADOS EM PROFILES:' as status,
  indexname,
  indexdef
FROM pg_indexes 
WHERE tablename = 'profiles'
AND schemaname = 'public';

-- Testar a função get_user_role()
SELECT 
  'TESTE DA FUNÇÃO get_user_role():' as status,
  pg_get_functiondef(oid) as definicao
FROM pg_proc 
WHERE proname = 'get_user_role';

