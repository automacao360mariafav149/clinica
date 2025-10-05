import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { PatientAvatarUpload } from './PatientAvatarUpload';
import { PatientStatsCards } from './PatientStatsCards';
import { PatientAlerts } from './PatientAlerts';
import { ClinicalEvolutionChart } from './ClinicalEvolutionChart';
import { Patient, MedicalRecord, ClinicalData, ExamHistory, Anamnesis } from '@/hooks/usePatientData';
import { 
  Mail, 
  Phone, 
  Calendar, 
  MapPin, 
  Hash,
  User,
  Clock
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface PatientOverviewProps {
  patient: Patient;
  doctors: any[];
  medicalRecords: MedicalRecord[];
  clinicalData: ClinicalData[];
  examHistory: ExamHistory[];
  anamnesis: Anamnesis[];
  onAvatarUpdate?: (url: string) => void;
}

export function PatientOverview({ 
  patient, 
  doctors, 
  medicalRecords,
  clinicalData,
  examHistory,
  anamnesis,
  onAvatarUpdate 
}: PatientOverviewProps) {
  const formatDate = (date?: string) => {
    if (!date) return '-';
    try {
      return format(new Date(date), 'dd/MM/yyyy', { locale: ptBR });
    } catch {
      return '-';
    }
  };

  const calculateAge = (birthDate?: string) => {
    if (!birthDate) return null;
    try {
      const today = new Date();
      const birth = new Date(birthDate);
      let age = today.getFullYear() - birth.getFullYear();
      const monthDiff = today.getMonth() - birth.getMonth();
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
        age--;
      }
      return age;
    } catch {
      return null;
    }
  };

  const age = calculateAge(patient.birth_date);

  return (
    <div className="space-y-6">
      {/* Cards de Estatísticas */}
      <PatientStatsCards
        medicalRecords={medicalRecords}
        clinicalData={clinicalData}
        examHistory={examHistory}
        anamnesis={anamnesis}
      />

      {/* Alertas Importantes */}
      <PatientAlerts
        patient={patient}
        anamnesis={anamnesis}
      />
      {/* Cabeçalho com Avatar e Informações Básicas */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-6">
            <div className="flex justify-center md:justify-start">
              <PatientAvatarUpload
                patientId={patient.id}
                avatarUrl={patient.avatar_url}
                patientName={patient.name}
                onUploadSuccess={onAvatarUpdate}
                size="lg"
              />
            </div>

            <div className="flex-1 space-y-4">
              <div>
                <h2 className="text-2xl font-bold text-foreground">{patient.name}</h2>
                {age && (
                  <p className="text-muted-foreground">
                    {age} anos {patient.gender && `• ${patient.gender}`}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {patient.email && (
                  <div className="flex items-center gap-2 text-sm">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <span className="truncate">{patient.email}</span>
                  </div>
                )}

                {patient.phone && (
                  <div className="flex items-center gap-2 text-sm">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span>{patient.phone}</span>
                  </div>
                )}

                {patient.cpf && (
                  <div className="flex items-center gap-2 text-sm">
                    <Hash className="h-4 w-4 text-muted-foreground" />
                    <span>CPF: {patient.cpf}</span>
                  </div>
                )}

                {patient.birth_date && (
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span>Nasc.: {formatDate(patient.birth_date)}</span>
                  </div>
                )}
              </div>

              {/* Endereço */}
              {(patient.address || patient.city || patient.state) && (
                <div className="flex items-start gap-2 text-sm">
                  <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                  <span className="text-muted-foreground">
                    {[patient.address, patient.city, patient.state]
                      .filter(Boolean)
                      .join(', ')}
                  </span>
                </div>
              )}

              {/* Próxima Consulta */}
              {patient.next_appointment_date && (
                <div className="flex items-center gap-2 p-3 bg-primary/5 border border-primary/20 rounded-lg">
                  <Clock className="h-5 w-5 text-primary" />
                  <div>
                    <p className="text-sm font-medium">Próxima Consulta</p>
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(patient.next_appointment_date), "dd/MM/yyyy 'às' HH:mm", {
                        locale: ptBR,
                      })}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Médicos Responsáveis */}
      {doctors.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <User className="h-5 w-5" />
              Médicos Responsáveis
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {doctors.map((pd: any) => (
                <Badge key={pd.id} variant="secondary" className="py-1.5 px-3">
                  {pd.doctor?.name}
                  {pd.doctor?.specialization && (
                    <span className="ml-1 text-xs text-muted-foreground">
                      ({pd.doctor.specialization})
                    </span>
                  )}
                  {pd.is_primary && (
                    <span className="ml-1 text-xs">⭐</span>
                  )}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Gráficos de Evolução Clínica */}
      {clinicalData.length > 0 && (
        <ClinicalEvolutionChart clinicalData={clinicalData} />
      )}
    </div>
  );
}
