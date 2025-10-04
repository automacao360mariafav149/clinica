import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card } from '@/components/ui/card';
import { Video } from 'lucide-react';

export default function Teleconsulta() {
  return (
    <DashboardLayout requiredRoles={['owner', 'doctor']}>
      <div className="p-8 space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Teleconsulta</h1>
          <p className="text-muted-foreground mt-1">Atendimento remoto por vídeo</p>
        </div>

        <Card className="bg-card border-border p-12">
          <div className="flex flex-col items-center justify-center gap-4 text-center">
            <Video className="w-16 h-16 text-primary" />
            <div>
              <h3 className="text-xl font-semibold text-foreground">Sistema de Teleconsulta</h3>
              <p className="text-muted-foreground mt-2">
                Plataforma de videochamadas será configurada posteriormente
              </p>
            </div>
          </div>
        </Card>
      </div>
    </DashboardLayout>
  );
}
