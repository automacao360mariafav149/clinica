import { useState } from 'react';
import { ChevronLeft, ChevronRight, GripVertical } from 'lucide-react';
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

interface DayCalendarProps {
  appointments: Appointment[];
  currentDate: Date;
  onDateChange: (date: Date) => void;
  onTimeSlotClick?: (date: Date) => void;
  onAppointmentClick?: (appointment: Appointment) => void;
  onEventMoved?: (eventId: string, newDate: Date) => void;
}

// Gera slots de 30 minutos das 7h às 20h
const generateTimeSlots = () => {
  const slots = [];
  for (let hour = 7; hour <= 20; hour++) {
    slots.push({ hour, minute: 0 });
    if (hour < 20) {
      slots.push({ hour, minute: 30 });
    }
  }
  return slots;
};

const TIME_SLOTS = generateTimeSlots();

const STATUS_COLORS = {
  scheduled: 'bg-blue-500 hover:bg-blue-600 border-blue-600',
  confirmed: 'bg-green-500 hover:bg-green-600 border-green-600',
  cancelled: 'bg-red-500 hover:bg-red-600 border-red-600',
  completed: 'bg-gray-500 hover:bg-gray-600 border-gray-600',
  pending: 'bg-yellow-500 hover:bg-yellow-600 border-yellow-600',
  holiday: 'bg-purple-600 hover:bg-purple-700 border-purple-700',
};

export function DayCalendar({ 
  appointments, 
  currentDate, 
  onDateChange, 
  onTimeSlotClick, 
  onAppointmentClick,
  onEventMoved 
}: DayCalendarProps) {
  const [draggingEventId, setDraggingEventId] = useState<string | null>(null);

  // Filtrar appointments por slot de tempo
  const getAppointmentsForTimeSlot = (hour: number, minute: number) => {
    return appointments.filter((apt) => {
      const aptDate = new Date(apt.scheduled_at);
      const isSameDay = (
        aptDate.getDate() === currentDate.getDate() &&
        aptDate.getMonth() === currentDate.getMonth() &&
        aptDate.getFullYear() === currentDate.getFullYear()
      );
      
      if (!isSameDay) return false;
      
      // Para feriados, não mostrar em slots específicos
      if (apt.status === 'holiday') return false;
      
      const aptHour = aptDate.getHours();
      const aptMinute = aptDate.getMinutes();
      
      // Verifica se o appointment está neste slot de 30 minutos
      return aptHour === hour && aptMinute >= minute && aptMinute < minute + 30;
    });
  };

  // Verificar se o dia tem feriado
  const getDayHoliday = () => {
    return appointments.find((apt) => {
      const aptDate = new Date(apt.scheduled_at);
      return (
        aptDate.getDate() === currentDate.getDate() &&
        aptDate.getMonth() === currentDate.getMonth() &&
        aptDate.getFullYear() === currentDate.getFullYear() &&
        apt.status === 'holiday'
      );
    });
  };

  // Verificar se é hoje
  const isToday = () => {
    const today = new Date();
    return (
      currentDate.getDate() === today.getDate() &&
      currentDate.getMonth() === today.getMonth() &&
      currentDate.getFullYear() === today.getFullYear()
    );
  };

  // Verificar se um time slot já passou
  const isTimeSlotPast = (hour: number, minute: number) => {
    if (!isToday()) return false;
    
    const now = new Date();
    const slotTime = new Date(currentDate);
    slotTime.setHours(hour, minute, 0, 0);
    
    return slotTime < now;
  };

  const goToPreviousDay = () => {
    const newDate = new Date(currentDate);
    newDate.setDate(newDate.getDate() - 1);
    onDateChange(newDate);
  };

  const goToNextDay = () => {
    const newDate = new Date(currentDate);
    newDate.setDate(newDate.getDate() + 1);
    onDateChange(newDate);
  };

  const goToToday = () => {
    onDateChange(new Date());
  };

  const formatDate = () => {
    return currentDate.toLocaleDateString('pt-BR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const holiday = getDayHoliday();

  return (
    <div className="w-full h-full flex flex-col bg-background rounded-lg border">
      {/* Header com navegação */}
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center gap-4">
          <h2 className="text-2xl font-semibold capitalize">
            {formatDate()}
          </h2>
          <Button variant="outline" size="sm" onClick={goToToday}>
            Hoje
          </Button>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={goToPreviousDay}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon" onClick={goToNextDay}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Banner de feriado se houver */}
      {holiday && (
        <div className="p-4 bg-gradient-to-r from-purple-100 to-purple-200 dark:from-purple-900/40 dark:to-purple-800/40 border-b border-purple-300 dark:border-purple-700">
          <div className="flex items-center gap-3">
            <span className="text-3xl">🎉</span>
            <div>
              <p className="font-semibold text-purple-900 dark:text-purple-100">
                {holiday.patient_id}
              </p>
              <p className="text-sm text-purple-700 dark:text-purple-300">
                Feriado Nacional - Não há expediente neste dia
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Grid de horários */}
      <div className="flex-1 overflow-y-auto">
        <div className="min-w-full">
          {TIME_SLOTS.map(({ hour, minute }, index) => {
            const slotAppointments = getAppointmentsForTimeSlot(hour, minute);
            const isPast = isTimeSlotPast(hour, minute);
            const slotDate = new Date(currentDate);
            slotDate.setHours(hour, minute, 0, 0);
            
            return (
              <div
                key={index}
                className={cn(
                  'grid grid-cols-[100px_1fr] border-b min-h-[80px] transition-colors',
                  isPast && 'bg-muted/30',
                  holiday && 'bg-purple-50/50 dark:bg-purple-950/20'
                )}
              >
                {/* Coluna de horário */}
                <div className={cn(
                  'p-3 border-r flex items-start',
                  isPast && 'text-muted-foreground/50'
                )}>
                  <span className="text-sm font-medium">
                    {hour.toString().padStart(2, '0')}:{minute.toString().padStart(2, '0')}
                  </span>
                </div>
                
                {/* Coluna de conteúdo */}
                <div
                  className={cn(
                    'p-3 cursor-pointer hover:bg-accent/30 transition-colors',
                    isToday() && !isPast && 'bg-primary/5'
                  )}
                  onClick={() => !holiday && onTimeSlotClick?.(slotDate)}
                  onDragOver={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                  }}
                  onDrop={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    const eventId = e.dataTransfer.getData('text/plain');
                    if (eventId) {
                      onEventMoved?.(eventId, slotDate);
                    }
                    setDraggingEventId(null);
                  }}
                >
                  {slotAppointments.length === 0 ? (
                    <div className="text-sm text-muted-foreground/50 italic">
                      {holiday ? 'Sem expediente' : isPast ? 'Horário passado' : 'Disponível'}
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {slotAppointments.map((apt) => {
                        const aptDate = new Date(apt.scheduled_at);
                        const aptMinutes = aptDate.getMinutes();
                        
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
                              'p-3 rounded-lg cursor-move transition-all text-white shadow-md border-l-4',
                              STATUS_COLORS[apt.status as keyof typeof STATUS_COLORS] || 'bg-gray-500',
                              draggingEventId === apt.id && 'opacity-50'
                            )}
                            onClick={(e) => {
                              e.stopPropagation();
                              onAppointmentClick?.(apt);
                            }}
                          >
                            <div className="flex items-start justify-between gap-3">
                              <GripVertical className="h-5 w-5 flex-shrink-0 opacity-70 mt-0.5" />
                              <div className="flex-1 min-w-0">
                                <div className="font-semibold text-base mb-1">
                                  {apt.patient_id}
                                </div>
                                <div className="text-xs opacity-90">
                                  {hour.toString().padStart(2, '0')}:{aptMinutes.toString().padStart(2, '0')}
                                </div>
                                {apt.notes && (
                                  <div className="text-xs mt-2 opacity-80 line-clamp-2">
                                    {apt.notes}
                                  </div>
                                )}
                              </div>
                              <div className="text-xs font-medium opacity-90 whitespace-nowrap">
                                {apt.status === 'scheduled' ? 'Agendado' : 
                                 apt.status === 'confirmed' ? 'Confirmado' :
                                 apt.status === 'cancelled' ? 'Cancelado' :
                                 apt.status === 'completed' ? 'Concluído' :
                                 apt.status === 'pending' ? 'Pendente' : apt.status}
                              </div>
                            </div>
                            {apt.doctor_id && (
                              <div className="text-xs mt-2 opacity-75">
                                Dr(a): {apt.doctor_id}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Legenda de status */}
      <div className="flex flex-wrap items-center gap-4 p-4 border-t bg-muted/30">
        <span className="text-sm font-medium text-muted-foreground">Legenda:</span>
        {Object.entries(STATUS_COLORS).map(([status, colorClass]) => (
          <div key={status} className="flex items-center gap-2">
            <div className={cn('w-3 h-3 rounded', colorClass.split(' ')[0])} />
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

