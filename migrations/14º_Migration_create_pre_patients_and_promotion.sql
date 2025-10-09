-- Descrição: Cria pre_patients, índices, RLS e promoção automática para patients quando nome for válido, com deduplicação por email/telefone
-- Data: 2025-10-09
-- Autor: Sistema MedX

-- ============================================================================
-- TABELA: pre_patients (Leads/Pré Pacientes)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.pre_patients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NULL,
  email TEXT NULL,
  phone TEXT NULL,
  health_insurance TEXT NULL,
  status TEXT NULL,
  area_interest TEXT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para busca rápida e deduplicação
CREATE INDEX IF NOT EXISTS idx_pre_patients_email ON public.pre_patients(email);
CREATE INDEX IF NOT EXISTS idx_pre_patients_phone ON public.pre_patients(phone);

-- Trigger para atualização automática de updated_at
CREATE TRIGGER update_pre_patients_updated_at
  BEFORE UPDATE ON public.pre_patients
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Comentário da tabela
COMMENT ON TABLE public.pre_patients IS 'Leads de pré-pacientes que ainda não foram promovidos ao CRM';

-- ============================================================================
-- RLS (Row Level Security)
-- ============================================================================
ALTER TABLE public.pre_patients ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuários autenticados podem ver pre_patients"
ON public.pre_patients FOR SELECT
USING (
  auth.uid() IN (
    SELECT auth_user_id FROM public.profiles WHERE role IN ('owner', 'doctor', 'secretary')
  )
);

CREATE POLICY "Usuários autenticados podem criar pre_patients"
ON public.pre_patients FOR INSERT
WITH CHECK (
  auth.uid() IN (
    SELECT auth_user_id FROM public.profiles WHERE role IN ('owner', 'doctor', 'secretary')
  )
);

CREATE POLICY "Usuários autenticados podem atualizar pre_patients"
ON public.pre_patients FOR UPDATE
USING (
  auth.uid() IN (
    SELECT auth_user_id FROM public.profiles WHERE role IN ('owner', 'doctor', 'secretary')
  )
);

CREATE POLICY "Apenas owners podem deletar pre_patients"
ON public.pre_patients FOR DELETE
USING (
  auth.uid() IN (
    SELECT auth_user_id FROM public.profiles WHERE role = 'owner'
  )
);

-- ============================================================================
-- Função e Trigger: Promoção automática de pre_patients -> patients
--  Regra de promoção:
--   - Dispara quando name passa a ter valor não vazio e diferente de 'null'/'undefined'.
--   - Deduplicação por email OU phone: se existir paciente, reutiliza e atualiza campos ausentes.
--   - Caso contrário, cria novo paciente.
--   - Remove o registro original de pre_patients após promover.
-- ============================================================================

CREATE OR REPLACE FUNCTION public.promote_pre_patient_to_patient()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_patient_id UUID;
BEGIN
  -- Condição de promoção: nome válido
  IF NEW.name IS NULL OR btrim(NEW.name) = '' OR lower(btrim(NEW.name)) IN ('null', 'undefined') THEN
    RETURN NEW; -- Nada a fazer
  END IF;

  -- Tentar achar paciente existente por email
  IF NEW.email IS NOT NULL AND btrim(NEW.email) <> '' THEN
    SELECT id INTO v_patient_id FROM public.patients WHERE email = NEW.email LIMIT 1;
  END IF;

  -- Se não achou por email, tentar por telefone
  IF v_patient_id IS NULL AND NEW.phone IS NOT NULL AND btrim(NEW.phone) <> '' THEN
    SELECT id INTO v_patient_id FROM public.patients WHERE phone = NEW.phone LIMIT 1;
  END IF;

  IF v_patient_id IS NOT NULL THEN
    -- Reutiliza paciente existente, atualizando apenas campos nulos/ausentes
    UPDATE public.patients p
    SET 
      email = COALESCE(p.email, NULLIF(NEW.email, '')),
      phone = COALESCE(p.phone, NULLIF(NEW.phone, '')),
      health_insurance = COALESCE(p.health_insurance, NULLIF(NEW.health_insurance, ''))
    WHERE p.id = v_patient_id;
  ELSE
    -- Cria novo paciente com os dados essenciais
    INSERT INTO public.patients (name, email, phone, health_insurance)
    VALUES (
      NEW.name,
      NULLIF(NEW.email, ''),
      NULLIF(NEW.phone, ''),
      NULLIF(NEW.health_insurance, '')
    )
    RETURNING id INTO v_patient_id;
  END IF;

  -- Remove o lead promovido
  DELETE FROM public.pre_patients WHERE id = NEW.id;

  RETURN NULL; -- linha original removida
END;
$$;

DROP TRIGGER IF EXISTS trg_promote_pre_patient_after_update ON public.pre_patients;
CREATE TRIGGER trg_promote_pre_patient_after_update
AFTER UPDATE OF name ON public.pre_patients
FOR EACH ROW
EXECUTE FUNCTION public.promote_pre_patient_to_patient();


