import { useState } from 'react';
import { uploadFile, uploadPatientAvatar, uploadDoctorAvatar, deleteFile } from '@/lib/storageUtils';

interface UploadState {
  uploading: boolean;
  progress: number;
  error: string | null;
  fileUrl: string | null;
  filePath: string | null;
}

export function useFileUpload() {
  const [state, setState] = useState<UploadState>({
    uploading: false,
    progress: 0,
    error: null,
    fileUrl: null,
    filePath: null,
  });

  const upload = async (
    file: File,
    patientId: string,
    folder: 'avatar' | 'medical_records' | 'exams' | 'attachments'
  ) => {
    setState({
      uploading: true,
      progress: 0,
      error: null,
      fileUrl: null,
      filePath: null,
    });

    try {
      const result = await uploadFile(file, patientId, folder, (progress) => {
        setState((prev) => ({ ...prev, progress }));
      });

      if (result.error) {
        setState({
          uploading: false,
          progress: 0,
          error: result.error,
          fileUrl: null,
          filePath: null,
        });
        return { success: false, error: result.error };
      }

      setState({
        uploading: false,
        progress: 100,
        error: null,
        fileUrl: result.url,
        filePath: result.path,
      });

      return { success: true, url: result.url, path: result.path };
    } catch (error: any) {
      const errorMessage = error.message || 'Erro ao fazer upload';
      setState({
        uploading: false,
        progress: 0,
        error: errorMessage,
        fileUrl: null,
        filePath: null,
      });
      return { success: false, error: errorMessage };
    }
  };

  const uploadAvatar = async (
    file: File,
    patientId: string,
    oldAvatarUrl?: string
  ) => {
    setState({
      uploading: true,
      progress: 0,
      error: null,
      fileUrl: null,
      filePath: null,
    });

    try {
      const result = await uploadPatientAvatar(file, patientId, oldAvatarUrl);

      if (result.error) {
        setState({
          uploading: false,
          progress: 0,
          error: result.error,
          fileUrl: null,
          filePath: null,
        });
        return { success: false, error: result.error };
      }

      setState({
        uploading: false,
        progress: 100,
        error: null,
        fileUrl: result.url,
        filePath: result.path,
      });

      return { success: true, url: result.url, path: result.path };
    } catch (error: any) {
      const errorMessage = error.message || 'Erro ao fazer upload do avatar';
      setState({
        uploading: false,
        progress: 0,
        error: errorMessage,
        fileUrl: null,
        filePath: null,
      });
      return { success: false, error: errorMessage };
    }
  };

  const uploadDoctorAvatarFile = async (
    file: File,
    doctorId: string,
    oldAvatarUrl?: string
  ) => {
    setState({
      uploading: true,
      progress: 0,
      error: null,
      fileUrl: null,
      filePath: null,
    });

    try {
      const result = await uploadDoctorAvatar(file, doctorId, oldAvatarUrl);

      if (result.error) {
        setState({
          uploading: false,
          progress: 0,
          error: result.error,
          fileUrl: null,
          filePath: null,
        });
        return { success: false, error: result.error };
      }

      setState({
        uploading: false,
        progress: 100,
        error: null,
        fileUrl: result.url,
        filePath: result.path,
      });

      return { success: true, url: result.url, path: result.path };
    } catch (error: any) {
      const errorMessage = error.message || 'Erro ao fazer upload do avatar';
      setState({
        uploading: false,
        progress: 0,
        error: errorMessage,
        fileUrl: null,
        filePath: null,
      });
      return { success: false, error: errorMessage };
    }
  };

  const removeFile = async (filePath: string) => {
    try {
      const result = await deleteFile(filePath);
      if (!result.success) {
        return { success: false, error: result.error };
      }
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message || 'Erro ao deletar arquivo' };
    }
  };

  const reset = () => {
    setState({
      uploading: false,
      progress: 0,
      error: null,
      fileUrl: null,
      filePath: null,
    });
  };

  return {
    ...state,
    upload,
    uploadAvatar,
    uploadDoctorAvatarFile,
    removeFile,
    reset,
  };
}
