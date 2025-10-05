import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { 
  AlertTriangle, 
  Pill, 
  Heart, 
  Info 
} from 'lucide-react';
import { Patient, Anamnesis } from '@/hooks/usePatientData';

interface PatientAlertsProps {
  patient: Patient;
  anamnesis: Anamnesis[];
}

export function PatientAlerts({ patient, anamnesis }: PatientAlertsProps) {
  // Buscar a anamnese mais recente para alergias e medicamentos
  const latestAnamnesis = anamnesis[0];

  const alerts = [];

  // Alergias
  if (latestAnamnesis?.allergies && latestAnamnesis.allergies.trim() !== '') {
    alerts.push({
      type: 'destructive' as const,
      icon: AlertTriangle,
      title: 'Alergias',
      description: latestAnamnesis.allergies,
    });
  }

  // Medicamentos em uso
  if (latestAnamnesis?.current_medications && latestAnamnesis.current_medications.trim() !== '') {
    alerts.push({
      type: 'default' as const,
      icon: Pill,
      title: 'Medicamentos em Uso',
      description: latestAnamnesis.current_medications,
      className: 'border-blue-500/50 bg-blue-50/50',
    });
  }

  // Histórico familiar
  if (latestAnamnesis?.family_history && latestAnamnesis.family_history.trim() !== '') {
    alerts.push({
      type: 'default' as const,
      icon: Heart,
      title: 'Histórico Familiar',
      description: latestAnamnesis.family_history,
      className: 'border-yellow-500/50 bg-yellow-50/50',
    });
  }

  // Observações importantes do paciente
  if (patient.notes && patient.notes.trim() !== '') {
    alerts.push({
      type: 'default' as const,
      icon: Info,
      title: 'Observações Importantes',
      description: patient.notes,
      className: 'border-orange-500/50 bg-orange-50/50',
    });
  }

  if (alerts.length === 0) {
    return null;
  }

  return (
    <div className="space-y-3 mb-6">
      {alerts.map((alert, index) => {
        const Icon = alert.icon;
        return (
          <Alert 
            key={index} 
            variant={alert.type}
            className={alert.className}
          >
            <Icon className="h-4 w-4" />
            <AlertTitle>{alert.title}</AlertTitle>
            <AlertDescription className="mt-2 text-sm">
              {alert.description}
            </AlertDescription>
          </Alert>
        );
      })}
    </div>
  );
}
