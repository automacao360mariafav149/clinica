-- Descrição: Adiciona coluna last_appointment_date na tabela patients para armazenar a data da última consulta realizada
-- Data: 2025-10-13
-- Autor: Sistema MedX

-- Adicionar coluna last_appointment_date
ALTER TABLE patients 
ADD COLUMN IF NOT EXISTS last_appointment_date TIMESTAMP WITH TIME ZONE;

-- Adicionar comentário explicativo
COMMENT ON COLUMN patients.last_appointment_date IS 'Data e hora da última consulta realizada pelo paciente';

-- Atualizar valores iniciais com base nos appointments já existentes (completed)
UPDATE patients
SET last_appointment_date = (
  SELECT MAX(scheduled_at)
  FROM appointments
  WHERE appointments.patient_id = patients.id
    AND appointments.status = 'completed'
)
WHERE EXISTS (
  SELECT 1
  FROM appointments
  WHERE appointments.patient_id = patients.id
    AND appointments.status = 'completed'
);

