import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Edit, Calendar, Clock, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabaseClient';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface Appointment {
  id: string;
  patient_id: string;
  doctor_id?: string;
  scheduled_at: string;
  status: string;
  notes?: string;
}

interface Patient {
  id: string;
  name: string;
  email?: string;
  phone?: string;
}

interface Doctor {
  id: string;
  name: string;
  specialization?: string;
  email?: string;
  calendar_id?: string;
}

interface EditEventModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  appointment: Appointment | null;
  onEventUpdated?: () => void;
  onEventDeleted?: () => void;
}

export function EditEventModal({
  open,
  onOpenChange,
  appointment,
  onEventUpdated,
  onEventDeleted,
}: EditEventModalProps) {
  const [loading, setLoading] = useState(false);
  const [loadingPatients, setLoadingPatients] = useState(false);
  const [loadingDoctors, setLoadingDoctors] = useState(false);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  // Dados do evento
  const [selectedPatientId, setSelectedPatientId] = useState<string>('');
  const [selectedDoctorId, setSelectedDoctorId] = useState<string>('');
  const [eventDate, setEventDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [consultationType, setConsultationType] = useState('primeira_consulta');
  const [notes, setNotes] = useState('');

  // Carregar pacientes
  const fetchPatients = async () => {
    setLoadingPatients(true);
    try {
      const { data, error } = await supabase
        .from('patients')
        .select('id, name, email, phone')
        .order('name');

      if (error) throw error;
      setPatients(data || []);
    } catch (error: any) {
      console.error('Erro ao carregar pacientes:', error);
      toast.error('Erro ao carregar lista de pacientes');
    } finally {
      setLoadingPatients(false);
    }
  };

  // Carregar médicos
  const fetchDoctors = async () => {
    setLoadingDoctors(true);
    try {
      const { data: doctorsData, error: doctorsError } = await supabase
        .from('profiles')
        .select('id, name, specialization, email')
        .eq('role', 'doctor')
        .order('name');

      if (doctorsError) throw doctorsError;

      const { data: calendarsData, error: calendarsError } = await supabase
        .from('profile_calendars')
        .select('profile_id, calendar_id, calendar_name');

      if (calendarsError) {
        console.error('[EditEventModal] Erro ao buscar calendários:', calendarsError);
      }

      const doctorsWithCalendar = (doctorsData || []).map((doctor: any) => {
        const calendar = calendarsData?.find(c => c.profile_id === doctor.id);
        return {
          id: doctor.id,
          name: doctor.name,
          specialization: doctor.specialization,
          email: doctor.email,
          calendar_id: calendar?.calendar_id || null,
        };
      });

      setDoctors(doctorsWithCalendar);
    } catch (error: any) {
      console.error('[EditEventModal] Erro ao carregar médicos:', error);
      toast.error('Erro ao carregar lista de médicos');
    } finally {
      setLoadingDoctors(false);
    }
  };

  // Inicializar form com dados do appointment
  useEffect(() => {
    if (open && appointment) {
      fetchPatients();
      fetchDoctors();

      // Parsear nome do paciente do appointment
      // Como appointment.patient_id contém o nome do paciente, vamos procurar pelo nome
      const patientName = appointment.patient_id;
      
      // Data e hora
      const aptDate = new Date(appointment.scheduled_at);
      const year = aptDate.getFullYear();
      const month = String(aptDate.getMonth() + 1).padStart(2, '0');
      const day = String(aptDate.getDate()).padStart(2, '0');
      const hours = String(aptDate.getHours()).padStart(2, '0');
      const minutes = String(aptDate.getMinutes()).padStart(2, '0');

      setEventDate(`${year}-${month}-${day}`);
      setStartTime(`${hours}:${minutes}`);
      
      // Calcular hora final (1 hora depois por padrão)
      const endDate = new Date(aptDate);
      endDate.setHours(endDate.getHours() + 1);
      const endHours = String(endDate.getHours()).padStart(2, '0');
      const endMinutes = String(endDate.getMinutes()).padStart(2, '0');
      setEndTime(`${endHours}:${endMinutes}`);

      setNotes(appointment.notes || '');

      // Buscar paciente pelo nome após carregar a lista
      setTimeout(async () => {
        const { data: patientData } = await supabase
          .from('patients')
          .select('id')
          .ilike('name', patientName)
          .limit(1)
          .single();
        
        if (patientData) {
          setSelectedPatientId(patientData.id);
        }
      }, 500);

      // Buscar médico pelo calendar_id
      if (appointment.doctor_id) {
        setTimeout(() => {
          const doctor = doctors.find(d => d.calendar_id === appointment.doctor_id);
          if (doctor) {
            setSelectedDoctorId(doctor.id);
          }
        }, 500);
      }
    } else {
      // Reset form quando fecha
      setSelectedPatientId('');
      setSelectedDoctorId('');
      setEventDate('');
      setStartTime('');
      setEndTime('');
      setConsultationType('primeira_consulta');
      setNotes('');
    }
  }, [open, appointment]);

  // Atualizar evento
  const handleUpdateEvent = async () => {
    if (!appointment) return;

    // Validações
    if (!selectedPatientId) {
      toast.error('Selecione um paciente');
      return;
    }
    if (!selectedDoctorId) {
      toast.error('Selecione um médico');
      return;
    }
    if (!eventDate) {
      toast.error('Selecione uma data');
      return;
    }
    if (!startTime) {
      toast.error('Selecione o horário inicial');
      return;
    }
    if (!endTime) {
      toast.error('Selecione o horário final');
      return;
    }

    setLoading(true);
    try {
      const patient = patients.find(p => p.id === selectedPatientId);
      const doctor = doctors.find(d => d.id === selectedDoctorId);

      if (!patient) throw new Error('Paciente não encontrado');
      if (!doctor) throw new Error('Médico não encontrado');

      if (!doctor.calendar_id) {
        toast.error('Este médico não possui agenda vinculada');
        setLoading(false);
        return;
      }

      // Formatar datas
      const dataInicio = `${eventDate}T${startTime}:00`;
      const dataFinal = `${eventDate}T${endTime}:00`;

      const payload = {
        event_id: appointment.id,
        calendar_id: doctor.calendar_id, // ID da agenda do Google Calendar
        nome_paciente: patient.name,
        email_paciente: patient.email || '',
        nome_medico: doctor.name,
        email_medico: doctor.email || '',
        especialidade_medico: doctor.specialization || '',
        tipo_consulta: consultationType,
        data_inicio: dataInicio,
        data_final: dataFinal,
        notas: notes || '',
      };

      console.log('[EditEventModal] Enviando para /editar-evento');
      console.log('Event ID:', appointment.id);
      console.log('Calendar ID (Agenda):', doctor.calendar_id);
      console.log('Payload completo:', payload);

      const response = await fetch('https://webhook.n8nlabz.com.br/webhook/editar-evento', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Erro ao atualizar evento: ${response.statusText}. ${errorText}`);
      }

      const data = await response.json();
      console.log('[EditEvent] Resposta do endpoint:', data);

      toast.success('Evento atualizado com sucesso!');
      onEventUpdated?.();
      onOpenChange(false);
    } catch (error: any) {
      console.error('Erro ao atualizar evento:', error);
      toast.error('Erro ao atualizar evento: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  // Deletar evento
  const handleDeleteEvent = async () => {
    if (!appointment) return;

    setLoading(true);
    try {
      const payload = {
        event_id: appointment.id,
        calendar_id: appointment.doctor_id,
      };

      console.log('[DeleteEvent] Enviando dados para deletar evento:', payload);

      const response = await fetch('https://webhook.n8nlabz.com.br/webhook/deletar-evento', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Erro ao deletar evento: ${response.statusText}. ${errorText}`);
      }

      const data = await response.json();
      console.log('[DeleteEvent] Resposta do endpoint:', data);

      toast.success('Evento deletado com sucesso!');
      onEventDeleted?.();
      onOpenChange(false);
      setShowDeleteDialog(false);
    } catch (error: any) {
      console.error('Erro ao deletar evento:', error);
      toast.error('Erro ao deletar evento: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const selectedPatient = patients.find(p => p.id === selectedPatientId);
  const selectedDoctor = doctors.find(d => d.id === selectedDoctorId);

  if (!appointment) return null;

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Edit className="h-5 w-5" />
              Editar Evento
            </DialogTitle>
            <DialogDescription>
              Atualize as informações do evento na agenda
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Seleção de Paciente */}
            <div className="space-y-2">
              <Label htmlFor="patient">Paciente *</Label>
              <Select value={selectedPatientId} onValueChange={setSelectedPatientId}>
                <SelectTrigger id="patient" disabled={loadingPatients}>
                  <SelectValue
                    placeholder={loadingPatients ? "Carregando pacientes..." : "Selecione um paciente"}
                  />
                </SelectTrigger>
                <SelectContent>
                  {patients.map((patient) => (
                    <SelectItem key={patient.id} value={patient.id}>
                      <div className="flex flex-col">
                        <span className="font-medium">{patient.name}</span>
                        {patient.phone && (
                          <span className="text-xs text-muted-foreground">
                            {patient.phone}
                          </span>
                        )}
                      </div>
                    </SelectItem>
                  ))}
                  {!loadingPatients && patients.length === 0 && (
                    <SelectItem value="empty" disabled>
                      Nenhum paciente cadastrado
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>

            {/* Seleção de Médico */}
            <div className="space-y-2">
              <Label htmlFor="doctor">Médico *</Label>
              <Select value={selectedDoctorId} onValueChange={setSelectedDoctorId}>
                <SelectTrigger id="doctor" disabled={loadingDoctors}>
                  <SelectValue
                    placeholder={loadingDoctors ? "Carregando médicos..." : "Selecione um médico"}
                  />
                </SelectTrigger>
                <SelectContent>
                  {doctors.map((doctor) => (
                    <SelectItem
                      key={doctor.id}
                      value={doctor.id}
                      disabled={!doctor.calendar_id}
                    >
                      <div className="flex items-center justify-between w-full gap-2">
                        <div className="flex flex-col">
                          <span className="font-medium">{doctor.name}</span>
                          {doctor.specialization && (
                            <span className="text-xs text-muted-foreground">
                              {doctor.specialization}
                            </span>
                          )}
                        </div>
                        {!doctor.calendar_id && (
                          <span className="text-xs text-orange-500">
                            (Sem agenda)
                          </span>
                        )}
                      </div>
                    </SelectItem>
                  ))}
                  {!loadingDoctors && doctors.length === 0 && (
                    <SelectItem value="empty" disabled>
                      Nenhum médico cadastrado
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>

            {/* Tipo de Consulta */}
            <div className="space-y-2">
              <Label htmlFor="consultationType">Tipo de Consulta *</Label>
              <Select value={consultationType} onValueChange={setConsultationType}>
                <SelectTrigger id="consultationType">
                  <SelectValue placeholder="Selecione o tipo de consulta" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="primeira_consulta">Primeira Consulta</SelectItem>
                  <SelectItem value="retorno">Retorno</SelectItem>
                  <SelectItem value="procedimento">Procedimento</SelectItem>
                  <SelectItem value="avaliacao">Avaliação</SelectItem>
                  <SelectItem value="teleconsulta">Teleconsulta</SelectItem>
                  <SelectItem value="outro">Outro</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Data do Evento */}
            <div className="space-y-2">
              <Label htmlFor="eventDate">Data *</Label>
              <Input
                id="eventDate"
                type="date"
                value={eventDate}
                onChange={(e) => setEventDate(e.target.value)}
              />
            </div>

            {/* Horários */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="startTime" className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Horário Inicial *
                </Label>
                <Input
                  id="startTime"
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="endTime" className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Horário Final *
                </Label>
                <Input
                  id="endTime"
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                />
              </div>
            </div>

            {/* Notas */}
            <div className="space-y-2">
              <Label htmlFor="notes">Observações</Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Informações adicionais..."
                rows={3}
              />
            </div>
          </div>

          <DialogFooter className="flex justify-between">
            <Button
              variant="destructive"
              onClick={() => setShowDeleteDialog(true)}
              disabled={loading}
              className="mr-auto"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Deletar
            </Button>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
                Cancelar
              </Button>
              <Button onClick={handleUpdateEvent} disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  'Salvar Alterações'
                )}
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog de confirmação de exclusão */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja deletar este evento? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={loading}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteEvent}
              disabled={loading}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deletando...
                </>
              ) : (
                'Deletar Evento'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

