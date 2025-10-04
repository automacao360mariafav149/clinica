import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, Calendar, TrendingUp, Clock, Activity, Stethoscope } from 'lucide-react';
import { useRealtimeList } from '@/hooks/useRealtimeList';

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

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat, index) => (
            <Card key={index} className="bg-card border-border hover:border-primary/50 transition-all">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {stat.title}
                </CardTitle>
                <stat.icon className="w-4 h-4 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-foreground">{stat.value}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  <span className={String(stat.trend).startsWith('+') ? 'text-green-500' : 'text-red-500'}>
                    {stat.trend}
                  </span>{' '}
                  vs. mês passado
                </p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Horários Mais Procurados */}
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-primary" />
                Horários Mais Procurados
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {['09:00 - 10:00', '14:00 - 15:00', '16:00 - 17:00', '10:00 - 11:00'].map((time, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm text-foreground">{time}</span>
                        <span className="text-sm text-muted-foreground">{85 - i * 10}%</span>
                      </div>
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-primary to-accent rounded-full"
                          style={{ width: `${85 - i * 10}%` }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Consultas por Médico */}
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Stethoscope className="w-5 h-5 text-primary" />
                Consultas por Médico
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {[
                  { name: 'Dr. Silva', count: 45 },
                  { name: 'Dra. Santos', count: 38 },
                  { name: 'Dr. Oliveira', count: 32 },
                  { name: 'Dra. Costa', count: 28 },
                ].map((doctor, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                        <span className="text-primary font-semibold text-sm">
                          {doctor.name.charAt(doctor.name.indexOf('.') + 2)}
                        </span>
                      </div>
                      <span className="text-sm text-foreground">{doctor.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-foreground">{doctor.count}</span>
                      <Activity className="w-4 h-4 text-muted-foreground" />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Pacientes Recentes */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5 text-primary" />
              Pacientes Recentes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                { name: 'João Silva', date: 'Hoje, 14:30', status: 'Confirmado' },
                { name: 'Maria Santos', date: 'Hoje, 15:00', status: 'Em atendimento' },
                { name: 'Pedro Costa', date: 'Hoje, 15:30', status: 'Aguardando' },
                { name: 'Ana Oliveira', date: 'Hoje, 16:00', status: 'Confirmado' },
              ].map((patient, i) => (
                <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                      <span className="text-white font-semibold text-sm">
                        {patient.name.charAt(0)}
                      </span>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">{patient.name}</p>
                      <p className="text-xs text-muted-foreground">{patient.date}</p>
                    </div>
                  </div>
                  <div className="px-3 py-1 rounded-full bg-primary/20 text-primary text-xs font-medium">
                    {patient.status}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
