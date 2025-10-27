-- Descrição: Ajustar tabela followup_config para armazenar valores em minutos (não segundos)
-- Data: 2025-10-27
-- Autor: Sistema MedX

-- Renomear colunas para refletir que armazenam minutos
ALTER TABLE followup_config 
  RENAME COLUMN followup1_seconds TO followup1_minutes;

ALTER TABLE followup_config 
  RENAME COLUMN followup2_seconds TO followup2_minutes;

ALTER TABLE followup_config 
  RENAME COLUMN followup3_seconds TO followup3_minutes;

-- Converter valores existentes de segundos para minutos
-- Segundos / 60 = Minutos
UPDATE followup_config
SET 
  followup1_minutes = followup1_minutes / 60,
  followup2_minutes = followup2_minutes / 60,
  followup3_minutes = followup3_minutes / 60
WHERE followup1_minutes > 1000; -- Só converte se parecer ser segundos

-- Atualizar comentários
COMMENT ON COLUMN followup_config.followup1_minutes IS 'Minutos para o primeiro follow-up';
COMMENT ON COLUMN followup_config.followup2_minutes IS 'Minutos para o segundo follow-up';
COMMENT ON COLUMN followup_config.followup3_minutes IS 'Minutos para o terceiro follow-up';

-- Verificar resultado
SELECT 
  id,
  followup1_minutes,
  followup2_minutes,
  followup3_minutes,
  followup1_minutes / 60.0 as followup1_horas,
  followup2_minutes / 60.0 as followup2_horas,
  followup3_minutes / 60.0 as followup3_horas
FROM followup_config;

