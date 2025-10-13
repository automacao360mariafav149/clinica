-- Descrição: Criação das tabelas para gerenciamento de convênios médicos (operadoras e planos)
-- Data: 2025-10-13
-- Autor: Sistema MedX

-- Tabela de operadoras de convênios
CREATE TABLE IF NOT EXISTS insurance_companies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  short_name VARCHAR(100),
  logo_url TEXT,
  market_share DECIMAL(5,2), -- Participação de mercado em percentual
  beneficiaries INTEGER, -- Número de beneficiários
  headquarters VARCHAR(100), -- Sede da operadora
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela de planos oferecidos por cada operadora
CREATE TABLE IF NOT EXISTS insurance_plans (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  insurance_company_id UUID NOT NULL REFERENCES insurance_companies(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  plan_type VARCHAR(100), -- Tipo: Básico, Intermediário, Premium, etc
  coverage_type VARCHAR(100), -- Tipo de cobertura: Regional, Estadual, Nacional
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela de convênios aceitos pela clínica
CREATE TABLE IF NOT EXISTS clinic_accepted_insurances (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  insurance_plan_id UUID NOT NULL REFERENCES insurance_plans(id) ON DELETE CASCADE,
  is_active BOOLEAN DEFAULT true,
  notes TEXT, -- Observações sobre o convênio (ex: carências, restrições)
  accepted_at TIMESTAMPTZ DEFAULT NOW(),
  accepted_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(insurance_plan_id) -- Evita duplicação do mesmo plano
);

-- Índices para melhorar performance
CREATE INDEX IF NOT EXISTS idx_insurance_plans_company ON insurance_plans(insurance_company_id);
CREATE INDEX IF NOT EXISTS idx_clinic_accepted_insurances_plan ON clinic_accepted_insurances(insurance_plan_id);
CREATE INDEX IF NOT EXISTS idx_insurance_companies_active ON insurance_companies(is_active);
CREATE INDEX IF NOT EXISTS idx_insurance_plans_active ON insurance_plans(is_active);

-- Comentários nas tabelas
COMMENT ON TABLE insurance_companies IS 'Operadoras de planos de saúde disponíveis no sistema';
COMMENT ON TABLE insurance_plans IS 'Planos oferecidos por cada operadora de saúde';
COMMENT ON TABLE clinic_accepted_insurances IS 'Convênios e planos aceitos pela clínica';

-- Enable RLS
ALTER TABLE insurance_companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE insurance_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE clinic_accepted_insurances ENABLE ROW LEVEL SECURITY;

-- Políticas de acesso (todos podem visualizar, apenas owner pode gerenciar)
-- Visualização de operadoras
CREATE POLICY "Operadoras visíveis para todos autenticados"
  ON insurance_companies FOR SELECT
  TO authenticated
  USING (true);

-- Visualização de planos
CREATE POLICY "Planos visíveis para todos autenticados"
  ON insurance_plans FOR SELECT
  TO authenticated
  USING (true);

-- Visualização de convênios aceitos
CREATE POLICY "Convênios aceitos visíveis para todos autenticados"
  ON clinic_accepted_insurances FOR SELECT
  TO authenticated
  USING (true);

-- Apenas owner pode inserir/atualizar/deletar convênios aceitos
CREATE POLICY "Apenas owner pode gerenciar convênios aceitos"
  ON clinic_accepted_insurances FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.raw_user_meta_data->>'role' = 'owner'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.raw_user_meta_data->>'role' = 'owner'
    )
  );

