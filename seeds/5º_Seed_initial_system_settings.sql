-- Descrição: Seed inicial para configurações do sistema
-- Data: 2025-10-06
-- Autor: Sistema MedX

-- Inserir configurações iniciais do sistema
INSERT INTO public.system_settings (key, value, description, is_active) VALUES
    ('api_base_url', 'https://api.exemplo.com', 'URL base para requisições da API externa', true),
    ('api_timeout', '30000', 'Timeout para requisições da API em milissegundos', true),
    ('maintenance_mode', 'false', 'Modo de manutenção do sistema', true),
    ('max_file_size', '10485760', 'Tamanho máximo de arquivo em bytes (10MB)', true)
ON CONFLICT (key) DO NOTHING;

