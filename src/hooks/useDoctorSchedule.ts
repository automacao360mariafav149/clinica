import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';

export interface DoctorSchedule {
  id?: string;
  doctor_id: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  appointment_duration: number;
  break_start_time?: string;
  break_end_time?: string;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

export function useDoctorSchedule(doctorId: string) {
  const [schedules, setSchedules] = useState<DoctorSchedule[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Busca os horários do médico
  const fetchSchedules = async () => {
    if (!doctorId) return;

    setLoading(true);
    setError(null);

    try {
      const { data, error: fetchError } = await supabase
        .from('doctor_schedules')
        .select('*')
        .eq('doctor_id', doctorId)
        .order('day_of_week', { ascending: true });

      if (fetchError) throw fetchError;

      setSchedules(data || []);
    } catch (err: any) {
      console.error('Erro ao buscar horários:', err);
      setError(err.message || 'Erro ao buscar horários');
    } finally {
      setLoading(false);
    }
  };

  // Salva ou atualiza um horário usando UPSERT
  // UPSERT = INSERT se não existir, UPDATE se já existir
  // Baseado na constraint UNIQUE(doctor_id, day_of_week)
  const saveSchedule = async (schedule: DoctorSchedule) => {
    setLoading(true);
    setError(null);

    try {
      // Prepara os dados para salvar (sem o ID, pois o UPSERT usa a constraint UNIQUE)
      const scheduleData = {
        doctor_id: schedule.doctor_id,
        day_of_week: schedule.day_of_week,
        start_time: schedule.start_time,
        end_time: schedule.end_time,
        appointment_duration: schedule.appointment_duration,
        break_start_time: schedule.break_start_time || null,
        break_end_time: schedule.break_end_time || null,
        is_active: schedule.is_active,
      };

      // UPSERT: Insere se não existe, atualiza se já existe
      // O PostgreSQL usa a constraint UNIQUE(doctor_id, day_of_week) para identificar conflitos
      const { error: upsertError } = await supabase
        .from('doctor_schedules')
        .upsert(scheduleData, {
          onConflict: 'doctor_id,day_of_week', // Identifica conflitos por estas colunas
          ignoreDuplicates: false, // Não ignora, faz UPDATE
        });

      if (upsertError) throw upsertError;

      // Recarrega a lista para pegar os dados atualizados do banco
      await fetchSchedules();
    } catch (err: any) {
      console.error('Erro ao salvar horário:', err);
      setError(err.message || 'Erro ao salvar horário');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Deleta um horário
  const deleteSchedule = async (scheduleId: string) => {
    setLoading(true);
    setError(null);

    try {
      const { error: deleteError } = await supabase
        .from('doctor_schedules')
        .delete()
        .eq('id', scheduleId);

      if (deleteError) throw deleteError;

      // Atualiza o estado local
      setSchedules((current) => current.filter((s) => s.id !== scheduleId));
    } catch (err: any) {
      console.error('Erro ao deletar horário:', err);
      setError(err.message || 'Erro ao deletar horário');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Toggle ativo/inativo
  const toggleScheduleActive = async (scheduleId: string, isActive: boolean) => {
    setLoading(true);
    setError(null);

    try {
      const { error: updateError } = await supabase
        .from('doctor_schedules')
        .update({ is_active: isActive })
        .eq('id', scheduleId);

      if (updateError) throw updateError;

      // Atualiza o estado local
      setSchedules((current) =>
        current.map((s) => (s.id === scheduleId ? { ...s, is_active: isActive } : s))
      );
    } catch (err: any) {
      console.error('Erro ao atualizar status:', err);
      setError(err.message || 'Erro ao atualizar status');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Carrega os horários ao montar o componente
  useEffect(() => {
    if (doctorId) {
      fetchSchedules();
    }
  }, [doctorId]);

  return {
    schedules,
    loading,
    error,
    fetchSchedules,
    saveSchedule,
    deleteSchedule,
    toggleScheduleActive,
  };
}

