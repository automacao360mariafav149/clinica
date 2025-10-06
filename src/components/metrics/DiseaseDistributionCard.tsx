import { FileText, Heart } from 'lucide-react';
import { MagicBentoCard } from '@/components/bento/MagicBento';
import { useRealtimeList } from '@/hooks/useRealtimeList';
import { useMemo } from 'react';

interface Appointment {
  reason: string | null;
}

interface AgentConsultation {
  cid_code: string | null;
  cid_description: string | null;
}

export function DiseaseDistributionCard() {
  const { data: appointments } = useRealtimeList<Appointment>({ table: 'appointments' });
  const { data: agentConsultations } = useRealtimeList<AgentConsultation>({
    table: 'agent_consultations',
  });

  const diseaseStats = useMemo(() => {
    // Combinar dados de CID e motivos de consulta
    const diseaseCounts: Record<string, { count: number; type: 'cid' | 'reason' }> = {};

    // Adicionar CIDs das consultas de agente
    agentConsultations.forEach((consultation) => {
      if (consultation.cid_code && consultation.cid_description) {
        const key = `${consultation.cid_code} - ${consultation.cid_description}`;
        if (!diseaseCounts[key]) {
          diseaseCounts[key] = { count: 0, type: 'cid' };
        }
        diseaseCounts[key].count++;
      }
    });

    // Adicionar motivos de consulta dos appointments
    appointments.forEach((apt) => {
      if (apt.reason) {
        if (!diseaseCounts[apt.reason]) {
          diseaseCounts[apt.reason] = { count: 0, type: 'reason' };
        }
        diseaseCounts[apt.reason].count++;
      }
    });

    const total = Object.values(diseaseCounts).reduce((sum, item) => sum + item.count, 0) || 1;

    return Object.entries(diseaseCounts)
      .map(([name, data]) => ({
        name,
        count: data.count,
        type: data.type,
        percentage: Math.round((data.count / total) * 100),
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8);
  }, [appointments, agentConsultations]);

  return (
    <MagicBentoCard>
      <div className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <Heart className="w-5 h-5 text-primary" />
          <span className="text-lg font-semibold">Distribuição por Diagnóstico/Motivo</span>
        </div>
        <div className="space-y-3 max-h-[400px] overflow-y-auto">
          {diseaseStats.length > 0 ? (
            diseaseStats.map((disease, index) => (
              <div key={`${disease.name}-${index}`} className="space-y-1">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-start gap-2 flex-1">
                    <div
                      className={`mt-1 w-2 h-2 rounded-full flex-shrink-0 ${
                        disease.type === 'cid' ? 'bg-blue-500' : 'bg-green-500'
                      }`}
                    />
                    <span className="text-xs text-foreground line-clamp-2">{disease.name}</span>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className="text-xs text-muted-foreground">{disease.count}</span>
                    <span className="text-xs font-semibold text-primary min-w-[35px] text-right">
                      {disease.percentage}%
                    </span>
                  </div>
                </div>
                <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-300 ${
                      disease.type === 'cid'
                        ? 'bg-gradient-to-r from-blue-500 to-blue-600'
                        : 'bg-gradient-to-r from-green-500 to-green-600'
                    }`}
                    style={{ width: `${disease.percentage}%` }}
                  />
                </div>
              </div>
            ))
          ) : (
            <div className="text-sm text-muted-foreground text-center py-4">
              Nenhum dado disponível
            </div>
          )}
          {diseaseStats.length > 0 && (
            <div className="flex gap-4 pt-3 mt-3 border-t border-border text-xs">
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-blue-500" />
                <span className="text-muted-foreground">Diagnóstico CID</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-green-500" />
                <span className="text-muted-foreground">Motivo Consulta</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </MagicBentoCard>
  );
}
