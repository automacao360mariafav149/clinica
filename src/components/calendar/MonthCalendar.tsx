import { useState } from 'react';
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface Appointment {
  id: string;
  patient_id: string;
  doctor_id?: string;
  scheduled_at: string;
  status: string;
  notes?: string;
}

interface MonthCalendarProps {
  appointments: Appointment[];
  onDayClick?: (date: Date) => void;
  onAppointmentClick?: (appointment: Appointment) => void;
}

const DAYS_OF_WEEK = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
const MONTHS = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

const STATUS_COLORS = {
  scheduled: 'bg-blue-500',
  confirmed: 'bg-green-500',
  cancelled: 'bg-red-500',
  completed: 'bg-gray-500',
  pending: 'bg-yellow-500',
  holiday: 'bg-purple-600',
};

export function MonthCalendar({ appointments, onDayClick, onAppointmentClick }: MonthCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date());

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  // Calcular primeiro e último dia do mês
  const firstDayOfMonth = new Date(year, month, 1);
  const lastDayOfMonth = new Date(year, month + 1, 0);
  const startingDayOfWeek = firstDayOfMonth.getDay();
  const daysInMonth = lastDayOfMonth.getDate();

  // Calcular dias do mês anterior para preencher o grid
  const prevMonthLastDay = new Date(year, month, 0).getDate();
  const prevMonthDays = startingDayOfWeek;

  // Calcular total de células necessárias
  const totalCells = Math.ceil((daysInMonth + startingDayOfWeek) / 7) * 7;
  const nextMonthDays = totalCells - (daysInMonth + prevMonthDays);

  // Gerar array de dias para renderizar
  const calendarDays = [];

  // Dias do mês anterior
  for (let i = prevMonthDays - 1; i >= 0; i--) {
    calendarDays.push({
      day: prevMonthLastDay - i,
      isCurrentMonth: false,
      date: new Date(year, month - 1, prevMonthLastDay - i),
    });
  }

  // Dias do mês atual
  for (let i = 1; i <= daysInMonth; i++) {
    calendarDays.push({
      day: i,
      isCurrentMonth: true,
      date: new Date(year, month, i),
    });
  }

  // Dias do próximo mês
  for (let i = 1; i <= nextMonthDays; i++) {
    calendarDays.push({
      day: i,
      isCurrentMonth: false,
      date: new Date(year, month + 1, i),
    });
  }

  // Filtrar appointments por dia
  const getAppointmentsForDay = (date: Date) => {
    return appointments.filter((apt) => {
      const aptDate = new Date(apt.scheduled_at);
      return (
        aptDate.getDate() === date.getDate() &&
        aptDate.getMonth() === date.getMonth() &&
        aptDate.getFullYear() === date.getFullYear()
      );
    });
  };

  // Verificar se é hoje
  const isToday = (date: Date) => {
    const today = new Date();
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
  };

  const goToPreviousMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const goToNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  return (
    <div className="w-full h-full flex flex-col bg-background rounded-lg border">
      {/* Header com navegação */}
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center gap-4">
          <h2 className="text-2xl font-semibold">
            {MONTHS[month]} {year}
          </h2>
          <Button variant="outline" size="sm" onClick={goToToday}>
            Hoje
          </Button>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={goToPreviousMonth}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon" onClick={goToNextMonth}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Grid de dias da semana */}
      <div className="grid grid-cols-7 border-b bg-muted/50">
        {DAYS_OF_WEEK.map((day) => (
          <div
            key={day}
            className="p-2 text-center text-sm font-medium text-muted-foreground"
          >
            {day}
          </div>
        ))}
      </div>

      {/* Grid de dias do mês */}
      <div className="grid grid-cols-7 flex-1 auto-rows-fr">
        {calendarDays.map((calDay, index) => {
          const dayAppointments = getAppointmentsForDay(calDay.date);
          const isTodayDate = isToday(calDay.date);
          const hasHoliday = dayAppointments.some(apt => apt.status === 'holiday');
          const holidayName = dayAppointments.find(apt => apt.status === 'holiday')?.patient_id;

          return (
            <div
              key={index}
              className={cn(
                'border-r border-b p-2 min-h-[120px] hover:bg-accent/50 transition-all cursor-pointer relative',
                !calDay.isCurrentMonth && 'bg-muted/30',
                index % 7 === 6 && 'border-r-0'
              )}
              onClick={() => onDayClick?.(calDay.date)}
            >
              <div className="flex flex-col h-full">
                <div className="flex items-center justify-between mb-1">
                  <span
                    className={cn(
                      'text-sm font-medium w-6 h-6 flex items-center justify-center rounded-full transition-all',
                      !calDay.isCurrentMonth && 'text-muted-foreground',
                      isTodayDate && 'bg-primary text-primary-foreground ring-2 ring-primary/20'
                    )}
                  >
                    {calDay.day}
                  </span>
                  {calDay.isCurrentMonth && dayAppointments.length === 0 && (
                    <Plus className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100" />
                  )}
                </div>

                <div className="space-y-1 overflow-y-auto flex-1">
                  {dayAppointments
                    .filter(apt => apt.status !== 'holiday') // Remove feriados da lista
                    .slice(0, 3)
                    .map((apt) => {
                      const aptDate = new Date(apt.scheduled_at);
                      const timeStr = aptDate.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
                      
                      return (
                        <div
                          key={apt.id}
                          className={cn(
                            'text-xs p-1.5 rounded cursor-pointer transition-all text-white hover:opacity-80',
                            STATUS_COLORS[apt.status as keyof typeof STATUS_COLORS] || 'bg-gray-500'
                          )}
                          onClick={(e) => {
                            e.stopPropagation();
                            onAppointmentClick?.(apt);
                          }}
                          title={`${timeStr} - ${apt.patient_id}`}
                        >
                          <div className="truncate">
                            {timeStr} - {apt.patient_id}
                          </div>
                        </div>
                      );
                    })}
                  {dayAppointments.filter(apt => apt.status !== 'holiday').length > 3 && (
                    <div className="text-xs text-muted-foreground pl-1">
                      +{dayAppointments.filter(apt => apt.status !== 'holiday').length - 3} mais
                    </div>
                  )}
                </div>
                
                {/* Tag minimalista de feriado na parte inferior */}
                {hasHoliday && calDay.isCurrentMonth && (
                  <div className="mt-auto pt-1">
                    <div className="flex items-center justify-center">
                      <span 
                        className="text-[9px] font-medium cursor-help relative inline-block"
                        title={holidayName}
                      >
                        <span className="relative bg-gradient-to-r from-[#40ffaa] via-[#4079ff] to-[#40ffaa] bg-[length:200%_auto] bg-clip-text text-transparent animate-shimmer">
                          Feriado
                        </span>
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Legenda de status */}
      <div className="flex flex-wrap items-center gap-4 p-4 border-t bg-muted/30">
        <span className="text-sm font-medium text-muted-foreground">Legenda:</span>
        {Object.entries(STATUS_COLORS).map(([status, color]) => (
          <div key={status} className="flex items-center gap-2">
            <div className={cn('w-3 h-3 rounded', color)} />
            <span className="text-sm capitalize">{status === 'scheduled' ? 'Agendado' : 
              status === 'confirmed' ? 'Confirmado' :
              status === 'cancelled' ? 'Cancelado' :
              status === 'completed' ? 'Concluído' :
              status === 'pending' ? 'Pendente' :
              status === 'holiday' ? 'Feriado' : status}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

