-- Descrição: Dados iniciais das principais operadoras de planos de saúde do Brasil e seus planos
-- Data: 2025-10-13
-- Autor: Sistema MedX

-- Inserir as principais operadoras de planos de saúde
INSERT INTO insurance_companies (id, name, short_name, market_share, beneficiaries, headquarters, is_active) VALUES
  ('a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d', 'Hapvida Assistência Médica', 'Hapvida', 8.4, 4410000, 'Ceará', true),
  ('b2c3d4e5-f6a7-5b6c-9d0e-1f2a3b4c5d6e', 'NotreDame Intermédica', 'Intermédica', 8.2, 4310000, 'São Paulo', true),
  ('c3d4e5f6-a7b8-6c7d-0e1f-2a3b4c5d6e7f', 'Bradesco Saúde', 'Bradesco', 7.1, 3720000, 'São Paulo', true),
  ('d4e5f6a7-b8c9-7d8e-1f2a-3b4c5d6e7f8a', 'Amil Assistência Médica', 'Amil', 6.0, 3130000, 'São Paulo', true),
  ('e5f6a7b8-c9d0-8e9f-2a3b-4c5d6e7f8a9b', 'SulAmérica Saúde', 'SulAmérica', 5.5, 2880000, 'Rio de Janeiro', true),
  ('f6a7b8c9-d0e1-9f0a-3b4c-5d6e7f8a9b0c', 'Unimed', 'Unimed', 1.7, 896000, 'São Paulo', true),
  ('a7b8c9d0-e1f2-0a1b-4c5d-6e7f8a9b0c1d', 'Porto Seguro Saúde', 'Porto Seguro', 1.3, 679000, 'São Paulo', true),
  ('b8c9d0e1-f2a3-1b2c-5d6e-7f8a9b0c1d2e', 'Prevent Senior', 'Prevent Senior', 1.0, 557000, 'São Paulo', true),
  ('c9d0e1f2-a3b4-2c3d-6e7f-8a9b0c1d2e3f', 'Assim Saúde', 'Assim', 1.0, 529000, 'Rio de Janeiro', true),
  ('d0e1f2a3-b4c5-3d4e-7f8a-9b0c1d2e3f4a', 'Golden Cross', 'Golden Cross', 0.8, 450000, 'Rio de Janeiro', true),
  ('e1f2a3b4-c5d6-4e5f-8a9b-0c1d2e3f4a5b', 'Care Plus', 'Care Plus', 0.7, 380000, 'São Paulo', true)
ON CONFLICT DO NOTHING;

-- Inserir os planos de cada operadora

-- Planos Hapvida
INSERT INTO insurance_plans (insurance_company_id, name, plan_type, coverage_type) VALUES
  ('a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d', 'Hapvida Mix', 'Básico', 'Regional'),
  ('a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d', 'Hapvida Pleno', 'Intermediário', 'Regional'),
  ('a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d', 'Hapvida Premium', 'Premium', 'Nacional');

-- Planos NotreDame Intermédica
INSERT INTO insurance_plans (insurance_company_id, name, plan_type, coverage_type) VALUES
  ('b2c3d4e5-f6a7-5b6c-9d0e-1f2a3b4c5d6e', 'Smart 200', 'Básico', 'Regional'),
  ('b2c3d4e5-f6a7-5b6c-9d0e-1f2a3b4c5d6e', 'Smart 400', 'Intermediário', 'Estadual'),
  ('b2c3d4e5-f6a7-5b6c-9d0e-1f2a3b4c5d6e', 'Smart 500', 'Premium', 'Nacional'),
  ('b2c3d4e5-f6a7-5b6c-9d0e-1f2a3b4c5d6e', 'Intermédica Advance', 'Premium', 'Nacional');

-- Planos Bradesco Saúde
INSERT INTO insurance_plans (insurance_company_id, name, plan_type, coverage_type) VALUES
  ('c3d4e5f6-a7b8-6c7d-0e1f-2a3b4c5d6e7f', 'Bradesco Saúde Efetivo', 'Básico', 'Regional'),
  ('c3d4e5f6-a7b8-6c7d-0e1f-2a3b4c5d6e7f', 'Bradesco Saúde Nacional Flex', 'Intermediário', 'Nacional'),
  ('c3d4e5f6-a7b8-6c7d-0e1f-2a3b4c5d6e7f', 'Bradesco Saúde Top Nacional', 'Premium', 'Nacional'),
  ('c3d4e5f6-a7b8-6c7d-0e1f-2a3b4c5d6e7f', 'Bradesco Saúde Preferencial', 'Premium', 'Nacional');

-- Planos Amil
INSERT INTO insurance_plans (insurance_company_id, name, plan_type, coverage_type) VALUES
  ('d4e5f6a7-b8c9-7d8e-1f2a-3b4c5d6e7f8a', 'Amil Fácil', 'Básico', 'Regional'),
  ('d4e5f6a7-b8c9-7d8e-1f2a-3b4c5d6e7f8a', 'Amil Medial', 'Intermediário', 'Estadual'),
  ('d4e5f6a7-b8c9-7d8e-1f2a-3b4c5d6e7f8a', 'Amil One Health', 'Premium', 'Nacional');

-- Planos SulAmérica
INSERT INTO insurance_plans (insurance_company_id, name, plan_type, coverage_type) VALUES
  ('e5f6a7b8-c9d0-8e9f-2a3b-4c5d6e7f8a9b', 'SulAmérica Direto', 'Básico', 'Regional'),
  ('e5f6a7b8-c9d0-8e9f-2a3b-4c5d6e7f8a9b', 'SulAmérica Clássico', 'Intermediário', 'Estadual'),
  ('e5f6a7b8-c9d0-8e9f-2a3b-4c5d6e7f8a9b', 'SulAmérica Executivo', 'Premium', 'Nacional'),
  ('e5f6a7b8-c9d0-8e9f-2a3b-4c5d6e7f8a9b', 'SulAmérica Exato', 'Intermediário', 'Nacional'),
  ('e5f6a7b8-c9d0-8e9f-2a3b-4c5d6e7f8a9b', 'SulAmérica Prestige', 'Premium', 'Nacional');

-- Planos Unimed
INSERT INTO insurance_plans (insurance_company_id, name, plan_type, coverage_type) VALUES
  ('f6a7b8c9-d0e1-9f0a-3b4c-5d6e7f8a9b0c', 'Unimed Municipal', 'Básico', 'Municipal'),
  ('f6a7b8c9-d0e1-9f0a-3b4c-5d6e7f8a9b0c', 'Unimed Regional', 'Básico', 'Regional'),
  ('f6a7b8c9-d0e1-9f0a-3b4c-5d6e7f8a9b0c', 'Unimed Estadual', 'Intermediário', 'Estadual'),
  ('f6a7b8c9-d0e1-9f0a-3b4c-5d6e7f8a9b0c', 'Unimed Nacional', 'Premium', 'Nacional'),
  ('f6a7b8c9-d0e1-9f0a-3b4c-5d6e7f8a9b0c', 'Unimed Estilo', 'Intermediário', 'Estadual'),
  ('f6a7b8c9-d0e1-9f0a-3b4c-5d6e7f8a9b0c', 'Unimed Clássico', 'Intermediário', 'Regional'),
  ('f6a7b8c9-d0e1-9f0a-3b4c-5d6e7f8a9b0c', 'Unimed Singular', 'Premium', 'Nacional'),
  ('f6a7b8c9-d0e1-9f0a-3b4c-5d6e7f8a9b0c', 'Unimed Pleno', 'Premium', 'Nacional'),
  ('f6a7b8c9-d0e1-9f0a-3b4c-5d6e7f8a9b0c', 'Unimed Absoluto', 'Premium', 'Nacional');

-- Planos Porto Seguro
INSERT INTO insurance_plans (insurance_company_id, name, plan_type, coverage_type) VALUES
  ('a7b8c9d0-e1f2-0a1b-4c5d-6e7f8a9b0c1d', 'Porto Seguro Saúde 200', 'Básico', 'Regional'),
  ('a7b8c9d0-e1f2-0a1b-4c5d-6e7f8a9b0c1d', 'Porto Seguro Saúde 400', 'Intermediário', 'Estadual'),
  ('a7b8c9d0-e1f2-0a1b-4c5d-6e7f8a9b0c1d', 'Porto Seguro Saúde 600', 'Premium', 'Nacional');

-- Planos Prevent Senior
INSERT INTO insurance_plans (insurance_company_id, name, plan_type, coverage_type) VALUES
  ('b8c9d0e1-f2a3-1b2c-5d6e-7f8a9b0c1d2e', 'Prevent Senior Individual', 'Básico', 'Municipal'),
  ('b8c9d0e1-f2a3-1b2c-5d6e-7f8a9b0c1d2e', 'Prevent Senior Familiar', 'Intermediário', 'Regional'),
  ('b8c9d0e1-f2a3-1b2c-5d6e-7f8a9b0c1d2e', 'Prevent Senior Empresarial', 'Premium', 'Estadual');

-- Planos Assim Saúde
INSERT INTO insurance_plans (insurance_company_id, name, plan_type, coverage_type) VALUES
  ('c9d0e1f2-a3b4-2c3d-6e7f-8a9b0c1d2e3f', 'Assim Essencial', 'Básico', 'Regional'),
  ('c9d0e1f2-a3b4-2c3d-6e7f-8a9b0c1d2e3f', 'Assim Clássico', 'Intermediário', 'Estadual'),
  ('c9d0e1f2-a3b4-2c3d-6e7f-8a9b0c1d2e3f', 'Assim Superior', 'Premium', 'Estadual');

-- Planos Golden Cross
INSERT INTO insurance_plans (insurance_company_id, name, plan_type, coverage_type) VALUES
  ('d0e1f2a3-b4c5-3d4e-7f8a-9b0c1d2e3f4a', 'Golden Cross Essencial', 'Básico', 'Regional'),
  ('d0e1f2a3-b4c5-3d4e-7f8a-9b0c1d2e3f4a', 'Golden Cross Clássico', 'Intermediário', 'Nacional'),
  ('d0e1f2a3-b4c5-3d4e-7f8a-9b0c1d2e3f4a', 'Golden Cross Premium', 'Premium', 'Nacional');

-- Planos Care Plus
INSERT INTO insurance_plans (insurance_company_id, name, plan_type, coverage_type) VALUES
  ('e1f2a3b4-c5d6-4e5f-8a9b-0c1d2e3f4a5b', 'Care Plus Exclusive', 'Premium', 'Nacional'),
  ('e1f2a3b4-c5d6-4e5f-8a9b-0c1d2e3f4a5b', 'Care Plus Premium', 'Premium', 'Nacional');

