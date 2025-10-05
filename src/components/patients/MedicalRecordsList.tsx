import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MedicalRecord } from '@/hooks/usePatientData';
import { FileText, Plus, ChevronDown, ChevronUp } from 'lucide-react';
import { format, differenceInMonths } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

interface MedicalRecordsListProps {
  records: MedicalRecord[];
  onAdd?: () => void;
  onView?: (record: MedicalRecord) => void;
}

interface GroupedRecords {
  period: string;
  records: MedicalRecord[];
}

export function MedicalRecordsList({ records, onAdd, onView }: MedicalRecordsListProps) {
  const [expandedRecords, setExpandedRecords] = useState<Set<string>>(new Set());

  // Agrupar prontuários por período
  const groupedRecords = useMemo((): GroupedRecords[] => {
    if (!records.length) return [];

    const now = new Date();
    const groups: Record<string, MedicalRecord[]> = {
      'Último mês': [],
      'Últimos 3 meses': [],
      'Últimos 6 meses': [],
      'Mais de 6 meses': [],
    };

    records.forEach(record => {
      const recordDate = new Date(record.appointment_date);
      const monthsDiff = differenceInMonths(now, recordDate);

      if (monthsDiff === 0) {
        groups['Último mês'].push(record);
      } else if (monthsDiff <= 3) {
        groups['Últimos 3 meses'].push(record);
      } else if (monthsDiff <= 6) {
        groups['Últimos 6 meses'].push(record);
      } else {
        groups['Mais de 6 meses'].push(record);
      }
    });

    return Object.entries(groups)
      .filter(([_, records]) => records.length > 0)
      .map(([period, records]) => ({ period, records }));
  }, [records]);

  const toggleRecordExpanded = (recordId: string) => {
    setExpandedRecords(prev => {
      const newSet = new Set(prev);
      if (newSet.has(recordId)) {
        newSet.delete(recordId);
      } else {
        newSet.add(recordId);
      }
      return newSet;
    });
  };

  if (records.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground mb-4">Nenhum prontuário registrado</p>
          {onAdd && (
            <Button onClick={onAdd}>
              <Plus className="mr-2 h-4 w-4" />
              Novo Prontuário
            </Button>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {onAdd && (
        <div className="flex justify-end">
          <Button onClick={onAdd}>
            <Plus className="mr-2 h-4 w-4" />
            Novo Prontuário
          </Button>
        </div>
      )}

      {groupedRecords.map((group, groupIndex) => (
        <div key={groupIndex} className="space-y-3">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
            {group.period} ({group.records.length})
          </h3>

          <div className="space-y-3">
            {group.records.map((record) => {
              const isExpanded = expandedRecords.has(record.id);
              
              return (
                <Card key={record.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="space-y-3">
                      {/* Cabeçalho com data e médico */}
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4 text-primary shrink-0" />
                          <div>
                            <p className="font-semibold">
                              {format(new Date(record.appointment_date), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {format(new Date(record.appointment_date), 'HH:mm', { locale: ptBR })}
                            </p>
                          </div>
                        </div>
                        
                        {record.doctor && (
                          <Badge variant="secondary" className="text-xs">
                            Dr(a). {record.doctor.name}
                          </Badge>
                        )}
                      </div>

                      {/* Preview da queixa e diagnóstico */}
                      <div className="space-y-2">
                        {record.chief_complaint && (
                          <div className="text-sm">
                            <span className="font-medium text-muted-foreground">Queixa: </span>
                            <span className={isExpanded ? '' : 'line-clamp-2'}>
                              {record.chief_complaint}
                            </span>
                          </div>
                        )}

                        {record.diagnosis && (
                          <div className="text-sm">
                            <span className="font-medium text-muted-foreground">Diagnóstico: </span>
                            <span className={isExpanded ? '' : 'line-clamp-2'}>
                              {record.diagnosis}
                            </span>
                          </div>
                        )}

                        {/* Conteúdo expandido */}
                        {isExpanded && (
                          <div className="space-y-2 pt-2 border-t">
                            {record.history_present_illness && (
                              <div className="text-sm">
                                <span className="font-medium text-muted-foreground">HDA: </span>
                                <span>{record.history_present_illness}</span>
                              </div>
                            )}

                            {record.physical_examination && (
                              <div className="text-sm">
                                <span className="font-medium text-muted-foreground">Exame Físico: </span>
                                <span>{record.physical_examination}</span>
                              </div>
                            )}

                            {record.treatment_plan && (
                              <div className="text-sm">
                                <span className="font-medium text-muted-foreground">Plano: </span>
                                <span>{record.treatment_plan}</span>
                              </div>
                            )}

                            {record.prescriptions && (
                              <div className="text-sm">
                                <span className="font-medium text-muted-foreground">Prescrições: </span>
                                <span>{record.prescriptions}</span>
                              </div>
                            )}

                            {record.notes && (
                              <div className="text-sm">
                                <span className="font-medium text-muted-foreground">Observações: </span>
                                <span>{record.notes}</span>
                              </div>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Botões de ação */}
                      <div className="flex items-center gap-2 pt-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleRecordExpanded(record.id)}
                        >
                          {isExpanded ? (
                            <>
                              <ChevronUp className="h-4 w-4 mr-1" />
                              Recolher
                            </>
                          ) : (
                            <>
                              <ChevronDown className="h-4 w-4 mr-1" />
                              Ver Mais
                            </>
                          )}
                        </Button>

                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onView?.(record)}
                        >
                          Abrir Completo
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
