import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { MedicalRecord } from '@/hooks/usePatientData';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { 
  FileText, 
  Calendar, 
  User, 
  Printer,
  X
} from 'lucide-react';

interface MedicalRecordViewModalProps {
  record: MedicalRecord | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  patientName?: string;
}

export function MedicalRecordViewModal({
  record,
  open,
  onOpenChange,
  patientName,
}: MedicalRecordViewModalProps) {
  
  if (!record) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] p-0">
        <DialogHeader className="px-6 pt-6 pb-4 border-b">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <DialogTitle className="text-2xl flex items-center gap-2">
                <FileText className="h-6 w-6" />
                Prontuário Médico
              </DialogTitle>
              <DialogDescription className="mt-2">
                {patientName && `Paciente: ${patientName}`}
              </DialogDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handlePrint}
              >
                <Printer className="h-4 w-4 mr-2" />
                Imprimir
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onOpenChange(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </DialogHeader>

        <ScrollArea className="h-[calc(90vh-120px)]">
          <div className="p-6 space-y-6">
            {/* Informações da Consulta */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Informações da Consulta</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-xs text-muted-foreground">Data da Consulta</p>
                      <p className="font-medium">
                        {format(new Date(record.appointment_date), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {format(new Date(record.appointment_date), 'HH:mm', { locale: ptBR })}
                      </p>
                    </div>
                  </div>

                  {record.doctor && (
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-xs text-muted-foreground">Médico Responsável</p>
                        <p className="font-medium">Dr(a). {record.doctor.name}</p>
                        {record.doctor.specialization && (
                          <Badge variant="secondary" className="mt-1">
                            {record.doctor.specialization}
                          </Badge>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Queixa Principal */}
            {record.chief_complaint && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Queixa Principal</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm whitespace-pre-wrap">{record.chief_complaint}</p>
                </CardContent>
              </Card>
            )}

            {/* História da Doença Atual */}
            {record.history_present_illness && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">História da Doença Atual (HDA)</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm whitespace-pre-wrap">{record.history_present_illness}</p>
                </CardContent>
              </Card>
            )}

            {/* Exame Físico */}
            {record.physical_examination && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Exame Físico</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm whitespace-pre-wrap">{record.physical_examination}</p>
                </CardContent>
              </Card>
            )}

            {/* Diagnóstico */}
            {record.diagnosis && (
              <Card className="border-blue-200 bg-blue-50/50">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base text-blue-900">Diagnóstico</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm whitespace-pre-wrap text-blue-900">{record.diagnosis}</p>
                </CardContent>
              </Card>
            )}

            {/* Plano de Tratamento */}
            {record.treatment_plan && (
              <Card className="border-green-200 bg-green-50/50">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base text-green-900">Plano de Tratamento</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm whitespace-pre-wrap text-green-900">{record.treatment_plan}</p>
                </CardContent>
              </Card>
            )}

            {/* Prescrições */}
            {record.prescriptions && (
              <Card className="border-purple-200 bg-purple-50/50">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base text-purple-900">Prescrições Médicas</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm whitespace-pre-wrap text-purple-900">{record.prescriptions}</p>
                </CardContent>
              </Card>
            )}

            {/* Observações */}
            {record.notes && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Observações Adicionais</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm whitespace-pre-wrap text-muted-foreground">{record.notes}</p>
                </CardContent>
              </Card>
            )}

            {/* Rodapé com data de criação */}
            <div className="text-center pt-4 border-t">
              <p className="text-xs text-muted-foreground">
                Prontuário criado em {format(new Date(record.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
              </p>
              {record.updated_at && record.updated_at !== record.created_at && (
                <p className="text-xs text-muted-foreground">
                  Última atualização em {format(new Date(record.updated_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                </p>
              )}
            </div>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
