-- Descrição: Criação completa do sistema de prontuários de pacientes
-- Data: 2025-10-05
-- Autor: Sistema MedX

-- ============================================================================
-- TABELA: patients
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.patients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  cpf TEXT,
  birth_date DATE,
  gender TEXT CHECK (gender IN ('M', 'F', 'Outro', 'Prefiro não informar')),
  address TEXT,
  city TEXT,
  state TEXT,
  zip_code TEXT,
  avatar_url TEXT,
  next_appointment_date TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para busca rápida
CREATE INDEX IF NOT EXISTS idx_patients_name ON public.patients(name);
CREATE INDEX IF NOT EXISTS idx_patients_cpf ON public.patients(cpf);
CREATE INDEX IF NOT EXISTS idx_patients_email ON public.patients(email);
CREATE INDEX IF NOT EXISTS idx_patients_phone ON public.patients(phone);

-- ============================================================================
-- TABELA: patient_doctors (Relação N:N entre pacientes e médicos)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.patient_doctors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  doctor_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  is_primary BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(patient_id, doctor_id)
);

CREATE INDEX IF NOT EXISTS idx_patient_doctors_patient ON public.patient_doctors(patient_id);
CREATE INDEX IF NOT EXISTS idx_patient_doctors_doctor ON public.patient_doctors(doctor_id);

-- ============================================================================
-- TABELA: medical_records (Prontuários)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.medical_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  doctor_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  appointment_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  chief_complaint TEXT,
  history_present_illness TEXT,
  physical_examination TEXT,
  diagnosis TEXT,
  treatment_plan TEXT,
  prescriptions TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_medical_records_patient ON public.medical_records(patient_id);
CREATE INDEX IF NOT EXISTS idx_medical_records_doctor ON public.medical_records(doctor_id);
CREATE INDEX IF NOT EXISTS idx_medical_records_date ON public.medical_records(appointment_date);

-- ============================================================================
-- TABELA: appointments (Consultas/Atendimentos)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.appointments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  doctor_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  appointment_date TIMESTAMPTZ NOT NULL,
  duration_minutes INTEGER DEFAULT 30,
  status TEXT CHECK (status IN ('scheduled', 'confirmed', 'completed', 'cancelled', 'no_show')) DEFAULT 'scheduled',
  type TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_appointments_patient ON public.appointments(patient_id);
CREATE INDEX IF NOT EXISTS idx_appointments_doctor ON public.appointments(doctor_id);
CREATE INDEX IF NOT EXISTS idx_appointments_date ON public.appointments(appointment_date);
CREATE INDEX IF NOT EXISTS idx_appointments_status ON public.appointments(status);

-- ============================================================================
-- TABELA: anamnesis (Ficha de Anamnese)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.anamnesis (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  doctor_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  chief_complaint TEXT,
  history_present_illness TEXT,
  past_medical_history TEXT,
  family_history TEXT,
  social_history TEXT,
  allergies TEXT,
  current_medications TEXT,
  review_of_systems TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_anamnesis_patient ON public.anamnesis(patient_id);
CREATE INDEX IF NOT EXISTS idx_anamnesis_doctor ON public.anamnesis(doctor_id);

-- ============================================================================
-- TABELA: clinical_data (Dados Clínicos - Peso, Altura, etc)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.clinical_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  doctor_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  measurement_date TIMESTAMPTZ DEFAULT NOW(),
  weight_kg DECIMAL(5,2),
  height_cm DECIMAL(5,2),
  bmi DECIMAL(4,2),
  blood_pressure_systolic INTEGER,
  blood_pressure_diastolic INTEGER,
  heart_rate INTEGER,
  temperature_celsius DECIMAL(4,2),
  oxygen_saturation INTEGER,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_clinical_data_patient ON public.clinical_data(patient_id);
CREATE INDEX IF NOT EXISTS idx_clinical_data_date ON public.clinical_data(measurement_date);

-- ============================================================================
-- TABELA: exam_history (Histórico de Exames)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.exam_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  doctor_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  exam_type TEXT NOT NULL,
  exam_name TEXT NOT NULL,
  exam_date DATE NOT NULL,
  result_summary TEXT,
  observations TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_exam_history_patient ON public.exam_history(patient_id);
CREATE INDEX IF NOT EXISTS idx_exam_history_date ON public.exam_history(exam_date);

-- ============================================================================
-- TABELA: medical_attachments (Anexos - Referências aos arquivos no Storage)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.medical_attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  uploaded_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  related_to_type TEXT CHECK (related_to_type IN ('medical_record', 'exam', 'anamnesis', 'general')),
  related_to_id UUID,
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_size_bytes BIGINT,
  file_type TEXT,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_attachments_patient ON public.medical_attachments(patient_id);
CREATE INDEX IF NOT EXISTS idx_attachments_related ON public.medical_attachments(related_to_type, related_to_id);

-- ============================================================================
-- TRIGGERS para atualização automática de updated_at
-- ============================================================================

-- Função já existe da migration anterior, apenas criar triggers
CREATE TRIGGER update_patients_updated_at
  BEFORE UPDATE ON public.patients
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_medical_records_updated_at
  BEFORE UPDATE ON public.medical_records
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_appointments_updated_at
  BEFORE UPDATE ON public.appointments
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_anamnesis_updated_at
  BEFORE UPDATE ON public.anamnesis
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_clinical_data_updated_at
  BEFORE UPDATE ON public.clinical_data
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_exam_history_updated_at
  BEFORE UPDATE ON public.exam_history
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================================

-- Habilitar RLS em todas as tabelas
ALTER TABLE public.patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.patient_doctors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.medical_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.anamnesis ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clinical_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exam_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.medical_attachments ENABLE ROW LEVEL SECURITY;

-- Políticas para PATIENTS
CREATE POLICY "Usuários autenticados podem ver todos os pacientes"
ON public.patients FOR SELECT
USING (
  auth.uid() IN (
    SELECT auth_user_id FROM public.profiles WHERE role IN ('owner', 'doctor', 'secretary')
  )
);

CREATE POLICY "Usuários autenticados podem criar pacientes"
ON public.patients FOR INSERT
WITH CHECK (
  auth.uid() IN (
    SELECT auth_user_id FROM public.profiles WHERE role IN ('owner', 'doctor', 'secretary')
  )
);

CREATE POLICY "Usuários autenticados podem atualizar pacientes"
ON public.patients FOR UPDATE
USING (
  auth.uid() IN (
    SELECT auth_user_id FROM public.profiles WHERE role IN ('owner', 'doctor', 'secretary')
  )
);

CREATE POLICY "Apenas owners podem deletar pacientes"
ON public.patients FOR DELETE
USING (
  auth.uid() IN (
    SELECT auth_user_id FROM public.profiles WHERE role = 'owner'
  )
);

-- Políticas para PATIENT_DOCTORS
CREATE POLICY "Todos podem ver relações médico-paciente"
ON public.patient_doctors FOR SELECT
USING (
  auth.uid() IN (
    SELECT auth_user_id FROM public.profiles WHERE role IN ('owner', 'doctor', 'secretary')
  )
);

CREATE POLICY "Usuários autenticados podem gerenciar relações"
ON public.patient_doctors FOR ALL
USING (
  auth.uid() IN (
    SELECT auth_user_id FROM public.profiles WHERE role IN ('owner', 'doctor', 'secretary')
  )
);

-- Políticas para MEDICAL_RECORDS
CREATE POLICY "Médicos e owners podem ver prontuários"
ON public.medical_records FOR SELECT
USING (
  auth.uid() IN (
    SELECT auth_user_id FROM public.profiles WHERE role IN ('owner', 'doctor', 'secretary')
  )
);

CREATE POLICY "Médicos podem criar prontuários"
ON public.medical_records FOR INSERT
WITH CHECK (
  doctor_id IN (
    SELECT id FROM public.profiles WHERE auth_user_id = auth.uid() AND role = 'doctor'
  ) OR auth.uid() IN (
    SELECT auth_user_id FROM public.profiles WHERE role = 'owner'
  )
);

CREATE POLICY "Médicos podem atualizar seus prontuários"
ON public.medical_records FOR UPDATE
USING (
  doctor_id IN (
    SELECT id FROM public.profiles WHERE auth_user_id = auth.uid()
  ) OR auth.uid() IN (
    SELECT auth_user_id FROM public.profiles WHERE role = 'owner'
  )
);

-- Políticas para APPOINTMENTS
CREATE POLICY "Todos podem ver consultas"
ON public.appointments FOR SELECT
USING (
  auth.uid() IN (
    SELECT auth_user_id FROM public.profiles WHERE role IN ('owner', 'doctor', 'secretary')
  )
);

CREATE POLICY "Usuários podem gerenciar consultas"
ON public.appointments FOR ALL
USING (
  auth.uid() IN (
    SELECT auth_user_id FROM public.profiles WHERE role IN ('owner', 'doctor', 'secretary')
  )
);

-- Políticas para ANAMNESIS
CREATE POLICY "Médicos podem ver anamnese"
ON public.anamnesis FOR SELECT
USING (
  auth.uid() IN (
    SELECT auth_user_id FROM public.profiles WHERE role IN ('owner', 'doctor', 'secretary')
  )
);

CREATE POLICY "Médicos podem criar anamnese"
ON public.anamnesis FOR INSERT
WITH CHECK (
  doctor_id IN (
    SELECT id FROM public.profiles WHERE auth_user_id = auth.uid() AND role = 'doctor'
  ) OR auth.uid() IN (
    SELECT auth_user_id FROM public.profiles WHERE role = 'owner'
  )
);

CREATE POLICY "Médicos podem atualizar sua anamnese"
ON public.anamnesis FOR UPDATE
USING (
  doctor_id IN (
    SELECT id FROM public.profiles WHERE auth_user_id = auth.uid()
  ) OR auth.uid() IN (
    SELECT auth_user_id FROM public.profiles WHERE role = 'owner'
  )
);

-- Políticas para CLINICAL_DATA
CREATE POLICY "Todos podem ver dados clínicos"
ON public.clinical_data FOR SELECT
USING (
  auth.uid() IN (
    SELECT auth_user_id FROM public.profiles WHERE role IN ('owner', 'doctor', 'secretary')
  )
);

CREATE POLICY "Usuários autenticados podem gerenciar dados clínicos"
ON public.clinical_data FOR ALL
USING (
  auth.uid() IN (
    SELECT auth_user_id FROM public.profiles WHERE role IN ('owner', 'doctor', 'secretary')
  )
);

-- Políticas para EXAM_HISTORY
CREATE POLICY "Todos podem ver histórico de exames"
ON public.exam_history FOR SELECT
USING (
  auth.uid() IN (
    SELECT auth_user_id FROM public.profiles WHERE role IN ('owner', 'doctor', 'secretary')
  )
);

CREATE POLICY "Usuários autenticados podem gerenciar exames"
ON public.exam_history FOR ALL
USING (
  auth.uid() IN (
    SELECT auth_user_id FROM public.profiles WHERE role IN ('owner', 'doctor', 'secretary')
  )
);

-- Políticas para MEDICAL_ATTACHMENTS
CREATE POLICY "Todos podem ver anexos"
ON public.medical_attachments FOR SELECT
USING (
  auth.uid() IN (
    SELECT auth_user_id FROM public.profiles WHERE role IN ('owner', 'doctor', 'secretary')
  )
);

CREATE POLICY "Usuários autenticados podem criar anexos"
ON public.medical_attachments FOR INSERT
WITH CHECK (
  auth.uid() IN (
    SELECT auth_user_id FROM public.profiles WHERE role IN ('owner', 'doctor', 'secretary')
  )
);

CREATE POLICY "Usuários autenticados podem deletar anexos"
ON public.medical_attachments FOR DELETE
USING (
  auth.uid() IN (
    SELECT auth_user_id FROM public.profiles WHERE role IN ('owner', 'doctor', 'secretary')
  )
);

-- ============================================================================
-- COMENTÁRIOS NAS TABELAS
-- ============================================================================
COMMENT ON TABLE public.patients IS 'Cadastro de pacientes da clínica';
COMMENT ON TABLE public.patient_doctors IS 'Relação N:N entre pacientes e seus médicos';
COMMENT ON TABLE public.medical_records IS 'Prontuários médicos dos atendimentos';
COMMENT ON TABLE public.appointments IS 'Consultas e atendimentos agendados';
COMMENT ON TABLE public.anamnesis IS 'Fichas de anamnese completas dos pacientes';
COMMENT ON TABLE public.clinical_data IS 'Dados clínicos mensuráveis (peso, altura, pressão, etc)';
COMMENT ON TABLE public.exam_history IS 'Histórico de exames realizados pelos pacientes';
COMMENT ON TABLE public.medical_attachments IS 'Referências aos arquivos médicos armazenados no Storage';
