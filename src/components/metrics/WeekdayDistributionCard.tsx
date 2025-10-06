import { CalendarDays } from 'lucide-react';
import { MagicBentoCard } from '@/components/bento/MagicBento';
import { useRealtimeList } from '@/hooks/useRealtimeList';
import { useMemo } from 'react';

interface Appointment {
  scheduled_at: string;
}

const weekDayNames = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

export function WeekdayDistributionCard() {
  const { data: appointments } = useRealtimeList<Appointment>({ table: 'appointments' });

  const weekdayStats = useMemo(() => {
    const dayCounts: Record<number, number> = {
      0: 0,
      1: 0,
      2: 0,
      3: 0,
      4: 0,
      5: 0,
      6: 0,
    };

    appointments.forEach((apt) => {
      if (apt.scheduled_at) {
        const date = new Date(apt.scheduled_at);
        const dayOfWeek = date.getDay();
        dayCounts[dayOfWeek]++;
      }
    });

    const maxCount = Math.max(...Object.values(dayCounts), 1);

    return Object.entries(dayCounts).map(([day, count]) => ({
      day: parseInt(day),
      dayName: weekDayNames[parseInt(day)],
      count,
      percentage: Math.round((count / maxCount) * 100),
    }));
  }, [appointments]);

  return (
    <MagicBentoCard>
      <div className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <CalendarDays className="w-5 h-5 text-primary" />
          <span className="text-lg font-semibold">Agendamentos por Dia da Semana</span>
        </div>
        <div className="space-y-3">
          {weekdayStats.map((stat) => (
            <div key={stat.day} className="flex items-center gap-3">
              <div className="w-12 text-sm font-medium text-foreground">{stat.dayName}</div>
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <div className="h-2 bg-muted rounded-full overflow-hidden flex-1">
                    <div
                      className="h-full bg-gradient-to-r from-primary to-accent rounded-full transition-all duration-300"
                      style={{ width: `${stat.percentage}%` }}
                    />
                  </div>
                  <span className="text-sm text-muted-foreground ml-3 min-w-[60px] text-right">
                    {stat.count} consultas
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </MagicBentoCard>
  );
}
