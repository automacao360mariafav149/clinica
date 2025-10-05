import { useCallback, useState } from 'react';
import { Upload, File, X, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useFileUpload } from '@/hooks/useFileUpload';
import { formatFileSize, isImageFile, isPdfFile } from '@/lib/storageUtils';
import { toast } from 'sonner';

interface FileUploadZoneProps {
  patientId: string;
  folder: 'medical_records' | 'exams' | 'attachments';
  onUploadSuccess?: (url: string, path: string) => void;
  maxFiles?: number;
}

export function FileUploadZone({
  patientId,
  folder,
  onUploadSuccess,
  maxFiles = 5,
}: FileUploadZoneProps) {
  const [dragActive, setDragActive] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const { uploading, upload } = useFileUpload();

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const newFiles = Array.from(e.dataTransfer.files);
      if (files.length + newFiles.length > maxFiles) {
        toast.error(`Máximo de ${maxFiles} arquivos permitidos`);
        return;
      }
      setFiles((prev) => [...prev, ...newFiles].slice(0, maxFiles));
    }
  }, [files, maxFiles]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const newFiles = Array.from(e.target.files);
      if (files.length + newFiles.length > maxFiles) {
        toast.error(`Máximo de ${maxFiles} arquivos permitidos`);
        return;
      }
      setFiles((prev) => [...prev, ...newFiles].slice(0, maxFiles));
    }
  };

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleUpload = async () => {
    if (files.length === 0) {
      toast.error('Selecione pelo menos um arquivo');
      return;
    }

    for (const file of files) {
      const result = await upload(file, patientId, folder);

      if (result.success) {
        toast.success(`${file.name} enviado com sucesso!`);
        onUploadSuccess?.(result.url!, result.path!);
      } else {
        toast.error(`Erro ao enviar ${file.name}: ${result.error}`);
      }
    }

    // Limpar arquivos após upload
    setFiles([]);
  };

  const getFileIcon = (fileName: string) => {
    if (isImageFile(fileName)) return '🖼️';
    if (isPdfFile(fileName)) return '📄';
    return '📎';
  };

  return (
    <div className="space-y-4">
      <div
        className={`
          relative border-2 border-dashed rounded-lg p-8
          transition-colors duration-200
          ${dragActive ? 'border-primary bg-primary/5' : 'border-border'}
          ${uploading ? 'opacity-50 pointer-events-none' : ''}
        `}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <div className="flex flex-col items-center justify-center gap-4">
          <div className="rounded-full bg-primary/10 p-4">
            <Upload className="h-8 w-8 text-primary" />
          </div>
          
          <div className="text-center">
            <p className="text-sm font-medium">
              Arraste arquivos aqui ou clique para selecionar
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              PDF, imagens e documentos (máx. 50MB por arquivo)
            </p>
          </div>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => document.getElementById('file-input')?.click()}
            disabled={uploading}
          >
            Selecionar Arquivos
          </Button>

          <input
            id="file-input"
            type="file"
            multiple
            onChange={handleFileSelect}
            className="hidden"
            accept=".pdf,.jpg,.jpeg,.png,.gif,.webp,.doc,.docx,.xls,.xlsx,.txt"
          />
        </div>
      </div>

      {files.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium">
              {files.length} arquivo(s) selecionado(s)
            </p>
            <Button
              type="button"
              size="sm"
              onClick={handleUpload}
              disabled={uploading}
            >
              {uploading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Enviando...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4 mr-2" />
                  Enviar Todos
                </>
              )}
            </Button>
          </div>

          <div className="space-y-2">
            {files.map((file, index) => (
              <div
                key={index}
                className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg"
              >
                <span className="text-2xl">{getFileIcon(file.name)}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{file.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatFileSize(file.size)}
                  </p>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => removeFile(index)}
                  disabled={uploading}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
