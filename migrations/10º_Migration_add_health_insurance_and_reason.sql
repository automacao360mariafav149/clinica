-- Descrição: Adiciona campos health_insurance na tabela patients e reason na tabela appointments para métricas
-- Data: 2025-10-06
-- Autor: Sistema MedX

-- ============================================================================
-- Adicionar coluna health_insurance na tabela patients
-- ============================================================================
ALTER TABLE public.patients 
ADD COLUMN IF NOT EXISTS health_insurance TEXT;

-- Índice para facilitar buscas e agrupamentos por convênio
CREATE INDEX IF NOT EXISTS idx_patients_health_insurance 
ON public.patients(health_insurance);

-- ============================================================================
-- Adicionar coluna reason na tabela appointments
-- ============================================================================
ALTER TABLE public.appointments 
ADD COLUMN IF NOT EXISTS reason TEXT;

-- Índice para facilitar buscas e agrupamentos por motivo de consulta
CREATE INDEX IF NOT EXISTS idx_appointments_reason 
ON public.appointments(reason);

-- ============================================================================
-- Comentários nas colunas
-- ============================================================================
COMMENT ON COLUMN public.patients.health_insurance IS 'Convênio médico do paciente';
COMMENT ON COLUMN public.appointments.reason IS 'Motivo/razão da consulta';
