-- Descrição: Substituir VIEWs por tabela real para suportar Realtime do Supabase
-- Data: 2025-10-14
-- Autor: Sistema MedX

-- MOTIVAÇÃO:
-- Supabase Realtime não funciona com VIEWs, apenas com tabelas reais.
-- Esta migration cria uma tabela real que se atualiza automaticamente via triggers.

-- ============================================================================
-- 0. LIMPAR VIEWs E FUNÇÕES ANTIGAS (não são mais usadas)
-- ============================================================================

-- Dropar VIEWs antigas (substituídas pela tabela real)
DROP VIEW IF EXISTS v_doctors_insurance_coverage CASCADE;
DROP VIEW IF EXISTS v_doctors_summary CASCADE;

-- Dropar função RPC antiga (substituída pela tabela real)
DROP FUNCTION IF EXISTS get_doctors_insurance_summary() CASCADE;

-- ============================================================================
-- 1. CRIAR TABELA REAL
-- ============================================================================

CREATE TABLE IF NOT EXISTS doctors_insurance_summary (
  doctor_id UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  doctor_email VARCHAR(255),
  doctor_name TEXT,
  doctor_specialty TEXT,
  total_insurance_companies BIGINT DEFAULT 0,
  total_insurance_plans BIGINT DEFAULT 0,
  insurance_companies TEXT,
  insurance_plans_list TEXT,
  last_updated TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_doctors_summary_name ON doctors_insurance_summary(doctor_name);
CREATE INDEX IF NOT EXISTS idx_doctors_summary_total_plans ON doctors_insurance_summary(total_insurance_plans);

-- Comentários na tabela
COMMENT ON TABLE doctors_insurance_summary IS 'Tabela materializada com resumo de convênios por médico - atualizada automaticamente via triggers';
COMMENT ON COLUMN doctors_insurance_summary.last_updated IS 'Data/hora da última atualização automática via trigger';

-- ============================================================================
-- 2. HABILITAR RLS
-- ============================================================================

ALTER TABLE doctors_insurance_summary ENABLE ROW LEVEL SECURITY;

-- Política RLS permissiva (todos podem ver)
CREATE POLICY "Todos podem ver resumo de médicos"
  ON doctors_insurance_summary
  FOR SELECT
  TO authenticated
  USING (true);

-- ============================================================================
-- 3. FUNÇÃO PARA RECALCULAR UM MÉDICO ESPECÍFICO
-- ============================================================================

CREATE OR REPLACE FUNCTION refresh_doctor_insurance_summary(p_doctor_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Deletar registro antigo se existir
  DELETE FROM doctors_insurance_summary WHERE doctor_id = p_doctor_id;
  
  -- Inserir dados recalculados
  INSERT INTO doctors_insurance_summary (
    doctor_id,
    doctor_email,
    doctor_name,
    doctor_specialty,
    total_insurance_companies,
    total_insurance_plans,
    insurance_companies,
    insurance_plans_list,
    last_updated
  )
  SELECT 
    p.id,
    p.email,
    p.name,
    p.specialization,
    COUNT(DISTINCT ic.id),
    COUNT(cai.id),
    STRING_AGG(DISTINCT ic.short_name, ', ' ORDER BY ic.short_name),
    STRING_AGG(ic.short_name || ' - ' || ip.name, ', ' ORDER BY ic.short_name, ip.name),
    NOW()
  FROM profiles p
  LEFT JOIN clinic_accepted_insurances cai ON cai.doctor_id = p.id AND cai.is_active = true
  LEFT JOIN insurance_plans ip ON ip.id = cai.insurance_plan_id
  LEFT JOIN insurance_companies ic ON ic.id = ip.insurance_company_id
  WHERE p.id = p_doctor_id AND p.role = 'doctor'
  GROUP BY p.id, p.email, p.name, p.specialization;
END;
$$;

-- ============================================================================
-- 4. FUNÇÃO PARA POPULAR TABELA COM TODOS OS MÉDICOS
-- ============================================================================

CREATE OR REPLACE FUNCTION refresh_all_doctors_insurance_summary()
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Limpar tabela
  TRUNCATE doctors_insurance_summary;
  
  -- Inserir todos os médicos
  INSERT INTO doctors_insurance_summary (
    doctor_id,
    doctor_email,
    doctor_name,
    doctor_specialty,
    total_insurance_companies,
    total_insurance_plans,
    insurance_companies,
    insurance_plans_list,
    last_updated
  )
  SELECT 
    p.id,
    p.email,
    p.name,
    p.specialization,
    COUNT(DISTINCT ic.id),
    COUNT(cai.id),
    STRING_AGG(DISTINCT ic.short_name, ', ' ORDER BY ic.short_name),
    STRING_AGG(ic.short_name || ' - ' || ip.name, ', ' ORDER BY ic.short_name, ip.name),
    NOW()
  FROM profiles p
  LEFT JOIN clinic_accepted_insurances cai ON cai.doctor_id = p.id AND cai.is_active = true
  LEFT JOIN insurance_plans ip ON ip.id = cai.insurance_plan_id
  LEFT JOIN insurance_companies ic ON ic.id = ip.insurance_company_id
  WHERE p.role = 'doctor'
  GROUP BY p.id, p.email, p.name, p.specialization;
END;
$$;

-- ============================================================================
-- 5. TRIGGERS PARA ATUALIZAÇÃO AUTOMÁTICA
-- ============================================================================

-- Trigger 1: Quando convênio é adicionado/removido/modificado
CREATE OR REPLACE FUNCTION trigger_refresh_doctor_summary()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Determinar qual doctor_id foi afetado
  IF (TG_OP = 'DELETE') THEN
    PERFORM refresh_doctor_insurance_summary(OLD.doctor_id);
  ELSE
    PERFORM refresh_doctor_insurance_summary(NEW.doctor_id);
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$;

-- Aplicar trigger na tabela clinic_accepted_insurances
DROP TRIGGER IF EXISTS trg_refresh_doctor_summary ON clinic_accepted_insurances;
CREATE TRIGGER trg_refresh_doctor_summary
  AFTER INSERT OR UPDATE OR DELETE ON clinic_accepted_insurances
  FOR EACH ROW
  EXECUTE FUNCTION trigger_refresh_doctor_summary();

-- Trigger 2: Quando perfil do médico muda (nome, especialidade, etc)
CREATE OR REPLACE FUNCTION trigger_refresh_doctor_profile()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Só atualiza se for médico
  IF (NEW.role = 'doctor' OR OLD.role = 'doctor') THEN
    IF (TG_OP = 'DELETE') THEN
      DELETE FROM doctors_insurance_summary WHERE doctor_id = OLD.id;
    ELSE
      PERFORM refresh_doctor_insurance_summary(NEW.id);
    END IF;
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$;

-- Aplicar trigger na tabela profiles
DROP TRIGGER IF EXISTS trg_refresh_doctor_profile ON profiles;
CREATE TRIGGER trg_refresh_doctor_profile
  AFTER INSERT OR UPDATE OR DELETE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION trigger_refresh_doctor_profile();

-- ============================================================================
-- 6. POPULAR TABELA COM DADOS INICIAIS
-- ============================================================================

SELECT refresh_all_doctors_insurance_summary();

-- ============================================================================
-- 7. HABILITAR REALTIME
-- ============================================================================

-- Adicionar tabela à publicação do Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE doctors_insurance_summary;

-- ============================================================================
-- NOTAS DE USO
-- ============================================================================

-- 1. Frontend deve usar a TABELA diretamente:
--    const { data } = await supabase.from('doctors_insurance_summary').select('*');

-- 2. Para escutar mudanças em tempo real:
--    supabase
--      .channel('doctors-insurance-changes')
--      .on('postgres_changes', { event: '*', schema: 'public', table: 'doctors_insurance_summary' }, ...)
--      .subscribe();

-- 3. Para forçar recalcular todos os médicos (se necessário):
--    SELECT refresh_all_doctors_insurance_summary();

-- 4. Para recalcular um médico específico (se necessário):
--    SELECT refresh_doctor_insurance_summary('doctor_id_aqui');

-- ============================================================================
-- COMO FUNCIONA
-- ============================================================================

-- Fluxo automático:
-- 1. Médico adiciona/remove convênio em clinic_accepted_insurances
--    ↓
-- 2. Trigger trg_refresh_doctor_summary é acionado
--    ↓
-- 3. Função refresh_doctor_insurance_summary recalcula dados do médico
--    ↓
-- 4. Tabela doctors_insurance_summary é atualizada (DELETE + INSERT)
--    ↓
-- 5. Realtime notifica frontend da mudança
--    ↓
-- 6. Frontend recarrega dados automaticamente

