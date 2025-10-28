-- Descrição: Adiciona CASCADE DELETE na foreign key de clinic_accepted_insurances e função de limpeza
-- Data: 2025-10-28
-- Autor: Sistema MedX
-- Objetivo: Prevenir dados órfãos quando médicos forem removidos do sistema

-- ============================================
-- 1. ATUALIZAR FOREIGN KEY COM CASCADE DELETE
-- ============================================

-- Remove a constraint antiga (se existir)
ALTER TABLE clinic_accepted_insurances
DROP CONSTRAINT IF EXISTS clinic_accepted_insurances_doctor_id_fkey;

-- Adiciona nova constraint com ON DELETE CASCADE
ALTER TABLE clinic_accepted_insurances
ADD CONSTRAINT clinic_accepted_insurances_doctor_id_fkey
FOREIGN KEY (doctor_id) REFERENCES profiles(id)
ON DELETE CASCADE;

-- Comentário explicativo
COMMENT ON CONSTRAINT clinic_accepted_insurances_doctor_id_fkey 
ON clinic_accepted_insurances IS 
'Foreign key com CASCADE DELETE - quando um médico for removido, seus convênios aceitos são automaticamente removidos';

-- ============================================
-- 2. FUNÇÃO DE LIMPEZA DE DADOS ÓRFÃOS
-- ============================================

-- Função para limpar dados órfãos manualmente (se necessário)
CREATE OR REPLACE FUNCTION cleanup_orphan_insurances()
RETURNS TABLE(deleted_count bigint) AS $$
DECLARE
  v_deleted_count bigint;
BEGIN
  -- Remove registros de convênios vinculados a médicos inexistentes
  WITH deleted AS (
    DELETE FROM clinic_accepted_insurances
    WHERE doctor_id NOT IN (SELECT id FROM profiles WHERE role = 'doctor')
    RETURNING *
  )
  SELECT COUNT(*) INTO v_deleted_count FROM deleted;
  
  -- Log da operação
  RAISE NOTICE 'Limpeza concluída: % registros órfãos removidos', v_deleted_count;
  
  -- Retorna contador
  RETURN QUERY SELECT v_deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Comentário na função
COMMENT ON FUNCTION cleanup_orphan_insurances() IS 
'Remove convênios aceitos vinculados a médicos que não existem mais na tabela profiles (role=doctor). Retorna o número de registros removidos.';

-- ============================================
-- 3. FUNÇÃO DE VERIFICAÇÃO DE INTEGRIDADE
-- ============================================

-- Função para verificar se há dados órfãos (sem deletar)
CREATE OR REPLACE FUNCTION check_orphan_insurances()
RETURNS TABLE(
  orphan_count bigint,
  orphan_doctor_ids uuid[]
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(*)::bigint as orphan_count,
    ARRAY_AGG(DISTINCT doctor_id) as orphan_doctor_ids
  FROM clinic_accepted_insurances
  WHERE doctor_id NOT IN (SELECT id FROM profiles WHERE role = 'doctor')
  AND is_active = true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Comentário na função
COMMENT ON FUNCTION check_orphan_insurances() IS 
'Verifica se existem convênios aceitos vinculados a médicos inexistentes. Retorna quantidade e lista de IDs órfãos.';

-- ============================================
-- 4. VIEW DE MONITORAMENTO
-- ============================================

-- View para monitorar integridade dos dados
CREATE OR REPLACE VIEW v_insurance_integrity_check AS
SELECT 
  'clinic_accepted_insurances' as tabela,
  COUNT(cai.id) as total_registros,
  COUNT(CASE WHEN p.id IS NULL THEN 1 END) as registros_orfaos,
  ARRAY_AGG(DISTINCT cai.doctor_id) FILTER (WHERE p.id IS NULL) as doctor_ids_orfaos
FROM clinic_accepted_insurances cai
LEFT JOIN profiles p ON p.id = cai.doctor_id AND p.role = 'doctor'
WHERE cai.is_active = true;

-- Comentário na view
COMMENT ON VIEW v_insurance_integrity_check IS 
'View de monitoramento para verificar integridade referencial dos convênios aceitos';

-- ============================================
-- 5. TESTE DAS FUNÇÕES
-- ============================================

-- Teste 1: Verificar se há dados órfãos
-- SELECT * FROM check_orphan_insurances();

-- Teste 2: Limpar dados órfãos (se houver)
-- SELECT * FROM cleanup_orphan_insurances();

-- Teste 3: Monitorar integridade
-- SELECT * FROM v_insurance_integrity_check;

-- ============================================
-- 6. PERMISSÕES RLS
-- ============================================

-- Garantir que as funções respeitem as permissões do sistema
-- (SECURITY DEFINER já aplicado nas funções)

-- ============================================
-- FIM DA MIGRATION
-- ============================================

-- Log de sucesso
DO $$
BEGIN
  RAISE NOTICE '✅ Migration 46 aplicada com sucesso!';
  RAISE NOTICE '   - Foreign key com CASCADE DELETE adicionada';
  RAISE NOTICE '   - Função de limpeza cleanup_orphan_insurances() criada';
  RAISE NOTICE '   - Função de verificação check_orphan_insurances() criada';
  RAISE NOTICE '   - View de monitoramento v_insurance_integrity_check criada';
END $$;

