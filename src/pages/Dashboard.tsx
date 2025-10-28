import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MagicBentoGrid, MagicBentoCard } from '@/components/bento/MagicBento';
import { Users, Calendar, Activity, Stethoscope } from 'lucide-react';
import { useDashboardMetrics } from '@/hooks/useDashboardMetrics';
import { PeakHoursChartCard } from '@/components/metrics/PeakHoursChartCard';
import { WeekdayChartCard } from '@/components/metrics/WeekdayChartCard';
import { DoctorPieChartCard } from '@/components/metrics/DoctorPieChartCard';
import { InsuranceDonutCard } from '@/components/metrics/InsuranceDonutCard';
import { DiseaseTreemapCard } from '@/components/metrics/DiseaseTreemapCard';

export default function Dashboard() {
  const metrics = useDashboardMetrics();

  const stats = [
    {
      title: 'Consultas Hoje',
      value: String(metrics.consultasHoje),
      icon: Calendar,
      trend: metrics.calculateTrend(metrics.consultasMesAtual, metrics.consultasMesAnterior),
      description: 'vs. mês passado'
    },
    {
      title: 'Pacientes CRM',
      value: String(metrics.pacientesCRM),
      icon: Users,
      trend: metrics.calculateTrend(metrics.pacientesCRMMesAtual, metrics.pacientesCRMMesAnterior),
      description: 'novos este mês'
    },
    {
      title: 'Pré Pacientes',
      value: String(metrics.prePatientes),
      icon: Activity,
      trend: '—',
      description: 'aguardando conversão'
    },
    {
      title: 'Equipe Médica',
      value: String(metrics.totalMedicos),
      icon: Stethoscope,
      trend: metrics.totalSecretarias > 0 ? `+${metrics.totalSecretarias} sec.` : '—',
      description: 'médicos ativos'
    },
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
              <div className="text-3xl font-bold text-foreground">
                {metrics.loading ? '...' : stat.value}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                <span className={String(stat.trend).startsWith('+') ? 'text-green-500' : String(stat.trend).startsWith('-') ? 'text-red-500' : 'text-muted-foreground'}>
                  {stat.trend}
                </span>{' '}
                {stat.description}
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
