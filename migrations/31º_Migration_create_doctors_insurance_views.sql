-- Descrição: Criação de VIEWs para visualização de médicos e seus convênios aceitos
-- Data: 2025-10-14
-- Autor: Sistema MedX
-- IMPORTANTE: Usa tabela PROFILES, não auth.users (o sistema gerencia usuários via profiles)

-- VIEW 1: Detalhamento completo de médicos e convênios (visão expandida)
-- Retorna uma linha para cada combinação médico + plano aceito
CREATE OR REPLACE VIEW v_doctors_insurance_coverage AS
SELECT 
  p.id as doctor_id,
  p.email as doctor_email,
  p.name as doctor_name,
  p.specialization as doctor_specialty,
  ic.id as insurance_company_id,
  ic.name as insurance_company_name,
  ic.short_name as insurance_company_short_name,
  ip.id as insurance_plan_id,
  ip.name as insurance_plan_name,
  ip.plan_type,
  ip.coverage_type,
  cai.id as acceptance_id,
  cai.accepted_at,
  cai.is_active,
  cai.notes
FROM profiles p
LEFT JOIN clinic_accepted_insurances cai ON cai.doctor_id = p.id AND cai.is_active = true
LEFT JOIN insurance_plans ip ON ip.id = cai.insurance_plan_id
LEFT JOIN insurance_companies ic ON ic.id = ip.insurance_company_id
WHERE p.role = 'doctor'
ORDER BY p.name, ic.name, ip.name;

-- VIEW 2: Resumo agregado por médico (visão consolidada)
-- Retorna uma linha por médico com totalizadores e listas agregadas
CREATE OR REPLACE VIEW v_doctors_summary AS
SELECT 
  p.id as doctor_id,
  p.email as doctor_email,
  p.name as doctor_name,
  p.specialization as doctor_specialty,
  COUNT(DISTINCT ic.id) as total_insurance_companies,
  COUNT(cai.id) as total_insurance_plans,
  STRING_AGG(DISTINCT ic.short_name, ', ' ORDER BY ic.short_name) as insurance_companies,
  STRING_AGG(ic.short_name || ' - ' || ip.name, ', ' ORDER BY ic.short_name, ip.name) as insurance_plans_list
FROM profiles p
LEFT JOIN clinic_accepted_insurances cai ON cai.doctor_id = p.id AND cai.is_active = true
LEFT JOIN insurance_plans ip ON ip.id = cai.insurance_plan_id
LEFT JOIN insurance_companies ic ON ic.id = ip.insurance_company_id
WHERE p.role = 'doctor'
GROUP BY p.id, p.email, p.name, p.specialization
ORDER BY p.name;

-- Exemplos de uso:

-- 1. Ver todos os convênios de um médico específico (visão detalhada):
-- SELECT * FROM v_doctors_insurance_coverage 
-- WHERE doctor_id = 'SEU_DOCTOR_ID';

-- 2. Ver resumo de todos os médicos:
-- SELECT * FROM v_doctors_summary;

-- 3. Ver médicos que aceitam determinada operadora:
-- SELECT * FROM v_doctors_insurance_coverage 
-- WHERE insurance_company_short_name = 'Amil';

-- 4. Estatísticas gerais:
-- SELECT 
--   AVG(total_insurance_plans) as media_planos,
--   MAX(total_insurance_plans) as max_planos,
--   COUNT(*) as total_medicos
-- FROM v_doctors_summary;

