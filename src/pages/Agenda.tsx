import { useState, useMemo, useEffect } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { MagicBentoCard } from '@/components/bento/MagicBento';
import { MonthCalendar } from '@/components/calendar/MonthCalendar';
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar, Clock, User, FileText, Save, Loader2, Filter } from 'lucide-react';
import { toast } from 'sonner';

interface Appointment {
  id: string;
  patient_id: string;
  doctor_id?: string;
  scheduled_at: string;
  status: string;
  notes?: string;
}

interface AgendaItem {
  id: string;
  nome: string;
  timeZone?: string;
  accessRole?: string;
  color?: string;
  isPrimary?: boolean;
  isSelected?: boolean;
}

interface AgendaData {
  [key: string]: any;
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

  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // Estados para gestão de agendas (owner)
  const [agendas, setAgendas] = useState<AgendaItem[]>([]);
  const [selectedAgenda, setSelectedAgenda] = useState<string>('todos');
  const [agendaData, setAgendaData] = useState<AgendaData | null>(null);
  const [loadingAgendas, setLoadingAgendas] = useState(false);
  const [loadingAgendaData, setLoadingAgendaData] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [externalAppointments, setExternalAppointments] = useState<Appointment[]>([]);

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

  // Função para buscar lista de agendas (owner)
  const fetchAgendas = async () => {
    if (user?.role !== 'owner') return;

    console.log('[Agenda] Buscando lista de agendas...');
    setLoadingAgendas(true);
    try {
      const response = await fetch('https://webhook.n8nlabz.com.br/webhook/gestao-agendas', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ funcao: 'leitura' }),
      });

      if (!response.ok) {
        throw new Error(`Erro ao buscar agendas: ${response.statusText}`);
      }

      const data = await response.json();
      console.log('[Agenda] Resposta do endpoint gestao-agendas:', data);
      
      // Processa a estrutura retornada pelo endpoint
      // Estrutura esperada: { count: X, calendars: [...] }
      let agendasList: AgendaItem[] = [];
      
      if (data && data.calendars && Array.isArray(data.calendars)) {
        // Mapeia os calendars para o formato esperado, excluindo calendários primários
        agendasList = data.calendars
          .filter((calendar: any) => calendar['Primary Calendar'] !== 'Yes')
          .map((calendar: any) => ({
            id: calendar['Calendar ID'],
            nome: calendar['Calendar Name'],
            timeZone: calendar['Time Zone'],
            accessRole: calendar['Access Role'],
            color: calendar['Color'],
            isPrimary: calendar['Primary Calendar'] === 'Yes',
            isSelected: calendar['Selected'] === 'Yes',
          }));
      }
      
      console.log('[Agenda] Agendas processadas:', agendasList);
      setAgendas(agendasList);
      
      if (agendasList.length > 0) {
        toast.success(`${agendasList.length} agenda(s) carregada(s) com sucesso`);
      } else {
        toast.info('Nenhuma agenda disponível no momento');
      }
    } catch (error: any) {
      console.error('[Agenda] Erro ao buscar agendas:', error);
      toast.error(`Erro ao buscar agendas: ${error.message}`);
      setAgendas([]);
    } finally {
      setLoadingAgendas(false);
    }
  };

  // Traduz nomes de feriados comuns
  const translateHolidayName = (name: string): string => {
    const translations: Record<string, string> = {
      "Our Lady of Aparecida / Children's Day": "Nossa Senhora Aparecida / Dia das Crianças",
      "Teacher's Day": "Dia do Professor",
      "Public Service Holiday": "Dia do Servidor Público",
      "New Year's Day": "Ano Novo",
      "Carnival": "Carnaval",
      "Good Friday": "Sexta-feira Santa",
      "Tiradentes' Day": "Tiradentes",
      "Labour Day": "Dia do Trabalhador",
      "Corpus Christi": "Corpus Christi",
      "Independence Day": "Independência do Brasil",
      "All Souls' Day": "Finados",
      "Republic Day": "Proclamação da República",
      "Black Consciousness Day": "Dia da Consciência Negra",
      "Christmas Day": "Natal",
      "Christmas Eve": "Véspera de Natal",
    };
    
    return translations[name] || name;
  };

  // Processa os eventos retornados do endpoint para o formato Appointment
  const processExternalEvents = (data: any): Appointment[] => {
    if (!data) return [];
    
    try {
      let events: any[] = [];
      
      // Tenta diferentes estruturas de resposta
      if (Array.isArray(data)) {
        events = data;
      } else if (data.events && Array.isArray(data.events)) {
        events = data.events;
      } else if (data.items && Array.isArray(data.items)) {
        events = data.items;
      } else if (data.data && Array.isArray(data.data)) {
        events = data.data;
      }
      
      console.log('[Agenda] Processando eventos:', events);
      
      // Filtra eventos válidos e mapeia para o formato Appointment
      return events
        .filter((event: any) => {
          // Remove objetos vazios ou sem ID/summary
          return event && (event.id || event.eventId) && (event.summary || event.title);
        })
        .map((event: any, index: number) => {
          // Processa a data do evento
          let scheduledAt: string;
          let isAllDayEvent = false;
          
          if (event.start?.dateTime) {
            // Evento com hora específica
            scheduledAt = event.start.dateTime;
          } else if (event.start?.date) {
            // Evento de dia inteiro - usa a data com hora 00:00
            scheduledAt = new Date(event.start.date + 'T00:00:00').toISOString();
            isAllDayEvent = true;
          } else if (event.data_inicio) {
            scheduledAt = event.data_inicio;
          } else if (event.scheduled_at) {
            scheduledAt = event.scheduled_at;
          } else {
            // Se não tem data válida, pula este evento
            console.warn('[Agenda] Evento sem data válida:', event);
            return null;
          }
          
          // Identifica se é um feriado
          const isHoliday = event.creator?.email?.includes('holiday@group.v.calendar.google.com') ||
                           event.organizer?.email?.includes('holiday@group.v.calendar.google.com') ||
                           event.creator?.displayName?.toLowerCase().includes('holiday') ||
                           event.organizer?.displayName?.toLowerCase().includes('holiday');
          
          // Traduz o nome se for feriado
          const eventName = isHoliday 
            ? translateHolidayName(event.summary || event.title || event.nome || 'Sem título')
            : event.summary || event.title || event.nome || 'Sem título';
          
          return {
            id: event.id || event.eventId || `external-${index}`,
            patient_id: eventName,
            doctor_id: event.calendarId || event.calendar_id || selectedAgenda,
            scheduled_at: scheduledAt,
            status: isHoliday ? 'holiday' : (event.status === 'confirmed' ? 'confirmed' : 'scheduled'),
            notes: event.description || event.notes || event.descricao || '',
          };
        })
        .filter((event): event is Appointment => event !== null);
    } catch (error) {
      console.error('[Agenda] Erro ao processar eventos:', error);
      return [];
    }
  };

  // Calcula as datas visíveis no calendário mensal
  const getCalendarDateRange = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    
    // Primeiro dia do mês
    const firstDayOfMonth = new Date(year, month, 1);
    const startingDayOfWeek = firstDayOfMonth.getDay();
    
    // Último dia do mês
    const lastDayOfMonth = new Date(year, month + 1, 0);
    const daysInMonth = lastDayOfMonth.getDate();
    
    // Calcular total de células necessárias
    const totalCells = Math.ceil((daysInMonth + startingDayOfWeek) / 7) * 7;
    const nextMonthDays = totalCells - (daysInMonth + startingDayOfWeek);
    
    // Primeiro dia visível (pode ser do mês anterior)
    const firstVisibleDay = new Date(year, month, 1 - startingDayOfWeek);
    firstVisibleDay.setHours(0, 1, 0, 0); // 00:01
    
    // Último dia visível (pode ser do próximo mês)
    const lastVisibleDay = new Date(year, month, daysInMonth + nextMonthDays);
    lastVisibleDay.setHours(23, 59, 59, 999); // 23:59
    
    return {
      data_inicio: firstVisibleDay.toISOString(),
      data_final: lastVisibleDay.toISOString(),
    };
  };

  // Função para buscar detalhes de uma agenda específica ou todas (owner)
  const fetchAgendaDetails = async (tipoBusca: 'todos' | 'individual', agendaId?: string) => {
    if (user?.role !== 'owner') return;

    setLoadingAgendaData(true);
    try {
      const dateRange = getCalendarDateRange(currentMonth);
      
      const body: { 
        tipo_busca: string; 
        id?: string;
        data_inicio: string;
        data_final: string;
      } = { 
        tipo_busca: tipoBusca,
        data_inicio: dateRange.data_inicio,
        data_final: dateRange.data_final,
      };
      
      if (tipoBusca === 'individual' && agendaId) {
        body.id = agendaId;
      }

      console.log('[Agenda] Buscando dados da agenda com body:', body);

      const response = await fetch('https://webhook.n8nlabz.com.br/webhook/ver-agenda-medx', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        throw new Error(`Erro ao buscar dados da agenda: ${response.statusText}`);
      }

      const data = await response.json();
      console.log('[Agenda] Dados da agenda recebidos:', data);
      setAgendaData(data);
      
      // Processa os eventos e atualiza o calendário
      const processedEvents = processExternalEvents(data);
      console.log('[Agenda] Eventos processados:', processedEvents);
      setExternalAppointments(processedEvents);
      
      toast.success(`${processedEvents.length} evento(s) carregado(s) com sucesso`);
    } catch (error: any) {
      console.error('[Agenda] Erro ao buscar dados da agenda:', error);
      toast.error(`Erro ao buscar dados da agenda: ${error.message}`);
      setAgendaData(null);
      setExternalAppointments([]);
    } finally {
      setLoadingAgendaData(false);
    }
  };

  // Carrega a lista de agendas quando o usuário é owner
  useEffect(() => {
    if (user?.role === 'owner') {
      console.log('[Agenda] Usuário é owner, carregando agendas automaticamente...');
      fetchAgendas();
    }
  }, [user?.role]);

  // Busca dados da agenda quando a seleção ou mês muda
  useEffect(() => {
    if (user?.role === 'owner' && selectedAgenda) {
      if (selectedAgenda === 'todos') {
        fetchAgendaDetails('todos');
      } else {
        fetchAgendaDetails('individual', selectedAgenda);
      }
    }
  }, [user?.role, selectedAgenda, currentMonth]);

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
      holiday: 'secondary',
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
      holiday: 'Feriado',
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

  // Sempre mostra dados do endpoint externo
  const displayedAppointments = externalAppointments;

  // Renderiza a visualização da agenda (calendário)
  const renderAgendaView = () => (
    <div className="space-y-6">
      {/* Filtro de agendas (apenas para owner) */}
      {user?.role === 'owner' && (
        <MagicBentoCard contentClassName="p-6">
          <div className="flex flex-col md:flex-row md:items-end gap-4">
            <div className="flex-1 space-y-2">
              <Label htmlFor="agenda-filter" className="flex items-center gap-2">
                <Filter className="h-4 w-4" />
                Filtrar por Médico
                {loadingAgendas && (
                  <span className="text-xs text-muted-foreground">(Carregando...)</span>
                )}
              </Label>
              <Select 
                value={selectedAgenda} 
                onValueChange={setSelectedAgenda}
                disabled={loadingAgendas}
              >
                <SelectTrigger id="agenda-filter">
                  <SelectValue 
                    placeholder={loadingAgendas ? "Carregando agendas..." : "Selecione um médico"} 
                  />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos os Médicos</SelectItem>
                  {agendas.map((agenda) => (
                    <SelectItem key={agenda.id} value={agenda.id}>
                      {agenda.nome}
                    </SelectItem>
                  ))}
                  {!loadingAgendas && agendas.length === 0 && (
                    <SelectItem value="vazio" disabled>
                      Nenhuma agenda disponível
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>
            
            <Button 
              onClick={fetchAgendas} 
              disabled={loadingAgendas}
              variant="outline"
              className="md:w-auto w-full"
            >
              {loadingAgendas ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Atualizando...
                </>
              ) : (
                'Atualizar Lista'
              )}
            </Button>
          </div>

          {/* Status da agenda */}
          {!loadingAgendaData && externalAppointments.length > 0 && (
            <div className="mt-4">
              <p className="text-sm text-green-600 flex items-center gap-2">
                <span className="inline-block w-2 h-2 bg-green-600 rounded-full"></span>
                {externalAppointments.length} evento(s) carregado(s) e exibidos no calendário
              </p>
            </div>
          )}
        </MagicBentoCard>
      )}

      {/* Calendário */}
      <MagicBentoCard contentClassName="p-0 min-h-[calc(100vh-20rem)]">
        {!loadingAgendaData && (
          <MonthCalendar
            appointments={displayedAppointments}
            onDayClick={handleDayClick}
            onAppointmentClick={handleAppointmentClick}
          />
        )}
        {loadingAgendaData && (
          <div className="flex items-center justify-center h-full min-h-[400px]">
            <div className="flex flex-col items-center gap-3">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <div className="text-muted-foreground">
                Carregando eventos da agenda...
              </div>
            </div>
          </div>
        )}
      </MagicBentoCard>
    </div>
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
            {loadingAgendaData ? 'Carregando agendamentos...' : 
             selectedAgenda
               ? `${displayedAppointments.length} evento(s) - ${selectedAgenda === 'todos' ? 'Todos os Médicos' : agendas.find(a => a.id === selectedAgenda)?.nome || 'Agenda selecionada'}`
               : 'Selecione uma agenda para visualizar os eventos'}
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
          // Owner e Secretary veem a agenda com dados do endpoint externo
          renderAgendaView()
        )}
      </div>

      {/* Dialog de detalhes do appointment */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {selectedAppointment?.status === 'holiday' ? 'Detalhes do Feriado' : 'Detalhes do Agendamento'}
            </DialogTitle>
            <DialogDescription>
              {selectedAppointment?.status === 'holiday' 
                ? 'Informações sobre o feriado nacional'
                : 'Informações completas sobre o agendamento selecionado'}
            </DialogDescription>
          </DialogHeader>
          {selectedAppointment && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                {selectedAppointment.status === 'holiday' ? (
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <User className="h-4 w-4 text-muted-foreground" />
                )}
                <div>
                  <p className="text-sm font-medium">
                    {selectedAppointment.status === 'holiday' ? 'Nome do Feriado' : 'Paciente'}
                  </p>
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

              {selectedAppointment.status !== 'holiday' && (
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
              )}

              <div className="flex items-center gap-2">
                <div className="h-4 w-4" />
                <div>
                  <p className="text-sm font-medium">Status</p>
                  <Badge variant={getStatusBadgeVariant(selectedAppointment.status)}>
                    {getStatusLabel(selectedAppointment.status)}
                    {selectedAppointment.status === 'holiday' && ' 🎉'}
                  </Badge>
                </div>
              </div>

              {selectedAppointment.status === 'holiday' && (
                <div className="p-4 bg-gradient-to-r from-purple-50 to-purple-100/50 dark:from-purple-950/30 dark:to-purple-900/20 rounded-lg border-l-4 border-l-purple-500 shadow-sm">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">🎉</span>
                    <div>
                      <p className="text-sm font-semibold text-purple-900 dark:text-purple-100">
                        Feriado Nacional
                      </p>
                      <p className="text-xs text-purple-700 dark:text-purple-300">
                        Evento de dia inteiro
                      </p>
                    </div>
                  </div>
                </div>
              )}

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
