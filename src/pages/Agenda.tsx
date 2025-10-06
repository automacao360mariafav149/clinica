import { useState, useMemo, useEffect } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { MagicBentoCard } from '@/components/bento/MagicBento';
import { MonthCalendar } from '@/components/calendar/MonthCalendar';
import { WeekCalendar } from '@/components/calendar/WeekCalendar';
import { DayCalendar } from '@/components/calendar/DayCalendar';
import { CreateEventModal } from '@/components/agenda/CreateEventModal';
import { EditEventModal } from '@/components/agenda/EditEventModal';
import { useAuth } from '@/contexts/AuthContext';
import { useDoctorSchedule, DoctorSchedule as ScheduleType } from '@/hooks/useDoctorSchedule';
import { supabase } from '@/lib/supabaseClient';
import { getApiBaseUrl } from '@/lib/apiConfig';
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
import { Calendar, Clock, User, FileText, Save, Loader2, Filter, CalendarDays, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

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

  // Estados para o modal de criação de eventos
  const [isCreateEventModalOpen, setIsCreateEventModalOpen] = useState(false);
  const [createEventDate, setCreateEventDate] = useState<Date | undefined>();
  const [createEventStartTime, setCreateEventStartTime] = useState<string | undefined>();

  // Estados para o modal de edição de eventos
  const [isEditEventModalOpen, setIsEditEventModalOpen] = useState(false);
  const [eventToEdit, setEventToEdit] = useState<Appointment | null>(null);

  // Estados para o modal de confirmação de exclusão
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [eventToDelete, setEventToDelete] = useState<Appointment | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Estado para controlar o modo de visualização
  const [viewMode, setViewMode] = useState<'month' | 'week' | 'day'>('month');

  // Estados para datas de cada modo de visualização
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [currentWeekDate, setCurrentWeekDate] = useState(new Date());
  const [currentDayDate, setCurrentDayDate] = useState(new Date());

  // Estados para gestão de agendas (owner)
  const [agendas, setAgendas] = useState<AgendaItem[]>([]);
  const [selectedAgenda, setSelectedAgenda] = useState<string>('todos');
  const [agendaData, setAgendaData] = useState<AgendaData | null>(null);
  const [loadingAgendas, setLoadingAgendas] = useState(false);
  const [loadingAgendaData, setLoadingAgendaData] = useState(false);
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
      const apiBaseUrl = await getApiBaseUrl();
      const response = await fetch(`${apiBaseUrl}/gestao-agendas`, {
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
          
          // Capturar o calendar_id SEMPRE do evento, NUNCA do filtro
          // Prioridade: calendarId > calendar_id > organizer.email
          const calendarId = event.calendarId || event.calendar_id || event.organizer?.email || null;
          
          // Log para verificar se calendar_id está sendo capturado corretamente
          if (index === 0) {
            console.log('[Agenda] 🔍 DEBUG - Exemplo de evento processado:');
            console.log('  - event.calendarId:', event.calendarId);
            console.log('  - event.calendar_id:', event.calendar_id);
            console.log('  - event.organizer?.email:', event.organizer?.email);
            console.log('  - Calendar ID FINAL:', calendarId);
            console.log('  - ❌ ALERTA: É "todos"?', calendarId === 'todos');
          }
          
          // Se não conseguiu capturar o calendar_id, pula este evento
          if (!calendarId || calendarId === 'todos') {
            console.warn('[Agenda] ⚠️ Evento sem calendar_id válido, será ignorado:', event);
            return null;
          }
          
          return {
            id: event.id || event.eventId || `external-${index}`,
            patient_id: eventName,
            doctor_id: calendarId, // Armazena o calendar_id do Google Calendar (NUNCA "todos")
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

  // Função para formatar data sem timezone (YYYY-MM-DDTHH:MM:SS)
  const formatDateWithoutTimezone = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
    
    return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}`;
  };

  // Calcula o range de datas para o modo MENSAL
  const getMonthDateRange = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    
    // Primeiro dia do mês às 00:00:00
    const firstDay = new Date(year, month, 1, 0, 0, 0);
    
    // Último dia do mês às 23:59:59
    const lastDay = new Date(year, month + 1, 0, 23, 59, 59);
    
    return {
      data_inicio: formatDateWithoutTimezone(firstDay),
      data_final: formatDateWithoutTimezone(lastDay),
    };
  };

  // Calcula o range de datas para o modo SEMANAL
  const getWeekDateRange = (date: Date) => {
    const d = new Date(date);
    const day = d.getDay(); // 0 = domingo, 6 = sábado
    
    // Primeiro dia da semana (domingo) às 00:00:00
    const firstDay = new Date(d);
    firstDay.setDate(d.getDate() - day);
    firstDay.setHours(0, 0, 0, 0);
    
    // Último dia da semana (sábado) às 23:59:59
    const lastDay = new Date(firstDay);
    lastDay.setDate(firstDay.getDate() + 6);
    lastDay.setHours(23, 59, 59, 999);
    
    return {
      data_inicio: formatDateWithoutTimezone(firstDay),
      data_final: formatDateWithoutTimezone(lastDay),
    };
  };

  // Calcula o range de datas para o modo DIÁRIO
  const getDayDateRange = (date: Date) => {
    // Início do dia às 00:00:00
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    
    // Fim do dia às 23:59:59
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);
    
    return {
      data_inicio: formatDateWithoutTimezone(startOfDay),
      data_final: formatDateWithoutTimezone(endOfDay),
    };
  };

  // Função para buscar detalhes de uma agenda específica ou todas (owner)
  const fetchAgendaDetails = async (tipoBusca: 'todos' | 'individual', agendaId?: string) => {
    if (user?.role !== 'owner') return;

    setLoadingAgendaData(true);
    try {
      // Seleciona o range de datas baseado no modo de visualização ativo
      let dateRange;
      if (viewMode === 'month') {
        dateRange = getMonthDateRange(currentMonth);
      } else if (viewMode === 'week') {
        dateRange = getWeekDateRange(currentWeekDate);
      } else {
        dateRange = getDayDateRange(currentDayDate);
      }
      
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

      console.log(`[Agenda] Buscando dados da agenda (modo: ${viewMode}) com body:`, body);

      const apiBaseUrl = await getApiBaseUrl();
      const response = await fetch(`${apiBaseUrl}/ver-agenda-medx`, {
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
      
      // Log detalhado do primeiro evento da resposta
      let firstEvent = null;
      if (Array.isArray(data) && data.length > 0) {
        firstEvent = data[0];
      } else if (data?.events && data.events.length > 0) {
        firstEvent = data.events[0];
      } else if (data?.items && data.items.length > 0) {
        firstEvent = data.items[0];
      } else if (data?.data && Array.isArray(data.data) && data.data.length > 0) {
        firstEvent = data.data[0];
      }
      
      if (firstEvent) {
        console.log('[Agenda] Estrutura do primeiro evento da API:');
        console.log('  - calendarId:', firstEvent?.calendarId);
        console.log('  - calendar_id:', firstEvent?.calendar_id);
        console.log('  - organizer:', firstEvent?.organizer);
        console.log('  - Evento completo:', firstEvent);
      }
      
      setAgendaData(data);
      
      // Processa os eventos e atualiza o calendário
      const processedEvents = processExternalEvents(data);
      console.log('[Agenda] Total de eventos processados:', processedEvents.length);
      if (processedEvents.length > 0) {
        console.log('[Agenda] Exemplo de evento processado (doctor_id/calendar_id):', processedEvents[0].doctor_id);
        console.log('[Agenda] ⚠️ ATENÇÃO: Se doctor_id === "todos", há um problema na captura do calendar_id!');
      }
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

  // Busca dados da agenda quando a seleção, modo ou data muda
  useEffect(() => {
    if (user?.role === 'owner' && selectedAgenda) {
      if (selectedAgenda === 'todos') {
        fetchAgendaDetails('todos');
      } else {
        fetchAgendaDetails('individual', selectedAgenda);
      }
    }
  }, [user?.role, selectedAgenda, viewMode, currentMonth, currentWeekDate, currentDayDate]);

  const handleAppointmentClick = async (appointment: Appointment) => {
    console.log('[Agenda] Evento clicado:', appointment);
    
    // Criar cópia do appointment para não modificar o original
    const appointmentCopy = { ...appointment };
    
    // Buscar nome do médico pelo calendar_id
    if (appointmentCopy.doctor_id && appointmentCopy.doctor_id !== 'todos') {
      try {
        // Buscar o calendar_id na tabela profile_calendars
        const { data: calendarData } = await supabase
          .from('profile_calendars')
          .select('profile_id, calendar_name')
          .eq('calendar_id', appointmentCopy.doctor_id)
          .single();
        
        if (calendarData) {
          console.log('[Agenda] Calendar encontrado:', calendarData.calendar_name);
          
          // Buscar o nome do médico pelo profile_id
          const { data: profileData } = await supabase
            .from('profiles')
            .select('name')
            .eq('id', calendarData.profile_id)
            .single();
          
          if (profileData) {
            console.log('[Agenda] ✅ Nome do médico encontrado:', profileData.name);
            // Substitui o doctor_id pelo nome do médico para exibição
            appointmentCopy.doctor_id = profileData.name;
          } else {
            // Se não encontrou o perfil, usa o nome do calendário
            console.log('[Agenda] Usando nome do calendário:', calendarData.calendar_name);
            appointmentCopy.doctor_id = calendarData.calendar_name || appointmentCopy.doctor_id;
          }
        } else {
          // Tenta buscar na lista de agendas carregadas
          const agenda = agendas.find(a => a.id === appointmentCopy.doctor_id);
          if (agenda) {
            console.log('[Agenda] Usando nome da agenda:', agenda.nome);
            appointmentCopy.doctor_id = agenda.nome;
          } else {
            console.warn('[Agenda] ⚠️ Não foi possível encontrar nome do médico para calendar_id:', appointmentCopy.doctor_id);
          }
        }
      } catch (error) {
        console.error('[Agenda] Erro ao buscar nome do médico:', error);
      }
    }
    
    setSelectedAppointment(appointmentCopy);
    setIsDialogOpen(true);
  };

  const handleDayClick = (date: Date) => {
    console.log('[Agenda] Dia/horário clicado:', date);
    
    // Define a data do evento
    setCreateEventDate(date);
    
    // Define o horário inicial baseado no clique
    // Se já tem horário (modo diário), usa ele
    // Caso contrário, usa 09:00 como padrão
    const hours = date.getHours();
    const minutes = date.getMinutes();
    
    if (hours === 0 && minutes === 0) {
      // Clique em dia sem horário específico (modo mensal/semanal)
      setCreateEventStartTime('09:00');
    } else {
      // Clique com horário específico (modo diário)
      setCreateEventStartTime(
        `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`
      );
    }
    
    // Abre o modal de criação
    setIsCreateEventModalOpen(true);
  };

  // Callback quando um evento é criado
  const handleEventCreated = () => {
    console.log('[Agenda] Evento criado, recarregando dados...');
    
    // Recarregar dados da agenda
    if (user?.role === 'owner' && selectedAgenda) {
      if (selectedAgenda === 'todos') {
        fetchAgendaDetails('todos');
      } else {
        fetchAgendaDetails('individual', selectedAgenda);
      }
    }
  };

  // Callback quando um evento é atualizado
  const handleEventUpdated = () => {
    console.log('[Agenda] Evento atualizado, recarregando dados...');
    
    // Fechar o dialog de detalhes
    setIsDialogOpen(false);
    
    // Recarregar dados da agenda
    if (user?.role === 'owner' && selectedAgenda) {
      if (selectedAgenda === 'todos') {
        fetchAgendaDetails('todos');
      } else {
        fetchAgendaDetails('individual', selectedAgenda);
      }
    }
  };

  // Callback quando um evento é deletado
  const handleEventDeleted = () => {
    console.log('[Agenda] Evento deletado, recarregando dados...');
    
    // Fechar o dialog de detalhes
    setIsDialogOpen(false);
    
    // Recarregar dados da agenda
    if (user?.role === 'owner' && selectedAgenda) {
      if (selectedAgenda === 'todos') {
        fetchAgendaDetails('todos');
      } else {
        fetchAgendaDetails('individual', selectedAgenda);
      }
    }
  };

  // Abrir modal de edição
  const handleEditEvent = (appointment: Appointment) => {
    setEventToEdit(appointment);
    setIsEditEventModalOpen(true);
  };

  // Abrir confirmação de exclusão
  const handleDeleteEventClick = (appointment: Appointment) => {
    // Encontrar o evento original com o calendar_id correto
    const originalEvent = externalAppointments.find(apt => apt.id === appointment.id);
    if (originalEvent) {
      setEventToDelete(originalEvent);
    } else {
      setEventToDelete(appointment);
    }
    setShowDeleteDialog(true);
  };

  // Deletar evento
  const handleDeleteEvent = async () => {
    if (!eventToDelete) return;

    // Validar calendar_id
    if (!eventToDelete.doctor_id || eventToDelete.doctor_id === 'todos') {
      toast.error('Agenda não identificada para este evento');
      console.error('[Agenda] Calendar ID inválido:', eventToDelete.doctor_id);
      return;
    }

    setIsDeleting(true);
    try {
      const payload = {
        event_id: eventToDelete.id,
        calendar_id: eventToDelete.doctor_id, // ID da agenda do Google Calendar
      };

      console.log('[Agenda] Deletando evento - Payload:', payload);
      toast.loading('Deletando evento...');

      const apiBaseUrl = await getApiBaseUrl();
      const response = await fetch(`${apiBaseUrl}/apagar-evento`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      toast.dismiss();

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Erro ao deletar evento: ${response.statusText}. ${errorText}`);
      }

      const data = await response.json();
      console.log('[Agenda] Resposta do endpoint:', data);

      toast.success('Evento deletado com sucesso!');
      
      // Fechar dialogs
      setShowDeleteDialog(false);
      setIsDialogOpen(false);
      setEventToDelete(null);
      
      // Recarregar dados da agenda
      if (user?.role === 'owner' && selectedAgenda) {
        if (selectedAgenda === 'todos') {
          fetchAgendaDetails('todos');
        } else {
          fetchAgendaDetails('individual', selectedAgenda);
        }
      }
    } catch (error: any) {
      console.error('[Agenda] Erro ao deletar evento:', error);
      toast.error('Erro ao deletar evento: ' + error.message);
    } finally {
      setIsDeleting(false);
    }
  };

  // Handler para mover evento (drag and drop)
  const handleEventMoved = async (eventId: string, newDate: Date) => {
    console.log('[Agenda] Movendo evento', eventId, 'para', newDate);
    
    // Encontrar o evento
    const event = externalAppointments.find(apt => apt.id === eventId);
    if (!event) {
      toast.error('Evento não encontrado');
      return;
    }

    // Se for feriado, não pode mover
    if (event.status === 'holiday') {
      toast.error('Feriados não podem ser movidos');
      return;
    }

    try {
      // Buscar informações completas do paciente e médico
      const { data: patientData } = await supabase
        .from('patients')
        .select('name, email, phone')
        .ilike('name', event.patient_id)
        .limit(1)
        .single();

      const { data: doctorData } = await supabase
        .from('profiles')
        .select('id, name, email, specialization')
        .eq('role', 'doctor')
        .limit(1);

      // Buscar calendar_id do médico
      const { data: calendarData } = await supabase
        .from('profile_calendars')
        .select('profile_id, calendar_id')
        .eq('calendar_id', event.doctor_id)
        .limit(1)
        .single();

      let doctor = null;
      if (calendarData && doctorData) {
        doctor = doctorData.find(d => d.id === calendarData.profile_id);
      }

      // Obter a hora do evento original
      const originalDate = new Date(event.scheduled_at);
      const hours = originalDate.getHours();
      const minutes = originalDate.getMinutes();

      // Criar nova data mantendo a mesma hora
      const newDateTime = new Date(newDate);
      newDateTime.setHours(hours, minutes, 0, 0);

      // Calcular hora final (1 hora depois)
      const endDateTime = new Date(newDateTime);
      endDateTime.setHours(endDateTime.getHours() + 1);

      // Formatar datas
      const formatDateTime = (date: Date) => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        return `${year}-${month}-${day}T${hours}:${minutes}:00`;
      };

      // Verificar se temos o calendar_id (NUNCA deve ser "todos")
      if (!event.doctor_id || event.doctor_id === 'todos') {
        toast.error('Agenda não identificada para este evento');
        console.error('[Agenda] Calendar ID inválido:', event.doctor_id);
        return;
      }

      // Montar payload completo para o endpoint de editar-evento
      const payload = {
        event_id: eventId,
        calendar_id: event.doctor_id, // ID da agenda do Google Calendar (ex: abc@group.calendar.google.com)
        nome_paciente: patientData?.name || event.patient_id,
        email_paciente: patientData?.email || '',
        nome_medico: doctor?.name || '',
        email_medico: doctor?.email || '',
        especialidade_medico: doctor?.specialization || '',
        tipo_consulta: 'retorno', // Mantém como retorno para eventos movidos
        data_inicio: formatDateTime(newDateTime),
        data_final: formatDateTime(endDateTime),
        notas: event.notes || '',
      };

      console.log('[Agenda - Drag&Drop] Enviando para /editar-evento');
      console.log('Event ID:', eventId);
      console.log('Calendar ID (Agenda):', event.doctor_id);
      console.log('⚠️ Verificação: Calendar ID é "todos"?', event.doctor_id === 'todos');
      console.log('Payload completo:', payload);
      toast.loading('Movendo evento...');

      const apiBaseUrl = await getApiBaseUrl();
      const response = await fetch(`${apiBaseUrl}/editar-evento`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      toast.dismiss();

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Erro ao mover evento: ${response.statusText}. ${errorText}`);
      }

      const data = await response.json();
      console.log('[Agenda] Resposta do endpoint:', data);

      toast.success('Evento movido com sucesso!');
      
      // Recarregar dados da agenda
      if (user?.role === 'owner' && selectedAgenda) {
        if (selectedAgenda === 'todos') {
          fetchAgendaDetails('todos');
        } else {
          fetchAgendaDetails('individual', selectedAgenda);
        }
      }
    } catch (error: any) {
      console.error('[Agenda] Erro ao mover evento:', error);
      toast.error('Erro ao mover evento: ' + error.message);
    }
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
      {/* Filtro de agendas e seletor de visualização */}
      <MagicBentoCard contentClassName="p-6">
        <div className="flex flex-col gap-4">
          {/* Linha 1: Filtro de médico (apenas owner) e Modo de Visualização */}
          <div className="flex flex-col md:flex-row md:items-end gap-4">
            {/* Filtro por médico (apenas para owner) */}
            {user?.role === 'owner' && (
              <>
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
              </>
            )}
          </div>

          {/* Linha 2: Modo de Visualização */}
          <div className="flex items-center gap-2">
            <CalendarDays className="h-4 w-4 text-muted-foreground" />
            <Label className="text-sm font-medium">Modo de Visualização:</Label>
            <div className="flex gap-2">
              <Button
                variant={viewMode === 'month' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('month')}
              >
                Mensal
              </Button>
              <Button
                variant={viewMode === 'week' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('week')}
              >
                Semanal
              </Button>
              <Button
                variant={viewMode === 'day' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('day')}
              >
                Diário
              </Button>
            </div>
          </div>

        </div>
      </MagicBentoCard>

      {/* Calendário */}
      <MagicBentoCard contentClassName="p-0 min-h-[calc(100vh-20rem)]">
        {!loadingAgendaData && (
          <>
            {viewMode === 'month' && (
              <MonthCalendar
                appointments={displayedAppointments}
                onDayClick={handleDayClick}
                onAppointmentClick={handleAppointmentClick}
                onEventMoved={handleEventMoved}
              />
            )}
            {viewMode === 'week' && (
              <WeekCalendar
                appointments={displayedAppointments}
                currentDate={currentWeekDate}
                onDateChange={setCurrentWeekDate}
                onDayClick={handleDayClick}
                onAppointmentClick={handleAppointmentClick}
                onEventMoved={handleEventMoved}
              />
            )}
            {viewMode === 'day' && (
              <DayCalendar
                appointments={displayedAppointments}
                currentDate={currentDayDate}
                onDateChange={setCurrentDayDate}
                onTimeSlotClick={handleDayClick}
                onAppointmentClick={handleAppointmentClick}
                onEventMoved={handleEventMoved}
              />
            )}
          </>
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
          {selectedAppointment && selectedAppointment.status !== 'holiday' && (
            <div className="flex justify-between gap-2 mt-4 pt-4 border-t">
              <Button
                variant="destructive"
                onClick={() => {
                  handleDeleteEventClick(selectedAppointment);
                }}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Deletar
              </Button>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => setIsDialogOpen(false)}
                >
                  Fechar
                </Button>
                <Button
                  onClick={() => {
                    handleEditEvent(selectedAppointment);
                    setIsDialogOpen(false);
                  }}
                >
                  Editar Evento
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Modal de criação de evento */}
      <CreateEventModal
        open={isCreateEventModalOpen}
        onOpenChange={setIsCreateEventModalOpen}
        initialDate={createEventDate}
        initialStartTime={createEventStartTime}
        calendarId={selectedAgenda !== 'todos' ? selectedAgenda : undefined}
        onEventCreated={handleEventCreated}
      />

      {/* Modal de edição de evento */}
      <EditEventModal
        open={isEditEventModalOpen}
        onOpenChange={setIsEditEventModalOpen}
        appointment={eventToEdit}
        onEventUpdated={handleEventUpdated}
        onEventDeleted={handleEventDeleted}
      />

      {/* Dialog de confirmação de exclusão */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja deletar este evento? Esta ação não pode ser desfeita.
              {eventToDelete && (
                <div className="mt-4 p-3 bg-muted rounded-md">
                  <p className="text-sm font-medium text-foreground">
                    {eventToDelete.patient_id}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {new Date(eventToDelete.scheduled_at).toLocaleDateString('pt-BR', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                </div>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                handleDeleteEvent();
              }}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deletando...
                </>
              ) : (
                <>
                  <Trash2 className="mr-2 h-4 w-4" />
                  Deletar Evento
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
}
