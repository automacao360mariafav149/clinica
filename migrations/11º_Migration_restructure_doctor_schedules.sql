-- Descrição: Reestrutura a tabela doctor_schedules de vertical (1 linha por dia) para horizontal (1 linha por médico com colunas para cada dia)
-- Data: 2025-10-06
-- Autor: Sistema MedX

-- ============================================
-- ETAPA 1: BACKUP DOS DADOS EXISTENTES (se houver)
-- ============================================
CREATE TEMP TABLE doctor_schedules_backup AS
SELECT * FROM doctor_schedules;

-- ============================================
-- ETAPA 2: DROP DA TABELA ANTIGA
-- ============================================
DROP TABLE IF EXISTS doctor_schedules CASCADE;

-- ============================================
-- ETAPA 3: CRIAÇÃO DA NOVA ESTRUTURA
-- ============================================
CREATE TABLE doctor_schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  doctor_id UUID NOT NULL UNIQUE REFERENCES profiles(id) ON DELETE CASCADE,
  
  -- Duração padrão das consultas (em minutos) - vale para todos os dias
  appointment_duration INTEGER DEFAULT 30,
  
  -- SEGUNDA-FEIRA (day_of_week = 1)
  seg_inicio TIME,
  seg_pausa_inicio TIME,
  seg_pausa_fim TIME,
  seg_fim TIME,
  seg_ativo BOOLEAN DEFAULT false,
  
  -- TERÇA-FEIRA (day_of_week = 2)
  ter_inicio TIME,
  ter_pausa_inicio TIME,
  ter_pausa_fim TIME,
  ter_fim TIME,
  ter_ativo BOOLEAN DEFAULT false,
  
  -- QUARTA-FEIRA (day_of_week = 3)
  qua_inicio TIME,
  qua_pausa_inicio TIME,
  qua_pausa_fim TIME,
  qua_fim TIME,
  qua_ativo BOOLEAN DEFAULT false,
  
  -- QUINTA-FEIRA (day_of_week = 4)
  qui_inicio TIME,
  qui_pausa_inicio TIME,
  qui_pausa_fim TIME,
  qui_fim TIME,
  qui_ativo BOOLEAN DEFAULT false,
  
  -- SEXTA-FEIRA (day_of_week = 5)
  sex_inicio TIME,
  sex_pausa_inicio TIME,
  sex_pausa_fim TIME,
  sex_fim TIME,
  sex_ativo BOOLEAN DEFAULT false,
  
  -- SÁBADO (day_of_week = 6)
  sab_inicio TIME,
  sab_pausa_inicio TIME,
  sab_pausa_fim TIME,
  sab_fim TIME,
  sab_ativo BOOLEAN DEFAULT false,
  
  -- DOMINGO (day_of_week = 0)
  dom_inicio TIME,
  dom_pausa_inicio TIME,
  dom_pausa_fim TIME,
  dom_fim TIME,
  dom_ativo BOOLEAN DEFAULT false,
  
  -- Campos de controle
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE doctor_schedules IS 'Horários de trabalho dos médicos - uma linha por médico com todos os dias';
COMMENT ON COLUMN doctor_schedules.doctor_id IS 'ID do médico na tabela profiles';
COMMENT ON COLUMN doctor_schedules.appointment_duration IS 'Duração padrão das consultas em minutos (vale para todos os dias)';

-- ============================================
-- ETAPA 4: ÍNDICES
-- ============================================
CREATE INDEX idx_doctor_schedules_doctor_id ON doctor_schedules(doctor_id);

-- ============================================
-- ETAPA 5: MIGRAÇÃO DOS DADOS (se houver backup)
-- ============================================
-- Transforma dados de vertical (múltiplas linhas) para horizontal (uma linha)
DO $$
DECLARE
  doctor_record RECORD;
  schedule_record RECORD;
BEGIN
  -- Para cada médico único no backup
  FOR doctor_record IN SELECT DISTINCT doctor_id FROM doctor_schedules_backup LOOP
    -- Insere uma nova linha para este médico
    INSERT INTO doctor_schedules (doctor_id, appointment_duration)
    VALUES (
      doctor_record.doctor_id,
      (SELECT appointment_duration FROM doctor_schedules_backup WHERE doctor_id = doctor_record.doctor_id LIMIT 1)
    );
    
    -- Atualiza cada dia individualmente
    FOR schedule_record IN SELECT * FROM doctor_schedules_backup WHERE doctor_id = doctor_record.doctor_id LOOP
      CASE schedule_record.day_of_week
        WHEN 1 THEN -- Segunda
          UPDATE doctor_schedules SET
            seg_inicio = schedule_record.start_time,
            seg_pausa_inicio = schedule_record.break_start_time,
            seg_pausa_fim = schedule_record.break_end_time,
            seg_fim = schedule_record.end_time,
            seg_ativo = schedule_record.is_active
          WHERE doctor_id = doctor_record.doctor_id;
        
        WHEN 2 THEN -- Terça
          UPDATE doctor_schedules SET
            ter_inicio = schedule_record.start_time,
            ter_pausa_inicio = schedule_record.break_start_time,
            ter_pausa_fim = schedule_record.break_end_time,
            ter_fim = schedule_record.end_time,
            ter_ativo = schedule_record.is_active
          WHERE doctor_id = doctor_record.doctor_id;
        
        WHEN 3 THEN -- Quarta
          UPDATE doctor_schedules SET
            qua_inicio = schedule_record.start_time,
            qua_pausa_inicio = schedule_record.break_start_time,
            qua_pausa_fim = schedule_record.break_end_time,
            qua_fim = schedule_record.end_time,
            qua_ativo = schedule_record.is_active
          WHERE doctor_id = doctor_record.doctor_id;
        
        WHEN 4 THEN -- Quinta
          UPDATE doctor_schedules SET
            qui_inicio = schedule_record.start_time,
            qui_pausa_inicio = schedule_record.break_start_time,
            qui_pausa_fim = schedule_record.break_end_time,
            qui_fim = schedule_record.end_time,
            qui_ativo = schedule_record.is_active
          WHERE doctor_id = doctor_record.doctor_id;
        
        WHEN 5 THEN -- Sexta
          UPDATE doctor_schedules SET
            sex_inicio = schedule_record.start_time,
            sex_pausa_inicio = schedule_record.break_start_time,
            sex_pausa_fim = schedule_record.break_end_time,
            sex_fim = schedule_record.end_time,
            sex_ativo = schedule_record.is_active
          WHERE doctor_id = doctor_record.doctor_id;
        
        WHEN 6 THEN -- Sábado
          UPDATE doctor_schedules SET
            sab_inicio = schedule_record.start_time,
            sab_pausa_inicio = schedule_record.break_start_time,
            sab_pausa_fim = schedule_record.break_end_time,
            sab_fim = schedule_record.end_time,
            sab_ativo = schedule_record.is_active
          WHERE doctor_id = doctor_record.doctor_id;
        
        WHEN 0 THEN -- Domingo
          UPDATE doctor_schedules SET
            dom_inicio = schedule_record.start_time,
            dom_pausa_inicio = schedule_record.break_start_time,
            dom_pausa_fim = schedule_record.break_end_time,
            dom_fim = schedule_record.end_time,
            dom_ativo = schedule_record.is_active
          WHERE doctor_id = doctor_record.doctor_id;
      END CASE;
    END LOOP;
  END LOOP;
END $$;

-- ============================================
-- ETAPA 6: RLS (Row Level Security)
-- ============================================
ALTER TABLE doctor_schedules ENABLE ROW LEVEL SECURITY;

-- Política: Todos os usuários autenticados podem visualizar horários
CREATE POLICY "Users can view schedules" ON doctor_schedules
  FOR SELECT USING (
    auth.uid() IN (
      SELECT auth_user_id FROM profiles WHERE role IN ('owner', 'doctor', 'secretary')
    )
  );

-- Política: Médicos podem gerenciar apenas seus próprios horários
CREATE POLICY "Doctors can manage own schedules" ON doctor_schedules
  FOR ALL USING (
    doctor_id IN (
      SELECT id FROM profiles WHERE auth_user_id = auth.uid()
    )
  );

-- Política: Owners podem gerenciar horários de todos os médicos
CREATE POLICY "Owners can manage all schedules" ON doctor_schedules
  FOR ALL USING (
    auth.uid() IN (
      SELECT auth_user_id FROM profiles WHERE role = 'owner'
    )
  );

-- ============================================
-- ETAPA 7: TRIGGER PARA updated_at
-- ============================================
CREATE TRIGGER update_doctor_schedules_updated_at
  BEFORE UPDATE ON doctor_schedules
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- ETAPA 8: LIMPEZA
-- ============================================
DROP TABLE IF EXISTS doctor_schedules_backup;

