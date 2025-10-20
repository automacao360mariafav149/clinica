-- Descrição: Cria função e trigger para sincronizar automaticamente doctor_schedules quando médicos são habilitados/desabilitados na equipe da clínica
-- Data: 2025-10-20
-- Autor: Sistema MedX

-- ============================================
-- FUNÇÃO: Sincroniza doctor_schedules com clinic_info.doctor_ids
-- ============================================

CREATE OR REPLACE FUNCTION sync_doctor_schedules_with_clinic_team()
RETURNS TRIGGER AS $$
DECLARE
  removed_doctor_id UUID;
  added_doctor_id UUID;
  old_doctor_ids UUID[];
  new_doctor_ids UUID[];
BEGIN
  -- Obtém os arrays de doctor_ids (antigo e novo)
  old_doctor_ids := COALESCE(OLD.doctor_ids, ARRAY[]::UUID[]);
  new_doctor_ids := COALESCE(NEW.doctor_ids, ARRAY[]::UUID[]);

  -- ============================================
  -- DESABILITA médicos removidos da equipe
  -- ============================================
  FOR removed_doctor_id IN 
    SELECT unnest(old_doctor_ids) 
    EXCEPT 
    SELECT unnest(new_doctor_ids)
  LOOP
    -- Desabilita todos os dias da semana para este médico
    UPDATE doctor_schedules
    SET 
      seg_ativo = false,
      ter_ativo = false,
      qua_ativo = false,
      qui_ativo = false,
      sex_ativo = false,
      sab_ativo = false,
      dom_ativo = false,
      updated_at = NOW()
    WHERE doctor_id = removed_doctor_id;

    RAISE NOTICE 'Médico % removido da equipe - schedules desabilitados', removed_doctor_id;
  END LOOP;

  -- ============================================
  -- HABILITA médicos adicionados à equipe
  -- ============================================
  FOR added_doctor_id IN 
    SELECT unnest(new_doctor_ids) 
    EXCEPT 
    SELECT unnest(old_doctor_ids)
  LOOP
    -- Habilita dias úteis (seg a sex) para este médico, se já existir registro
    UPDATE doctor_schedules
    SET 
      seg_ativo = true,
      ter_ativo = true,
      qua_ativo = true,
      qui_ativo = true,
      sex_ativo = true,
      sab_ativo = false,
      dom_ativo = false,
      updated_at = NOW()
    WHERE doctor_id = added_doctor_id;

    RAISE NOTICE 'Médico % adicionado à equipe - schedules habilitados', added_doctor_id;
  END LOOP;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION sync_doctor_schedules_with_clinic_team() IS 
'Sincroniza automaticamente a tabela doctor_schedules quando a lista de médicos da equipe (clinic_info.doctor_ids) é atualizada. Desabilita schedules de médicos removidos e habilita schedules de médicos adicionados.';

-- ============================================
-- TRIGGER: Executa a sincronização após UPDATE em clinic_info
-- ============================================

DROP TRIGGER IF EXISTS trigger_sync_doctor_schedules ON clinic_info;

CREATE TRIGGER trigger_sync_doctor_schedules
  AFTER UPDATE OF doctor_ids ON clinic_info
  FOR EACH ROW
  WHEN (OLD.doctor_ids IS DISTINCT FROM NEW.doctor_ids)
  EXECUTE FUNCTION sync_doctor_schedules_with_clinic_team();

COMMENT ON TRIGGER trigger_sync_doctor_schedules ON clinic_info IS 
'Trigger que sincroniza doctor_schedules automaticamente quando doctor_ids é modificado na tabela clinic_info';

-- ============================================
-- TESTE DA FUNCIONALIDADE
-- ============================================

-- Para testar manualmente (não executar em produção sem backup):
-- 
-- 1. Verificar médicos atuais na equipe:
--    SELECT doctor_ids FROM clinic_info LIMIT 1;
--
-- 2. Remover um médico da equipe:
--    UPDATE clinic_info SET doctor_ids = array_remove(doctor_ids, '<doctor_id>');
--    
-- 3. Verificar se os schedules foram desabilitados:
--    SELECT doctor_id, seg_ativo, ter_ativo, qua_ativo, qui_ativo, sex_ativo, sab_ativo, dom_ativo 
--    FROM doctor_schedules WHERE doctor_id = '<doctor_id>';
--
-- 4. Adicionar o médico de volta:
--    UPDATE clinic_info SET doctor_ids = array_append(doctor_ids, '<doctor_id>');
--
-- 5. Verificar se os schedules foram reabilitados:
--    SELECT doctor_id, seg_ativo, ter_ativo, qua_ativo, qui_ativo, sex_ativo, sab_ativo, dom_ativo 
--    FROM doctor_schedules WHERE doctor_id = '<doctor_id>';


