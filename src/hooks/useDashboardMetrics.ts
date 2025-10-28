import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';

export interface DashboardMetrics {
  consultasHoje: number;
  consultasMesAtual: number;
  consultasMesAnterior: number;
  pacientesCRM: number;
  pacientesCRMMesAtual: number;
  pacientesCRMMesAnterior: number;
  prePatientes: number;
  totalMedicos: number;
  totalSecretarias: number;
  mensagensHoje: number;
  mensagensMesAtual: number;
  followupsPendentes: number;
  prontuariosCriados: number;
  consultasIA: number;
  loading: boolean;
  error: string | null;
}

export function useDashboardMetrics() {
  const [metrics, setMetrics] = useState<DashboardMetrics>({
    consultasHoje: 0,
    consultasMesAtual: 0,
    consultasMesAnterior: 0,
    pacientesCRM: 0,
    pacientesCRMMesAtual: 0,
    pacientesCRMMesAnterior: 0,
    prePatientes: 0,
    totalMedicos: 0,
    totalSecretarias: 0,
    mensagensHoje: 0,
    mensagensMesAtual: 0,
    followupsPendentes: 0,
    prontuariosCriados: 0,
    consultasIA: 0,
    loading: true,
    error: null,
  });

  useEffect(() => {
    fetchMetrics();
  }, []);

  const fetchMetrics = async () => {
    try {
      setMetrics(prev => ({ ...prev, loading: true, error: null }));

      // Buscar métricas principais
      const { data: mainMetrics, error: mainError } = await supabase.rpc(
        'get_dashboard_metrics'
      );

      if (mainError) {
        // Se a function não existir, buscar dados manualmente
        console.warn('RPC get_dashboard_metrics não encontrada, buscando dados manualmente');
        await fetchMetricsManually();
        return;
      }

      if (mainMetrics && mainMetrics.length > 0) {
        const data = mainMetrics[0];
        setMetrics({
          consultasHoje: data.consultas_hoje || 0,
          consultasMesAtual: data.consultas_mes_atual || 0,
          consultasMesAnterior: data.consultas_mes_anterior || 0,
          pacientesCRM: data.total_pacientes_crm || 0,
          pacientesCRMMesAtual: data.pacientes_mes_atual || 0,
          pacientesCRMMesAnterior: data.pacientes_mes_anterior || 0,
          prePatientes: data.total_pre_pacientes || 0,
          totalMedicos: data.total_medicos || 0,
          totalSecretarias: data.total_secretarias || 0,
          mensagensHoje: data.mensagens_hoje || 0,
          mensagensMesAtual: data.mensagens_mes_atual || 0,
          followupsPendentes: data.followups_pendentes || 0,
          prontuariosCriados: data.prontuarios_criados || 0,
          consultasIA: data.consultas_ia || 0,
          loading: false,
          error: null,
        });
      }
    } catch (err) {
      console.error('Erro ao buscar métricas:', err);
      // Tentar buscar manualmente
      await fetchMetricsManually();
    }
  };

  const fetchMetricsManually = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const firstDayCurrentMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString();
      const firstDayLastMonth = new Date(new Date().getFullYear(), new Date().getMonth() - 1, 1).toISOString();
      const lastDayLastMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 0).toISOString();

      // Buscar consultas hoje
      const { count: consultasHoje } = await supabase
        .from('appointments')
        .select('*', { count: 'exact', head: true })
        .gte('scheduled_at', today)
        .lt('scheduled_at', new Date(new Date().setDate(new Date().getDate() + 1)).toISOString());

      // Buscar consultas mês atual
      const { count: consultasMesAtual } = await supabase
        .from('appointments')
        .select('*', { count: 'exact', head: true })
        .gte('scheduled_at', firstDayCurrentMonth);

      // Buscar consultas mês anterior
      const { count: consultasMesAnterior } = await supabase
        .from('appointments')
        .select('*', { count: 'exact', head: true })
        .gte('scheduled_at', firstDayLastMonth)
        .lte('scheduled_at', lastDayLastMonth);

      // Buscar total de pacientes CRM
      const { count: pacientesCRM } = await supabase
        .from('patients')
        .select('*', { count: 'exact', head: true });

      // Buscar pacientes criados mês atual
      const { count: pacientesCRMMesAtual } = await supabase
        .from('patients')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', firstDayCurrentMonth);

      // Buscar pacientes criados mês anterior
      const { count: pacientesCRMMesAnterior } = await supabase
        .from('patients')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', firstDayLastMonth)
        .lte('created_at', lastDayLastMonth);

      // Buscar pré-pacientes
      const { count: prePatientes } = await supabase
        .from('pre_patients')
        .select('*', { count: 'exact', head: true });

      // Buscar médicos
      const { count: totalMedicos } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .eq('role', 'doctor');

      // Buscar secretárias
      const { count: totalSecretarias } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .eq('role', 'secretary');

      // Buscar mensagens hoje
      const { count: mensagensHoje } = await supabase
        .from('messages')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', today);

      // Buscar mensagens mês atual
      const { count: mensagensMesAtual } = await supabase
        .from('messages')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', firstDayCurrentMonth);

      // Buscar follow-ups pendentes
      const { count: followupsPendentes } = await supabase
        .from('follow_ups')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending');

      // Buscar prontuários criados
      const { count: prontuariosCriados } = await supabase
        .from('medical_records')
        .select('*', { count: 'exact', head: true });

      // Buscar consultas de IA
      const { count: consultasIA } = await supabase
        .from('agent_consultations')
        .select('*', { count: 'exact', head: true });

      setMetrics({
        consultasHoje: consultasHoje || 0,
        consultasMesAtual: consultasMesAtual || 0,
        consultasMesAnterior: consultasMesAnterior || 0,
        pacientesCRM: pacientesCRM || 0,
        pacientesCRMMesAtual: pacientesCRMMesAtual || 0,
        pacientesCRMMesAnterior: pacientesCRMMesAnterior || 0,
        prePatientes: prePatientes || 0,
        totalMedicos: totalMedicos || 0,
        totalSecretarias: totalSecretarias || 0,
        mensagensHoje: mensagensHoje || 0,
        mensagensMesAtual: mensagensMesAtual || 0,
        followupsPendentes: followupsPendentes || 0,
        prontuariosCriados: prontuariosCriados || 0,
        consultasIA: consultasIA || 0,
        loading: false,
        error: null,
      });
    } catch (err) {
      console.error('Erro ao buscar métricas manualmente:', err);
      setMetrics(prev => ({
        ...prev,
        loading: false,
        error: 'Erro ao carregar métricas. Tente novamente.',
      }));
    }
  };

  const calculateTrend = (current: number, previous: number): string => {
    if (previous === 0 && current === 0) return '0%';
    if (previous === 0) return '+100%';
    
    const diff = ((current - previous) / previous) * 100;
    const sign = diff >= 0 ? '+' : '';
    return `${sign}${Math.round(diff)}%`;
  };

  return {
    ...metrics,
    calculateTrend,
    refresh: fetchMetrics,
  };
}

