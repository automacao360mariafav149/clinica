import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card } from '@/components/ui/card';
import { Calendar } from 'lucide-react';

export default function Agenda() {
  return (
    <DashboardLayout>
      <div className="p-8 space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Agenda</h1>
          <p className="text-muted-foreground mt-1">Gerencie seus agendamentos</p>
        </div>

        <Card className="bg-card border-border p-12">
          <div className="flex flex-col items-center justify-center gap-4 text-center">
            <Calendar className="w-16 h-16 text-primary" />
            <div>
              <h3 className="text-xl font-semibold text-foreground">Agenda em Desenvolvimento</h3>
              <p className="text-muted-foreground mt-2">
                Interface de calendário estilo Google Calendar será configurada em breve
              </p>
            </div>
          </div>
        </Card>
      </div>
    </DashboardLayout>
  );
}
