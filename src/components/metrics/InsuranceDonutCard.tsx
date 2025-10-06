import { Shield, TrendingUp, Users, Percent, Building2 } from 'lucide-react';
import { MagicBentoCard } from '@/components/bento/MagicBento';
import { useRealtimeList } from '@/hooks/useRealtimeList';
import { useMemo } from 'react';
import { AreaChart, Area, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, Cell } from 'recharts';

interface Patient {
  health_insurance: string | null;
}

export function InsuranceDonutCard() {
  const { data: patients } = useRealtimeList<Patient>({ table: 'patients' });

  const insuranceStats = useMemo(() => {
    const insuranceCounts: Record<string, number> = {};

    patients.forEach((patient) => {
      const insurance = patient.health_insurance || 'Particular';
      insuranceCounts[insurance] = (insuranceCounts[insurance] || 0) + 1;
    });

    const total = patients.length || 1;

    return Object.entries(insuranceCounts)
      .map(([name, value]) => ({
        name,
        value,
        percentage: ((value / total) * 100).toFixed(1),
      }))
      .sort((a, b) => b.value - a.value);
  }, [patients]);

  const INSURANCE_COLORS: Record<string, { bg: string; border: string; text: string }> = {
    'Unimed': { bg: '#10B98115', border: '#10B98150', text: '#10B981' },
    'Amil': { bg: '#3B82F615', border: '#3B82F650', text: '#3B82F6' },
    'Bradesco Saúde': { bg: '#EF444415', border: '#EF444450', text: '#EF4444' },
    'SulAmérica': { bg: '#F59E0B15', border: '#F59E0B50', text: '#F59E0B' },
    'Particular': { bg: '#8B5CF615', border: '#8B5CF650', text: '#8B5CF6' },
    'default': { bg: '#EC489915', border: '#EC489950', text: '#EC4899' }
  };

  const getInsuranceColor = (name: string) => {
    return INSURANCE_COLORS[name] || INSURANCE_COLORS['default'];
  };

  const getInsuranceIcon = (name: string) => {
    if (name === 'Particular') return '💰';
    return '🏥';
  };

  return (
    <MagicBentoCard>
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-primary" />
            <span className="text-lg font-semibold">Mix de Convênios</span>
          </div>
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Building2 className="w-3 h-3" />
            <span>{insuranceStats.length} tipos</span>
          </div>
        </div>

        {insuranceStats.length > 0 ? (
          <div className="space-y-4">
            {/* Cards de Convênios */}
            <div className="grid grid-cols-1 gap-3">
              {insuranceStats.map((insurance, index) => {
                const colors = getInsuranceColor(insurance.name);
                return (
                  <div 
                    key={insurance.name}
                    className="relative overflow-hidden rounded-xl p-4 transition-all duration-300 hover:scale-[1.02] hover:shadow-lg"
                    style={{
                      background: colors.bg,
                      border: `1px solid ${colors.border}`
                    }}
                  >
                    {/* Ícone do Convênio */}
                    <div className="absolute top-3 right-3 text-2xl opacity-50">
                      {getInsuranceIcon(insurance.name)}
                    </div>

                    <div className="flex items-center gap-4">
                      {/* Percentual Grande */}
                      <div 
                        className="w-20 h-20 rounded-xl flex flex-col items-center justify-center shadow-lg"
                        style={{ background: `linear-gradient(135deg, ${colors.text}dd, ${colors.text})` }}
                      >
                        <Percent className="w-4 h-4 text-white opacity-70 mb-1" />
                        <span className="text-2xl font-bold text-white">
                          {insurance.percentage}
                        </span>
                      </div>

                      {/* Info */}
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-semibold text-foreground text-base">{insurance.name}</h3>
                        </div>

                        {/* Estatísticas */}
                        <div className="flex items-center gap-4 mb-2">
                          <div className="flex items-center gap-1">
                            <Users className="w-4 h-4" style={{ color: colors.text }} />
                            <span className="text-xl font-bold text-foreground">
                              {insurance.value}
                            </span>
                            <span className="text-xs text-muted-foreground">pacientes</span>
                          </div>
                        </div>

                        {/* Barra de Progresso Visual */}
                        <div className="relative h-3 bg-black/10 rounded-full overflow-hidden">
                          <div 
                            className="absolute inset-y-0 left-0 rounded-full transition-all duration-1000 ease-out flex items-center justify-end pr-2"
                            style={{
                              width: `${insurance.percentage}%`,
                              background: `linear-gradient(90deg, ${colors.text}cc, ${colors.text})`
                            }}
                          >
                            {parseFloat(insurance.percentage) > 15 && (
                              <span className="text-[10px] font-bold text-white">
                                {insurance.percentage}%
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Mini Gráfico de Área Comparativo */}
            <div className="mt-6 pt-6 border-t border-border">
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs text-muted-foreground">Distribuição Comparativa</p>
                <div className="flex items-center gap-1 text-xs text-green-500">
                  <TrendingUp className="w-3 h-3" />
                  <span>Total: {patients.length} pacientes</span>
                </div>
              </div>
              
              <ResponsiveContainer width="100%" height={120}>
                <BarChart data={insuranceStats} layout="horizontal">
                  <XAxis 
                    type="category" 
                    dataKey="name" 
                    tick={{ fill: '#888', fontSize: 10 }}
                    tickFormatter={(value) => value.split(' ')[0]}
                  />
                  <YAxis type="number" hide />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#1a1a1a', 
                      border: '1px solid #333',
                      borderRadius: '8px',
                      fontSize: '12px'
                    }}
                    labelStyle={{ color: '#fff' }}
                    formatter={(value: any, name: string, props: any) => [
                      `${value} pacientes (${props.payload.percentage}%)`,
                      props.payload.name
                    ]}
                  />
                  <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                    {insuranceStats.map((entry, index) => {
                      const colors = getInsuranceColor(entry.name);
                      return <Cell key={`cell-${index}`} fill={colors.text} />;
                    })}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Resumo */}
            <div className="grid grid-cols-3 gap-3 pt-4 border-t border-border">
              <div className="text-center">
                <p className="text-xs text-muted-foreground mb-1">Total</p>
                <p className="text-lg font-bold text-foreground">{patients.length}</p>
              </div>
              <div className="text-center">
                <p className="text-xs text-muted-foreground mb-1">Convênios</p>
                <p className="text-lg font-bold text-blue-500">
                  {insuranceStats.filter(i => i.name !== 'Particular').length}
                </p>
              </div>
              <div className="text-center">
                <p className="text-xs text-muted-foreground mb-1">Particular</p>
                <p className="text-lg font-bold text-purple-500">
                  {insuranceStats.find(i => i.name === 'Particular')?.value || 0}
                </p>
              </div>
            </div>
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
