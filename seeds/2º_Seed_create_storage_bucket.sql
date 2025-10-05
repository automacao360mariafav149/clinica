-- Descrição: Configuração do bucket de armazenamento para arquivos médicos
-- Data: 2025-10-05
-- Autor: Sistema MedX

-- ============================================================================
-- CRIAÇÃO DO BUCKET medical-files
-- ============================================================================

-- Inserir bucket se não existir
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'medical-files',
  'medical-files',
  false, -- Não é público, requer autenticação
  52428800, -- 50MB de limite por arquivo
  ARRAY[
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/plain',
    'application/dicom' -- Para imagens médicas DICOM
  ]
)
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- POLÍTICAS DE ACESSO AO BUCKET
-- ============================================================================

-- Permitir usuários autenticados visualizar arquivos
CREATE POLICY "Usuários autenticados podem visualizar arquivos médicos"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'medical-files' AND
  auth.uid() IN (
    SELECT auth_user_id FROM public.profiles 
    WHERE role IN ('owner', 'doctor', 'secretary')
  )
);

-- Permitir usuários autenticados fazer upload de arquivos
CREATE POLICY "Usuários autenticados podem fazer upload"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'medical-files' AND
  auth.uid() IN (
    SELECT auth_user_id FROM public.profiles 
    WHERE role IN ('owner', 'doctor', 'secretary')
  )
);

-- Permitir usuários autenticados atualizar arquivos
CREATE POLICY "Usuários autenticados podem atualizar arquivos"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'medical-files' AND
  auth.uid() IN (
    SELECT auth_user_id FROM public.profiles 
    WHERE role IN ('owner', 'doctor', 'secretary')
  )
);

-- Permitir usuários autenticados deletar arquivos
CREATE POLICY "Usuários autenticados podem deletar arquivos"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'medical-files' AND
  auth.uid() IN (
    SELECT auth_user_id FROM public.profiles 
    WHERE role IN ('owner', 'doctor', 'secretary')
  )
);

-- ============================================================================
-- COMENTÁRIOS
-- ============================================================================
COMMENT ON TABLE storage.buckets IS 'Buckets de armazenamento do Supabase Storage';

-- ============================================================================
-- ESTRUTURA DE PASTAS RECOMENDADA
-- ============================================================================
-- medical-files/
--   ├── {patient_id}/
--   │   ├── avatar/
--   │   │   └── {filename} (foto do paciente)
--   │   ├── medical_records/
--   │   │   └── {filename} (documentos de prontuários)
--   │   ├── exams/
--   │   │   └── {filename} (resultados de exames)
--   │   └── attachments/
--   │       └── {filename} (outros documentos)
--   
-- Exemplo de path completo:
-- medical-files/550e8400-e29b-41d4-a716-446655440000/avatar/profile.jpg
-- medical-files/550e8400-e29b-41d4-a716-446655440000/exams/hemograma-2025-10-05.pdf
