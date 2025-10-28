-- Descrição: Migration de reconciliação - verifica estado atual e ajusta apenas o necessário
-- Data: 2025-10-28
-- Autor: Sistema MedX - Reconciliação

-- ============================================================================
-- EXTENSÕES NECESSÁRIAS
-- ============================================================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================================
-- FUNÇÃO AUXILIAR: Verificar se coluna existe
-- ============================================================================
CREATE OR REPLACE FUNCTION column_exists(
    ptable TEXT, 
    pcolumn TEXT, 
    pschema TEXT DEFAULT 'public'
) RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = pschema 
        AND table_name = ptable 
        AND column_name = pcolumn
    );
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- RECONCILIAR TABELA: insurance_companies
-- ============================================================================
DO $$
BEGIN
    -- Criar tabela se não existir
    IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'insurance_companies') THEN
        CREATE TABLE public.insurance_companies (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            name VARCHAR(255) NOT NULL,
            short_name VARCHAR(100),
            logo_url TEXT,
            market_share DECIMAL(5,2),
            beneficiaries INTEGER,
            headquarters VARCHAR(100),
            is_active BOOLEAN DEFAULT true,
            created_at TIMESTAMPTZ DEFAULT NOW(),
            updated_at TIMESTAMPTZ DEFAULT NOW()
        );
        
        -- RLS
        ALTER TABLE public.insurance_companies ENABLE ROW LEVEL SECURITY;
        
        CREATE POLICY "Operadoras visíveis para todos autenticados"
        ON insurance_companies FOR SELECT
        TO authenticated
        USING (true);
        
        -- Comentário
        COMMENT ON TABLE public.insurance_companies IS 'Operadoras de planos de saúde disponíveis no sistema';
        
        RAISE NOTICE 'Tabela insurance_companies criada';
    ELSE
        RAISE NOTICE 'Tabela insurance_companies já existe - OK';
    END IF;
END $$;

-- ============================================================================
-- RECONCILIAR TABELA: insurance_plans
-- ============================================================================
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'insurance_plans') THEN
        CREATE TABLE public.insurance_plans (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            insurance_company_id UUID NOT NULL REFERENCES insurance_companies(id) ON DELETE CASCADE,
            name VARCHAR(255) NOT NULL,
            plan_type VARCHAR(100),
            coverage_type VARCHAR(100),
            is_active BOOLEAN DEFAULT true,
            created_at TIMESTAMPTZ DEFAULT NOW(),
            updated_at TIMESTAMPTZ DEFAULT NOW()
        );
        
        ALTER TABLE public.insurance_plans ENABLE ROW LEVEL SECURITY;
        
        CREATE POLICY "Planos visíveis para todos autenticados"
        ON insurance_plans FOR SELECT
        TO authenticated
        USING (true);
        
        COMMENT ON TABLE public.insurance_plans IS 'Planos oferecidos por cada operadora de saúde';
        
        RAISE NOTICE 'Tabela insurance_plans criada';
    ELSE
        RAISE NOTICE 'Tabela insurance_plans já existe - OK';
    END IF;
END $$;

-- ============================================================================
-- RECONCILIAR TABELA: clinic_accepted_insurances
-- ============================================================================
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'clinic_accepted_insurances') THEN
        CREATE TABLE public.clinic_accepted_insurances (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            insurance_plan_id UUID NOT NULL REFERENCES insurance_plans(id) ON DELETE CASCADE,
            doctor_id UUID REFERENCES profiles(id),
            is_active BOOLEAN DEFAULT true,
            notes TEXT,
            accepted_at TIMESTAMPTZ DEFAULT NOW(),
            accepted_by UUID,
            created_at TIMESTAMPTZ DEFAULT NOW(),
            updated_at TIMESTAMPTZ DEFAULT NOW(),
            CONSTRAINT unique_doctor_plan UNIQUE (doctor_id, insurance_plan_id)
        );
        
        ALTER TABLE public.clinic_accepted_insurances ENABLE ROW LEVEL SECURITY;
        
        RAISE NOTICE 'Tabela clinic_accepted_insurances criada';
    ELSE
        -- Verificar se coluna doctor_id existe
        IF NOT column_exists('clinic_accepted_insurances', 'doctor_id') THEN
            ALTER TABLE clinic_accepted_insurances 
            ADD COLUMN doctor_id UUID REFERENCES profiles(id);
            
            RAISE NOTICE 'Coluna doctor_id adicionada à clinic_accepted_insurances';
        END IF;
        
        RAISE NOTICE 'Tabela clinic_accepted_insurances já existe - OK';
    END IF;
END $$;

-- ============================================================================
-- RECONCILIAR TABELA: clinic_info
-- ============================================================================
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'clinic_info') THEN
        CREATE TABLE public.clinic_info (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            address_line TEXT,
            address_number TEXT,
            neighborhood TEXT,
            city TEXT,
            state TEXT,
            zip_code TEXT,
            opening_hours TEXT,
            policy_scheduling TEXT,
            policy_rescheduling TEXT,
            policy_cancellation TEXT,
            doctor_ids UUID[],
            doctor_team JSONB,
            created_at TIMESTAMPTZ DEFAULT NOW(),
            updated_at TIMESTAMPTZ DEFAULT NOW()
        );
        
        ALTER TABLE public.clinic_info ENABLE ROW LEVEL SECURITY;
        
        COMMENT ON TABLE public.clinic_info IS 'Informações da clínica: endereço, horários e políticas de atendimento.';
        
        RAISE NOTICE 'Tabela clinic_info criada';
    ELSE
        -- Verificar colunas adicionais
        IF NOT column_exists('clinic_info', 'doctor_ids') THEN
            ALTER TABLE clinic_info ADD COLUMN doctor_ids UUID[];
            RAISE NOTICE 'Coluna doctor_ids adicionada';
        END IF;
        
        IF NOT column_exists('clinic_info', 'doctor_team') THEN
            ALTER TABLE clinic_info ADD COLUMN doctor_team JSONB;
            RAISE NOTICE 'Coluna doctor_team adicionada';
        END IF;
        
        RAISE NOTICE 'Tabela clinic_info já existe - OK';
    END IF;
END $$;

-- ============================================================================
-- RECONCILIAR TABELA: followup_config
-- ============================================================================
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'followup_config') THEN
        CREATE TABLE public.followup_config (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            clinic_id UUID REFERENCES clinic_info(id) ON DELETE CASCADE,
            followup1_minutes INTEGER NOT NULL DEFAULT 7,
            followup2_minutes INTEGER NOT NULL DEFAULT 15,
            followup3_minutes INTEGER NOT NULL DEFAULT 30,
            created_at TIMESTAMPTZ DEFAULT NOW(),
            updated_at TIMESTAMPTZ DEFAULT NOW(),
            UNIQUE(clinic_id)
        );
        
        ALTER TABLE public.followup_config ENABLE ROW LEVEL SECURITY;
        
        COMMENT ON TABLE public.followup_config IS 'Configuração dos períodos de follow-up (em minutos)';
        
        RAISE NOTICE 'Tabela followup_config criada';
    ELSE
        RAISE NOTICE 'Tabela followup_config já existe - OK';
    END IF;
END $$;

-- ============================================================================
-- VERIFICAR OUTRAS COLUNAS IMPORTANTES
-- ============================================================================

-- Verificar coluna health_insurance em patients
DO $$
BEGIN
    IF NOT column_exists('patients', 'health_insurance') THEN
        ALTER TABLE patients ADD COLUMN health_insurance TEXT;
        COMMENT ON COLUMN patients.health_insurance IS 'Convênio médico do paciente';
        RAISE NOTICE 'Coluna health_insurance adicionada a patients';
    END IF;
    
    IF NOT column_exists('patients', 'last_appointment_date') THEN
        ALTER TABLE patients ADD COLUMN last_appointment_date TIMESTAMPTZ;
        COMMENT ON COLUMN patients.last_appointment_date IS 'Data e hora da última consulta realizada pelo paciente';
        RAISE NOTICE 'Coluna last_appointment_date adicionada a patients';
    END IF;
    
    IF NOT column_exists('patients', 'stage') THEN
        ALTER TABLE patients ADD COLUMN stage TEXT DEFAULT 'crm';
        RAISE NOTICE 'Coluna stage adicionada a patients';
    END IF;
END $$;

-- Verificar coluna consultation_price em profiles
DO $$
BEGIN
    IF NOT column_exists('profiles', 'consultation_price') THEN
        ALTER TABLE profiles ADD COLUMN consultation_price NUMERIC DEFAULT 0.00;
        COMMENT ON COLUMN profiles.consultation_price IS 'Preço da consulta do médico (em reais)';
        RAISE NOTICE 'Coluna consultation_price adicionada a profiles';
    END IF;
    
    IF NOT column_exists('profiles', 'avatar_url') THEN
        ALTER TABLE profiles ADD COLUMN avatar_url TEXT;
        COMMENT ON COLUMN profiles.avatar_url IS 'URL da foto de perfil do usuário (médico, secretária, etc)';
        RAISE NOTICE 'Coluna avatar_url adicionada a profiles';
    END IF;
END $$;

-- Verificar colunas de medicação em agent_consultations
DO $$
BEGIN
    IF NOT column_exists('agent_consultations', 'medication_name') THEN
        ALTER TABLE agent_consultations ADD COLUMN medication_name TEXT;
        COMMENT ON COLUMN agent_consultations.medication_name IS 'Nome do medicamento calculado (para Agent Medicação)';
        RAISE NOTICE 'Coluna medication_name adicionada';
    END IF;
    
    IF NOT column_exists('agent_consultations', 'medication_dosage') THEN
        ALTER TABLE agent_consultations ADD COLUMN medication_dosage TEXT;
        COMMENT ON COLUMN agent_consultations.medication_dosage IS 'Dosagem calculada do medicamento';
        RAISE NOTICE 'Coluna medication_dosage adicionada';
    END IF;
    
    IF NOT column_exists('agent_consultations', 'medication_frequency') THEN
        ALTER TABLE agent_consultations ADD COLUMN medication_frequency TEXT;
        COMMENT ON COLUMN agent_consultations.medication_frequency IS 'Frequência de administração do medicamento';
        RAISE NOTICE 'Coluna medication_frequency adicionada';
    END IF;
    
    IF NOT column_exists('agent_consultations', 'exam_type') THEN
        ALTER TABLE agent_consultations ADD COLUMN exam_type TEXT;
        COMMENT ON COLUMN agent_consultations.exam_type IS 'Tipo de exame analisado pelo Agent de Exames';
        RAISE NOTICE 'Coluna exam_type adicionada';
    END IF;
    
    IF NOT column_exists('agent_consultations', 'exam_result_summary') THEN
        ALTER TABLE agent_consultations ADD COLUMN exam_result_summary TEXT;
        COMMENT ON COLUMN agent_consultations.exam_result_summary IS 'Resumo da análise do exame';
        RAISE NOTICE 'Coluna exam_result_summary adicionada';
    END IF;
    
    IF NOT column_exists('agent_consultations', 'exam_file_name') THEN
        ALTER TABLE agent_consultations ADD COLUMN exam_file_name TEXT;
        COMMENT ON COLUMN agent_consultations.exam_file_name IS 'Nome do arquivo PDF do exame analisado';
        RAISE NOTICE 'Coluna exam_file_name adicionada';
    END IF;
    
    IF NOT column_exists('agent_consultations', 'exam_analysis_date') THEN
        ALTER TABLE agent_consultations ADD COLUMN exam_analysis_date TIMESTAMPTZ DEFAULT NOW();
        COMMENT ON COLUMN agent_consultations.exam_analysis_date IS 'Data em que a análise do exame foi realizada';
        RAISE NOTICE 'Coluna exam_analysis_date adicionada';
    END IF;
END $$;

-- Verificar coluna reason em appointments
DO $$
BEGIN
    IF NOT column_exists('appointments', 'reason') THEN
        ALTER TABLE appointments ADD COLUMN reason TEXT;
        COMMENT ON COLUMN appointments.reason IS 'Motivo/razão da consulta';
        RAISE NOTICE 'Coluna reason adicionada a appointments';
    END IF;
END $$;

-- ============================================================================
-- LIMPAR FUNÇÃO AUXILIAR
-- ============================================================================
DROP FUNCTION IF EXISTS column_exists(TEXT, TEXT, TEXT);

-- ============================================================================
-- FIM DA RECONCILIAÇÃO
-- ============================================================================

