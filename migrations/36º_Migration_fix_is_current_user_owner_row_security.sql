-- Descrição: Ajuste da função is_current_user_owner para desabilitar RLS dentro da função e conceder EXECUTE
-- Data: 2025-10-13
-- Autor: Assistente GPT-5

-- Recria a função com row_security desativado durante a execução
CREATE OR REPLACE FUNCTION public.is_current_user_owner()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
SET row_security = off
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE p.auth_user_id = auth.uid()
      AND p.role = 'owner'
  );
$$;

-- Conceder execução para roles padrão do Supabase
GRANT EXECUTE ON FUNCTION public.is_current_user_owner() TO anon, authenticated;


