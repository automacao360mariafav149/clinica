import { Stethoscope, TrendingUp, Award, Users } from 'lucide-react';
import { MagicBentoCard } from '@/components/bento/MagicBento';
import { useRealtimeList } from '@/hooks/useRealtimeList';
import { useRealtimeProfiles } from '@/hooks/useRealtimeProfiles';
import { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Cell, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts';

interface Appointment {
  doctor_id: string;
}

interface Profile {
  id: string;
  full_name: string;
  role: string;
}

export function DoctorPieChartCard() {
  const { data: appointments } = useRealtimeList<Appointment>({ table: 'appointments' });
  
  // Usa o novo hook com canal isolado e filtro para apenas médicos
  const { profiles } = useRealtimeProfiles([], {
    channelName: 'doctor-pie-chart-profiles',
    filter: 'role.eq.doctor', // Só médicos
    onlyUpdates: true, // Só precisa de updates para atualizar gráfico
  });

  const doctorStats = useMemo(() => {
    const doctorCounts: Record<string, number> = {};

    appointments.forEach((apt) => {
      if (apt.doctor_id) {
        doctorCounts[apt.doctor_id] = (doctorCounts[apt.doctor_id] || 0) + 1;
      }
    });

    const doctors = profiles.filter((p) => p.role === 'doctor');
    const total = appointments.length || 1;

    return doctors
      .map((doctor) => ({
        id: doctor.id,
        name: doctor.full_name || 'Médico',
        value: doctorCounts[doctor.id] || 0,
        percentage: ((doctorCounts[doctor.id] || 0) / total * 100).toFixed(1),
      }))
      .filter(d => d.value > 0)
      .sort((a, b) => b.value - a.value);
  }, [appointments, profiles]);

  const COLORS = ['#5227FF', '#8B5CF6', '#A78BFA', '#C4B5FD', '#DDD6FE'];
  const MEDAL_COLORS = ['#FFD700', '#C0C0C0', '#CD7F32'];

  const getInitials = (name: string) => {
    const parts = name.split(' ');
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  const getMedalIcon = (index: number) => {
    if (index === 0) return '🥇';
    if (index === 1) return '🥈';
    if (index === 2) return '🥉';
    return `${index + 1}º`;
  };

  return (
    <MagicBentoCard>
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Stethoscope className="w-5 h-5 text-primary" />
            <span className="text-lg font-semibold">Ranking de Profissionais</span>
          </div>
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Users className="w-3 h-3" />
            <span>{doctorStats.length} médicos</span>
          </div>
        </div>

        {doctorStats.length > 0 ? (
          <div className="space-y-4">
            {/* Top 3 com Destaque */}
            {doctorStats.slice(0, 3).map((doctor, index) => (
              <div 
                key={doctor.id}
                className="relative overflow-hidden rounded-xl p-4 transition-all duration-300 hover:scale-[1.02]"
                style={{
                  background: `linear-gradient(135deg, ${COLORS[index]}15 0%, ${COLORS[index]}05 100%)`,
                  border: `1px solid ${COLORS[index]}30`
                }}
              >
                {/* Badge de Posição */}
                <div className="absolute top-2 right-2 text-2xl">
                  {getMedalIcon(index)}
                </div>

                <div className="flex items-start gap-4">
                  {/* Avatar */}
                  <div 
                    className="w-14 h-14 rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-lg"
                    style={{ background: `linear-gradient(135deg, ${COLORS[index]}, ${COLORS[index]}dd)` }}
                  >
                    {getInitials(doctor.name)}
                  </div>

                  {/* Info */}
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-foreground">{doctor.name}</h3>
                      {index === 0 && (
                        <Award className="w-4 h-4 text-yellow-500" />
                      )}
                    </div>

                    {/* Estatísticas */}
                    <div className="flex items-center gap-4 mb-2">
                      <div className="flex items-center gap-1">
                        <span className="text-2xl font-bold" style={{ color: COLORS[index] }}>
                          {doctor.value}
                        </span>
                        <span className="text-xs text-muted-foreground">consultas</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <TrendingUp className="w-3 h-3 text-green-500" />
                        <span className="text-sm font-semibold text-green-500">
                          {doctor.percentage}%
                        </span>
                      </div>
                    </div>

                    {/* Barra de Progresso */}
                    <div className="relative h-2 bg-muted rounded-full overflow-hidden">
                      <div 
                        className="absolute inset-y-0 left-0 rounded-full transition-all duration-1000 ease-out"
                        style={{
                          width: `${Math.min(parseFloat(doctor.percentage), 100)}%`,
                          background: `linear-gradient(90deg, ${COLORS[index]}, ${COLORS[index]}cc)`
                        }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            ))}

            {/* Outros Médicos (4º em diante) */}
            {doctorStats.length > 3 && (
              <div className="pt-2 space-y-2">
                {doctorStats.slice(3).map((doctor, index) => (
                  <div 
                    key={doctor.id}
                    className="flex items-center gap-3 p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
                  >
                    <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center text-primary text-xs font-semibold">
                      {index + 4}º
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{doctor.name}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-foreground">{doctor.value}</span>
                      <span className="text-xs text-muted-foreground">({doctor.percentage}%)</span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Mini Gráfico de Radar (se houver 3+ médicos) */}
            {doctorStats.length >= 3 && (
              <div className="mt-6 pt-6 border-t border-border">
                <p className="text-xs text-muted-foreground mb-3 text-center">Distribuição Comparativa</p>
                <ResponsiveContainer width="100%" height={220}>
                  <RadarChart data={doctorStats.slice(0, 5)}>
                    <PolarGrid stroke="#333" />
                    <PolarAngleAxis 
                      dataKey="name" 
                      tick={{ fill: '#888', fontSize: 10 }}
                      tickFormatter={(value) => value.split(' ')[0]}
                    />
                    <PolarRadiusAxis angle={90} domain={[0, 'auto']} tick={{ fill: '#888', fontSize: 10 }} />
                    <Radar 
                      name="Consultas" 
                      dataKey="value" 
                      stroke="#5227FF" 
                      fill="#5227FF" 
                      fillOpacity={0.5} 
                    />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        ) : (
          <div className="text-sm text-muted-foreground text-center py-8">
            Nenhum dado disponível
          </div>
        )}
      </div>
    </MagicBentoCard>
  );
}
