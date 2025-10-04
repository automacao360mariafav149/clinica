import { useState, useMemo, useEffect } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { MagicBentoCard } from '@/components/bento/MagicBento';
import { MonthCalendar } from '@/components/calendar/MonthCalendar';
import { useRealtimeList } from '@/hooks/useRealtimeList';
import { useAuth } from '@/contexts/AuthContext';
import { useDoctorSchedule, DoctorSchedule as ScheduleType } from '@/hooks/useDoctorSchedule';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle 
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Calendar, Clock, User, FileText, Save, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface Appointment {
  id: string;
  patient_id: string;
  doctor_id?: string;
  scheduled_at: string;
  status: string;
  notes?: string;
}

const DAYS_OF_WEEK = [
  { value: 0, label: 'Domingo' },
  { value: 1, label: 'Segunda-feira' },
  { value: 2, label: 'Terça-feira' },
  { value: 3, label: 'Quarta-feira' },
  { value: 4, label: 'Quinta-feira' },
  { value: 5, label: 'Sexta-feira' },
  { value: 6, label: 'Sábado' },
];

export default function Agenda() {
  const { user } = useAuth();

  // Filtra appointments baseado na role do usuário
  const filters = useMemo(() => {
    if (user?.role === 'doctor') {
      // Médico vê apenas seus próprios appointments
      return [{ column: 'doctor_id', operator: 'eq' as const, value: user.id }];
    }
    // Owner e secretary veem todos
    return undefined;
  }, [user?.role, user?.id]);

  const { data, loading, error } = useRealtimeList<Appointment>({
    table: 'appointments',
    order: { column: 'scheduled_at', ascending: true },
    filters: filters,
  });

  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // Hook para gerenciar horários (apenas para médicos)
  const { schedules, saveSchedule, loading: schedulesLoading } = useDoctorSchedule(user?.role === 'doctor' ? user.id : '');
  const [isSaving, setIsSaving] = useState(false);
  const [localSchedules, setLocalSchedules] = useState<Record<number, ScheduleType>>({});

  // Inicializa os horários locais quando os dados são carregados (apenas para médicos)
  useEffect(() => {
    if (user?.role !== 'doctor' || !user?.id) return;
    
    // Cria um mapa completo com todos os dias da semana
    const scheduleMap: Record<number, ScheduleType> = {};
    
    if (schedules.length > 0) {
      // Se há horários salvos, carrega do banco
      schedules.forEach((schedule) => {
        scheduleMap[schedule.day_of_week] = schedule;
      });
      
      // Preenche dias que não foram configurados ainda com valores padrão
      DAYS_OF_WEEK.forEach((day) => {
        if (!scheduleMap[day.value]) {
          scheduleMap[day.value] = {
            doctor_id: user.id,
            day_of_week: day.value,
            start_time: '08:00',
            end_time: '18:00',
            appointment_duration: 30,
            break_start_time: '12:00',
            break_end_time: '13:00',
            is_active: false, // Padrão: inativo para dias não configurados
          };
        }
      });
    } else if (!schedulesLoading) {
      // Se não há horários salvos E já terminou de carregar, inicializa com valores padrão
      DAYS_OF_WEEK.forEach((day) => {
        scheduleMap[day.value] = {
          doctor_id: user.id,
          day_of_week: day.value,
          start_time: '08:00',
          end_time: '18:00',
          appointment_duration: 30,
          break_start_time: '12:00',
          break_end_time: '13:00',
          is_active: day.value >= 1 && day.value <= 5, // Segunda a Sexta ativo por padrão
        };
      });
    }
    
    // Só atualiza se houver dados
    if (Object.keys(scheduleMap).length > 0) {
      setLocalSchedules(scheduleMap);
    }
  }, [schedules, schedulesLoading, user?.role, user?.id]);

  const handleAppointmentClick = (appointment: Appointment) => {
    setSelectedAppointment(appointment);
    setIsDialogOpen(true);
  };

  const handleDayClick = (date: Date) => {
    console.log('Dia clicado:', date);
    // Aqui você pode adicionar lógica para criar novo appointment, por exemplo
  };

  const getStatusBadgeVariant = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      scheduled: 'default',
      confirmed: 'default',
      cancelled: 'destructive',
      completed: 'secondary',
      pending: 'outline',
    };
    return variants[status] || 'default';
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      scheduled: 'Agendado',
      confirmed: 'Confirmado',
      cancelled: 'Cancelado',
      completed: 'Concluído',
      pending: 'Pendente',
    };
    return labels[status] || status;
  };

  const handleScheduleChange = (dayOfWeek: number, field: keyof ScheduleType, value: any) => {
    setLocalSchedules((prev) => ({
      ...prev,
      [dayOfWeek]: {
        ...prev[dayOfWeek],
        [field]: value,
      },
    }));
  };

  const handleSaveSchedules = async () => {
    if (!user || user.role !== 'doctor') return;

    setIsSaving(true);
    try {
      const promises = Object.values(localSchedules).map((schedule) => {
        if (schedule.is_active) {
          return saveSchedule(schedule);
        }
        if (schedule.id) {
          return saveSchedule({ ...schedule, is_active: false });
        }
        return Promise.resolve();
      });

      await Promise.all(promises);
      toast.success('Horários salvos com sucesso!');
    } catch (error: any) {
      toast.error('Erro ao salvar horários: ' + error.message);
    } finally {
      setIsSaving(false);
    }
  };

  // Renderiza a visualização da agenda (calendário)
  const renderAgendaView = () => (
    <MagicBentoCard contentClassName="p-0 min-h-[calc(100vh-20rem)]">
      {!loading && !error && (
        <MonthCalendar
          appointments={data}
          onDayClick={handleDayClick}
          onAppointmentClick={handleAppointmentClick}
        />
      )}
      {loading && (
        <div className="flex items-center justify-center h-full">
          <div className="text-muted-foreground">Carregando calendário...</div>
        </div>
      )}
      {error && (
        <div className="flex items-center justify-center h-full">
          <div className="text-destructive">Erro ao carregar: {error}</div>
        </div>
      )}
    </MagicBentoCard>
  );

  // Renderiza a configuração de horários (apenas para médicos)
  const renderScheduleConfig = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <p className="text-muted-foreground">
          Configure seus horários de trabalho para cada dia da semana
        </p>
        <Button onClick={handleSaveSchedules} disabled={isSaving}>
          {isSaving ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Salvando...
            </>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" />
              Salvar Todos
            </>
          )}
        </Button>
      </div>

      <div className="grid gap-4">
        {DAYS_OF_WEEK.map((day) => {
          const schedule = localSchedules[day.value];
          if (!schedule) return null;

          return (
            <MagicBentoCard key={day.value} contentClassName="p-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">{day.label}</h3>
                  <div className="flex items-center gap-2">
                    <Label htmlFor={`active-${day.value}`}>Ativo</Label>
                    <Switch
                      id={`active-${day.value}`}
                      checked={schedule.is_active}
                      onCheckedChange={(checked) =>
                        handleScheduleChange(day.value, 'is_active', checked)
                      }
                    />
                  </div>
                </div>

                {schedule.is_active && (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor={`start-${day.value}`}>Início</Label>
                      <Input
                        id={`start-${day.value}`}
                        type="time"
                        value={schedule.start_time}
                        onChange={(e) =>
                          handleScheduleChange(day.value, 'start_time', e.target.value)
                        }
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor={`end-${day.value}`}>Fim</Label>
                      <Input
                        id={`end-${day.value}`}
                        type="time"
                        value={schedule.end_time}
                        onChange={(e) =>
                          handleScheduleChange(day.value, 'end_time', e.target.value)
                        }
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor={`duration-${day.value}`}>
                        Duração da Consulta (min)
                      </Label>
                      <Input
                        id={`duration-${day.value}`}
                        type="number"
                        min="15"
                        step="5"
                        value={schedule.appointment_duration}
                        onChange={(e) =>
                          handleScheduleChange(
                            day.value,
                            'appointment_duration',
                            parseInt(e.target.value)
                          )
                        }
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor={`break-start-${day.value}`}>
                        Início Intervalo
                      </Label>
                      <Input
                        id={`break-start-${day.value}`}
                        type="time"
                        value={schedule.break_start_time || ''}
                        onChange={(e) =>
                          handleScheduleChange(
                            day.value,
                            'break_start_time',
                            e.target.value || undefined
                          )
                        }
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor={`break-end-${day.value}`}>
                        Fim Intervalo
                      </Label>
                      <Input
                        id={`break-end-${day.value}`}
                        type="time"
                        value={schedule.break_end_time || ''}
                        onChange={(e) =>
                          handleScheduleChange(
                            day.value,
                            'break_end_time',
                            e.target.value || undefined
                          )
                        }
                      />
                    </div>
                  </div>
                )}
              </div>
            </MagicBentoCard>
          );
        })}
      </div>
    </div>
  );

  return (
    <DashboardLayout>
      <div className="p-8 space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Agenda</h1>
          <p className="text-muted-foreground mt-1">
            {loading ? 'Carregando agendamentos...' : 
             error ? `Erro ao carregar: ${error}` : 
             user?.role === 'doctor' 
               ? `${data.length} agendamento(s) seus` 
               : `${data.length} agendamento(s) no total`}
          </p>
        </div>

        {user?.role === 'doctor' ? (
          // Médicos veem abas: Visão Geral e Configurar Horários
          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="grid w-full max-w-md grid-cols-2">
              <TabsTrigger value="overview">Visão Geral</TabsTrigger>
              <TabsTrigger value="schedule">Configurar Horários</TabsTrigger>
            </TabsList>
            
            <TabsContent value="overview" className="mt-6">
              {renderAgendaView()}
            </TabsContent>
            
            <TabsContent value="schedule" className="mt-6">
              {renderScheduleConfig()}
            </TabsContent>
          </Tabs>
        ) : (
          // Owner e Secretary veem apenas a agenda
          renderAgendaView()
        )}
      </div>

      {/* Dialog de detalhes do appointment */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Detalhes do Agendamento</DialogTitle>
            <DialogDescription>
              Informações completas sobre o agendamento selecionado
            </DialogDescription>
          </DialogHeader>
          {selectedAppointment && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Paciente</p>
                  <p className="text-sm text-muted-foreground">{selectedAppointment.patient_id}</p>
                </div>
              </div>

              {selectedAppointment.doctor_id && (
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Médico</p>
                    <p className="text-sm text-muted-foreground">{selectedAppointment.doctor_id}</p>
                  </div>
                </div>
              )}

              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Data</p>
                  <p className="text-sm text-muted-foreground">
                    {new Date(selectedAppointment.scheduled_at).toLocaleDateString('pt-BR', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Horário</p>
                  <p className="text-sm text-muted-foreground">
                    {new Date(selectedAppointment.scheduled_at).toLocaleTimeString('pt-BR', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <div className="h-4 w-4" />
                <div>
                  <p className="text-sm font-medium">Status</p>
                  <Badge variant={getStatusBadgeVariant(selectedAppointment.status)}>
                    {getStatusLabel(selectedAppointment.status)}
                  </Badge>
                </div>
              </div>

              {selectedAppointment.notes && (
                <div className="flex items-start gap-2">
                  <FileText className="h-4 w-4 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-sm font-medium">Notas</p>
                    <p className="text-sm text-muted-foreground">{selectedAppointment.notes}</p>
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
