import { Stethoscope, Activity } from 'lucide-react';
import { MagicBentoCard } from '@/components/bento/MagicBento';
import { useRealtimeList } from '@/hooks/useRealtimeList';
import { useMemo } from 'react';

interface Appointment {
  doctor_id: string;
}

interface Profile {
  id: string;
  full_name: string;
  role: string;
}

export function ConsultationsByDoctorCard() {
  const { data: appointments } = useRealtimeList<Appointment>({ table: 'appointments' });
  const { data: profiles } = useRealtimeList<Profile>({ table: 'profiles' });

  const doctorStats = useMemo(() => {
    const doctorCounts: Record<string, number> = {};

    appointments.forEach((apt) => {
      if (apt.doctor_id) {
        doctorCounts[apt.doctor_id] = (doctorCounts[apt.doctor_id] || 0) + 1;
      }
    });

    // Filtrar apenas médicos
    const doctors = profiles.filter((p) => p.role === 'doctor');

    // Mapear contagens com nomes dos médicos
    return doctors
      .map((doctor) => ({
        id: doctor.id,
        name: doctor.full_name || 'Médico',
        count: doctorCounts[doctor.id] || 0,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  }, [appointments, profiles]);

  const getInitials = (name: string) => {
    const parts = name.split(' ');
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  return (
    <MagicBentoCard>
      <div className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <Stethoscope className="w-5 h-5 text-primary" />
          <span className="text-lg font-semibold">Consultas por Profissional</span>
        </div>
        <div className="space-y-3">
          {doctorStats.length > 0 ? (
            doctorStats.map((doctor) => (
              <div key={doctor.id} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                    <span className="text-primary font-semibold text-sm">
                      {getInitials(doctor.name)}
                    </span>
                  </div>
                  <span className="text-sm text-foreground">{doctor.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-foreground">{doctor.count}</span>
                  <Activity className="w-4 h-4 text-muted-foreground" />
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
