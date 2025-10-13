-- Descrição: Correção da VIEW de médicos usando função SECURITY DEFINER para acesso a auth.users
-- Data: 2025-10-14
-- Autor: Sistema MedX

-- PROBLEMA IDENTIFICADO:
-- As VIEWs v_doctors_summary e v_doctors_insurance_coverage não conseguiam fazer JOIN
-- com auth.users porque VIEWs executam com as permissões do usuário logado,
-- e usuários comuns não têm acesso à tabela auth.users.

-- SOLUÇÃO:
-- Criar uma função SQL com SECURITY DEFINER que executa com permissões elevadas.

-- Dropar função se já existir
DROP FUNCTION IF EXISTS get_doctors_insurance_summary();

-- Criar função para retornar summary dos médicos
-- IMPORTANTE: Usa tabela PROFILES, não auth.users
-- O sistema gerencia usuários através da tabela profiles
CREATE FUNCTION get_doctors_insurance_summary()
RETURNS TABLE (
  doctor_id UUID,
  doctor_email VARCHAR,
  doctor_name TEXT,
  doctor_specialty TEXT,
  total_insurance_companies BIGINT,
  total_insurance_plans BIGINT,
  insurance_companies TEXT,
  insurance_plans_list TEXT
)
SECURITY DEFINER  -- Executa com permissões do dono da função
SET search_path = public  -- Define schemas a serem buscados
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    p.email::VARCHAR,
    p.name::TEXT,
    p.specialization::TEXT,
    COUNT(DISTINCT ic.id),
    COUNT(cai.id),
    STRING_AGG(DISTINCT ic.short_name, ', ' ORDER BY ic.short_name),
    STRING_AGG(ic.short_name || ' - ' || ip.name, ', ' ORDER BY ic.short_name, ip.name)
  FROM profiles p
  LEFT JOIN clinic_accepted_insurances cai ON cai.doctor_id = p.id AND cai.is_active = true
  LEFT JOIN insurance_plans ip ON ip.id = cai.insurance_plan_id
  LEFT JOIN insurance_companies ic ON ic.id = ip.insurance_company_id
  WHERE p.role = 'doctor'
  GROUP BY p.id, p.email, p.name, p.specialization
  ORDER BY p.name;
END;
$$;

-- Garantir que usuários autenticados podem executar a função
GRANT EXECUTE ON FUNCTION get_doctors_insurance_summary() TO authenticated;

-- Manter as VIEWs antigas (caso algum código ainda use)
-- mas agora elas funcionarão porque a função tem SECURITY DEFINER

-- Exemplo de uso no frontend:
-- const { data, error } = await supabase.rpc('get_doctors_insurance_summary');

-- Limpeza de dados órfãos (convênios de usuários que não existem mais)
DELETE FROM clinic_accepted_insurances
WHERE doctor_id NOT IN (SELECT id FROM auth.users);

