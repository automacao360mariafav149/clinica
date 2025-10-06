import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Loader2, Send, FileText, Edit3 } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast } from 'sonner';
import { getApiBaseUrl } from '@/lib/apiConfig';

interface SendMedicationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  patientName: string;
  patientPhone: string;
  medicationName: string;
  defaultMessage: string; // modo_usar do resultado
}

export function SendMedicationModal({
  open,
  onOpenChange,
  patientName,
  patientPhone,
  medicationName,
  defaultMessage,
}: SendMedicationModalProps) {
  const [messageType, setMessageType] = useState<'automatic' | 'custom'>('automatic');
  const [customMessage, setCustomMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSend = async () => {
    const messageToSend = messageType === 'automatic' ? defaultMessage : customMessage;

    // Validar mensagem
    if (!messageToSend.trim()) {
      setError('Por favor, escreva uma mensagem antes de enviar');
      return;
    }

    if (!patientPhone || patientPhone.trim() === '') {
      setError('Paciente não possui número de telefone cadastrado');
      return;
    }

    setSending(true);
    setError(null);

    try {
      const apiBaseUrl = await getApiBaseUrl();
      const response = await fetch(`${apiBaseUrl}/enviar-medicacao`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          texto: messageToSend,
          nome_paciente: patientName,
          numero_paciente: patientPhone,
          medicamento: medicationName,
        }),
      });

      if (!response.ok) {
        throw new Error(`Erro ao enviar mensagem: ${response.status}`);
      }

      const result = await response.json();
      console.log('Resposta do envio:', result);

      toast.success('Mensagem enviada com sucesso!');
      onOpenChange(false);
      
      // Limpar estados
      setMessageType('automatic');
      setCustomMessage('');
      setError(null);
    } catch (err) {
      console.error('Erro ao enviar medicação:', err);
      const errorMessage = err instanceof Error ? err.message : 'Erro ao enviar mensagem. Tente novamente.';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setSending(false);
    }
  };

  const handleClose = () => {
    if (!sending) {
      setMessageType('automatic');
      setCustomMessage('');
      setError(null);
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-gradient-to-br from-green-500/20 to-emerald-500/20 border border-border/50">
              <Send className="w-6 h-6 text-green-500" />
            </div>
            <div>
              <DialogTitle>Enviar Orientações ao Paciente</DialogTitle>
              <DialogDescription>
                {patientName} • {medicationName}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Seleção do tipo de mensagem */}
          <div className="space-y-3">
            <Label>Escolha o tipo de mensagem:</Label>
            <RadioGroup value={messageType} onValueChange={(value) => setMessageType(value as 'automatic' | 'custom')}>
              <div className="flex items-start space-x-3 p-4 rounded-lg border hover:bg-muted/50 cursor-pointer transition-colors">
                <RadioGroupItem value="automatic" id="automatic" className="mt-1" />
                <label htmlFor="automatic" className="flex-1 cursor-pointer">
                  <div className="flex items-center gap-2 mb-1">
                    <FileText className="w-4 h-4 text-blue-500" />
                    <span className="font-semibold">Enviar orientações automáticas</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Usa as instruções de uso geradas pelo sistema
                  </p>
                </label>
              </div>

              <div className="flex items-start space-x-3 p-4 rounded-lg border hover:bg-muted/50 cursor-pointer transition-colors">
                <RadioGroupItem value="custom" id="custom" className="mt-1" />
                <label htmlFor="custom" className="flex-1 cursor-pointer">
                  <div className="flex items-center gap-2 mb-1">
                    <Edit3 className="w-4 h-4 text-purple-500" />
                    <span className="font-semibold">Escrever mensagem personalizada</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Crie sua própria mensagem para o paciente
                  </p>
                </label>
              </div>
            </RadioGroup>
          </div>

          {/* Preview ou input da mensagem */}
          <div className="space-y-2">
            <Label htmlFor="message">
              {messageType === 'automatic' ? 'Preview da Mensagem:' : 'Mensagem Personalizada:'}
            </Label>
            
            {messageType === 'automatic' ? (
              <div className="p-4 rounded-lg bg-blue-500/10 border border-blue-500/20">
                <p className="text-sm leading-relaxed whitespace-pre-wrap">
                  {defaultMessage}
                </p>
              </div>
            ) : (
              <Textarea
                id="message"
                placeholder="Digite a mensagem que deseja enviar ao paciente..."
                value={customMessage}
                onChange={(e) => setCustomMessage(e.target.value)}
                disabled={sending}
                rows={8}
                className="resize-none"
              />
            )}
            
            <p className="text-xs text-muted-foreground">
              📱 Será enviado via WhatsApp para: {patientPhone || 'Número não cadastrado'}
            </p>
          </div>

          {/* Mensagem de erro */}
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </div>

        {/* Botões de ação */}
        <div className="flex gap-3 justify-end pt-4 border-t">
          <Button
            type="button"
            variant="outline"
            onClick={handleClose}
            disabled={sending}
          >
            Cancelar
          </Button>
          <Button
            type="button"
            onClick={handleSend}
            disabled={sending || (messageType === 'custom' && !customMessage.trim())}
          >
            {sending ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Enviando...
              </>
            ) : (
              <>
                <Send className="w-4 h-4 mr-2" />
                Enviar para {patientName}
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

