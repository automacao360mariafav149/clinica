import { Card, CardContent } from '@/components/ui/card';
import { 
  Stethoscope, 
  Calendar, 
  Clipboard, 
  AlertCircle 
} from 'lucide-react';
import { MedicalRecord, ClinicalData, ExamHistory, Anamnesis } from '@/hooks/usePatientData';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface PatientStatsCardsProps {
  medicalRecords: MedicalRecord[];
  clinicalData: ClinicalData[];
  examHistory: ExamHistory[];
  anamnesis: Anamnesis[];
}

export function PatientStatsCards({
  medicalRecords,
  clinicalData,
  examHistory,
  anamnesis,
}: PatientStatsCardsProps) {
  
  // Calcular última consulta
  const lastConsultation = medicalRecords.length > 0 
    ? medicalRecords[0]
    : null;

  const daysSinceLastConsultation = lastConsultation
    ? formatDistanceToNow(new Date(lastConsultation.appointment_date), {
        addSuffix: true,
        locale: ptBR,
      })
    : 'Nunca';

  // Calcular pendências (exemplo: dados clínicos desatualizados, exames sem resultado)
  const pendingItems = (() => {
    let count = 0;
    const items: string[] = [];
    
    // Dados clínicos desatualizados (> 6 meses)
    const lastClinicalData = clinicalData[0];
    if (!lastClinicalData || 
        new Date().getTime() - new Date(lastClinicalData.measurement_date).getTime() > 180 * 24 * 60 * 60 * 1000) {
      count++;
      items.push('Dados Clínicos');
    }

    // Anamnese vazia ou desatualizada
    if (anamnesis.length === 0) {
      count++;
      items.push('Anamnese');
    }

    return { count, items };
  })();

  const stats = [
    {
      label: 'Total de Consultas',
      value: medicalRecords.length,
      icon: Stethoscope,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
    },
    {
      label: 'Última Consulta',
      value: lastConsultation 
        ? new Date(lastConsultation.appointment_date).toLocaleDateString('pt-BR')
        : 'N/A',
      subtitle: daysSinceLastConsultation,
      icon: Calendar,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
    },
    {
      label: 'Exames Realizados',
      value: examHistory.length,
      icon: Clipboard,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
    },
    {
      label: 'Pendências',
      value: pendingItems.count,
      icon: AlertCircle,
      color: pendingItems.count > 0 ? 'text-orange-600' : 'text-gray-600',
      bgColor: pendingItems.count > 0 ? 'bg-orange-50' : 'bg-gray-50',
      details: pendingItems.items,
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {stats.map((stat, index) => {
        const Icon = stat.icon;
        return (
          <Card key={index} className="hover:shadow-md transition-shadow">
            <CardContent className="pt-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p className="text-sm font-medium text-muted-foreground">
                    {stat.label}
                  </p>
                  <p className="text-2xl font-bold mt-2">
                    {stat.value}
                  </p>
                  {stat.subtitle && (
                    <p className="text-xs text-muted-foreground mt-1">
                      {stat.subtitle}
                    </p>
                  )}
                  {stat.details && stat.details.length > 0 && (
                    <div className="mt-2 space-y-1">
                      {stat.details.map((detail, idx) => (
                        <div key={idx} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                          <div className="w-1 h-1 rounded-full bg-orange-500" />
                          <span>{detail}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <div className={`${stat.bgColor} ${stat.color} p-3 rounded-lg`}>
                  <Icon className="h-6 w-6" />
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
