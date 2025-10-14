import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Download, Eye, FileText, Image as ImageIcon, Loader2, Trash2 } from 'lucide-react';
import { getFileUrl, isImageFile, isPdfFile, formatFileSize } from '@/lib/storageUtils';
import { toast } from 'sonner';

interface Attachment {
  id: string;
  file_name: string;
  file_path: string;
  file_size_bytes?: number;
  created_at: string;
  related_to_type?: string;
}

interface AttachmentCardProps {
  attachment: Attachment;
  onDelete?: (attachmentId: string) => void;
}

export function AttachmentCard({ attachment, onDelete }: AttachmentCardProps) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [loadingUrl, setLoadingUrl] = useState(false);
  const [showFullView, setShowFullView] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Verificar extensão tanto no file_name quanto no file_path (URLs externas)
  const isImage = isImageFile(attachment.file_name, attachment.file_path);
  const isPdf = isPdfFile(attachment.file_name, attachment.file_path);

  // Carregar URL assinada ao montar
  useEffect(() => {
    loadSignedUrl();
  }, [attachment.file_path]);

  const loadSignedUrl = async () => {
    setLoadingUrl(true);
    try {
      // getFileUrl detecta automaticamente se é URL externa ou caminho do storage
      const url = await getFileUrl(attachment.file_path, 3600); // 1 hora
      if (url) {
        setPreviewUrl(url);
      }
    } catch (error) {
      console.error('Erro ao carregar URL:', error);
    } finally {
      setLoadingUrl(false);
    }
  };

  const handleDownload = async () => {
    if (!previewUrl) {
      toast.error('URL não disponível');
      return;
    }

    try {
      const response = await fetch(previewUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = attachment.file_name;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success('Download iniciado!');
    } catch (error) {
      console.error('Erro ao fazer download:', error);
      toast.error('Erro ao fazer download');
    }
  };

  const handleDelete = async () => {
    if (!onDelete) return;
    
    if (!confirm('Tem certeza que deseja excluir este anexo?')) return;

    setIsDeleting(true);
    try {
      await onDelete(attachment.id);
    } finally {
      setIsDeleting(false);
    }
  };

  const getFileIcon = () => {
    if (isImage) return <ImageIcon className="h-8 w-8 text-blue-500" />;
    if (isPdf) return <FileText className="h-8 w-8 text-red-500" />;
    return <FileText className="h-8 w-8 text-gray-500" />;
  };

  return (
    <>
      <Card className="overflow-hidden hover:shadow-lg transition-shadow">
        <div className="flex flex-col h-full">
          {/* Área de Preview */}
          <div className="relative bg-muted/30 aspect-video flex items-center justify-center border-b">
            {loadingUrl ? (
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            ) : previewUrl && isImage ? (
              <img
                src={previewUrl}
                alt={attachment.file_name}
                className="w-full h-full object-cover cursor-pointer"
                onClick={() => setShowFullView(true)}
              />
            ) : previewUrl && isPdf ? (
              <div
                className="flex flex-col items-center justify-center gap-2 cursor-pointer hover:bg-muted/50 w-full h-full"
                onClick={() => setShowFullView(true)}
              >
                <FileText className="h-16 w-16 text-red-500" />
                <p className="text-xs text-muted-foreground">Clique para visualizar PDF</p>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center gap-2">
                {getFileIcon()}
                <p className="text-xs text-muted-foreground">Sem preview</p>
              </div>
            )}
          </div>

          {/* Informações do Arquivo */}
          <div className="p-4 flex-1 flex flex-col">
            <div className="flex-1">
              <h4 className="text-sm font-medium truncate" title={attachment.file_name}>
                {attachment.file_name}
              </h4>
              <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                <span>
                  {new Date(attachment.created_at).toLocaleDateString('pt-BR', {
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric',
                  })}
                </span>
                {attachment.file_size_bytes && (
                  <>
                    <span>•</span>
                    <span>{formatFileSize(attachment.file_size_bytes)}</span>
                  </>
                )}
              </div>
            </div>

            {/* Ações */}
            <div className="flex gap-2 mt-4">
              <Button
                variant="outline"
                size="sm"
                className="flex-1"
                onClick={() => setShowFullView(true)}
                disabled={!previewUrl || loadingUrl}
              >
                <Eye className="h-4 w-4 mr-1" />
                Ver
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="flex-1"
                onClick={handleDownload}
                disabled={!previewUrl || loadingUrl}
              >
                <Download className="h-4 w-4 mr-1" />
                Baixar
              </Button>
              {onDelete && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className="text-destructive hover:text-destructive"
                >
                  {isDeleting ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Trash2 className="h-4 w-4" />
                  )}
                </Button>
              )}
            </div>
          </div>
        </div>
      </Card>

      {/* Modal de Visualização Completa */}
      <Dialog open={showFullView} onOpenChange={setShowFullView}>
        <DialogContent className="max-w-5xl max-h-[90vh] p-0">
          <DialogHeader className="px-6 pt-6 pb-4 border-b">
            <DialogTitle className="text-lg">{attachment.file_name}</DialogTitle>
            <DialogDescription>
              Enviado em {new Date(attachment.created_at).toLocaleDateString('pt-BR', {
                day: '2-digit',
                month: 'long',
                year: 'numeric',
              })}
            </DialogDescription>
          </DialogHeader>
          
          <div className="w-full h-[calc(90vh-140px)] overflow-auto bg-muted/10">
            {previewUrl && isImage ? (
              <div className="flex items-center justify-center p-4 h-full">
                <img
                  src={previewUrl}
                  alt={attachment.file_name}
                  className="max-w-full max-h-full object-contain"
                />
              </div>
            ) : previewUrl && isPdf ? (
              <iframe
                src={`${previewUrl}#toolbar=1&navpanes=1&scrollbar=1`}
                className="w-full h-full border-0"
                title={attachment.file_name}
              />
            ) : (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  {getFileIcon()}
                  <p className="text-sm text-muted-foreground mt-2">
                    Preview não disponível
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleDownload}
                    className="mt-4"
                    disabled={!previewUrl}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Fazer Download
                  </Button>
                </div>
              </div>
            )}
          </div>

          <div className="px-6 py-4 border-t flex justify-end gap-2">
            <Button variant="outline" onClick={() => setShowFullView(false)}>
              Fechar
            </Button>
            <Button onClick={handleDownload} disabled={!previewUrl}>
              <Download className="h-4 w-4 mr-2" />
              Baixar Arquivo
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
