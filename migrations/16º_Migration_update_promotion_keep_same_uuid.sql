-- Descrição: Atualiza a promoção de pré-pacientes para manter o mesmo UUID ao criar em patients
-- Data: 2025-10-10
-- Autor: Assistente GPT-5

CREATE OR REPLACE FUNCTION public.promote_pre_patient_to_patient()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_patient_exists UUID;
BEGIN
  -- Condição de promoção: nome válido
  IF NEW.name IS NULL OR btrim(NEW.name) = '' OR lower(btrim(NEW.name)) IN ('null', 'undefined') THEN
    RETURN NEW; -- Nada a fazer
  END IF;

  -- Verifica se já existe paciente com o mesmo id (não deve, mas por segurança)
  SELECT id INTO v_patient_exists FROM public.patients WHERE id = NEW.id;
  IF v_patient_exists IS NOT NULL THEN
    -- Se por acaso existir, apenas remove o pre_patient
    DELETE FROM public.pre_patients WHERE id = NEW.id;
    RETURN NULL;
  END IF;

  -- Cria novo paciente reutilizando o MESMO UUID do pre_patient
  INSERT INTO public.patients (id, name, email, phone, health_insurance, created_at, updated_at)
  VALUES (
    NEW.id,
    NEW.name,
    NULLIF(NEW.email, ''),
    NULLIF(NEW.phone, ''),
    NULLIF(NEW.health_insurance, ''),
    NOW(),
    NOW()
  );

  -- Remove o lead promovido
  DELETE FROM public.pre_patients WHERE id = NEW.id;

  RETURN NULL; -- linha original removida
END;
$$;
