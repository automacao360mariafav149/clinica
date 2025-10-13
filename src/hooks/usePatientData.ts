import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';

export interface Patient {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  cpf?: string;
  birth_date?: string;
  gender?: string;
  address?: string;
  city?: string;
  state?: string;
  zip_code?: string;
  avatar_url?: string;
  health_insurance?: string;
  next_appointment_date?: string;
  last_appointment_date?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface MedicalRecord {
  id: string;
  patient_id: string;
  doctor_id: string;
  appointment_date: string;
  chief_complaint?: string;
  history_present_illness?: string;
  physical_examination?: string;
  diagnosis?: string;
  treatment_plan?: string;
  prescriptions?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
  doctor?: {
    name: string;
    specialization?: string;
  };
}

export interface Anamnesis {
  id: string;
  patient_id: string;
  doctor_id: string;
  chief_complaint?: string;
  history_present_illness?: string;
  past_medical_history?: string;
  family_history?: string;
  social_history?: string;
  allergies?: string;
  current_medications?: string;
  review_of_systems?: string;
  created_at: string;
  updated_at: string;
  doctor?: {
    name: string;
  };
}

export interface ClinicalData {
  id: string;
  patient_id: string;
  doctor_id?: string;
  measurement_date: string;
  weight_kg?: number;
  height_cm?: number;
  bmi?: number;
  blood_pressure_systolic?: number;
  blood_pressure_diastolic?: number;
  heart_rate?: number;
  temperature_celsius?: number;
  oxygen_saturation?: number;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface ExamHistory {
  id: string;
  patient_id: string;
  doctor_id?: string;
  exam_type: string;
  exam_name: string;
  exam_date: string;
  result_summary?: string;
  observations?: string;
  created_at: string;
  updated_at: string;
}

export interface MedicalAttachment {
  id: string;
  patient_id: string;
  uploaded_by?: string;
  related_to_type?: string;
  related_to_id?: string;
  file_name: string;
  file_path: string;
  file_size_bytes?: number;
  file_type?: string;
  description?: string;
  created_at: string;
}

export interface AgentExam {
  id: string;
  patient_id: string;
  doctor_id: string;
  agent_type: string;
  consultation_input: any;
  consultation_output: any;
  exam_type?: string;
  exam_result_summary?: string;
  exam_file_name?: string;
  exam_analysis_date?: string;
  consultation_date: string;
  created_at: string;
  doctor?: {
    name: string;
  };
}

export interface PatientData {
  patient: Patient | null;
  medicalRecords: MedicalRecord[];
  anamnesis: Anamnesis[];
  clinicalData: ClinicalData[];
  examHistory: ExamHistory[];
  attachments: MedicalAttachment[];
  agentExams: AgentExam[];
  doctors: any[];
}

export function usePatientData(patientId: string | null) {
  const [data, setData] = useState<PatientData>({
    patient: null,
    medicalRecords: [],
    anamnesis: [],
    clinicalData: [],
    examHistory: [],
    attachments: [],
    agentExams: [],
    doctors: [],
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPatientData = async () => {
    if (!patientId) {
      setData({
        patient: null,
        medicalRecords: [],
        anamnesis: [],
        clinicalData: [],
        examHistory: [],
        attachments: [],
        agentExams: [],
        doctors: [],
      });
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Buscar dados do paciente
      const { data: patientData, error: patientError } = await supabase
        .from('patients')
        .select('*')
        .eq('id', patientId)
        .single();

      if (patientError) throw patientError;

      // Buscar prontuários
      const { data: recordsData, error: recordsError } = await supabase
        .from('medical_records')
        .select(`
          *,
          doctor:profiles!medical_records_doctor_id_fkey(name, specialization)
        `)
        .eq('patient_id', patientId)
        .order('appointment_date', { ascending: false });

      if (recordsError) throw recordsError;

      // Buscar anamneses
      const { data: anamnesisData, error: anamnesisError } = await supabase
        .from('anamnesis')
        .select(`
          *,
          doctor:profiles!anamnesis_doctor_id_fkey(name)
        `)
        .eq('patient_id', patientId)
        .order('created_at', { ascending: false });

      if (anamnesisError) throw anamnesisError;

      // Buscar dados clínicos
      const { data: clinicalDataData, error: clinicalError } = await supabase
        .from('clinical_data')
        .select('*')
        .eq('patient_id', patientId)
        .order('measurement_date', { ascending: false });

      if (clinicalError) throw clinicalError;

      // Buscar histórico de exames
      const { data: examsData, error: examsError } = await supabase
        .from('exam_history')
        .select('*')
        .eq('patient_id', patientId)
        .order('exam_date', { ascending: false });

      if (examsError) throw examsError;

      // Buscar anexos
      const { data: attachmentsData, error: attachmentsError } = await supabase
        .from('medical_attachments')
        .select('*')
        .eq('patient_id', patientId)
        .order('created_at', { ascending: false });

      if (attachmentsError) throw attachmentsError;

      // Buscar exames do Agent de Exames
      const { data: agentExamsData, error: agentExamsError } = await supabase
        .from('agent_consultations')
        .select(`
          *,
          doctor:profiles!agent_consultations_doctor_id_fkey(name)
        `)
        .eq('patient_id', patientId)
        .eq('agent_type', 'exams') // Plural conforme definido no CHECK constraint
        .order('consultation_date', { ascending: false });

      if (agentExamsError) throw agentExamsError;

      // Buscar médicos relacionados
      const { data: doctorsData, error: doctorsError } = await supabase
        .from('patient_doctors')
        .select(`
          *,
          doctor:profiles!patient_doctors_doctor_id_fkey(id, name, specialization)
        `)
        .eq('patient_id', patientId);

      if (doctorsError) throw doctorsError;

      setData({
        patient: patientData,
        medicalRecords: recordsData || [],
        anamnesis: anamnesisData || [],
        clinicalData: clinicalDataData || [],
        examHistory: examsData || [],
        attachments: attachmentsData || [],
        agentExams: agentExamsData || [],
        doctors: doctorsData || [],
      });
    } catch (err: any) {
      console.error('Erro ao buscar dados do paciente:', err);
      setError(err.message || 'Erro ao carregar dados');
    } finally {
      setLoading(false);
    }
  };

  const refetch = () => {
    fetchPatientData();
  };

  useEffect(() => {
    fetchPatientData();
  }, [patientId]);

  return {
    ...data,
    loading,
    error,
    refetch,
  };
}
