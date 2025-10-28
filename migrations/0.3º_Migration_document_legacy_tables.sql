-- Descrição: Documentação das tabelas legadas existentes no banco
-- Data: 2025-10-28
-- Autor: Sistema MedX (Retroativa - documentando estrutura existente)

-- NOTA: Estas tabelas já existem no banco de dados.
-- Esta migration apenas documenta sua estrutura e propósito.
-- Elas foram criadas manualmente antes do sistema de migrations.

-- ============================================================================
-- TABELA LEGADA: medx_history
-- ============================================================================

-- Criar tabela SE NÃO EXISTIR (caso seja replicação)
CREATE TABLE IF NOT EXISTS public.medx_history (
  id SERIAL PRIMARY KEY,
  session_id VARCHAR(255),
  message JSONB,
  data_e_hora TIMESTAMPTZ DEFAULT NOW(),
  media TEXT
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_medx_history_session ON public.medx_history(session_id);
CREATE INDEX IF NOT EXISTS idx_medx_history_data ON public.medx_history(data_e_hora DESC);

-- Comentários
COMMENT ON TABLE public.medx_history IS 
'Histórico de conversas com pacientes - Sistema Legado. Mantida para compatibilidade com integrações antigas.';

COMMENT ON COLUMN public.medx_history.session_id IS 
'ID da sessão de conversa';

COMMENT ON COLUMN public.medx_history.message IS 
'Conteúdo da mensagem em formato JSON';

COMMENT ON COLUMN public.medx_history.data_e_hora IS 
'Data/hora do evento (armazenado como timestamptz em UTC). Exibir no app com offset -03:00.';

COMMENT ON COLUMN public.medx_history.media IS 
'URL para mídia associada à mensagem (imagem, áudio ou documento).';

-- RLS já ativado pela Migration 52
-- Garantir que está ativo
DO $$
BEGIN
  IF NOT (SELECT relrowsecurity FROM pg_class WHERE relname = 'medx_history') THEN
    ALTER TABLE public.medx_history ENABLE ROW LEVEL SECURITY;
  END IF;
END $$;

-- ============================================================================
-- TABELA LEGADA: clientes_followup
-- ============================================================================

-- Criar tabela SE NÃO EXISTIR (caso seja replicação)
CREATE TABLE IF NOT EXISTS public.clientes_followup (
  id SERIAL PRIMARY KEY,
  nome TEXT,
  numero TEXT,
  ultima_atividade TEXT,
  sessionid TEXT,
  "follow-up1" TEXT,
  data_envio1 TEXT,
  mensagem1 TEXT,
  "follow-up2" TEXT,
  data_envio2 TEXT,
  mensagem2 TEXT,
  "follow-up3" TEXT,
  data_envio3 TEXT,
  mensagem3 TEXT,
  situacao TEXT,
  followup TEXT
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_clientes_followup_numero ON public.clientes_followup(numero);
CREATE INDEX IF NOT EXISTS idx_clientes_followup_sessionid ON public.clientes_followup(sessionid);

-- Comentários
COMMENT ON TABLE public.clientes_followup IS 
'Clientes em processo de follow-up - Sistema Legado. Sendo gradualmente substituída pela tabela follow_ups (nova). Mantida para compatibilidade.';

COMMENT ON COLUMN public.clientes_followup.nome IS 
'Nome do cliente/paciente';

COMMENT ON COLUMN public.clientes_followup.numero IS 
'Número de telefone (WhatsApp)';

COMMENT ON COLUMN public.clientes_followup.sessionid IS 
'ID da sessão de conversa';

COMMENT ON COLUMN public.clientes_followup."follow-up1" IS 
'Status do primeiro follow-up';

COMMENT ON COLUMN public.clientes_followup.situacao IS 
'Situação atual do cliente no processo de follow-up';

-- RLS já ativado pela Migration 52
DO $$
BEGIN
  IF NOT (SELECT relrowsecurity FROM pg_class WHERE relname = 'clientes_followup') THEN
    ALTER TABLE public.clientes_followup ENABLE ROW LEVEL SECURITY;
  END IF;
END $$;

-- ============================================================================
-- TABELA LEGADA: followup_history
-- ============================================================================

-- Criar tabela SE NÃO EXISTIR (caso seja replicação)
CREATE TABLE IF NOT EXISTS public.followup_history (
  id SERIAL PRIMARY KEY,
  session_id VARCHAR(255),
  message JSONB
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_followup_history_session ON public.followup_history(session_id);

-- Comentários
COMMENT ON TABLE public.followup_history IS 
'Histórico de follow-ups realizados - Sistema Legado. Mantida para auditoria e análise histórica.';

COMMENT ON COLUMN public.followup_history.session_id IS 
'ID da sessão de follow-up';

COMMENT ON COLUMN public.followup_history.message IS 
'Conteúdo do follow-up em formato JSON';

-- RLS já ativado pela Migration 52
DO $$
BEGIN
  IF NOT (SELECT relrowsecurity FROM pg_class WHERE relname = 'followup_history') THEN
    ALTER TABLE public.followup_history ENABLE ROW LEVEL SECURITY;
  END IF;
END $$;

-- ============================================================================
-- TABELA DE TESTE: teste_mcp (Opcional)
-- ============================================================================

-- Criar tabela SE NÃO EXISTIR (caso seja replicação)
CREATE TABLE IF NOT EXISTS public.teste_mcp (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  descricao TEXT,
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Comentários
COMMENT ON TABLE public.teste_mcp IS 
'Tabela de teste para verificar conexão via MCP (Model Context Protocol). Pode ser removida em produção.';

-- RLS
ALTER TABLE public.teste_mcp ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Teste MCP visível para todos autenticados"
ON public.teste_mcp FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- ============================================================================
-- HABILITAR REALTIME (se ainda não estiver)
-- ============================================================================

-- medx_history, clientes_followup e followup_history já têm Realtime (Migration 52)
-- Adicionar teste_mcp se necessário
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
    AND tablename = 'teste_mcp'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.teste_mcp;
  END IF;
END $$;

-- ============================================================================
-- NOTAS IMPORTANTES
-- ============================================================================

-- 1. MIGRAÇÃO FUTURA:
--    As tabelas legadas (medx_history, clientes_followup, followup_history)
--    devem ser gradualmente substituídas pelas novas tabelas:
--    - clientes_followup → follow_ups (nova)
--    - medx_history → messages (nova)
--    
-- 2. DADOS EXISTENTES:
--    Os dados existentes nessas tabelas devem ser preservados para auditoria.
--    Quando criar script de migração de dados, documentar aqui.
--
-- 3. TABELA DE TESTE:
--    teste_mcp pode ser removida em produção após validação do sistema.

