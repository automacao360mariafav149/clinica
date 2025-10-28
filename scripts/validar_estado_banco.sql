-- Descrição: Script de validação do estado do banco de dados
-- Verifica se todas as tabelas, colunas e políticas RLS estão corretas
-- Data: 2025-10-28
-- Autor: Sistema MedX

-- ============================================================================
-- VERIFICAR TABELAS OBRIGATÓRIAS
-- ============================================================================
DO $$
DECLARE
    tabelas_obrigatorias TEXT[] := ARRAY[
        'profiles', 'patients', 'appointments', 'follow_ups', 'messages',
        'teleconsultations', 'profile_calendars', 'patient_doctors',
        'medical_records', 'anamnesis', 'clinical_data', 'exam_history',
        'medical_attachments', 'agent_consultations', 'doctor_schedules',
        'system_settings', 'pre_patients', 'insurance_companies',
        'insurance_plans', 'clinic_accepted_insurances',
        'doctors_insurance_summary', 'clinic_info', 'followup_config'
    ];
    tabela TEXT;
    existe BOOLEAN;
BEGIN
    RAISE NOTICE '============================================';
    RAISE NOTICE 'VALIDAÇÃO DE TABELAS';
    RAISE NOTICE '============================================';
    
    FOREACH tabela IN ARRAY tabelas_obrigatorias
    LOOP
        SELECT EXISTS (
            SELECT 1 FROM pg_tables 
            WHERE schemaname = 'public' AND tablename = tabela
        ) INTO existe;
        
        IF existe THEN
            RAISE NOTICE '✅ Tabela % existe', tabela;
        ELSE
            RAISE WARNING '❌ Tabela % NÃO EXISTE', tabela;
        END IF;
    END LOOP;
END $$;

-- ============================================================================
-- VERIFICAR RLS ATIVADO
-- ============================================================================
DO $$
DECLARE
    rec RECORD;
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '============================================';
    RAISE NOTICE 'VERIFICAÇÃO DE RLS';
    RAISE NOTICE '============================================';
    
    FOR rec IN 
        SELECT tablename, relrowsecurity
        FROM pg_tables t
        JOIN pg_class c ON c.relname = t.tablename
        WHERE t.schemaname = 'public'
        ORDER BY t.tablename
    LOOP
        IF rec.relrowsecurity THEN
            RAISE NOTICE '✅ % - RLS ATIVO', rec.tablename;
        ELSE
            RAISE WARNING '⚠️  % - RLS DESATIVADO', rec.tablename;
        END IF;
    END LOOP;
END $$;

-- ============================================================================
-- VERIFICAR POLÍTICAS RLS
-- ============================================================================
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- ============================================================================
-- VERIFICAR REALTIME
-- ============================================================================
SELECT schemaname, tablename
FROM pg_publication_tables
WHERE pubname = 'supabase_realtime'
ORDER BY schemaname, tablename;

-- ============================================================================
-- ESTATÍSTICAS GERAIS
-- ============================================================================
SELECT 
    'Tabelas Públicas' AS metrica,
    COUNT(*)::TEXT AS valor
FROM pg_tables
WHERE schemaname = 'public'

UNION ALL

SELECT 
    'Tabelas com RLS',
    COUNT(*)::TEXT
FROM pg_tables t
JOIN pg_class c ON c.relname = t.tablename
WHERE t.schemaname = 'public' AND c.relrowsecurity = true

UNION ALL

SELECT 
    'Políticas RLS',
    COUNT(*)::TEXT
FROM pg_policies
WHERE schemaname = 'public'

UNION ALL

SELECT 
    'Tabelas no Realtime',
    COUNT(*)::TEXT
FROM pg_publication_tables
WHERE pubname = 'supabase_realtime';

