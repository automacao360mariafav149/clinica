-- Descrição: Criação da tabela system_settings para armazenar configurações do sistema (URL base, etc)
-- Data: 2025-10-06
-- Autor: Sistema MedX

-- Criar tabela de configurações do sistema
CREATE TABLE IF NOT EXISTS public.system_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    key VARCHAR(100) UNIQUE NOT NULL,
    value TEXT NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Criar índice para buscas rápidas por chave
CREATE INDEX idx_system_settings_key ON public.system_settings(key);

-- Criar índice para configurações ativas
CREATE INDEX idx_system_settings_active ON public.system_settings(is_active) WHERE is_active = true;

-- Habilitar RLS (Row Level Security)
ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;

-- Política: Todos podem ler configurações ativas
CREATE POLICY "Permitir leitura de configurações ativas"
ON public.system_settings
FOR SELECT
USING (is_active = true);

-- Política: Apenas usuários autenticados podem criar/atualizar configurações
CREATE POLICY "Apenas autenticados podem modificar configurações"
ON public.system_settings
FOR ALL
USING (auth.role() = 'authenticated')
WITH CHECK (auth.role() = 'authenticated');

-- Função para atualizar o campo updated_at automaticamente
CREATE OR REPLACE FUNCTION update_system_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para atualizar updated_at
CREATE TRIGGER trigger_update_system_settings_updated_at
    BEFORE UPDATE ON public.system_settings
    FOR EACH ROW
    EXECUTE FUNCTION update_system_settings_updated_at();

-- Habilitar Realtime para a tabela
ALTER PUBLICATION supabase_realtime ADD TABLE public.system_settings;

COMMENT ON TABLE public.system_settings IS 'Tabela de configurações do sistema para permitir alterações dinâmicas sem modificar código';
COMMENT ON COLUMN public.system_settings.key IS 'Chave única da configuração (ex: api_base_url, api_timeout)';
COMMENT ON COLUMN public.system_settings.value IS 'Valor da configuração';
COMMENT ON COLUMN public.system_settings.description IS 'Descrição da finalidade da configuração';
COMMENT ON COLUMN public.system_settings.is_active IS 'Indica se a configuração está ativa';

