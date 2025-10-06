import { Clock } from 'lucide-react';
import { MagicBentoCard } from '@/components/bento/MagicBento';
import { useRealtimeList } from '@/hooks/useRealtimeList';
import { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

interface Appointment {
  scheduled_at: string;
}

export function PeakHoursChartCard() {
  const { data: appointments } = useRealtimeList<Appointment>({ table: 'appointments' });

  const hourStats = useMemo(() => {
    const hourCounts: Record<number, number> = {};

    appointments.forEach((apt) => {
      if (apt.scheduled_at) {
        const date = new Date(apt.scheduled_at);
        const hour = date.getHours();
        hourCounts[hour] = (hourCounts[hour] || 0) + 1;
      }
    });

    // Converter para array e ordenar por horário
    const sorted = Object.entries(hourCounts)
      .map(([hour, count]) => ({
        hour: parseInt(hour),
        count,
        name: `${String(hour).padStart(2, '0')}:00`,
      }))
      .sort((a, b) => a.hour - b.hour);

    return sorted;
  }, [appointments]);

  const COLORS = ['#5227FF', '#8B5CF6', '#A78BFA', '#C4B5FD', '#DDD6FE'];

  return (
    <MagicBentoCard>
      <div className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <Clock className="w-5 h-5 text-primary" />
          <span className="text-lg font-semibold">Horários Mais Procurados</span>
        </div>
        {hourStats.length > 0 ? (
          <ResponsiveContainer width="100%" height={350}>
            <BarChart data={hourStats}>
              <CartesianGrid strokeDasharray="3 3" stroke="#333" opacity={0.1} />
              <XAxis 
                dataKey="name" 
                stroke="#888"
                style={{ fontSize: '12px' }}
              />
              <YAxis 
                stroke="#888"
                style={{ fontSize: '12px' }}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#1a1a1a', 
                  border: '1px solid #333',
                  borderRadius: '8px',
                  color: '#fff'
                }}
                labelStyle={{ color: '#fff' }}
                cursor={{ fill: 'rgba(82, 39, 255, 0.1)' }}
              />
              <Bar dataKey="count" radius={[8, 8, 0, 0]}>
                {hourStats.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="text-sm text-muted-foreground text-center py-8">
            Nenhum dado disponível
          </div>
        )}
      </div>
    </MagicBentoCard>
  );
}
