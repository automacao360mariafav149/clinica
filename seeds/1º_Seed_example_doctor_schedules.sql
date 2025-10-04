-- Descrição: Horários de exemplo para médicos de teste
-- Data: 2025-10-04
-- Autor: Sistema MedX

-- Este seed cria horários de trabalho de exemplo para médicos.
-- IMPORTANTE: Substitua 'DOCTOR_UUID_HERE' pelo UUID real do médico na tabela profiles.

-- Exemplo 1: Horário padrão comercial (Segunda a Sexta, 8h-12h e 14h-18h)
-- Descomente e ajuste o UUID abaixo:

/*
DO $$
DECLARE
  doctor_uuid UUID := 'DOCTOR_UUID_HERE'; -- Substitua pelo UUID real
BEGIN
  -- Segunda-feira
  INSERT INTO doctor_schedules (doctor_id, day_of_week, start_time, end_time, appointment_duration, break_start_time, break_end_time, is_active)
  VALUES (doctor_uuid, 1, '08:00', '18:00', 30, '12:00', '14:00', true)
  ON CONFLICT (doctor_id, day_of_week) DO UPDATE
  SET start_time = EXCLUDED.start_time, end_time = EXCLUDED.end_time;

  -- Terça-feira
  INSERT INTO doctor_schedules (doctor_id, day_of_week, start_time, end_time, appointment_duration, break_start_time, break_end_time, is_active)
  VALUES (doctor_uuid, 2, '08:00', '18:00', 30, '12:00', '14:00', true)
  ON CONFLICT (doctor_id, day_of_week) DO UPDATE
  SET start_time = EXCLUDED.start_time, end_time = EXCLUDED.end_time;

  -- Quarta-feira
  INSERT INTO doctor_schedules (doctor_id, day_of_week, start_time, end_time, appointment_duration, break_start_time, break_end_time, is_active)
  VALUES (doctor_uuid, 3, '08:00', '18:00', 30, '12:00', '14:00', true)
  ON CONFLICT (doctor_id, day_of_week) DO UPDATE
  SET start_time = EXCLUDED.start_time, end_time = EXCLUDED.end_time;

  -- Quinta-feira
  INSERT INTO doctor_schedules (doctor_id, day_of_week, start_time, end_time, appointment_duration, break_start_time, break_end_time, is_active)
  VALUES (doctor_uuid, 4, '08:00', '18:00', 30, '12:00', '14:00', true)
  ON CONFLICT (doctor_id, day_of_week) DO UPDATE
  SET start_time = EXCLUDED.start_time, end_time = EXCLUDED.end_time;

  -- Sexta-feira
  INSERT INTO doctor_schedules (doctor_id, day_of_week, start_time, end_time, appointment_duration, break_start_time, break_end_time, is_active)
  VALUES (doctor_uuid, 5, '08:00', '18:00', 30, '12:00', '14:00', true)
  ON CONFLICT (doctor_id, day_of_week) DO UPDATE
  SET start_time = EXCLUDED.start_time, end_time = EXCLUDED.end_time;
END $$;
*/

-- Exemplo 2: Horário alternativo (Consultas mais longas, sem horário de almoço)
/*
DO $$
DECLARE
  doctor_uuid UUID := 'ANOTHER_DOCTOR_UUID_HERE'; -- Substitua pelo UUID real
BEGIN
  -- Terça e Quinta (consultas de 60 minutos)
  INSERT INTO doctor_schedules (doctor_id, day_of_week, start_time, end_time, appointment_duration, is_active)
  VALUES (doctor_uuid, 2, '09:00', '17:00', 60, true)
  ON CONFLICT (doctor_id, day_of_week) DO UPDATE
  SET start_time = EXCLUDED.start_time, end_time = EXCLUDED.end_time;

  INSERT INTO doctor_schedules (doctor_id, day_of_week, start_time, end_time, appointment_duration, is_active)
  VALUES (doctor_uuid, 4, '09:00', '17:00', 60, true)
  ON CONFLICT (doctor_id, day_of_week) DO UPDATE
  SET start_time = EXCLUDED.start_time, end_time = EXCLUDED.end_time;
END $$;
*/

-- Para aplicar este seed:
-- 1. Busque o UUID do médico na tabela profiles
-- 2. Substitua 'DOCTOR_UUID_HERE' pelo UUID real
-- 3. Descomente o bloco DO $$ que deseja usar
-- 4. Execute o SQL no Supabase SQL Editor

