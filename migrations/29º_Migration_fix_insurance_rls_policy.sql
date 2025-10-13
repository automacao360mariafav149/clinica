-- Descrição: Correção da política RLS para médicos gerenciarem convênios sem precisar acessar tabela users
-- Data: 2025-10-13
-- Autor: Sistema MedX
-- Problema: Política anterior tentava fazer SELECT em auth.users, causando erro "permission denied for table users"
-- Solução: Usar auth.jwt() ao invés de EXISTS SELECT em auth.users

-- Remover política problemática
DROP POLICY IF EXISTS "Médicos podem gerenciar seus próprios convênios" ON clinic_accepted_insurances;

-- Criar nova política simplificada usando auth.jwt()
CREATE POLICY "Médicos podem gerenciar seus próprios convênios"
  ON clinic_accepted_insurances FOR ALL
  TO authenticated
  USING (
    -- Pode ver/editar se é o próprio médico OU se é owner/secretary
    doctor_id = auth.uid() OR
    (auth.jwt() -> 'user_metadata' ->> 'role') IN ('owner', 'secretary')
  )
  WITH CHECK (
    -- Pode inserir se está inserindo para si mesmo (e é doctor ou owner) OU se é owner
    (
      doctor_id = auth.uid() AND 
      (auth.jwt() -> 'user_metadata' ->> 'role') IN ('doctor', 'owner')
    ) OR
    (auth.jwt() -> 'user_metadata' ->> 'role') = 'owner'
  );

-- Comentário explicativo
COMMENT ON POLICY "Médicos podem gerenciar seus próprios convênios" ON clinic_accepted_insurances IS 
'Permite que médicos gerenciem seus próprios convênios, owners gerenciem todos, e secretárias visualizem. Usa auth.jwt() para evitar erro de permissão na tabela users.';

