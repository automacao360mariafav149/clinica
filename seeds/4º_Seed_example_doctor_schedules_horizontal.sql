-- Descrição: Horários de exemplo para médicos (estrutura horizontal)
-- Data: 2025-10-06
-- Autor: Sistema MedX

-- Este seed cria horários de trabalho de exemplo para médicos usando a nova estrutura horizontal.
-- IMPORTANTE: Substitua 'DOCTOR_UUID_HERE' pelo UUID real do médico na tabela profiles.

-- ============================================
-- EXEMPLO 1: Médico com horário comercial padrão
-- ============================================
-- Segunda a Sexta: 08:00-12:00 e 14:00-18:00
-- Sábado: 08:00-12:00 (meio período)
-- Domingo: Inativo

/*
INSERT INTO doctor_schedules (
  doctor_id,
  appointment_duration,
  
  -- Segunda-feira
  seg_inicio, seg_pausa_inicio, seg_pausa_fim, seg_fim, seg_ativo,
  
  -- Terça-feira
  ter_inicio, ter_pausa_inicio, ter_pausa_fim, ter_fim, ter_ativo,
  
  -- Quarta-feira
  qua_inicio, qua_pausa_inicio, qua_pausa_fim, qua_fim, qua_ativo,
  
  -- Quinta-feira
  qui_inicio, qui_pausa_inicio, qui_pausa_fim, qui_fim, qui_ativo,
  
  -- Sexta-feira
  sex_inicio, sex_pausa_inicio, sex_pausa_fim, sex_fim, sex_ativo,
  
  -- Sábado
  sab_inicio, sab_pausa_inicio, sab_pausa_fim, sab_fim, sab_ativo,
  
  -- Domingo
  dom_inicio, dom_pausa_inicio, dom_pausa_fim, dom_fim, dom_ativo
)
VALUES (
  'DOCTOR_UUID_HERE', -- Substitua pelo UUID do médico
  30, -- Duração da consulta em minutos
  
  -- Segunda-feira
  '08:00', '12:00', '14:00', '18:00', true,
  
  -- Terça-feira
  '08:00', '12:00', '14:00', '18:00', true,
  
  -- Quarta-feira
  '08:00', '12:00', '14:00', '18:00', true,
  
  -- Quinta-feira
  '08:00', '12:00', '14:00', '18:00', true,
  
  -- Sexta-feira
  '08:00', '12:00', '14:00', '18:00', true,
  
  -- Sábado (meio período)
  '08:00', NULL, NULL, '12:00', true,
  
  -- Domingo (inativo)
  NULL, NULL, NULL, NULL, false
)
ON CONFLICT (doctor_id) DO UPDATE SET
  appointment_duration = EXCLUDED.appointment_duration,
  seg_inicio = EXCLUDED.seg_inicio,
  seg_pausa_inicio = EXCLUDED.seg_pausa_inicio,
  seg_pausa_fim = EXCLUDED.seg_pausa_fim,
  seg_fim = EXCLUDED.seg_fim,
  seg_ativo = EXCLUDED.seg_ativo,
  ter_inicio = EXCLUDED.ter_inicio,
  ter_pausa_inicio = EXCLUDED.ter_pausa_inicio,
  ter_pausa_fim = EXCLUDED.ter_pausa_fim,
  ter_fim = EXCLUDED.ter_fim,
  ter_ativo = EXCLUDED.ter_ativo,
  qua_inicio = EXCLUDED.qua_inicio,
  qua_pausa_inicio = EXCLUDED.qua_pausa_inicio,
  qua_pausa_fim = EXCLUDED.qua_pausa_fim,
  qua_fim = EXCLUDED.qua_fim,
  qua_ativo = EXCLUDED.qua_ativo,
  qui_inicio = EXCLUDED.qui_inicio,
  qui_pausa_inicio = EXCLUDED.qui_pausa_inicio,
  qui_pausa_fim = EXCLUDED.qui_pausa_fim,
  qui_fim = EXCLUDED.qui_fim,
  qui_ativo = EXCLUDED.qui_ativo,
  sex_inicio = EXCLUDED.sex_inicio,
  sex_pausa_inicio = EXCLUDED.sex_pausa_inicio,
  sex_pausa_fim = EXCLUDED.sex_pausa_fim,
  sex_fim = EXCLUDED.sex_fim,
  sex_ativo = EXCLUDED.sex_ativo,
  sab_inicio = EXCLUDED.sab_inicio,
  sab_pausa_inicio = EXCLUDED.sab_pausa_inicio,
  sab_pausa_fim = EXCLUDED.sab_pausa_fim,
  sab_fim = EXCLUDED.sab_fim,
  sab_ativo = EXCLUDED.sab_ativo,
  dom_inicio = EXCLUDED.dom_inicio,
  dom_pausa_inicio = EXCLUDED.dom_pausa_inicio,
  dom_pausa_fim = EXCLUDED.dom_pausa_fim,
  dom_fim = EXCLUDED.dom_fim,
  dom_ativo = EXCLUDED.dom_ativo,
  updated_at = NOW();
*/

-- ============================================
-- EXEMPLO 2: Médico com horário alternativo
-- ============================================
-- Segunda, Quarta, Sexta: 09:00-17:00 (sem pausa para almoço)
-- Terça, Quinta: 13:00-21:00 (tarde/noite)
-- Fim de semana: Inativo

/*
INSERT INTO doctor_schedules (
  doctor_id,
  appointment_duration,
  
  -- Segunda-feira
  seg_inicio, seg_pausa_inicio, seg_pausa_fim, seg_fim, seg_ativo,
  
  -- Terça-feira
  ter_inicio, ter_pausa_inicio, ter_pausa_fim, ter_fim, ter_ativo,
  
  -- Quarta-feira
  qua_inicio, qua_pausa_inicio, qua_pausa_fim, qua_fim, qua_ativo,
  
  -- Quinta-feira
  qui_inicio, qui_pausa_inicio, qui_pausa_fim, qui_fim, qui_ativo,
  
  -- Sexta-feira
  sex_inicio, sex_pausa_inicio, sex_pausa_fim, sex_fim, sex_ativo,
  
  -- Sábado
  sab_inicio, sab_pausa_inicio, sab_pausa_fim, sab_fim, sab_ativo,
  
  -- Domingo
  dom_inicio, dom_pausa_inicio, dom_pausa_fim, dom_fim, dom_ativo
)
VALUES (
  'DOCTOR_UUID_HERE', -- Substitua pelo UUID do médico
  45, -- Consultas de 45 minutos
  
  -- Segunda-feira (manhã/tarde)
  '09:00', NULL, NULL, '17:00', true,
  
  -- Terça-feira (tarde/noite)
  '13:00', NULL, NULL, '21:00', true,
  
  -- Quarta-feira (manhã/tarde)
  '09:00', NULL, NULL, '17:00', true,
  
  -- Quinta-feira (tarde/noite)
  '13:00', NULL, NULL, '21:00', true,
  
  -- Sexta-feira (manhã/tarde)
  '09:00', NULL, NULL, '17:00', true,
  
  -- Sábado (inativo)
  NULL, NULL, NULL, NULL, false,
  
  -- Domingo (inativo)
  NULL, NULL, NULL, NULL, false
)
ON CONFLICT (doctor_id) DO UPDATE SET
  appointment_duration = EXCLUDED.appointment_duration,
  seg_inicio = EXCLUDED.seg_inicio,
  seg_pausa_inicio = EXCLUDED.seg_pausa_inicio,
  seg_pausa_fim = EXCLUDED.seg_pausa_fim,
  seg_fim = EXCLUDED.seg_fim,
  seg_ativo = EXCLUDED.seg_ativo,
  ter_inicio = EXCLUDED.ter_inicio,
  ter_pausa_inicio = EXCLUDED.ter_pausa_inicio,
  ter_pausa_fim = EXCLUDED.ter_pausa_fim,
  ter_fim = EXCLUDED.ter_fim,
  ter_ativo = EXCLUDED.ter_ativo,
  qua_inicio = EXCLUDED.qua_inicio,
  qua_pausa_inicio = EXCLUDED.qua_pausa_inicio,
  qua_pausa_fim = EXCLUDED.qua_pausa_fim,
  qua_fim = EXCLUDED.qua_fim,
  qua_ativo = EXCLUDED.qua_ativo,
  qui_inicio = EXCLUDED.qui_inicio,
  qui_pausa_inicio = EXCLUDED.qui_pausa_inicio,
  qui_pausa_fim = EXCLUDED.qui_pausa_fim,
  qui_fim = EXCLUDED.qui_fim,
  qui_ativo = EXCLUDED.qui_ativo,
  sex_inicio = EXCLUDED.sex_inicio,
  sex_pausa_inicio = EXCLUDED.sex_pausa_inicio,
  sex_pausa_fim = EXCLUDED.sex_pausa_fim,
  sex_fim = EXCLUDED.sex_fim,
  sex_ativo = EXCLUDED.sex_ativo,
  sab_inicio = EXCLUDED.sab_inicio,
  sab_pausa_inicio = EXCLUDED.sab_pausa_inicio,
  sab_pausa_fim = EXCLUDED.sab_pausa_fim,
  sab_fim = EXCLUDED.sab_fim,
  sab_ativo = EXCLUDED.sab_ativo,
  dom_inicio = EXCLUDED.dom_inicio,
  dom_pausa_inicio = EXCLUDED.dom_pausa_inicio,
  dom_pausa_fim = EXCLUDED.dom_pausa_fim,
  dom_fim = EXCLUDED.dom_fim,
  dom_ativo = EXCLUDED.dom_ativo,
  updated_at = NOW();
*/

-- ============================================
-- EXEMPLO 3: Como obter o UUID de um médico
-- ============================================
-- Execute esta query para ver os UUIDs dos médicos cadastrados:
-- SELECT id, name, specialization FROM profiles WHERE role = 'doctor';

-- ============================================
-- EXEMPLO 4: Inserir horário usando função
-- ============================================
-- Você também pode usar uma função para facilitar a inserção:

/*
CREATE OR REPLACE FUNCTION insert_doctor_schedule_simple(
  p_doctor_id UUID,
  p_weekday_start TIME DEFAULT '08:00',
  p_weekday_end TIME DEFAULT '18:00',
  p_weekday_break_start TIME DEFAULT '12:00',
  p_weekday_break_end TIME DEFAULT '14:00',
  p_duration INTEGER DEFAULT 30
)
RETURNS VOID AS $$
BEGIN
  INSERT INTO doctor_schedules (
    doctor_id,
    appointment_duration,
    seg_inicio, seg_pausa_inicio, seg_pausa_fim, seg_fim, seg_ativo,
    ter_inicio, ter_pausa_inicio, ter_pausa_fim, ter_fim, ter_ativo,
    qua_inicio, qua_pausa_inicio, qua_pausa_fim, qua_fim, qua_ativo,
    qui_inicio, qui_pausa_inicio, qui_pausa_fim, qui_fim, qui_ativo,
    sex_inicio, sex_pausa_inicio, sex_pausa_fim, sex_fim, sex_ativo,
    sab_inicio, sab_pausa_inicio, sab_pausa_fim, sab_fim, sab_ativo,
    dom_inicio, dom_pausa_inicio, dom_pausa_fim, dom_fim, dom_ativo
  )
  VALUES (
    p_doctor_id,
    p_duration,
    p_weekday_start, p_weekday_break_start, p_weekday_break_end, p_weekday_end, true,
    p_weekday_start, p_weekday_break_start, p_weekday_break_end, p_weekday_end, true,
    p_weekday_start, p_weekday_break_start, p_weekday_break_end, p_weekday_end, true,
    p_weekday_start, p_weekday_break_start, p_weekday_break_end, p_weekday_end, true,
    p_weekday_start, p_weekday_break_start, p_weekday_break_end, p_weekday_end, true,
    NULL, NULL, NULL, NULL, false,
    NULL, NULL, NULL, NULL, false
  )
  ON CONFLICT (doctor_id) DO UPDATE SET
    appointment_duration = EXCLUDED.appointment_duration,
    seg_inicio = EXCLUDED.seg_inicio,
    seg_pausa_inicio = EXCLUDED.seg_pausa_inicio,
    seg_pausa_fim = EXCLUDED.seg_pausa_fim,
    seg_fim = EXCLUDED.seg_fim,
    seg_ativo = EXCLUDED.seg_ativo,
    ter_inicio = EXCLUDED.ter_inicio,
    ter_pausa_inicio = EXCLUDED.ter_pausa_inicio,
    ter_pausa_fim = EXCLUDED.ter_pausa_fim,
    ter_fim = EXCLUDED.ter_fim,
    ter_ativo = EXCLUDED.ter_ativo,
    qua_inicio = EXCLUDED.qua_inicio,
    qua_pausa_inicio = EXCLUDED.qua_pausa_inicio,
    qua_pausa_fim = EXCLUDED.qua_pausa_fim,
    qua_fim = EXCLUDED.qua_fim,
    qua_ativo = EXCLUDED.qua_ativo,
    qui_inicio = EXCLUDED.qui_inicio,
    qui_pausa_inicio = EXCLUDED.qui_pausa_inicio,
    qui_pausa_fim = EXCLUDED.qui_pausa_fim,
    qui_fim = EXCLUDED.qui_fim,
    qui_ativo = EXCLUDED.qui_ativo,
    sex_inicio = EXCLUDED.sex_inicio,
    sex_pausa_inicio = EXCLUDED.sex_pausa_inicio,
    sex_pausa_fim = EXCLUDED.sex_pausa_fim,
    sex_fim = EXCLUDED.sex_fim,
    sex_ativo = EXCLUDED.sex_ativo,
    sab_inicio = EXCLUDED.sab_inicio,
    sab_pausa_inicio = EXCLUDED.sab_pausa_inicio,
    sab_pausa_fim = EXCLUDED.sab_pausa_fim,
    sab_fim = EXCLUDED.sab_fim,
    sab_ativo = EXCLUDED.sab_ativo,
    dom_inicio = EXCLUDED.dom_inicio,
    dom_pausa_inicio = EXCLUDED.dom_pausa_inicio,
    dom_pausa_fim = EXCLUDED.dom_pausa_fim,
    dom_fim = EXCLUDED.dom_fim,
    dom_ativo = EXCLUDED.dom_ativo,
    updated_at = NOW();
END;
$$ LANGUAGE plpgsql;

-- Uso da função:
-- SELECT insert_doctor_schedule_simple('UUID_DO_MEDICO_AQUI');
*/

