-- Descrição: Ajustar tabela followup_config para armazenar valores em segundos ao invés de dias
-- Data: 2025-10-27
-- Autor: Sistema MedX

-- Renomear colunas para refletir que armazenam segundos
ALTER TABLE followup_config 
  RENAME COLUMN followup1_days TO followup1_seconds;

ALTER TABLE followup_config 
  RENAME COLUMN followup2_days TO followup2_seconds;

ALTER TABLE followup_config 
  RENAME COLUMN followup3_days TO followup3_seconds;

-- Converter valores existentes de dias para segundos (1 dia = 86400 segundos)
UPDATE followup_config
SET 
  followup1_seconds = followup1_seconds * 86400,
  followup2_seconds = followup2_seconds * 86400,
  followup3_seconds = followup3_seconds * 86400
WHERE followup1_seconds < 1000; -- Só converte se parecer ser dias (< 1000)

-- Atualizar comentários
COMMENT ON COLUMN followup_config.followup1_seconds IS 'Segundos para o primeiro follow-up';
COMMENT ON COLUMN followup_config.followup2_seconds IS 'Segundos para o segundo follow-up';
COMMENT ON COLUMN followup_config.followup3_seconds IS 'Segundos para o terceiro follow-up';

-- Verificar resultado
SELECT 
  id,
  followup1_seconds,
  followup2_seconds,
  followup3_seconds,
  followup1_seconds / 86400.0 as followup1_dias,
  followup2_seconds / 86400.0 as followup2_dias,
  followup3_seconds / 86400.0 as followup3_dias
FROM followup_config;

