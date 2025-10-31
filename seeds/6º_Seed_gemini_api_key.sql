-- Descrição: Adiciona configuração da API key do Gemini Flash para análise de exames
-- Data: 2025-10-06
-- Autor: Sistema MedX

-- Inserir configuração da API key do Gemini
-- IMPORTANTE: Substitua 'SUA_API_KEY_AQUI' pela sua API key real do Google AI Studio
-- Para obter sua API key, acesse: https://makersuite.google.com/app/apikey
INSERT INTO public.system_settings (key, value, description, is_active) VALUES
    ('gemini_api_key', 'IzaSyCo_vyfXytvUuRwthPsqxVJaVLOLF2DiRs', 'API key do Google Gemini Flash para análise de exames laboratoriais e imagens médicas', true)
ON CONFLICT (key) DO UPDATE SET
    description = EXCLUDED.description,
    updated_at = NOW();

-- Nota: A API key do Gemini é usada para analisar PDFs e imagens de exames
-- usando inteligência artificial diretamente no frontend, sem necessidade de servidor intermediário.
-- 
-- Como obter sua API key:
-- 1. Acesse https://makersuite.google.com/app/apikey
-- 2. Faça login com sua conta Google
-- 3. Clique em "Create API Key"
-- 4. Copie a chave gerada
-- 5. Execute o comando SQL abaixo substituindo pela sua chave:
--
-- UPDATE public.system_settings 
-- SET value = 'sua-api-key-real-aqui' 
-- WHERE key = 'gemini_api_key';

