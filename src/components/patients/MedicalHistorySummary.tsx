import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MedicalRecord } from '@/hooks/usePatientData';
import { 
  FileText, 
  Pill, 
  TrendingUp, 
  Calendar,
  AlertCircle,
  Activity
} from 'lucide-react';

interface MedicalHistorySummaryProps {
  records: MedicalRecord[];
}

export function MedicalHistorySummary({ records }: MedicalHistorySummaryProps) {
  const summary = useMemo(() => {
    if (records.length === 0) return null;

    // Extrair todas as prescrições
    const allPrescriptions = records
      .filter(r => r.prescriptions && r.prescriptions.trim() !== '')
      .map(r => ({
        date: r.appointment_date,
        prescriptions: r.prescriptions,
        diagnosis: r.diagnosis,
        doctor: r.doctor?.name,
      }));

    // Extrair diagnósticos
    const allDiagnoses = records
      .filter(r => r.diagnosis && r.diagnosis.trim() !== '')
      .map(r => r.diagnosis!.toLowerCase());

    // Contar diagnósticos mais comuns (palavras-chave)
    const diagnosisKeywords: Record<string, number> = {};
    allDiagnoses.forEach(diagnosis => {
      // Dividir em palavras e contar as mais relevantes (> 4 caracteres)
      const words = diagnosis
        .split(/[\s,;.]+/)
        .filter(word => word.length > 4)
        .filter(word => !['muito', 'pouco', 'sempre', 'nunca', 'sendo'].includes(word));
      
      words.forEach(word => {
        diagnosisKeywords[word] = (diagnosisKeywords[word] || 0) + 1;
      });
    });

    // Top 5 diagnósticos mais comuns
    const topDiagnoses = Object.entries(diagnosisKeywords)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([word, count]) => ({ word, count }));

    // Medicamentos mais prescritos (análise simples por palavras)
    const medicationKeywords: Record<string, number> = {};
    allPrescriptions.forEach(({ prescriptions }) => {
      // Tentar identificar nomes de medicamentos (palavras em maiúsculas ou começando com maiúscula)
      const words = prescriptions!
        .split(/[\s,;.\n]+/)
        .filter(word => word.length > 3)
        .filter(word => /^[A-ZÁÉÍÓÚÀÂÊÔ]/.test(word)); // Começa com maiúscula
      
      words.forEach(word => {
        const normalized = word.toLowerCase();
        medicationKeywords[normalized] = (medicationKeywords[normalized] || 0) + 1;
      });
    });

    // Top 5 medicamentos
    const topMedications = Object.entries(medicationKeywords)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([word, count]) => ({ word, count }));

    // Última prescrição
    const lastPrescription = allPrescriptions[0];

    // Tempo médio entre consultas
    const consultationIntervals: number[] = [];
    for (let i = 1; i < records.length; i++) {
      const diff = new Date(records[i - 1].appointment_date).getTime() - 
                   new Date(records[i].appointment_date).getTime();
      consultationIntervals.push(diff);
    }
    const avgInterval = consultationIntervals.length > 0
      ? consultationIntervals.reduce((a, b) => a + b, 0) / consultationIntervals.length
      : 0;
    const avgDays = Math.round(avgInterval / (1000 * 60 * 60 * 24));

    return {
      totalConsultations: records.length,
      totalWithPrescriptions: allPrescriptions.length,
      topDiagnoses,
      topMedications,
      lastPrescription,
      avgDays,
    };
  }, [records]);

  if (!summary || records.length === 0) {
    return null;
  }

  return (
    <Card className="mb-6 border-primary/20 bg-primary/5">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-5 w-5 text-primary" />
          Resumo do Histórico de Atendimento
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Estatísticas Gerais */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center p-4 bg-card rounded-lg border shadow-sm">
            <FileText className="h-6 w-6 mx-auto mb-2 text-primary" />
            <p className="text-2xl font-bold text-foreground">{summary.totalConsultations}</p>
            <p className="text-xs text-muted-foreground">Total de Consultas</p>
          </div>

          <div className="text-center p-4 bg-card rounded-lg border shadow-sm">
            <Pill className="h-6 w-6 mx-auto mb-2 text-primary" />
            <p className="text-2xl font-bold text-foreground">{summary.totalWithPrescriptions}</p>
            <p className="text-xs text-muted-foreground">Com Prescrições</p>
          </div>

          <div className="text-center p-4 bg-card rounded-lg border shadow-sm">
            <Calendar className="h-6 w-6 mx-auto mb-2 text-primary" />
            <p className="text-2xl font-bold text-foreground">{summary.avgDays}</p>
            <p className="text-xs text-muted-foreground">Dias entre consultas</p>
          </div>

          <div className="text-center p-4 bg-card rounded-lg border shadow-sm">
            <TrendingUp className="h-6 w-6 mx-auto mb-2 text-primary" />
            <p className="text-2xl font-bold text-foreground">{summary.topMedications.length}</p>
            <p className="text-xs text-muted-foreground">Medicamentos distintos</p>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Diagnósticos Mais Comuns */}
          {summary.topDiagnoses.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-primary" />
                <h4 className="font-semibold text-sm">Diagnósticos Recorrentes</h4>
              </div>
              <div className="space-y-2">
                {summary.topDiagnoses.map((item, index) => (
                  <div 
                    key={index} 
                    className="flex items-center justify-between p-2 bg-card rounded-lg border"
                  >
                    <span className="text-sm capitalize">{item.word}</span>
                    <Badge variant="secondary" className="text-xs">
                      {item.count}x
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Medicamentos Mais Prescritos */}
          {summary.topMedications.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Pill className="h-4 w-4 text-primary" />
                <h4 className="font-semibold text-sm">Medicamentos Frequentes</h4>
              </div>
              <div className="space-y-2">
                {summary.topMedications.map((item, index) => (
                  <div 
                    key={index} 
                    className="flex items-center justify-between p-2 bg-card rounded-lg border"
                  >
                    <span className="text-sm capitalize">{item.word}</span>
                    <Badge variant="secondary" className="text-xs">
                      {item.count}x
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Última Prescrição */}
        {summary.lastPrescription && (
          <div className="p-4 bg-card rounded-lg border border-primary/20">
            <div className="flex items-center gap-2 mb-2">
              <Pill className="h-4 w-4 text-primary" />
              <h4 className="font-semibold text-sm">Última Prescrição</h4>
              <Badge variant="outline" className="text-xs ml-auto">
                {new Date(summary.lastPrescription.date).toLocaleDateString('pt-BR')}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground line-clamp-3">
              {summary.lastPrescription.prescriptions}
            </p>
            {summary.lastPrescription.doctor && (
              <p className="text-xs text-muted-foreground mt-2">
                Dr(a). {summary.lastPrescription.doctor}
              </p>
            )}
          </div>
        )}

        {/* Nota informativa */}
        <div className="text-xs text-muted-foreground text-center italic pt-2 border-t">
          * Análise automática baseada em {summary.totalConsultations} consulta(s) registrada(s)
        </div>
      </CardContent>
    </Card>
  );
}
