import { useState, useMemo } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { MagicBentoCard } from '@/components/bento/MagicBento';
import { MonthCalendar } from '@/components/calendar/MonthCalendar';
import { useRealtimeList } from '@/hooks/useRealtimeList';
import { useAuth } from '@/contexts/AuthContext';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle 
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Calendar, Clock, User, FileText } from 'lucide-react';

interface Appointment {
  id: string;
  patient_id: string;
  doctor_id?: string;
  scheduled_at: string;
  status: string;
  notes?: string;
}

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

  return (
    <DashboardLayout>
      <div className="p-8 space-y-6 h-[calc(100vh-4rem)]">
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

        <MagicBentoCard contentClassName="p-0 h-[calc(100vh-16rem)]">
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
