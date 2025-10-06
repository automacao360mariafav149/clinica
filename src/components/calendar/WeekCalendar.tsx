import { ChevronLeft, ChevronRight, GripVertical } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useState } from 'react';

interface Appointment {
  id: string;
  patient_id: string;
  doctor_id?: string;
  scheduled_at: string;
  status: string;
  notes?: string;
}

interface WeekCalendarProps {
  appointments: Appointment[];
  currentDate: Date;
  onDateChange: (date: Date) => void;
  onDayClick?: (date: Date) => void;
  onAppointmentClick?: (appointment: Appointment) => void;
  onEventMoved?: (eventId: string, newDate: Date) => void;
}

const DAYS_OF_WEEK = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
const HOURS = Array.from({ length: 14 }, (_, i) => i + 7); // 7h até 20h

const STATUS_COLORS = {
  scheduled: 'bg-blue-500 hover:bg-blue-600',
  confirmed: 'bg-green-500 hover:bg-green-600',
  cancelled: 'bg-red-500 hover:bg-red-600',
  completed: 'bg-gray-500 hover:bg-gray-600',
  pending: 'bg-yellow-500 hover:bg-yellow-600',
  holiday: 'bg-purple-600 hover:bg-purple-700',
};

export function WeekCalendar({ 
  appointments, 
  currentDate, 
  onDateChange, 
  onDayClick, 
  onAppointmentClick,
  onEventMoved 
}: WeekCalendarProps) {
  const [draggingEventId, setDraggingEventId] = useState<string | null>(null);
  // Calcular primeiro dia da semana (domingo)
  const getWeekStart = (date: Date) => {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day;
    return new Date(d.setDate(diff));
  };

  const weekStart = getWeekStart(currentDate);
  
  // Gerar array de dias da semana
  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const date = new Date(weekStart);
    date.setDate(weekStart.getDate() + i);
    return date;
  });

  // Filtrar appointments por dia e hora
  const getAppointmentsForDayAndHour = (date: Date, hour: number) => {
    return appointments.filter((apt) => {
      const aptDate = new Date(apt.scheduled_at);
      return (
        aptDate.getDate() === date.getDate() &&
        aptDate.getMonth() === date.getMonth() &&
        aptDate.getFullYear() === date.getFullYear() &&
        aptDate.getHours() === hour &&
        apt.status !== 'holiday' // Exclui feriados da visualização por hora
      );
    });
  };

  // Verificar se um dia tem feriado
  const getDayHoliday = (date: Date) => {
    return appointments.find((apt) => {
      const aptDate = new Date(apt.scheduled_at);
      return (
        aptDate.getDate() === date.getDate() &&
        aptDate.getMonth() === date.getMonth() &&
        aptDate.getFullYear() === date.getFullYear() &&
        apt.status === 'holiday'
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

  const goToPreviousWeek = () => {
    const newDate = new Date(currentDate);
    newDate.setDate(newDate.getDate() - 7);
    onDateChange(newDate);
  };

  const goToNextWeek = () => {
    const newDate = new Date(currentDate);
    newDate.setDate(newDate.getDate() + 7);
    onDateChange(newDate);
  };

  const goToToday = () => {
    onDateChange(new Date());
  };

  const formatWeekRange = () => {
    const start = weekDays[0];
    const end = weekDays[6];
    const startMonth = start.toLocaleDateString('pt-BR', { month: 'short' });
    const endMonth = end.toLocaleDateString('pt-BR', { month: 'short' });
    const year = end.getFullYear();
    
    if (start.getMonth() === end.getMonth()) {
      return `${start.getDate()} - ${end.getDate()} ${endMonth} ${year}`;
    }
    return `${start.getDate()} ${startMonth} - ${end.getDate()} ${endMonth} ${year}`;
  };

  return (
    <div className="w-full h-full flex flex-col bg-background rounded-lg border">
      {/* Header com navegação */}
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center gap-4">
          <h2 className="text-2xl font-semibold capitalize">
            {formatWeekRange()}
          </h2>
          <Button variant="outline" size="sm" onClick={goToToday}>
            Hoje
          </Button>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={goToPreviousWeek}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon" onClick={goToNextWeek}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Grid de dias da semana */}
      <div className="grid grid-cols-[80px_repeat(7,1fr)] border-b bg-muted/50 sticky top-0 z-10">
        <div className="p-2 border-r" /> {/* Espaço para coluna de horas */}
        {weekDays.map((day, index) => {
          const holiday = getDayHoliday(day);
          return (
            <div
              key={index}
              className={cn(
                'p-2 text-center border-r cursor-pointer hover:bg-accent/50 transition-colors',
                isToday(day) && 'bg-primary/10',
                index === 6 && 'border-r-0'
              )}
              onClick={() => onDayClick?.(day)}
            >
              <div className="text-xs text-muted-foreground">{DAYS_OF_WEEK[day.getDay()]}</div>
              <div className={cn(
                'text-lg font-semibold mt-1',
                isToday(day) && 'text-primary'
              )}>
                {day.getDate()}
              </div>
              {holiday && (
                <div className="text-[8px] font-medium mt-1 bg-gradient-to-r from-[#40ffaa] via-[#4079ff] to-[#40ffaa] bg-[length:200%_auto] bg-clip-text text-transparent animate-shimmer">
                  Feriado
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Grid de horários e eventos */}
      <div className="flex-1 overflow-y-auto">
        {HOURS.map((hour) => (
          <div key={hour} className="grid grid-cols-[80px_repeat(7,1fr)] border-b min-h-[80px]">
            {/* Coluna de horas */}
            <div className="p-2 border-r text-sm text-muted-foreground font-medium flex items-start">
              {hour.toString().padStart(2, '0')}:00
            </div>
            
            {/* Colunas de dias */}
            {weekDays.map((day, dayIndex) => {
              const dayAppointments = getAppointmentsForDayAndHour(day, hour);
              const holiday = getDayHoliday(day);
              
              return (
                <div
                  key={dayIndex}
                  className={cn(
                    'p-1 border-r hover:bg-accent/30 transition-colors cursor-pointer relative',
                    isToday(day) && 'bg-primary/5',
                    dayIndex === 6 && 'border-r-0',
                    holiday && 'bg-purple-50 dark:bg-purple-950/20'
                  )}
                  onClick={() => onDayClick?.(day)}
                  onDragOver={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                  }}
                  onDrop={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    const eventId = e.dataTransfer.getData('text/plain');
                    if (eventId) {
                      // Criar data com hora do slot atual
                      const newDate = new Date(day);
                      newDate.setHours(hour, 0, 0, 0);
                      onEventMoved?.(eventId, newDate);
                    }
                    setDraggingEventId(null);
                  }}
                >
                  <div className="space-y-1">
                    {dayAppointments.map((apt) => {
                      const aptDate = new Date(apt.scheduled_at);
                      const minutes = aptDate.getMinutes();
                      
                      return (
                        <div
                          key={apt.id}
                          draggable
                          onDragStart={(e) => {
                            e.dataTransfer.setData('text/plain', apt.id);
                            e.dataTransfer.effectAllowed = 'move';
                            setDraggingEventId(apt.id);
                          }}
                          onDragEnd={() => {
                            setDraggingEventId(null);
                          }}
                          className={cn(
                            'text-xs p-2 rounded cursor-move transition-all text-white shadow-sm flex items-start gap-1',
                            STATUS_COLORS[apt.status as keyof typeof STATUS_COLORS] || 'bg-gray-500',
                            draggingEventId === apt.id && 'opacity-50'
                          )}
                          onClick={(e) => {
                            e.stopPropagation();
                            onAppointmentClick?.(apt);
                          }}
                          title={apt.patient_id}
                        >
                          <GripVertical className="h-3 w-3 flex-shrink-0 opacity-70 mt-0.5" />
                          <div className="flex-1 min-w-0">
                            <div className="font-medium">
                              {hour.toString().padStart(2, '0')}:{minutes.toString().padStart(2, '0')}
                            </div>
                            <div className="truncate opacity-90">
                              {apt.patient_id}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        ))}
      </div>

      {/* Legenda de status */}
      <div className="flex flex-wrap items-center gap-4 p-4 border-t bg-muted/30">
        <span className="text-sm font-medium text-muted-foreground">Legenda:</span>
        {Object.entries(STATUS_COLORS).map(([status, color]) => (
          <div key={status} className="flex items-center gap-2">
            <div className={cn('w-3 h-3 rounded', color.split(' ')[0])} />
            <span className="text-sm capitalize">
              {status === 'scheduled' ? 'Agendado' : 
               status === 'confirmed' ? 'Confirmado' :
               status === 'cancelled' ? 'Cancelado' :
               status === 'completed' ? 'Concluído' :
               status === 'pending' ? 'Pendente' :
               status === 'holiday' ? 'Feriado' : status}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

