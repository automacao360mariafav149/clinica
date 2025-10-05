import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';

export interface TimelineEvent {
  id: string;
  type: 'medical_record' | 'appointment' | 'anamnesis' | 'clinical_data' | 'exam' | 'attachment' | 'agent_consultation';
  date: string;
  title: string;
  description?: string;
  doctor?: string;
  icon?: string;
  data?: any;
}

export function usePatientTimeline(patientId: string | null) {
  const [events, setEvents] = useState<TimelineEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchTimeline = async () => {
    if (!patientId) {
      setEvents([]);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const timelineEvents: TimelineEvent[] = [];

      // Buscar prontuários
      const { data: records } = await supabase
        .from('medical_records')
        .select(`
          id, 
          appointment_date, 
          chief_complaint, 
          diagnosis,
          doctor:profiles!medical_records_doctor_id_fkey(name)
        `)
        .eq('patient_id', patientId);

      records?.forEach((record: any) => {
        timelineEvents.push({
          id: record.id,
          type: 'medical_record',
          date: record.appointment_date,
          title: 'Consulta Médica',
          description: record.chief_complaint || record.diagnosis || 'Consulta realizada',
          doctor: record.doctor?.name,
          icon: 'stethoscope',
          data: record,
        });
      });

      // Buscar consultas
      const { data: appointments } = await supabase
        .from('appointments')
        .select(`
          id, 
          appointment_date, 
          status, 
          type, 
          notes,
          doctor:profiles!appointments_doctor_id_fkey(name)
        `)
        .eq('patient_id', patientId);

      appointments?.forEach((apt: any) => {
        timelineEvents.push({
          id: apt.id,
          type: 'appointment',
          date: apt.appointment_date,
          title: apt.type || 'Consulta Agendada',
          description: `Status: ${apt.status}${apt.notes ? ` - ${apt.notes}` : ''}`,
          doctor: apt.doctor?.name,
          icon: 'calendar',
          data: apt,
        });
      });

      // Buscar anamnese
      const { data: anamnesis } = await supabase
        .from('anamnesis')
        .select(`
          id, 
          created_at, 
          chief_complaint,
          doctor:profiles!anamnesis_doctor_id_fkey(name)
        `)
        .eq('patient_id', patientId);

      anamnesis?.forEach((anam: any) => {
        timelineEvents.push({
          id: anam.id,
          type: 'anamnesis',
          date: anam.created_at,
          title: 'Anamnese',
          description: anam.chief_complaint || 'Ficha de anamnese preenchida',
          doctor: anam.doctor?.name,
          icon: 'file-text',
          data: anam,
        });
      });

      // Buscar dados clínicos
      const { data: clinicalData } = await supabase
        .from('clinical_data')
        .select('*')
        .eq('patient_id', patientId);

      clinicalData?.forEach((data: any) => {
        const details = [];
        if (data.weight_kg) details.push(`Peso: ${data.weight_kg}kg`);
        if (data.height_cm) details.push(`Altura: ${data.height_cm}cm`);
        if (data.blood_pressure_systolic && data.blood_pressure_diastolic) {
          details.push(`PA: ${data.blood_pressure_systolic}/${data.blood_pressure_diastolic}`);
        }

        timelineEvents.push({
          id: data.id,
          type: 'clinical_data',
          date: data.measurement_date,
          title: 'Medição Clínica',
          description: details.join(' | ') || 'Dados clínicos registrados',
          icon: 'activity',
          data,
        });
      });

      // Buscar exames
      const { data: exams } = await supabase
        .from('exam_history')
        .select('*')
        .eq('patient_id', patientId);

      exams?.forEach((exam: any) => {
        timelineEvents.push({
          id: exam.id,
          type: 'exam',
          date: exam.exam_date,
          title: exam.exam_name,
          description: exam.result_summary || `Exame: ${exam.exam_type}`,
          icon: 'clipboard',
          data: exam,
        });
      });

      // Buscar anexos
      const { data: attachments } = await supabase
        .from('medical_attachments')
        .select('*')
        .eq('patient_id', patientId);

      attachments?.forEach((att: any) => {
        timelineEvents.push({
          id: att.id,
          type: 'attachment',
          date: att.created_at,
          title: 'Arquivo Anexado',
          description: att.description || att.file_name,
          icon: 'paperclip',
          data: att,
        });
      });

      // Buscar consultas dos agentes de IA
      const { data: agentConsultations } = await supabase
        .from('agent_consultations')
        .select(`
          id,
          agent_type,
          consultation_date,
          cid_code,
          cid_description,
          confidence_level,
          consultation_input,
          consultation_output,
          doctor:profiles!agent_consultations_doctor_id_fkey(name)
        `)
        .eq('patient_id', patientId);

      agentConsultations?.forEach((consultation: any) => {
        let title = 'Consulta de Agente IA';
        let description = '';

        // Formatar título e descrição baseado no tipo de agente
        switch (consultation.agent_type) {
          case 'cid':
            title = `CID: ${consultation.cid_code || 'Consulta CID'}`;
            description = consultation.cid_description || 'Consulta de código CID';
            if (consultation.confidence_level) {
              description += ` (Confiança: ${consultation.confidence_level})`;
            }
            break;
          case 'medication':
            title = 'Cálculo de Medicação';
            description = 'Cálculo de dosagem medicamentosa';
            break;
          case 'protocol':
            title = 'Protocolo Clínico';
            description = 'Consulta de protocolo clínico';
            break;
          case 'exams':
            title = 'Interpretação de Exames';
            description = 'Auxílio na interpretação de exames';
            break;
        }

        timelineEvents.push({
          id: consultation.id,
          type: 'agent_consultation',
          date: consultation.consultation_date,
          title,
          description,
          doctor: consultation.doctor?.name,
          icon: 'bot',
          data: consultation,
        });
      });

      // Ordenar por data (mais recente primeiro)
      timelineEvents.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

      setEvents(timelineEvents);
    } catch (err: any) {
      console.error('Erro ao buscar timeline:', err);
      setError(err.message || 'Erro ao carregar timeline');
    } finally {
      setLoading(false);
    }
  };

  const refetch = () => {
    fetchTimeline();
  };

  useEffect(() => {
    fetchTimeline();
  }, [patientId]);

  return {
    events,
    loading,
    error,
    refetch,
  };
}
