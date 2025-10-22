-- Descrição: Seed de exemplo para demonstrar o uso do campo avatar_url na tabela profiles
-- Data: 2025-10-21
-- Autor: Sistema MedX
-- Nota: Este é apenas um exemplo. Os avatares reais serão adicionados pelos próprios usuários através da interface.

-- IMPORTANTE: Não execute este seed em produção, é apenas um exemplo!
-- Os avatares devem ser adicionados através da interface do sistema, não diretamente no banco.

-- Exemplo de como o campo avatar_url seria preenchido:
-- UPDATE public.profiles
-- SET avatar_url = 'https://sua-url-do-supabase-storage.com/doctors/uuid-do-medico/avatar/foto.jpg'
-- WHERE id = 'uuid-do-medico';

-- Os avatares são gerenciados através do componente DoctorAvatarUpload na interface web
-- e armazenados no Supabase Storage no bucket 'medical-files' com a estrutura:
-- medical-files/doctors/{doctor_id}/avatar/{filename}

