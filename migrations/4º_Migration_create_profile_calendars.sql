-- Descrição: Criação da tabela para vincular profiles (médicos) às suas agendas do Google Calendar
-- Data: 2025-01-04
-- Autor: Sistema MedX

-- Criar tabela de vinculação de agendas
CREATE TABLE IF NOT EXISTS public.profile_calendars (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  calendar_id TEXT NOT NULL,
  calendar_name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Garantir que cada profile tenha apenas uma agenda vinculada
  UNIQUE(profile_id)
);

-- Criar índice para busca rápida por profile
CREATE INDEX IF NOT EXISTS idx_profile_calendars_profile_id 
ON public.profile_calendars(profile_id);

-- Criar índice para busca por calendar_id
CREATE INDEX IF NOT EXISTS idx_profile_calendars_calendar_id 
ON public.profile_calendars(calendar_id);

-- Habilitar RLS (Row Level Security)
ALTER TABLE public.profile_calendars ENABLE ROW LEVEL SECURITY;

-- Política: Usuários podem ver apenas seus próprios calendários vinculados
CREATE POLICY "Usuários podem ver seus próprios calendários"
ON public.profile_calendars
FOR SELECT
USING (
  profile_id IN (
    SELECT id FROM public.profiles WHERE auth_user_id = auth.uid()
  )
);

-- Política: Owners podem ver todos os calendários vinculados
CREATE POLICY "Owners podem ver todos os calendários"
ON public.profile_calendars
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE auth_user_id = auth.uid() AND role = 'owner'
  )
);

-- Política: Owners podem inserir/atualizar/deletar qualquer vinculação
CREATE POLICY "Owners podem gerenciar todas as vinculações"
ON public.profile_calendars
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE auth_user_id = auth.uid() AND role = 'owner'
  )
);

-- Política: Usuários podem gerenciar suas próprias vinculações
CREATE POLICY "Usuários podem gerenciar suas próprias vinculações"
ON public.profile_calendars
FOR ALL
USING (
  profile_id IN (
    SELECT id FROM public.profiles WHERE auth_user_id = auth.uid()
  )
);

-- Habilitar Realtime para a tabela
ALTER PUBLICATION supabase_realtime ADD TABLE public.profile_calendars;

-- Comentários
COMMENT ON TABLE public.profile_calendars IS 'Vinculação entre profiles (médicos) e suas agendas do Google Calendar';
COMMENT ON COLUMN public.profile_calendars.profile_id IS 'ID do profile (médico)';
COMMENT ON COLUMN public.profile_calendars.calendar_id IS 'ID da agenda no Google Calendar';
COMMENT ON COLUMN public.profile_calendars.calendar_name IS 'Nome da agenda no Google Calendar';

