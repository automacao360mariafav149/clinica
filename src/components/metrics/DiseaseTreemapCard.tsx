import { Heart } from 'lucide-react';
import { MagicBentoCard } from '@/components/bento/MagicBento';
import { useRealtimeList } from '@/hooks/useRealtimeList';
import { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, Legend } from 'recharts';

interface Appointment {
  reason: string | null;
}

interface AgentConsultation {
  cid_code: string | null;
  cid_description: string | null;
}

export function DiseaseTreemapCard() {
  const { data: appointments } = useRealtimeList<Appointment>({ table: 'appointments' });
  const { data: agentConsultations } = useRealtimeList<AgentConsultation>({
    table: 'agent_consultations',
  });

  const diseaseStats = useMemo(() => {
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

    return Object.entries(diseaseCounts)
      .map(([name, data]) => ({
        name: name.length > 40 ? name.substring(0, 37) + '...' : name,
        fullName: name,
        value: data.count,
        type: data.type,
      }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 12);
  }, [appointments, agentConsultations]);

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-[#1a1a1a] border border-[#333] rounded-lg p-3 shadow-lg">
          <p className="text-white text-sm font-medium mb-1">{payload[0].payload.fullName}</p>
          <p className="text-primary text-xs">
            <span className="font-semibold">{payload[0].value}</span> ocorrência(s)
          </p>
          <p className="text-muted-foreground text-xs mt-1">
            {payload[0].payload.type === 'cid' ? '📋 Diagnóstico CID' : '🩺 Motivo Consulta'}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <MagicBentoCard>
      <div className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <Heart className="w-5 h-5 text-primary" />
          <span className="text-lg font-semibold">Top Diagnósticos e Motivos de Consulta</span>
        </div>
        {diseaseStats.length > 0 ? (
          <ResponsiveContainer width="100%" height={450}>
            <BarChart 
              data={diseaseStats}
              layout="vertical"
              margin={{ top: 5, right: 30, left: 150, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#333" opacity={0.1} />
              <XAxis 
                type="number"
                stroke="#888"
                style={{ fontSize: '12px' }}
              />
              <YAxis 
                type="category"
                dataKey="name" 
                stroke="#888"
                style={{ fontSize: '11px' }}
                width={140}
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="value" radius={[0, 8, 8, 0]}>
                {diseaseStats.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={entry.type === 'cid' ? '#3B82F6' : '#10B981'} 
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="text-sm text-muted-foreground text-center py-8">
            Nenhum dado disponível
          </div>
        )}
        {diseaseStats.length > 0 && (
          <div className="flex gap-4 justify-center pt-4 mt-4 border-t border-border text-xs">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-sm bg-blue-500" />
              <span className="text-muted-foreground">Diagnóstico CID</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-sm bg-green-500" />
              <span className="text-muted-foreground">Motivo Consulta</span>
            </div>
          </div>
        )}
      </div>
    </MagicBentoCard>
  );
}
