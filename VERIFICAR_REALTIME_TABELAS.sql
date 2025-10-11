-- ============================================
-- VERIFICAÇÃO DE REALTIME NAS TABELAS
-- ============================================
-- Execute este SQL no Supabase SQL Editor para verificar
-- quais tabelas têm Realtime habilitado

-- 1. Verificar se a publicação existe
SELECT 
  pubname as "Nome da Publicação",
  puballtables as "Todas as Tabelas?",
  pubinsert as "INSERT habilitado?",
  pubupdate as "UPDATE habilitado?",
  pubdelete as "DELETE habilitado?"
FROM pg_publication 
WHERE pubname = 'supabase_realtime';

-- 2. Listar TODAS as tabelas que têm Realtime habilitado
SELECT 
  schemaname as "Schema",
  tablename as "Tabela",
  '✅ HABILITADO' as "Status Realtime"
FROM pg_publication_tables 
WHERE pubname = 'supabase_realtime'
ORDER BY schemaname, tablename;

-- 3. Listar tabelas do schema public que NÃO têm Realtime
SELECT 
  schemaname as "Schema",
  tablename as "Tabela",
  '❌ NÃO HABILITADO' as "Status Realtime"
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename NOT IN (
    SELECT tablename 
    FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime'
  )
ORDER BY tablename;

-- 4. Verificação específica das tabelas críticas do MedX
SELECT 
  t.table_name as "Tabela",
  CASE 
    WHEN pt.tablename IS NOT NULL THEN '✅ HABILITADO'
    ELSE '❌ NÃO HABILITADO'
  END as "Status Realtime"
FROM information_schema.tables t
LEFT JOIN pg_publication_tables pt 
  ON pt.tablename = t.table_name 
  AND pt.pubname = 'supabase_realtime'
WHERE t.table_schema = 'public'
  AND t.table_name IN (
    'appointments',
    'patients', 
    'profiles',
    'pre_patients',
    'agent_consultations',
    'doctor_schedules',
    'profile_calendars',
    'patient_records',
    'patient_documents',
    'medx_history'
  )
ORDER BY t.table_name;

-- ============================================
-- RESULTADO ESPERADO:
-- Todas as tabelas listadas devem mostrar "✅ HABILITADO"
-- Se alguma mostrar "❌ NÃO HABILITADO", execute a migration:
-- 19º_Migration_fix_realtime_appointments_patients.sql
-- ============================================


