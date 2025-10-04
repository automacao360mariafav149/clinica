-- Descrição: Habilita o Realtime em todas as tabelas de schemas de usuário (inclui automaticamente tabelas futuras)
-- Data: 2025-10-04
-- Autor: Assistente MCP

-- Garante que a publicação 'supabase_realtime' exista
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    EXECUTE 'CREATE PUBLICATION supabase_realtime';
  END IF;
END
$$;

-- Adiciona todas as tabelas de schemas não-internos à publicação
DO $$
DECLARE
  schema_name text;
BEGIN
  FOR schema_name IN
    SELECT nspname
    FROM pg_namespace
    WHERE nspname NOT LIKE 'pg_temp%'
      AND nspname NOT LIKE 'pg_toast_temp%'
      AND nspname NOT IN (
        'pg_catalog','information_schema','pg_toast',
        'extensions','auth','storage','graphql','supabase_functions',
        'supabase_migrations','supabase','pgbouncer','realtime','vault'
      )
  LOOP
    EXECUTE format('ALTER PUBLICATION supabase_realtime ADD TABLES IN SCHEMA %I', schema_name);
  END LOOP;
END
$$;


