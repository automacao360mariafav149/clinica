import { usePatientTimeline } from '@/hooks/usePatientTimeline';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
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

interface PatientTimelineProps {
  patientId: string;
}

export function PatientTimeline({ patientId }: PatientTimelineProps) {
  const { events, loading, error } = usePatientTimeline(patientId);

  const getIcon = (type: string) => {
    switch (type) {
      case 'medical_record':
        return <Stethoscope className="h-5 w-5" />;
      case 'appointment':
        return <Calendar className="h-5 w-5" />;
      case 'anamnesis':
        return <FileText className="h-5 w-5" />;
      case 'clinical_data':
        return <Activity className="h-5 w-5" />;
      case 'exam':
        return <Clipboard className="h-5 w-5" />;
      case 'attachment':
        return <Paperclip className="h-5 w-5" />;
      default:
        return <FileText className="h-5 w-5" />;
    }
  };

  const getIconColor = (type: string) => {
    switch (type) {
      case 'medical_record':
        return 'text-blue-500 bg-blue-50';
      case 'appointment':
        return 'text-green-500 bg-green-50';
      case 'anamnesis':
        return 'text-purple-500 bg-purple-50';
      case 'clinical_data':
        return 'text-orange-500 bg-orange-50';
      case 'exam':
        return 'text-pink-500 bg-pink-50';
      case 'attachment':
        return 'text-gray-500 bg-gray-50';
      default:
        return 'text-gray-500 bg-gray-50';
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex gap-4">
            <Skeleton className="h-10 w-10 rounded-full shrink-0" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-1/2" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          <p>Erro ao carregar timeline: {error}</p>
        </CardContent>
      </Card>
    );
  }

  if (events.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          <p>Nenhum evento registrado ainda</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="relative space-y-8">
      {/* Linha vertical */}
      <div className="absolute left-5 top-0 bottom-0 w-0.5 bg-border" />

      {events.map((event, index) => (
        <div key={event.id} className="relative flex gap-4">
          {/* Ícone */}
          <div
            className={`
              relative z-10 flex items-center justify-center
              h-10 w-10 rounded-full shrink-0
              ${getIconColor(event.type)}
            `}
          >
            {getIcon(event.type)}
          </div>

          {/* Conteúdo */}
          <div className="flex-1 pb-8">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-foreground">
                      {event.title}
                    </h4>
                    {event.description && (
                      <p className="text-sm text-muted-foreground mt-1">
                        {event.description}
                      </p>
                    )}
                    {event.doctor && (
                      <p className="text-xs text-muted-foreground mt-2">
                        Médico: {event.doctor}
                      </p>
                    )}
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(event.date), 'dd MMM yyyy', { locale: ptBR })}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(event.date), 'HH:mm', { locale: ptBR })}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      ))}
    </div>
  );
}
