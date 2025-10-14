import { supabase } from './supabaseClient';

export const BUCKET_NAME = 'medical-files';
export const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB
export const MAX_AVATAR_SIZE = 5 * 1024 * 1024; // 5MB para avatares

export const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
export const ALLOWED_DOCUMENT_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'text/plain',
];
export const ALLOWED_MEDICAL_TYPES = ['application/dicom'];

export const ALL_ALLOWED_TYPES = [
  ...ALLOWED_IMAGE_TYPES,
  ...ALLOWED_DOCUMENT_TYPES,
  ...ALLOWED_MEDICAL_TYPES,
];

/**
 * Valida o tipo de arquivo
 */
export function validateFileType(file: File, allowedTypes: string[]): boolean {
  return allowedTypes.includes(file.type);
}

/**
 * Valida o tamanho do arquivo
 */
export function validateFileSize(file: File, maxSize: number): boolean {
  return file.size <= maxSize;
}

/**
 * Gera um nome de arquivo único
 */
export function generateUniqueFileName(originalName: string): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 15);
  const extension = originalName.split('.').pop();
  const nameWithoutExtension = originalName.replace(`.${extension}`, '').replace(/[^a-zA-Z0-9]/g, '_');
  return `${nameWithoutExtension}_${timestamp}_${random}.${extension}`;
}

/**
 * Cria o caminho completo do arquivo
 */
export function buildFilePath(patientId: string, folder: string, fileName: string): string {
  return `${patientId}/${folder}/${fileName}`;
}

/**
 * Upload de arquivo genérico
 */
export async function uploadFile(
  file: File,
  patientId: string,
  folder: 'avatar' | 'medical_records' | 'exams' | 'attachments',
  onProgress?: (progress: number) => void
): Promise<{ path: string; url: string; error?: string }> {
  try {
    // Validações
    const maxSize = folder === 'avatar' ? MAX_AVATAR_SIZE : MAX_FILE_SIZE;
    
    if (!validateFileSize(file, maxSize)) {
      return {
        path: '',
        url: '',
        error: `Arquivo muito grande. Tamanho máximo: ${maxSize / 1024 / 1024}MB`,
      };
    }

    const allowedTypes = folder === 'avatar' ? ALLOWED_IMAGE_TYPES : ALL_ALLOWED_TYPES;
    if (!validateFileType(file, allowedTypes)) {
      return {
        path: '',
        url: '',
        error: 'Tipo de arquivo não permitido',
      };
    }

    // Gerar nome único e caminho
    const uniqueFileName = generateUniqueFileName(file.name);
    const filePath = buildFilePath(patientId, folder, uniqueFileName);

    // Upload para o Supabase Storage
    const { data, error } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false,
      });

    if (error) {
      console.error('Erro no upload:', error);
      return {
        path: '',
        url: '',
        error: error.message,
      };
    }

    // Obter URL pública (signed URL por 1 ano)
    const { data: urlData } = await supabase.storage
      .from(BUCKET_NAME)
      .createSignedUrl(filePath, 31536000); // 1 ano em segundos

    return {
      path: filePath,
      url: urlData?.signedUrl || '',
    };
  } catch (error: any) {
    console.error('Erro no upload:', error);
    return {
      path: '',
      url: '',
      error: error.message || 'Erro desconhecido no upload',
    };
  }
}

/**
 * Upload de avatar de paciente (com substituição)
 */
export async function uploadPatientAvatar(
  file: File,
  patientId: string,
  oldAvatarUrl?: string
): Promise<{ path: string; url: string; error?: string }> {
  try {
    // Se existe avatar antigo, deletar primeiro
    if (oldAvatarUrl) {
      await deleteFileByUrl(oldAvatarUrl);
    }

    // Upload do novo avatar
    return await uploadFile(file, patientId, 'avatar');
  } catch (error: any) {
    console.error('Erro no upload do avatar:', error);
    return {
      path: '',
      url: '',
      error: error.message || 'Erro ao fazer upload do avatar',
    };
  }
}

/**
 * Verificar se o file_path é uma URL completa
 */
export function isFullUrl(filePath: string): boolean {
  try {
    const url = new URL(filePath);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

/**
 * Obter URL signed de um arquivo
 */
export async function getSignedUrl(filePath: string, expiresIn: number = 3600): Promise<string | null> {
  try {
    const { data, error } = await supabase.storage
      .from(BUCKET_NAME)
      .createSignedUrl(filePath, expiresIn);

    if (error) {
      console.error('Erro ao obter signed URL:', error);
      return null;
    }

    return data?.signedUrl || null;
  } catch (error) {
    console.error('Erro ao obter signed URL:', error);
    return null;
  }
}

/**
 * Obter URL do arquivo - suporta tanto URLs completas quanto caminhos do storage
 * Esta função detecta automaticamente se o file_path é uma URL ou caminho local
 */
export async function getFileUrl(filePath: string, expiresIn: number = 3600): Promise<string | null> {
  try {
    // Se já é uma URL completa, retornar diretamente
    if (isFullUrl(filePath)) {
      return filePath;
    }

    // Caso contrário, buscar URL signed do storage
    return await getSignedUrl(filePath, expiresIn);
  } catch (error) {
    console.error('Erro ao obter URL do arquivo:', error);
    return null;
  }
}

/**
 * Deletar arquivo pelo path
 * URLs externas não serão deletadas, apenas registros do storage local
 */
export async function deleteFile(filePath: string): Promise<{ success: boolean; error?: string }> {
  try {
    // Se for uma URL externa, não tentar deletar do storage
    if (isFullUrl(filePath)) {
      console.log('URL externa detectada, não será deletada do storage:', filePath);
      return { success: true };
    }

    const { error } = await supabase.storage.from(BUCKET_NAME).remove([filePath]);

    if (error) {
      console.error('Erro ao deletar arquivo:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error: any) {
    console.error('Erro ao deletar arquivo:', error);
    return { success: false, error: error.message || 'Erro desconhecido ao deletar' };
  }
}

/**
 * Deletar arquivo pela URL
 */
export async function deleteFileByUrl(url: string): Promise<{ success: boolean; error?: string }> {
  try {
    // Extrair o path da URL
    const urlObj = new URL(url);
    const pathMatch = urlObj.pathname.match(/\/object\/public\/medical-files\/(.+?)(\?|$)/);
    
    if (!pathMatch) {
      return { success: false, error: 'URL inválida' };
    }

    const filePath = pathMatch[1];
    return await deleteFile(filePath);
  } catch (error: any) {
    console.error('Erro ao deletar arquivo pela URL:', error);
    return { success: false, error: error.message || 'Erro ao processar URL' };
  }
}

/**
 * Listar arquivos de um paciente
 */
export async function listPatientFiles(
  patientId: string,
  folder?: 'avatar' | 'medical_records' | 'exams' | 'attachments'
): Promise<{ files: any[]; error?: string }> {
  try {
    const path = folder ? `${patientId}/${folder}` : patientId;

    const { data, error } = await supabase.storage.from(BUCKET_NAME).list(path, {
      limit: 100,
      offset: 0,
      sortBy: { column: 'created_at', order: 'desc' },
    });

    if (error) {
      console.error('Erro ao listar arquivos:', error);
      return { files: [], error: error.message };
    }

    return { files: data || [] };
  } catch (error: any) {
    console.error('Erro ao listar arquivos:', error);
    return { files: [], error: error.message || 'Erro desconhecido' };
  }
}

/**
 * Fazer download de arquivo
 */
export async function downloadFile(filePath: string): Promise<{ data: Blob | null; error?: string }> {
  try {
    const { data, error } = await supabase.storage.from(BUCKET_NAME).download(filePath);

    if (error) {
      console.error('Erro ao fazer download:', error);
      return { data: null, error: error.message };
    }

    return { data };
  } catch (error: any) {
    console.error('Erro ao fazer download:', error);
    return { data: null, error: error.message || 'Erro desconhecido' };
  }
}

/**
 * Formatar tamanho de arquivo
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}

/**
 * Obter extensão do arquivo
 */
export function getFileExtension(fileName: string): string {
  return fileName.split('.').pop()?.toLowerCase() || '';
}

/**
 * Verificar se arquivo é imagem
 * Verifica tanto o fileName quanto o filePath (útil para URLs externas)
 */
export function isImageFile(fileName: string, filePath?: string): boolean {
  // Tentar pelo fileName primeiro
  const ext = getFileExtension(fileName);
  if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext)) {
    return true;
  }
  
  // Se não encontrou extensão no fileName e tem filePath, tentar pelo filePath
  if (filePath) {
    const extFromPath = getFileExtension(filePath);
    return ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(extFromPath);
  }
  
  return false;
}

/**
 * Verificar se arquivo é PDF
 * Verifica tanto o fileName quanto o filePath (útil para URLs externas)
 */
export function isPdfFile(fileName: string, filePath?: string): boolean {
  // Tentar pelo fileName primeiro
  if (getFileExtension(fileName) === 'pdf') {
    return true;
  }
  
  // Se não encontrou no fileName e tem filePath, tentar pelo filePath
  if (filePath) {
    return getFileExtension(filePath) === 'pdf';
  }
  
  return false;
}

/**
 * Verificar se arquivo é áudio
 * Verifica tanto o fileName quanto o filePath (útil para URLs externas)
 */
export function isAudioFile(fileName: string, filePath?: string): boolean {
  const audioExtensions = ['mp3', 'wav', 'ogg', 'm4a', 'aac', 'flac', 'opus'];
  
  // Tentar pelo fileName primeiro
  const ext = getFileExtension(fileName);
  if (audioExtensions.includes(ext)) {
    return true;
  }
  
  // Se não encontrou no fileName e tem filePath, tentar pelo filePath
  if (filePath) {
    const extFromPath = getFileExtension(filePath);
    return audioExtensions.includes(extFromPath);
  }
  
  return false;
}
