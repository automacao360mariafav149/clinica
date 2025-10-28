-- Descrição: Criação das tabelas de comunicação, follow-up e teleconsultas
-- Data: 2025-10-04 (Retroativa - documentando estrutura existente)
-- Autor: Sistema MedX

-- ============================================================================
-- TABELA: messages (Mensagens WhatsApp)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  sender_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  direction TEXT NOT NULL CHECK (direction IN ('in', 'out')),
  channel TEXT NOT NULL CHECK (channel = 'whatsapp'),
  content TEXT NOT NULL,
  sent_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_messages_patient ON public.messages(patient_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender ON public.messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_sent_at ON public.messages(sent_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_direction ON public.messages(direction);

-- Comentários
COMMENT ON TABLE public.messages IS 'Mensagens trocadas com pacientes via WhatsApp';
COMMENT ON COLUMN public.messages.direction IS 'Direção da mensagem: in (recebida) ou out (enviada)';
COMMENT ON COLUMN public.messages.channel IS 'Canal de comunicação (atualmente apenas whatsapp)';

-- ============================================================================
-- TABELA: follow_ups (Acompanhamento de Pacientes)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.follow_ups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  assigned_to UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  due_date DATE NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('pending', 'done')) DEFAULT 'pending',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_follow_ups_patient ON public.follow_ups(patient_id);
CREATE INDEX IF NOT EXISTS idx_follow_ups_assigned ON public.follow_ups(assigned_to);
CREATE INDEX IF NOT EXISTS idx_follow_ups_due_date ON public.follow_ups(due_date);
CREATE INDEX IF NOT EXISTS idx_follow_ups_status ON public.follow_ups(status);

-- Comentários
COMMENT ON TABLE public.follow_ups IS 'Follow-ups programados para acompanhamento de pacientes';
COMMENT ON COLUMN public.follow_ups.assigned_to IS 'Profissional responsável pelo follow-up';
COMMENT ON COLUMN public.follow_ups.due_date IS 'Data prevista para o follow-up';
COMMENT ON COLUMN public.follow_ups.status IS 'Status do follow-up: pending (pendente) ou done (concluído)';

-- ============================================================================
-- TABELA: teleconsultations (Teleconsultas)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.teleconsultations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  appointment_id UUID NOT NULL REFERENCES public.appointments(id) ON DELETE CASCADE,
  start_time TIMESTAMPTZ,
  end_time TIMESTAMPTZ,
  status TEXT NOT NULL CHECK (status IN ('scheduled', 'completed', 'cancelled')) DEFAULT 'scheduled',
  meeting_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_teleconsultations_appointment ON public.teleconsultations(appointment_id);
CREATE INDEX IF NOT EXISTS idx_teleconsultations_status ON public.teleconsultations(status);
CREATE INDEX IF NOT EXISTS idx_teleconsultations_start_time ON public.teleconsultations(start_time);

-- Comentários
COMMENT ON TABLE public.teleconsultations IS 'Teleconsultas (consultas remotas por vídeo)';
COMMENT ON COLUMN public.teleconsultations.appointment_id IS 'Consulta à qual a teleconsulta está vinculada';
COMMENT ON COLUMN public.teleconsultations.meeting_url IS 'URL da sala de vídeo conferência';

-- ============================================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================================

-- RLS: messages
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuários autenticados podem ver mensagens"
ON public.messages FOR SELECT
TO authenticated
USING (
  auth.uid() IN (
    SELECT auth_user_id FROM public.profiles WHERE role IN ('owner', 'doctor', 'secretary')
  )
);

CREATE POLICY "Usuários autenticados podem criar mensagens"
ON public.messages FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() IN (
    SELECT auth_user_id FROM public.profiles WHERE role IN ('owner', 'doctor', 'secretary')
  )
);

-- RLS: follow_ups
ALTER TABLE public.follow_ups ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuários autenticados podem ver follow-ups"
ON public.follow_ups FOR SELECT
TO authenticated
USING (
  auth.uid() IN (
    SELECT auth_user_id FROM public.profiles WHERE role IN ('owner', 'doctor', 'secretary')
  )
);

CREATE POLICY "Usuários autenticados podem gerenciar follow-ups"
ON public.follow_ups FOR ALL
TO authenticated
USING (
  auth.uid() IN (
    SELECT auth_user_id FROM public.profiles WHERE role IN ('owner', 'doctor', 'secretary')
  )
);

-- RLS: teleconsultations
ALTER TABLE public.teleconsultations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuários autenticados podem ver teleconsultas"
ON public.teleconsultations FOR SELECT
TO authenticated
USING (
  auth.uid() IN (
    SELECT auth_user_id FROM public.profiles WHERE role IN ('owner', 'doctor', 'secretary')
  )
);

CREATE POLICY "Usuários autenticados podem gerenciar teleconsultas"
ON public.teleconsultations FOR ALL
TO authenticated
USING (
  auth.uid() IN (
    SELECT auth_user_id FROM public.profiles WHERE role IN ('owner', 'doctor', 'secretary')
  )
);

-- ============================================================================
-- HABILITAR REALTIME
-- ============================================================================
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.follow_ups;
ALTER PUBLICATION supabase_realtime ADD TABLE public.teleconsultations;

