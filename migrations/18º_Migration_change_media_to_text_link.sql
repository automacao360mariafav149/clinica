-- Descrição: Altera o tipo da coluna 'media' em medx_history para text (URL/link)
-- Data: 2025-10-10
-- Autor: Assistente GPT-5

ALTER TABLE public.medx_history
  ALTER COLUMN media TYPE text USING (
    CASE
      WHEN jsonb_typeof(media) IS NOT NULL THEN media->> 'url'
      ELSE media::text
    END
  );

COMMENT ON COLUMN public.medx_history.media IS 'URL para mídia associada à mensagem (imagem, áudio ou documento).';
