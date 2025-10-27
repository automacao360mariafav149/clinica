-- Descrição: Criação da tabela de configuração de Follow Up com tempos personalizáveis para os 3 períodos
-- Data: 2025-10-27
-- Autor: Sistema MedX

-- Criar tabela de configuração de follow-up
CREATE TABLE IF NOT EXISTS followup_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id UUID REFERENCES clinic_info(id) ON DELETE CASCADE,
  followup1_days INTEGER NOT NULL DEFAULT 7,
  followup2_days INTEGER NOT NULL DEFAULT 15,
  followup3_days INTEGER NOT NULL DEFAULT 30,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(clinic_id)
);

-- Habilitar RLS
ALTER TABLE followup_config ENABLE ROW LEVEL SECURITY;

-- Políticas RLS com WITH CHECK para permitir INSERT e UPDATE

-- Política para SELECT (todos os roles autenticados podem ler)
CREATE POLICY "Todos autenticados podem ler configuração"
ON followup_config
FOR SELECT
TO authenticated
USING (true);

-- Política para INSERT (todos os roles autenticados podem criar)
CREATE POLICY "Todos autenticados podem criar configuração"
ON followup_config
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Política para UPDATE (todos os roles autenticados podem atualizar)
CREATE POLICY "Todos autenticados podem atualizar configuração"
ON followup_config
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

-- Política para DELETE (apenas owner pode deletar)
CREATE POLICY "Apenas owner pode deletar configuração"
ON followup_config
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'owner'
  )
);

-- Habilitar Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE followup_config;

-- Inserir configuração padrão (7, 15, 30 dias)
INSERT INTO followup_config (followup1_days, followup2_days, followup3_days)
VALUES (7, 15, 30)
ON CONFLICT (clinic_id) DO NOTHING;

-- Adicionar índices para performance
CREATE INDEX IF NOT EXISTS idx_followup_config_clinic ON followup_config(clinic_id);

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_followup_config_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_followup_config_updated_at
  BEFORE UPDATE ON followup_config
  FOR EACH ROW
  EXECUTE FUNCTION update_followup_config_updated_at();

-- Comentários para documentação
COMMENT ON TABLE followup_config IS 'Configuração dos períodos de follow-up (em dias)';
COMMENT ON COLUMN followup_config.followup1_days IS 'Dias para o primeiro follow-up';
COMMENT ON COLUMN followup_config.followup2_days IS 'Dias para o segundo follow-up';
COMMENT ON COLUMN followup_config.followup3_days IS 'Dias para o terceiro follow-up';

