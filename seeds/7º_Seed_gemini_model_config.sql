-- Descrição: Adiciona configuração opcional para especificar o modelo do Gemini a ser usado
-- Data: 2025-10-06
-- Autor: Sistema MedX

-- Inserir configuração opcional do modelo do Gemini
-- Esta configuração é OPCIONAL. Se não definida, o sistema tentará automaticamente vários modelos.
-- Se definida, o modelo especificado será tentado primeiro.

INSERT INTO public.system_settings (key, value, description, is_active) VALUES
    ('gemini_model', 'gemini-1.5-flash', 'Modelo preferido do Gemini para análise de exames (deixe vazio para tentar automaticamente)', true)
ON CONFLICT (key) DO UPDATE SET
    description = EXCLUDED.description,
    updated_at = NOW();

-- Como usar:
-- 1. Para deixar automático (recomendado), deixe o valor como está ou defina como vazio
-- 2. Para forçar um modelo específico, use um dos seguintes:
--    - gemini-2.0-flash-exp (mais recente, experimental)
--    - gemini-1.5-flash-latest (recomendado)
--    - gemini-1.5-flash-002
--    - gemini-1.5-flash (estável)
--    - gemini-1.5-pro-latest
--    - gemini-1.5-pro
--    - gemini-pro-vision
--    - gemini-pro

-- Exemplo para forçar uso do gemini-1.5-flash-latest:
-- UPDATE public.system_settings 
-- SET value = 'gemini-1.5-flash-latest' 
-- WHERE key = 'gemini_model';

-- Exemplo para deixar automático novamente:
-- UPDATE public.system_settings 
-- SET value = '' 
-- WHERE key = 'gemini_model';

