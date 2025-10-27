-- Descrição: Seed inicial para configuração padrão de Follow Up (7, 15 e 30 dias)
-- Data: 2025-10-27
-- Autor: Sistema MedX

-- Inserir configuração padrão caso não exista
INSERT INTO followup_config (followup1_days, followup2_days, followup3_days)
VALUES (7, 15, 30)
ON CONFLICT (clinic_id) DO NOTHING;

-- Verificar se foi inserido
SELECT * FROM followup_config;

