-- Descrição: Cria tabela de horários de trabalho dos médicos
-- Data: 2025-10-04
-- Autor: Sistema MedX

-- Cria a tabela doctor_schedules
CREATE TABLE IF NOT EXISTS doctor_schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  doctor_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  day_of_week INTEGER NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  appointment_duration INTEGER DEFAULT 30,
  break_start_time TIME,
  break_end_time TIME,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(doctor_id, day_of_week)
);

-- Cria índice para melhorar performance nas consultas
CREATE INDEX IF NOT EXISTS idx_doctor_schedules_doctor_id ON doctor_schedules(doctor_id);
CREATE INDEX IF NOT EXISTS idx_doctor_schedules_day_of_week ON doctor_schedules(day_of_week);

-- Habilita RLS (Row Level Security)
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

-- Trigger para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_doctor_schedules_updated_at
  BEFORE UPDATE ON doctor_schedules
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

