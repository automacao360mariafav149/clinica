import { Clock } from 'lucide-react';
import { MagicBentoCard } from '@/components/bento/MagicBento';
import { useRealtimeList } from '@/hooks/useRealtimeList';
import { useMemo } from 'react';

interface Appointment {
  scheduled_at: string;
}

export function PeakHoursCard() {
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

    // Converter para array e ordenar por contagem
    const sorted = Object.entries(hourCounts)
      .map(([hour, count]) => ({
        hour: parseInt(hour),
        count,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // Calcular percentual em relação ao horário mais procurado
    const maxCount = sorted[0]?.count || 1;
    return sorted.map((item) => ({
      ...item,
      percentage: Math.round((item.count / maxCount) * 100),
      timeRange: `${String(item.hour).padStart(2, '0')}:00 - ${String(item.hour + 1).padStart(2, '0')}:00`,
    }));
  }, [appointments]);

  return (
    <MagicBentoCard>
      <div className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <Clock className="w-5 h-5 text-primary" />
          <span className="text-lg font-semibold">Horários Mais Procurados</span>
        </div>
        <div className="space-y-3">
          {hourStats.length > 0 ? (
            hourStats.map((stat, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm text-foreground">{stat.timeRange}</span>
                    <span className="text-sm text-muted-foreground">
                      {stat.count} consultas
                    </span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-primary to-accent rounded-full transition-all duration-300"
                      style={{ width: `${stat.percentage}%` }}
                    />
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="text-sm text-muted-foreground text-center py-4">
              Nenhum dado disponível
            </div>
          )}
        </div>
      </div>
    </MagicBentoCard>
  );
}
