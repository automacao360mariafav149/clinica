import { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';

export interface AvailableDoctorProfile {
  id: string;
  name?: string | null;
  specialization?: string | null;
}

export interface DoctorScheduleRow {
  doctor_id: string;
  appointment_duration: number | null;
  seg_inicio: string | null; seg_pausa_inicio: string | null; seg_pausa_fim: string | null; seg_fim: string | null; seg_ativo: boolean | null;
  ter_inicio: string | null; ter_pausa_inicio: string | null; ter_pausa_fim: string | null; ter_fim: string | null; ter_ativo: boolean | null;
  qua_inicio: string | null; qua_pausa_inicio: string | null; qua_pausa_fim: string | null; qua_fim: string | null; qua_ativo: boolean | null;
  qui_inicio: string | null; qui_pausa_inicio: string | null; qui_pausa_fim: string | null; qui_fim: string | null; qui_ativo: boolean | null;
  sex_inicio: string | null; sex_pausa_inicio: string | null; sex_pausa_fim: string | null; sex_fim: string | null; sex_ativo: boolean | null;
  sab_inicio: string | null; sab_pausa_inicio: string | null; sab_pausa_fim: string | null; sab_fim: string | null; sab_ativo: boolean | null;
  dom_inicio: string | null; dom_pausa_inicio: string | null; dom_pausa_fim: string | null; dom_fim: string | null; dom_ativo: boolean | null;
  profiles?: AvailableDoctorProfile | null;
}

export interface AvailableDoctor {
  doctorId: string;
  profile: AvailableDoctorProfile;
}

function timeStringToMinutes(value: string | null): number | null {
  if (!value) return null;
  // Accepts 'HH:MM' or 'HH:MM:SS'
  const [hh, mm, ss] = value.split(':');
  const hours = parseInt(hh, 10);
  const mins = parseInt(mm ?? '0', 10);
  return hours * 60 + mins;
}

function getTodayKey(date: Date): 'dom' | 'seg' | 'ter' | 'qua' | 'qui' | 'sex' | 'sab' {
  const map: Record<number, any> = {
    0: 'dom',
    1: 'seg',
    2: 'ter',
    3: 'qua',
    4: 'qui',
    5: 'sex',
    6: 'sab',
  };
  return map[date.getDay()];
}

function isAvailableNow(schedule: DoctorScheduleRow, now: Date): boolean {
  const key = getTodayKey(now);
  const ativo = (schedule as any)[`${key}_ativo`] as boolean | null;
  if (!ativo) return false;

  const inicio = timeStringToMinutes((schedule as any)[`${key}_inicio`] || null);
  const fim = timeStringToMinutes((schedule as any)[`${key}_fim`] || null);
  if (inicio == null || fim == null) return false;

  const pausaInicio = timeStringToMinutes((schedule as any)[`${key}_pausa_inicio`] || null);
  const pausaFim = timeStringToMinutes((schedule as any)[`${key}_pausa_fim`] || null);

  const minutesNow = now.getHours() * 60 + now.getMinutes();

  // Fora do horário geral
  if (minutesNow < inicio || minutesNow >= fim) return false;

  // Dentro do horário de almoço, se existir
  if (pausaInicio != null && pausaFim != null) {
    if (minutesNow >= pausaInicio && minutesNow < pausaFim) return false;
  }

  return true;
}

export function useAvailableDoctorsNow() {
  const [schedules, setSchedules] = useState<DoctorScheduleRow[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    const fetch = async () => {
      setLoading(true);
      setError(null);
      try {
        // Tenta buscar com join em profiles e filtrar apenas médicos
        const { data, error: err } = await supabase
          .from('doctor_schedules')
          .select('doctor_id, appointment_duration, seg_inicio, seg_pausa_inicio, seg_pausa_fim, seg_fim, seg_ativo, ter_inicio, ter_pausa_inicio, ter_pausa_fim, ter_fim, ter_ativo, qua_inicio, qua_pausa_inicio, qua_pausa_fim, qua_fim, qua_ativo, qui_inicio, qui_pausa_inicio, qui_pausa_fim, qui_fim, qui_ativo, sex_inicio, sex_pausa_inicio, sex_pausa_fim, sex_fim, sex_ativo, sab_inicio, sab_pausa_inicio, sab_pausa_fim, sab_fim, sab_ativo, dom_inicio, dom_pausa_inicio, dom_pausa_fim, dom_fim, dom_ativo, profiles!inner(id, name, specialization, role)')
          .eq('profiles.role', 'doctor');

        if (err) throw err;
        if (!isMounted) return;
        setSchedules((data as DoctorScheduleRow[]) || []);
      } catch (e: any) {
        if (!isMounted) return;
        setError(e?.message ?? 'Erro ao carregar médicos disponíveis');
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetch();
    return () => {
      isMounted = false;
    };
  }, []);

  const availableDoctors: AvailableDoctor[] = useMemo(() => {
    const now = new Date();
    return schedules
      .filter((row) => isAvailableNow(row, now) && row.profiles)
      .map((row) => ({
        doctorId: row.doctor_id,
        profile: row.profiles as AvailableDoctorProfile,
      }));
  }, [schedules]);

  return { availableDoctors, loading, error };
}


