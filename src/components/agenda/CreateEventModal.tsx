import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Plus, Search, User, Calendar, Clock } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabaseClient';
import { getApiBaseUrl } from '@/lib/apiConfig';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';

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

interface CreateEventModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialDate?: Date;
  initialStartTime?: string;
  calendarId?: string;
  onEventCreated?: () => void;
}

export function CreateEventModal({
  open,
  onOpenChange,
  initialDate,
  initialStartTime,
  calendarId,
  onEventCreated,
}: CreateEventModalProps) {
  const [loading, setLoading] = useState(false);
  const [loadingPatients, setLoadingPatients] = useState(false);
  const [loadingDoctors, setLoadingDoctors] = useState(false);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [showNewPatientForm, setShowNewPatientForm] = useState(false);
  const [openPatientCombo, setOpenPatientCombo] = useState(false);

  // Dados do evento
  const [selectedPatientId, setSelectedPatientId] = useState<string>('');
  const [selectedDoctorId, setSelectedDoctorId] = useState<string>('');
  const [eventDate, setEventDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [consultationType, setConsultationType] = useState('primeira_consulta');
  const [notes, setNotes] = useState('');

  // Dados do novo paciente
  const [newPatientName, setNewPatientName] = useState('');
  const [newPatientEmail, setNewPatientEmail] = useState('');
  const [newPatientPhone, setNewPatientPhone] = useState('');

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
      // Primeiro busca os médicos
      const { data: doctorsData, error: doctorsError } = await supabase
        .from('profiles')
        .select('id, name, specialization, email')
        .eq('role', 'doctor')
        .order('name');

      if (doctorsError) throw doctorsError;
      
      console.log('[CreateEventModal] Médicos encontrados:', doctorsData);
      
      // Depois busca os calendários vinculados
      const { data: calendarsData, error: calendarsError } = await supabase
        .from('profile_calendars')
        .select('profile_id, calendar_id, calendar_name');
      
      if (calendarsError) {
        console.error('[CreateEventModal] Erro ao buscar calendários:', calendarsError);
      }
      
      console.log('[CreateEventModal] Calendários encontrados:', calendarsData);
      
      // Combinar os dados
      const doctorsWithCalendar = (doctorsData || []).map((doctor: any) => {
        const calendar = calendarsData?.find(c => c.profile_id === doctor.id);
        
        console.log(`[CreateEventModal] Médico: ${doctor.name}, Calendar vinculado:`, calendar);
        
        return {
          id: doctor.id,
          name: doctor.name,
          specialization: doctor.specialization,
          email: doctor.email,
          calendar_id: calendar?.calendar_id || null,
        };
      });
      
      console.log('[CreateEventModal] Médicos processados com calendários:', doctorsWithCalendar);
      setDoctors(doctorsWithCalendar);
    } catch (error: any) {
      console.error('[CreateEventModal] Erro ao carregar médicos:', error);
      toast.error('Erro ao carregar lista de médicos');
    } finally {
      setLoadingDoctors(false);
    }
  };

  // Inicializar data e hora quando o modal abre
  useEffect(() => {
    if (open) {
      fetchPatients();
      fetchDoctors();
      
      if (initialDate) {
        const year = initialDate.getFullYear();
        const month = String(initialDate.getMonth() + 1).padStart(2, '0');
        const day = String(initialDate.getDate()).padStart(2, '0');
        setEventDate(`${year}-${month}-${day}`);
      }
      
      if (initialStartTime) {
        setStartTime(initialStartTime);
        
        // Calcular hora final (1 hora depois)
        const [hours, minutes] = initialStartTime.split(':').map(Number);
        const endHours = hours + 1;
        setEndTime(`${String(endHours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`);
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
      setNewPatientName('');
      setNewPatientEmail('');
      setNewPatientPhone('');
      setShowNewPatientForm(false);
    }
  }, [open, initialDate, initialStartTime]);

  // Criar novo paciente
  const handleCreatePatient = async () => {
    if (!newPatientName.trim()) {
      toast.error('Nome do paciente é obrigatório');
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('patients')
        .insert({
          name: newPatientName.trim(),
          email: newPatientEmail.trim() || null,
          phone: newPatientPhone.trim() || null,
        })
        .select()
        .single();

      if (error) throw error;

      toast.success('Paciente criado com sucesso!');
      setSelectedPatientId(data.id);
      setShowNewPatientForm(false);
      setNewPatientName('');
      setNewPatientEmail('');
      setNewPatientPhone('');
      
      // Recarregar lista de pacientes
      await fetchPatients();
    } catch (error: any) {
      console.error('Erro ao criar paciente:', error);
      toast.error('Erro ao criar paciente: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  // Criar evento
  const handleCreateEvent = async () => {
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
      // Buscar informações do paciente e médico
      const patient = patients.find(p => p.id === selectedPatientId);
      const doctor = doctors.find(d => d.id === selectedDoctorId);
      
      if (!patient) throw new Error('Paciente não encontrado');
      if (!doctor) throw new Error('Médico não encontrado');
      
      // Verificar se o médico tem agenda vinculada
      if (!doctor.calendar_id) {
        toast.error('Este médico não possui agenda vinculada');
        setLoading(false);
        return;
      }

      // Formatar datas para o endpoint (sem timezone)
      const dataInicio = `${eventDate}T${startTime}:00`;
      const dataFinal = `${eventDate}T${endTime}:00`;

      // Preparar payload para o endpoint
      // Usa o calendar_id do médico selecionado
      const payload = {
        calendar_id: doctor.calendar_id,
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

      console.log('[CreateEvent] Enviando dados para criar evento:', payload);
      console.log('[CreateEvent] Calendar ID do médico:', doctor.calendar_id);

      const apiBaseUrl = await getApiBaseUrl();
      const response = await fetch(`${apiBaseUrl}/criar-evento`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Erro ao criar evento: ${response.statusText}. ${errorText}`);
      }

      const data = await response.json();
      console.log('[CreateEvent] Resposta do endpoint:', data);

      toast.success('Evento criado com sucesso!');
      onEventCreated?.();
      onOpenChange(false);
    } catch (error: any) {
      console.error('Erro ao criar evento:', error);
      toast.error('Erro ao criar evento: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const selectedPatient = patients.find(p => p.id === selectedPatientId);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Criar Novo Evento
          </DialogTitle>
          <DialogDescription>
            Preencha as informações do evento para adicioná-lo à agenda
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Seleção de Paciente */}
          <div className="space-y-2">
            <Label>Paciente *</Label>
            {!showNewPatientForm ? (
              <div className="flex gap-2">
                <Popover open={openPatientCombo} onOpenChange={setOpenPatientCombo}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={openPatientCombo}
                      className="flex-1 justify-between"
                      disabled={loadingPatients}
                    >
                      {loadingPatients ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Carregando...
                        </>
                      ) : selectedPatient ? (
                        <>
                          <User className="mr-2 h-4 w-4" />
                          {selectedPatient.name}
                        </>
                      ) : (
                        <>
                          <Search className="mr-2 h-4 w-4" />
                          Buscar paciente...
                        </>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[400px] p-0">
                    <Command>
                      <CommandInput placeholder="Buscar paciente..." />
                      <CommandEmpty>Nenhum paciente encontrado.</CommandEmpty>
                      <CommandList>
                        <CommandGroup>
                          {patients.map((patient) => (
                            <CommandItem
                              key={patient.id}
                              value={patient.name}
                              onSelect={() => {
                                setSelectedPatientId(patient.id);
                                setOpenPatientCombo(false);
                              }}
                            >
                              <div className="flex flex-col">
                                <span className="font-medium">{patient.name}</span>
                                {patient.phone && (
                                  <span className="text-xs text-muted-foreground">
                                    {patient.phone}
                                  </span>
                                )}
                              </div>
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setShowNewPatientForm(true)}
                  title="Criar novo paciente"
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <div className="space-y-3 p-4 border rounded-lg bg-muted/30">
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-semibold">Novo Paciente</Label>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowNewPatientForm(false)}
                  >
                    Cancelar
                  </Button>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="newPatientName">Nome *</Label>
                  <Input
                    id="newPatientName"
                    value={newPatientName}
                    onChange={(e) => setNewPatientName(e.target.value)}
                    placeholder="Nome completo do paciente"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="newPatientEmail">Email</Label>
                  <Input
                    id="newPatientEmail"
                    type="email"
                    value={newPatientEmail}
                    onChange={(e) => setNewPatientEmail(e.target.value)}
                    placeholder="email@exemplo.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="newPatientPhone">Telefone</Label>
                  <Input
                    id="newPatientPhone"
                    value={newPatientPhone}
                    onChange={(e) => setNewPatientPhone(e.target.value)}
                    placeholder="(00) 00000-0000"
                  />
                </div>
                <Button
                  onClick={handleCreatePatient}
                  disabled={loading || !newPatientName.trim()}
                  className="w-full"
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Criando...
                    </>
                  ) : (
                    <>
                      <Plus className="mr-2 h-4 w-4" />
                      Criar Paciente
                    </>
                  )}
                </Button>
              </div>
            )}
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

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            Cancelar
          </Button>
          <Button onClick={handleCreateEvent} disabled={loading || showNewPatientForm}>
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Criando...
              </>
            ) : (
              'Criar Evento'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

