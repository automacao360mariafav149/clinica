-- Descrição: Adiciona coluna 'media' na tabela medx_history para armazenar metadados de mídia (imagens, áudios, documentos)
-- Data: 2025-10-10
-- Autor: Assistente GPT-5

ALTER TABLE public.medx_history
  ADD COLUMN IF NOT EXISTS media jsonb NULL;

COMMENT ON COLUMN public.medx_history.media IS 'Metadados de mídia relacionados à mensagem (ex.: urls, tipos, tamanhos).';
