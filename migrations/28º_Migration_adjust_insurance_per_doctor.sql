-- Descrição: Ajuste para permitir que cada médico escolha seus próprios convênios
-- Data: 2025-10-13
-- Autor: Sistema MedX

-- Adicionar coluna doctor_id para vincular convênios ao médico específico
ALTER TABLE clinic_accepted_insurances
ADD COLUMN IF NOT EXISTS doctor_id UUID REFERENCES auth.users(id);

-- Remover constraint UNIQUE antigo (que não permitia múltiplos médicos com mesmo plano)
ALTER TABLE clinic_accepted_insurances
DROP CONSTRAINT IF EXISTS clinic_accepted_insurances_insurance_plan_id_key;

-- Adicionar constraint UNIQUE composto (um médico não pode aceitar o mesmo plano duas vezes)
ALTER TABLE clinic_accepted_insurances
ADD CONSTRAINT unique_doctor_plan UNIQUE (doctor_id, insurance_plan_id);

-- Criar índice para melhorar performance nas consultas por médico
CREATE INDEX IF NOT EXISTS idx_clinic_accepted_insurances_doctor 
ON clinic_accepted_insurances(doctor_id);

-- Atualizar comentário da tabela
COMMENT ON TABLE clinic_accepted_insurances IS 'Convênios e planos aceitos por cada médico da clínica';

-- Remover políticas antigas
DROP POLICY IF EXISTS "Apenas owner pode gerenciar convênios aceitos" ON clinic_accepted_insurances;

-- Nova política: Médicos podem gerenciar seus próprios convênios
CREATE POLICY "Médicos podem gerenciar seus próprios convênios"
  ON clinic_accepted_insurances FOR ALL
  TO authenticated
  USING (
    -- Pode ver/editar se é o próprio médico OU se é owner/secretary
    doctor_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.raw_user_meta_data->>'role' IN ('owner', 'secretary')
    )
  )
  WITH CHECK (
    -- Pode inserir se é médico (inserindo para si mesmo) OU se é owner
    (doctor_id = auth.uid() AND 
     EXISTS (
       SELECT 1 FROM auth.users
       WHERE auth.users.id = auth.uid()
       AND auth.users.raw_user_meta_data->>'role' IN ('doctor', 'owner')
     )
    ) OR
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.raw_user_meta_data->>'role' = 'owner'
    )
  );

-- Atualizar política de visualização para incluir informações de qual médico aceita
COMMENT ON POLICY "Convênios aceitos visíveis para todos autenticados" ON clinic_accepted_insurances IS 
'Todos os usuários autenticados podem ver os convênios aceitos pelos médicos';

