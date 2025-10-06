import { Shield, TrendingUp } from 'lucide-react';
import { MagicBentoCard } from '@/components/bento/MagicBento';
import { useRealtimeList } from '@/hooks/useRealtimeList';
import { useMemo } from 'react';

interface Patient {
  health_insurance: string | null;
}

export function HealthInsuranceCard() {
  const { data: patients } = useRealtimeList<Patient>({ table: 'patients' });

  const insuranceStats = useMemo(() => {
    const insuranceCounts: Record<string, number> = {};

    patients.forEach((patient) => {
      const insurance = patient.health_insurance || 'Particular';
      insuranceCounts[insurance] = (insuranceCounts[insurance] || 0) + 1;
    });

    const total = patients.length || 1;

    return Object.entries(insuranceCounts)
      .map(([name, count]) => ({
        name,
        count,
        percentage: Math.round((count / total) * 100),
      }))
      .sort((a, b) => b.count - a.count);
  }, [patients]);

  const getInsuranceColor = (index: number) => {
    const colors = [
      'from-blue-500 to-blue-600',
      'from-green-500 to-green-600',
      'from-purple-500 to-purple-600',
      'from-orange-500 to-orange-600',
      'from-pink-500 to-pink-600',
      'from-indigo-500 to-indigo-600',
    ];
    return colors[index % colors.length];
  };

  return (
    <MagicBentoCard>
      <div className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <Shield className="w-5 h-5 text-primary" />
          <span className="text-lg font-semibold">Distribuição por Convênio</span>
        </div>
        <div className="space-y-3">
          {insuranceStats.length > 0 ? (
            insuranceStats.map((insurance, index) => (
              <div key={insurance.name} className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-foreground">{insurance.name}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">{insurance.count} pacientes</span>
                    <span className="text-sm font-semibold text-primary">
                      {insurance.percentage}%
                    </span>
                  </div>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className={`h-full bg-gradient-to-r ${getInsuranceColor(index)} rounded-full transition-all duration-300`}
                    style={{ width: `${insurance.percentage}%` }}
                  />
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
