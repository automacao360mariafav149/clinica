import { useState, useRef } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Camera, Loader2, Trash2 } from 'lucide-react';
import { useFileUpload } from '@/hooks/useFileUpload';
import { toast } from 'sonner';

interface DoctorAvatarUploadProps {
  doctorId: string;
  avatarUrl?: string;
  doctorName: string;
  onUploadSuccess?: (url: string) => void;
  onRemoveSuccess?: () => void;
  size?: 'sm' | 'md' | 'lg';
}

export function DoctorAvatarUpload({
  doctorId,
  avatarUrl,
  doctorName,
  onUploadSuccess,
  onRemoveSuccess,
  size = 'md',
}: DoctorAvatarUploadProps) {
  const [currentAvatar, setCurrentAvatar] = useState(avatarUrl);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { uploading, uploadDoctorAvatarFile, removeFile } = useFileUpload();

  const sizeClasses = {
    sm: 'h-16 w-16',
    md: 'h-24 w-24',
    lg: 'h-32 w-32',
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validar tipo
    if (!file.type.startsWith('image/')) {
      toast.error('Por favor, selecione uma imagem');
      return;
    }

    // Validar tamanho (5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Imagem muito grande. Tamanho máximo: 5MB');
      return;
    }

    const result = await uploadDoctorAvatarFile(file, doctorId, currentAvatar);

    if (result.success) {
      setCurrentAvatar(result.url);
      toast.success('Foto atualizada com sucesso!');
      onUploadSuccess?.(result.url!);
    } else {
      toast.error(result.error || 'Erro ao fazer upload');
    }

    // Limpar input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleRemove = async () => {
    if (!currentAvatar) return;

    const result = await removeFile(currentAvatar);

    if (result.success) {
      setCurrentAvatar(undefined);
      toast.success('Foto removida com sucesso!');
      onRemoveSuccess?.();
    } else {
      toast.error(result.error || 'Erro ao remover foto');
    }
  };

  const getInitials = (name: string) => {
    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="relative group">
        <Avatar className={sizeClasses[size]}>
          <AvatarImage src={currentAvatar} alt={doctorName} />
          <AvatarFallback className="text-lg font-semibold bg-primary text-primary-foreground">
            {getInitials(doctorName)}
          </AvatarFallback>
        </Avatar>

        {uploading && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full">
            <Loader2 className="h-6 w-6 animate-spin text-white" />
          </div>
        )}
      </div>

      <div className="flex gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
        >
          <Camera className="h-4 w-4 mr-2" />
          {currentAvatar ? 'Alterar' : 'Adicionar'} Foto
        </Button>

        {currentAvatar && !uploading && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleRemove}
            className="text-destructive hover:text-destructive hover:bg-destructive/10"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        )}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        onChange={handleFileSelect}
        className="hidden"
      />
    </div>
  );
}

