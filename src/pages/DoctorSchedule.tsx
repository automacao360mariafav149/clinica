import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { MagicBentoCard } from '@/components/bento/MagicBento';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { ArrowLeft, Save, Loader2, Calendar, Clock, Coffee, Timer } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useDoctorSchedule, DoctorSchedule as ScheduleType } from '@/hooks/useDoctorSchedule';
import { supabase } from '@/lib/supabaseClient';
import { toast } from 'sonner';

const DAYS_OF_WEEK = [
  { value: 0, label: 'Domingo' },
  { value: 1, label: 'Segunda-feira' },
  { value: 2, label: 'Terça-feira' },
  { value: 3, label: 'Quarta-feira' },
  { value: 4, label: 'Quinta-feira' },
  { value: 5, label: 'Sexta-feira' },
  { value: 6, label: 'Sábado' },
];

export default function DoctorSchedule() {
  const { doctorId } = useParams<{ doctorId: string }>();
  const navigate = useNavigate();
  const { schedules, loading, saveSchedule } = useDoctorSchedule(doctorId || '');
  
  const [doctorName, setDoctorName] = useState<string>('');
  const [isSaving, setIsSaving] = useState(false);
  const [localSchedules, setLocalSchedules] = useState<Record<number, ScheduleType>>({});

  // Carrega o nome do médico
  useEffect(() => {
    const fetchDoctorName = async () => {
      if (!doctorId) return;
      
      const { data, error } = await supabase
        .from('profiles')
        .select('name')
        .eq('id', doctorId)
        .single();

      if (!error && data) {
        setDoctorName(data.name);
      }
    };

    fetchDoctorName();
  }, [doctorId]);

  // Inicializa os horários locais quando os dados são carregados
  useEffect(() => {
    if (!doctorId) return;

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
            doctor_id: doctorId,
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
    } else if (!loading) {
      // Se não há horários salvos E já terminou de carregar, inicializa com valores padrão
      DAYS_OF_WEEK.forEach((day) => {
        scheduleMap[day.value] = {
          doctor_id: doctorId,
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
  }, [schedules, loading, doctorId]);

  const handleScheduleChange = (dayOfWeek: number, field: keyof ScheduleType, value: any) => {
    setLocalSchedules((prev) => ({
      ...prev,
      [dayOfWeek]: {
        ...prev[dayOfWeek],
        [field]: value,
      },
    }));
  };

  const handleSaveAll = async () => {
    if (!doctorId) return;

    setIsSaving(true);
    try {
      const promises = Object.values(localSchedules).map((schedule) => {
        // Só salva horários ativos
        if (schedule.is_active) {
          return saveSchedule(schedule);
        }
        // Remove horários inativos se já existirem no banco
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

  if (loading && schedules.length === 0) {
    return (
      <DashboardLayout requiredRoles={['owner']}>
        <div className="flex items-center justify-center h-screen">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout requiredRoles={['owner']}>
      <div className="p-8 space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate('/users')}
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-foreground">
                Configurar Agenda
              </h1>
              <p className="text-muted-foreground mt-1">
                {doctorName || 'Carregando...'}
              </p>
            </div>
          </div>
          
          <Button onClick={handleSaveAll} disabled={isSaving}>
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

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {DAYS_OF_WEEK.map((day) => {
            const schedule = localSchedules[day.value];
            if (!schedule) return null;

            return (
              <Card 
                key={day.value} 
                className={`transition-all duration-200 ${
                  schedule.is_active 
                    ? 'border-primary/50 bg-primary/5' 
                    : 'border-muted bg-muted/20'
                }`}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <Calendar className="h-5 w-5 text-primary" />
                      {day.label}
                    </CardTitle>
                    <div className="flex items-center gap-2">
                      {schedule.is_active ? (
                        <Badge variant="default" className="bg-green-600">
                          Ativo
                        </Badge>
                      ) : (
                        <Badge variant="secondary">
                          Inativo
                        </Badge>
                      )}
                      <Switch
                        id={`active-${day.value}`}
                        checked={schedule.is_active}
                        onCheckedChange={(checked) =>
                          handleScheduleChange(day.value, 'is_active', checked)
                        }
                      />
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="space-y-4">
                  {schedule.is_active ? (
                    <>
                      {/* Horário de Funcionamento */}
                      <div className="space-y-3 p-3 bg-background/80 rounded-lg border">
                        <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                          <Clock className="h-4 w-4" />
                          Horário de Funcionamento
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-1.5">
                            <Label htmlFor={`start-${day.value}`} className="text-xs">
                              Início
                            </Label>
                            <Input
                              id={`start-${day.value}`}
                              type="time"
                              value={schedule.start_time}
                              onChange={(e) =>
                                handleScheduleChange(day.value, 'start_time', e.target.value)
                              }
                              className="h-9"
                            />
                          </div>

                          <div className="space-y-1.5">
                            <Label htmlFor={`end-${day.value}`} className="text-xs">
                              Fim
                            </Label>
                            <Input
                              id={`end-${day.value}`}
                              type="time"
                              value={schedule.end_time}
                              onChange={(e) =>
                                handleScheduleChange(day.value, 'end_time', e.target.value)
                              }
                              className="h-9"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Duração da Consulta */}
                      <div className="space-y-3 p-3 bg-background/80 rounded-lg border">
                        <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                          <Timer className="h-4 w-4" />
                          Duração da Consulta
                        </div>
                        <div className="space-y-1.5">
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
                            className="h-9"
                          />
                          <p className="text-xs text-muted-foreground">
                            Minutos por consulta
                          </p>
                        </div>
                      </div>

                      {/* Intervalo */}
                      <div className="space-y-3 p-3 bg-background/80 rounded-lg border">
                        <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                          <Coffee className="h-4 w-4" />
                          Intervalo (Almoço/Pausa)
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-1.5">
                            <Label htmlFor={`break-start-${day.value}`} className="text-xs">
                              Início
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
                              className="h-9"
                            />
                          </div>

                          <div className="space-y-1.5">
                            <Label htmlFor={`break-end-${day.value}`} className="text-xs">
                              Fim
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
                              className="h-9"
                            />
                          </div>
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <Calendar className="h-12 w-12 mx-auto mb-2 opacity-30" />
                      <p className="text-sm">Dia inativo</p>
                      <p className="text-xs mt-1">
                        Ative para configurar os horários
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </DashboardLayout>
  );
}

