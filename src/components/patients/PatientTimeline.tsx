import { useEffect, useRef } from 'react';
import { usePatientTimeline } from '@/hooks/usePatientTimeline';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { 
  Activity, 
  Calendar, 
  Clipboard, 
  FileText, 
  Paperclip, 
  Stethoscope 
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import './PatientTimeline.css';

interface PatientTimelineProps {
  patientId: string;
}

export function PatientTimeline({ patientId }: PatientTimelineProps) {
  const { events, loading, error } = usePatientTimeline(patientId);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Habilitar drag para scroll horizontal
  useEffect(() => {
    const slider = scrollRef.current;
    if (!slider) return;

    let isDown = false;
    let startX: number;
    let scrollLeft: number;

    const handleMouseDown = (e: MouseEvent) => {
      isDown = true;
      slider.classList.add('active');
      startX = e.pageX - slider.offsetLeft;
      scrollLeft = slider.scrollLeft;
    };

    const handleMouseLeave = () => {
      isDown = false;
      slider.classList.remove('active');
    };

    const handleMouseUp = () => {
      isDown = false;
      slider.classList.remove('active');
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (!isDown) return;
      e.preventDefault();
      const x = e.pageX - slider.offsetLeft;
      const walk = (x - startX) * 2; // Velocidade do scroll
      slider.scrollLeft = scrollLeft - walk;
    };

    slider.addEventListener('mousedown', handleMouseDown);
    slider.addEventListener('mouseleave', handleMouseLeave);
    slider.addEventListener('mouseup', handleMouseUp);
    slider.addEventListener('mousemove', handleMouseMove);

    return () => {
      slider.removeEventListener('mousedown', handleMouseDown);
      slider.removeEventListener('mouseleave', handleMouseLeave);
      slider.removeEventListener('mouseup', handleMouseUp);
      slider.removeEventListener('mousemove', handleMouseMove);
    };
  }, []);

  const getIcon = (type: string) => {
    switch (type) {
      case 'medical_record':
        return <Stethoscope className="h-6 w-6" />;
      case 'appointment':
        return <Calendar className="h-6 w-6" />;
      case 'anamnesis':
        return <FileText className="h-6 w-6" />;
      case 'clinical_data':
        return <Activity className="h-6 w-6" />;
      case 'exam':
        return <Clipboard className="h-6 w-6" />;
      case 'attachment':
        return <Paperclip className="h-6 w-6" />;
      default:
        return <FileText className="h-6 w-6" />;
    }
  };

  const getEventLabel = (type: string) => {
    switch (type) {
      case 'medical_record':
        return 'Prontuário';
      case 'appointment':
        return 'Consulta';
      case 'anamnesis':
        return 'Anamnese';
      case 'clinical_data':
        return 'Dados Clínicos';
      case 'exam':
        return 'Exame';
      case 'attachment':
        return 'Anexo';
      default:
        return 'Evento';
    }
  };

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center p-8">
        <div className="space-y-4 w-full">
          <Skeleton className="h-4 w-48 mx-auto" />
          <div className="flex gap-6 justify-center">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex flex-col items-center gap-2">
                <Skeleton className="h-20 w-20 rounded-full" />
                <Skeleton className="h-3 w-24" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-full flex items-center justify-center p-8">
        <Card className="timeline-empty-state max-w-md">
          <CardContent className="py-12 text-center text-muted-foreground">
            <p>Erro ao carregar timeline: {error}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (events.length === 0) {
    return (
      <div className="h-full flex items-center justify-center p-8">
        <Card className="border-dashed timeline-empty-state max-w-md">
          <CardContent className="py-12 text-center text-muted-foreground">
            <Activity className="h-16 w-16 mx-auto mb-4 opacity-50" />
            <p className="text-lg font-medium">Nenhum evento registrado ainda</p>
            <p className="text-sm mt-2">Os eventos aparecerão aqui conforme forem registrados</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="timeline-horizontal-container h-full flex flex-col">
      {/* Header */}
      <div className="px-8 pt-6 pb-4 flex-shrink-0">
        <h3 className="text-base font-semibold text-foreground flex items-center gap-2">
          <Calendar className="h-5 w-5 text-primary" />
          Histórico de Atendimento
        </h3>
        <p className="text-sm text-muted-foreground mt-1">
          {events.length} {events.length === 1 ? 'evento registrado' : 'eventos registrados'}
        </p>
      </div>

      {/* Timeline horizontal com scroll */}
      <div className="flex-1 relative overflow-hidden">
        <div className="absolute inset-0 px-8 pb-8">
          {/* Linha horizontal */}
          <div className="timeline-horizontal-line absolute left-8 right-8 h-0.5 bg-gradient-to-r from-primary/30 via-primary/30 to-transparent" style={{ top: '72px' }} />

          {/* Container de eventos com scroll horizontal */}
          <div ref={scrollRef} className="timeline-horizontal-scroll absolute inset-0 flex items-center gap-10 overflow-x-auto overflow-y-hidden pb-6 px-8">
          {/* Indicador de início */}
          <div className="timeline-horizontal-start flex flex-col items-center min-w-[100px] flex-shrink-0">
            <div className="relative mb-8">
              <div className="absolute top-16 left-1/2 -translate-x-1/2 w-0.5 h-6 bg-primary/30" />
              <div className="relative z-10 flex items-center justify-center h-14 w-14 rounded-full bg-gradient-to-br from-muted to-muted/50 border-2 border-primary/30 shadow-md">
                <div className="h-4 w-4 rounded-full bg-primary/50" />
              </div>
            </div>
            <div className="text-center">
              <p className="text-xs font-semibold text-foreground">Início</p>
              <p className="text-xs text-muted-foreground mt-1">do histórico</p>
            </div>
          </div>

          {[...events].reverse().map((event, index) => {
            const reversedEvents = [...events].reverse();
            const isLastEvent = index === reversedEvents.length - 1; // Último = mais recente
            
            return (
            <div
              key={event.id}
              className="timeline-horizontal-item flex flex-col items-center min-w-[160px] flex-shrink-0"
              style={{ animationDelay: `${(index + 1) * 0.1}s` }}
            >
              {/* Ícone do evento */}
              <div className="timeline-horizontal-icon-wrapper relative mb-8">
                {/* Linha conectora ao topo */}
                <div className="absolute top-[72px] left-1/2 -translate-x-1/2 w-0.5 h-6 bg-primary/40" />
                
                {/* Ícone */}
                <div 
                  className={`timeline-horizontal-icon relative z-10 flex items-center justify-center h-20 w-20 rounded-full bg-gradient-to-br from-primary to-primary/80 text-primary-foreground shadow-xl cursor-pointer group transition-all duration-300 ${isLastEvent ? 'timeline-icon-pulse' : ''}`}
                >
                  {getIcon(event.type)}

                  {/* Tooltip detalhado no hover */}
                  <div className="timeline-tooltip absolute top-[110px] left-1/2 -translate-x-1/2 w-[360px] max-w-[90vw] opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 z-50 pointer-events-none group-hover:pointer-events-auto">
                    <Card className="border-2 border-primary/30 shadow-2xl bg-card/95 backdrop-blur-sm">
                      <CardContent className="p-5">
                        <div className="space-y-4">
                          {/* Header do tooltip */}
                          <div className="flex items-start justify-between gap-3">
                            <Badge variant="default" className="font-medium">
                              {getEventLabel(event.type)}
                            </Badge>
                            <div className="text-xs text-muted-foreground text-right flex-shrink-0">
                              <div className="font-medium text-foreground">
                                {format(new Date(event.date), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                              </div>
                              <div className="mt-1">
                                {format(new Date(event.date), 'HH:mm', { locale: ptBR })}h
                              </div>
                            </div>
                          </div>

                          {/* Título */}
                          <h4 className="font-semibold text-base leading-tight text-foreground">
                            {event.title}
                          </h4>

                          {/* Descrição */}
                          {event.description && (
                            <div className="bg-muted/50 rounded-md p-3 -mx-1">
                              <p className="text-sm text-foreground/90 leading-relaxed line-clamp-4">
                                {event.description}
                              </p>
                            </div>
                          )}

                          {/* Médico */}
                          {event.doctor && (
                            <div className="flex items-center gap-2 pt-2 border-t">
                              <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                                <Stethoscope className="h-4 w-4 text-primary" />
                              </div>
                              <div>
                                <p className="text-xs text-muted-foreground">Responsável</p>
                                <p className="text-sm font-medium text-foreground">Dr(a). {event.doctor}</p>
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Seta do tooltip */}
                        <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-6 h-6 bg-card border-l-2 border-t-2 border-primary/30 rotate-45" />
                      </CardContent>
                    </Card>
                  </div>
                </div>
              </div>

              {/* Resumo abaixo do ícone (sempre visível) */}
              <div className="text-center space-y-1.5">
                <p className="text-sm font-semibold text-foreground">
                  {getEventLabel(event.type)}
                </p>
                <p className="text-xs text-muted-foreground font-medium">
                  {format(new Date(event.date), "dd MMM yyyy", { locale: ptBR })}
                </p>
              </div>
            </div>
            );
          })}

            {/* Espaçador final para garantir visualização do último tooltip */}
            <div className="min-w-[400px] flex-shrink-0" />
          </div>

          {/* Indicador de scroll melhorado */}
          <div className="timeline-scroll-hint absolute bottom-2 left-1/2 -translate-x-1/2 text-xs text-muted-foreground flex items-center gap-2 bg-background/90 backdrop-blur-sm px-4 py-2 rounded-full border shadow-sm z-20 pointer-events-none">
            <div className="flex gap-1">
              <div className="h-1.5 w-1.5 rounded-full bg-primary/60 animate-bounce" style={{ animationDelay: '0s' }} />
              <div className="h-1.5 w-1.5 rounded-full bg-primary/60 animate-bounce" style={{ animationDelay: '0.1s' }} />
              <div className="h-1.5 w-1.5 rounded-full bg-primary/60 animate-bounce" style={{ animationDelay: '0.2s' }} />
            </div>
            <span className="font-medium">Arraste horizontalmente para navegar</span>
          </div>
        </div>
      </div>
    </div>
  );
}