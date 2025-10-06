import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MagicBentoGrid, MagicBentoCard } from '@/components/bento/MagicBento';
import { Users, Calendar, TrendingUp, Clock, Activity, Stethoscope } from 'lucide-react';
import { useRealtimeList } from '@/hooks/useRealtimeList';
import { PeakHoursChartCard } from '@/components/metrics/PeakHoursChartCard';
import { WeekdayChartCard } from '@/components/metrics/WeekdayChartCard';
import { DoctorPieChartCard } from '@/components/metrics/DoctorPieChartCard';
import { InsuranceDonutCard } from '@/components/metrics/InsuranceDonutCard';
import { DiseaseTreemapCard } from '@/components/metrics/DiseaseTreemapCard';

export default function Dashboard() {
  const today = new Date();
  const todayISO = today.toISOString().slice(0, 10); // YYYY-MM-DD

  // Listas mínimas só para obter contagens reativas
  const { data: appointments } = useRealtimeList<any>({ table: 'appointments' });
  const { data: patients } = useRealtimeList<any>({ table: 'patients' });

  const stats = [
    {
      title: 'Consultas Hoje',
      value: String(
        appointments.filter((a) => (a.scheduled_at ?? '').slice(0, 10) === todayISO).length,
      ),
      icon: Calendar,
      trend: '+0%'
    },
    { title: 'Pacientes Ativos', value: String(patients.length), icon: Users, trend: '+0%' },
    { title: 'Taxa de Ocupação', value: '—', icon: TrendingUp, trend: '+0%' },
    { title: 'Tempo Médio', value: '—', icon: Clock, trend: '0%' },
  ];

  return (
    <DashboardLayout requiredRoles={['owner']}>
      <div className="p-8 space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-foreground">Métricas de Atendimento</h1>
          <p className="text-muted-foreground mt-1">Visão geral do desempenho da clínica</p>
        </div>

        {/* Stats Grid - Magic Bento */}
        <MagicBentoGrid>
          {stats.map((stat, index) => (
            <MagicBentoCard key={index} accent={index % 2 === 0 ? 'primary' : 'accent'}>
              <div className="flex items-start justify-between pb-2">
                <div className="text-sm font-medium text-muted-foreground">{stat.title}</div>
                <stat.icon className="w-4 h-4 text-primary" />
              </div>
              <div className="text-3xl font-bold text-foreground">{stat.value}</div>
              <p className="text-xs text-muted-foreground mt-1">
                <span className={String(stat.trend).startsWith('+') ? 'text-green-500' : 'text-red-500'}>
                  {stat.trend}
                </span>{' '}
                vs. mês passado
              </p>
            </MagicBentoCard>
          ))}
        </MagicBentoGrid>

        {/* Charts Grid - Linha 1: Gráficos de Tempo */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <PeakHoursChartCard />
          <WeekdayChartCard />
        </div>

        {/* Charts Grid - Linha 2: Gráficos de Pizza */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <DoctorPieChartCard />
          <InsuranceDonutCard />
        </div>

        {/* Charts Grid - Linha 3: Gráfico de Diagnósticos */}
        <div className="grid grid-cols-1 gap-6">
          <DiseaseTreemapCard />
        </div>
      </div>
    </DashboardLayout>
  );
}
