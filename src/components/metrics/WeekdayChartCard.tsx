import { CalendarDays } from 'lucide-react';
import { MagicBentoCard } from '@/components/bento/MagicBento';
import { useRealtimeList } from '@/hooks/useRealtimeList';
import { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

interface Appointment {
  scheduled_at: string;
}

const weekDayNames = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

export function WeekdayChartCard() {
  const { data: appointments } = useRealtimeList<Appointment>({ table: 'appointments' });

  const weekdayStats = useMemo(() => {
    const dayCounts: Record<number, number> = {
      0: 0, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0,
    };

    appointments.forEach((apt) => {
      if (apt.scheduled_at) {
        const date = new Date(apt.scheduled_at);
        const dayOfWeek = date.getDay();
        dayCounts[dayOfWeek]++;
      }
    });

    return Object.entries(dayCounts).map(([day, count]) => ({
      day: parseInt(day),
      name: weekDayNames[parseInt(day)],
      count,
    }));
  }, [appointments]);

  const COLORS = ['#EF4444', '#F59E0B', '#10B981', '#3B82F6', '#8B5CF6', '#EC4899', '#F97316'];

  return (
    <MagicBentoCard>
      <div className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <CalendarDays className="w-5 h-5 text-primary" />
          <span className="text-lg font-semibold">Agendamentos por Dia da Semana</span>
        </div>
        {weekdayStats.some(s => s.count > 0) ? (
          <ResponsiveContainer width="100%" height={350}>
            <BarChart data={weekdayStats}>
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
                {weekdayStats.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index]} />
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
