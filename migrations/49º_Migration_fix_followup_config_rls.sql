-- Descrição: Correção das políticas RLS da tabela followup_config para permitir INSERT e UPDATE com WITH CHECK
-- Data: 2025-10-27
-- Autor: Sistema MedX

-- Remover políticas antigas que não tinham WITH CHECK
DROP POLICY IF EXISTS "Owner pode gerenciar configuração de follow-up" ON followup_config;
DROP POLICY IF EXISTS "Doctor e Secretary podem ler configuração de follow-up" ON followup_config;

-- Criar políticas corrigidas com WITH CHECK

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

-- Comentários para documentação
COMMENT ON POLICY "Todos autenticados podem ler configuração" ON followup_config 
  IS 'Permite que todos os usuários autenticados leiam a configuração de follow-up';
COMMENT ON POLICY "Todos autenticados podem criar configuração" ON followup_config 
  IS 'Permite que todos os usuários autenticados criem configuração (primeira vez)';
COMMENT ON POLICY "Todos autenticados podem atualizar configuração" ON followup_config 
  IS 'Permite que todos os usuários autenticados atualizem a configuração existente';
COMMENT ON POLICY "Apenas owner pode deletar configuração" ON followup_config 
  IS 'Apenas usuários com role owner podem deletar configurações';

