-- Descrição: Ativar RLS em tabelas legadas que estavam expostas (correção de segurança)
-- Data: 2025-10-28
-- Autor: Sistema MedX - Correção de Segurança

-- ============================================================================
-- ATIVAR RLS EM TABELAS LEGADAS
-- ============================================================================

-- Tabela: medx_history
ALTER TABLE public.medx_history ENABLE ROW LEVEL SECURITY;

-- Política: Todos autenticados podem ver e criar histórico
CREATE POLICY "Usuários autenticados podem gerenciar histórico"
ON public.medx_history FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- Tabela: clientes_followup
ALTER TABLE public.clientes_followup ENABLE ROW LEVEL SECURITY;

-- Política: Todos autenticados podem gerenciar follow-ups
CREATE POLICY "Usuários autenticados podem gerenciar clientes_followup"
ON public.clientes_followup FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- Tabela: followup_history
ALTER TABLE public.followup_history ENABLE ROW LEVEL SECURITY;

-- Política: Todos autenticados podem gerenciar histórico de follow-up
CREATE POLICY "Usuários autenticados podem gerenciar followup_history"
ON public.followup_history FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- ============================================================================
-- ADICIONAR REALTIME NAS TABELAS
-- ============================================================================
ALTER PUBLICATION supabase_realtime ADD TABLE public.medx_history;
ALTER PUBLICATION supabase_realtime ADD TABLE public.clientes_followup;
ALTER PUBLICATION supabase_realtime ADD TABLE public.followup_history;

-- ============================================================================
-- COMENTÁRIOS
-- ============================================================================
COMMENT ON TABLE public.medx_history IS 'Histórico de conversas com pacientes (tabela legada)';
COMMENT ON TABLE public.clientes_followup IS 'Clientes em processo de follow-up (tabela legada)';
COMMENT ON TABLE public.followup_history IS 'Histórico de follow-ups realizados (tabela legada)';

