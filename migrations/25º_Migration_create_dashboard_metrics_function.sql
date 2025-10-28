-- Descrição: Criação de function para buscar métricas do dashboard de forma otimizada
-- Data: 2025-10-28
-- Autor: Sistema MedX

-- Function para buscar todas as métricas do dashboard em uma única consulta otimizada
CREATE OR REPLACE FUNCTION get_dashboard_metrics()
RETURNS TABLE (
  consultas_hoje BIGINT,
  consultas_mes_atual BIGINT,
  consultas_mes_anterior BIGINT,
  total_pacientes_crm BIGINT,
  pacientes_mes_atual BIGINT,
  pacientes_mes_anterior BIGINT,
  total_pre_pacientes BIGINT,
  total_medicos BIGINT,
  total_secretarias BIGINT,
  mensagens_hoje BIGINT,
  mensagens_mes_atual BIGINT,
  followups_pendentes BIGINT,
  prontuarios_criados BIGINT,
  consultas_ia BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  hoje DATE := CURRENT_DATE;
  primeiro_dia_mes_atual TIMESTAMPTZ := DATE_TRUNC('month', CURRENT_DATE);
  primeiro_dia_mes_anterior TIMESTAMPTZ := DATE_TRUNC('month', CURRENT_DATE - INTERVAL '1 month');
  ultimo_dia_mes_anterior TIMESTAMPTZ := DATE_TRUNC('month', CURRENT_DATE) - INTERVAL '1 day';
BEGIN
  RETURN QUERY
  SELECT
    -- Consultas hoje
    (SELECT COUNT(*)::BIGINT FROM appointments WHERE DATE(scheduled_at) = hoje),
    
    -- Consultas mês atual
    (SELECT COUNT(*)::BIGINT FROM appointments WHERE scheduled_at >= primeiro_dia_mes_atual),
    
    -- Consultas mês anterior
    (SELECT COUNT(*)::BIGINT FROM appointments 
     WHERE scheduled_at >= primeiro_dia_mes_anterior 
     AND scheduled_at <= ultimo_dia_mes_anterior),
    
    -- Total de pacientes CRM
    (SELECT COUNT(*)::BIGINT FROM patients),
    
    -- Pacientes criados mês atual
    (SELECT COUNT(*)::BIGINT FROM patients WHERE created_at >= primeiro_dia_mes_atual),
    
    -- Pacientes criados mês anterior
    (SELECT COUNT(*)::BIGINT FROM patients 
     WHERE created_at >= primeiro_dia_mes_anterior 
     AND created_at <= ultimo_dia_mes_anterior),
    
    -- Total de pré-pacientes
    (SELECT COUNT(*)::BIGINT FROM pre_patients),
    
    -- Total de médicos
    (SELECT COUNT(*)::BIGINT FROM profiles WHERE role = 'doctor'),
    
    -- Total de secretárias
    (SELECT COUNT(*)::BIGINT FROM profiles WHERE role = 'secretary'),
    
    -- Mensagens hoje
    (SELECT COUNT(*)::BIGINT FROM messages WHERE DATE(created_at) = hoje),
    
    -- Mensagens mês atual
    (SELECT COUNT(*)::BIGINT FROM messages WHERE created_at >= primeiro_dia_mes_atual),
    
    -- Follow-ups pendentes
    (SELECT COUNT(*)::BIGINT FROM follow_ups WHERE status = 'pending'),
    
    -- Prontuários criados
    (SELECT COUNT(*)::BIGINT FROM medical_records),
    
    -- Consultas de IA
    (SELECT COUNT(*)::BIGINT FROM agent_consultations);
END;
$$;

-- Comentário na function
COMMENT ON FUNCTION get_dashboard_metrics() IS 'Retorna todas as métricas do dashboard em uma única consulta otimizada';

-- Garantir que a function pode ser executada por usuários autenticados
GRANT EXECUTE ON FUNCTION get_dashboard_metrics() TO authenticated;


