-- Descrição: Ajuste final das políticas RLS da clinic_info usando subconsulta com auth.uid() (sem função)
-- Data: 2025-10-13
-- Autor: Assistente GPT-5

-- Garantir RLS habilitado
ALTER TABLE public.clinic_info ENABLE ROW LEVEL SECURITY;

-- Remover políticas atuais específicas
DROP POLICY IF EXISTS "Owner pode inserir clinic_info" ON public.clinic_info;
DROP POLICY IF EXISTS "Owner pode atualizar clinic_info" ON public.clinic_info;
DROP POLICY IF EXISTS "Owner pode deletar clinic_info" ON public.clinic_info;

-- Criar políticas baseadas em auth.uid() direto na tabela profiles
CREATE POLICY "Owner pode inserir clinic_info"
ON public.clinic_info
FOR INSERT
WITH CHECK (
  auth.uid() IN (
    SELECT auth_user_id FROM public.profiles WHERE role = 'owner'
  )
);

CREATE POLICY "Owner pode atualizar clinic_info"
ON public.clinic_info
FOR UPDATE
USING (
  auth.uid() IN (
    SELECT auth_user_id FROM public.profiles WHERE role = 'owner'
  )
)
WITH CHECK (
  auth.uid() IN (
    SELECT auth_user_id FROM public.profiles WHERE role = 'owner'
  )
);

CREATE POLICY "Owner pode deletar clinic_info"
ON public.clinic_info
FOR DELETE
USING (
  auth.uid() IN (
    SELECT auth_user_id FROM public.profiles WHERE role = 'owner'
  )
);


