-- Descrição: Seed de dados de teste para visualizar métricas e gráficos no Dashboard
-- Data: 2025-10-06
-- Autor: Sistema MedX

-- NOTA: Este seed é OPCIONAL e deve ser usado apenas para testes/demonstração
-- Executar apenas em ambientes de desenvolvimento/teste

-- ============================================================================
-- Atualizar pacientes com convênios de exemplo
-- ============================================================================

-- Atualizar alguns pacientes existentes com convênios
UPDATE public.patients
SET health_insurance = 'Unimed'
WHERE id IN (
  SELECT id FROM public.patients LIMIT 5
);

UPDATE public.patients
SET health_insurance = 'Amil'
WHERE id IN (
  SELECT id FROM public.patients 
  WHERE health_insurance IS NULL 
  LIMIT 4
);

UPDATE public.patients
SET health_insurance = 'Bradesco Saúde'
WHERE id IN (
  SELECT id FROM public.patients 
  WHERE health_insurance IS NULL 
  LIMIT 3
);

UPDATE public.patients
SET health_insurance = 'SulAmérica'
WHERE id IN (
  SELECT id FROM public.patients 
  WHERE health_insurance IS NULL 
  LIMIT 2
);

-- Deixar alguns sem convênio (Particular)
UPDATE public.patients
SET health_insurance = NULL
WHERE id IN (
  SELECT id FROM public.patients 
  WHERE health_insurance IS NULL 
  LIMIT 3
);

-- ============================================================================
-- Criar appointments de teste com horários e motivos variados
-- ============================================================================

DO $$
DECLARE
  v_patient_id UUID;
  v_doctor_id UUID;
  v_date DATE;
  v_hour INTEGER;
  v_reasons TEXT[] := ARRAY[
    'Consulta de rotina',
    'Dor de cabeça',
    'Febre',
    'Check-up anual',
    'Dor nas costas',
    'Acompanhamento',
    'Resultado de exames',
    'Dor abdominal',
    'Gripe',
    'Pressão alta'
  ];
BEGIN
  -- Obter um paciente e um médico de exemplo
  SELECT id INTO v_patient_id FROM public.patients LIMIT 1;
  SELECT id INTO v_doctor_id FROM public.profiles WHERE role = 'doctor' LIMIT 1;
  
  -- Se não existir paciente ou médico, sair
  IF v_patient_id IS NULL OR v_doctor_id IS NULL THEN
    RAISE NOTICE 'Nenhum paciente ou médico encontrado. Pulando criação de appointments.';
    RETURN;
  END IF;

  -- Criar appointments para os últimos 30 dias
  FOR i IN 0..29 LOOP
    v_date := CURRENT_DATE - i;
    
    -- Criar 2-5 appointments por dia em horários variados
    FOR j IN 1..(2 + FLOOR(RANDOM() * 4))::INTEGER LOOP
      -- Horário aleatório entre 8h e 18h
      v_hour := 8 + FLOOR(RANDOM() * 11)::INTEGER;
      
      INSERT INTO public.appointments (
        patient_id,
        doctor_id,
        scheduled_at,
        status,
        reason
      )
      VALUES (
        v_patient_id,
        v_doctor_id,
        v_date + (v_hour || ' hours')::INTERVAL,
        'completed',
        v_reasons[1 + FLOOR(RANDOM() * ARRAY_LENGTH(v_reasons, 1))::INTEGER]
      );
    END LOOP;
  END LOOP;
  
  RAISE NOTICE 'Appointments de teste criados com sucesso!';
END $$;

-- ============================================================================
-- Criar consultas de agentes (CID) de teste
-- ============================================================================

DO $$
DECLARE
  v_patient_id UUID;
  v_doctor_id UUID;
  v_cids TEXT[][] := ARRAY[
    ARRAY['J00', 'Nasofaringite aguda (resfriado comum)'],
    ARRAY['J06', 'Infecções agudas das vias aéreas superiores'],
    ARRAY['K21', 'Doença do refluxo gastroesofágico'],
    ARRAY['M54', 'Dorsalgia (dor nas costas)'],
    ARRAY['I10', 'Hipertensão essencial (primária)'],
    ARRAY['E78', 'Distúrbios do metabolismo de lipoproteínas'],
    ARRAY['R51', 'Cefaleia (dor de cabeça)'],
    ARRAY['K59', 'Outros transtornos funcionais do intestino'],
    ARRAY['J40', 'Bronquite não especificada'],
    ARRAY['E11', 'Diabetes mellitus não insulino-dependente']
  ];
BEGIN
  -- Obter um paciente e um médico de exemplo
  SELECT id INTO v_patient_id FROM public.patients LIMIT 1;
  SELECT id INTO v_doctor_id FROM public.profiles WHERE role = 'doctor' LIMIT 1;
  
  IF v_patient_id IS NULL OR v_doctor_id IS NULL THEN
    RAISE NOTICE 'Nenhum paciente ou médico encontrado. Pulando criação de agent_consultations.';
    RETURN;
  END IF;

  -- Criar consultas de agentes para os últimos 30 dias
  FOR i IN 0..19 LOOP
    INSERT INTO public.agent_consultations (
      patient_id,
      doctor_id,
      agent_type,
      consultation_input,
      consultation_output,
      cid_code,
      cid_description,
      confidence_level,
      consultation_date
    )
    VALUES (
      v_patient_id,
      v_doctor_id,
      'cid',
      jsonb_build_object(
        'term', v_cids[1 + (i % ARRAY_LENGTH(v_cids, 1))][2],
        'age', 35,
        'gender', 'M'
      ),
      jsonb_build_object(
        'code', v_cids[1 + (i % ARRAY_LENGTH(v_cids, 1))][1],
        'description', v_cids[1 + (i % ARRAY_LENGTH(v_cids, 1))][2]
      ),
      v_cids[1 + (i % ARRAY_LENGTH(v_cids, 1))][1],
      v_cids[1 + (i % ARRAY_LENGTH(v_cids, 1))][2],
      'high',
      CURRENT_TIMESTAMP - (i || ' days')::INTERVAL
    );
  END LOOP;
  
  RAISE NOTICE 'Consultas de agentes (CID) de teste criadas com sucesso!';
END $$;

-- ============================================================================
-- Mensagem final
-- ============================================================================
DO $$
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Seed de dados de teste concluído!';
  RAISE NOTICE 'Os gráficos do Dashboard agora devem exibir dados.';
  RAISE NOTICE '========================================';
END $$;
