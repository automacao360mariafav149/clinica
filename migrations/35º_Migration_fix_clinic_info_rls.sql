-- Descrição: Ajuste de RLS da tabela clinic_info usando função SECURITY DEFINER para validar se usuário é owner
-- Data: 2025-10-13
-- Autor: Assistente GPT-5

-- Função para verificar se o usuário atual é OWNER, bypassando RLS de profiles
CREATE OR REPLACE FUNCTION public.is_current_user_owner()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE p.auth_user_id = auth.uid()
      AND p.role = 'owner'
  );
$$;

COMMENT ON FUNCTION public.is_current_user_owner() IS 'Retorna true se o usuário autenticado tiver role owner na tabela profiles. Usa SECURITY DEFINER para não depender da RLS de profiles.';

-- Garantir RLS habilitado
ALTER TABLE public.clinic_info ENABLE ROW LEVEL SECURITY;

-- Remover política ampla anterior
DROP POLICY IF EXISTS "Somente owner pode modificar clinic_info" ON public.clinic_info;

-- Políticas específicas por operação utilizando a função
CREATE POLICY "Owner pode inserir clinic_info"
ON public.clinic_info
FOR INSERT
WITH CHECK (public.is_current_user_owner());

CREATE POLICY "Owner pode atualizar clinic_info"
ON public.clinic_info
FOR UPDATE
USING (public.is_current_user_owner())
WITH CHECK (public.is_current_user_owner());

CREATE POLICY "Owner pode deletar clinic_info"
ON public.clinic_info
FOR DELETE
USING (public.is_current_user_owner());

-- Mantém a leitura aberta (já criada na migration anterior)
-- CREATE POLICY "Leitura pública de clinic_info" ...


