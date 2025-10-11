-- Descrição: Corrige realtime para tabelas appointments e patients que estavam com CHANNEL_ERROR
-- Data: 2025-10-11
-- Autor: Sistema de Debug MedX

-- Verifica se a publicação existe
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    CREATE PUBLICATION supabase_realtime;
  END IF;
END
$$;

-- Remove as tabelas da publicação (caso estejam)
ALTER PUBLICATION supabase_realtime DROP TABLE IF EXISTS public.appointments;
ALTER PUBLICATION supabase_realtime DROP TABLE IF EXISTS public.patients;

-- Adiciona novamente as tabelas à publicação
ALTER PUBLICATION supabase_realtime ADD TABLE public.appointments;
ALTER PUBLICATION supabase_realtime ADD TABLE public.patients;

-- Verifica todas as tabelas na publicação (para debug)
-- Para ver o resultado, execute: SELECT * FROM pg_publication_tables WHERE pubname = 'supabase_realtime';

-- Também habilita para outras tabelas importantes que podem ter o mesmo problema
ALTER PUBLICATION supabase_realtime DROP TABLE IF EXISTS public.profiles;
ALTER PUBLICATION supabase_realtime ADD TABLE public.profiles;

ALTER PUBLICATION supabase_realtime DROP TABLE IF EXISTS public.pre_patients;
ALTER PUBLICATION supabase_realtime ADD TABLE public.pre_patients;

ALTER PUBLICATION supabase_realtime DROP TABLE IF EXISTS public.agent_consultations;
ALTER PUBLICATION supabase_realtime ADD TABLE public.agent_consultations;

ALTER PUBLICATION supabase_realtime DROP TABLE IF EXISTS public.doctor_schedules;
ALTER PUBLICATION supabase_realtime ADD TABLE public.doctor_schedules;

ALTER PUBLICATION supabase_realtime DROP TABLE IF EXISTS public.profile_calendars;
ALTER PUBLICATION supabase_realtime ADD TABLE public.profile_calendars;

ALTER PUBLICATION supabase_realtime DROP TABLE IF EXISTS public.patient_records;
ALTER PUBLICATION supabase_realtime ADD TABLE public.patient_records;

ALTER PUBLICATION supabase_realtime DROP TABLE IF EXISTS public.patient_documents;
ALTER PUBLICATION supabase_realtime ADD TABLE public.patient_documents;

ALTER PUBLICATION supabase_realtime DROP TABLE IF EXISTS public.medx_history;
ALTER PUBLICATION supabase_realtime ADD TABLE public.medx_history;

-- Comentário: Esta migration garante que todas as tabelas críticas do sistema
-- tenham o Realtime habilitado corretamente, resolvendo o erro CHANNEL_ERROR
-- que impedia a atualização automática dos dados nas páginas.


