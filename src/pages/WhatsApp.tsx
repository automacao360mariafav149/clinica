import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card } from '@/components/ui/card';
import { MessageCircle } from 'lucide-react';

export default function WhatsApp() {
  return (
    <DashboardLayout requiredRoles={['owner', 'secretary']}>
      <div className="p-8 space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground">WhatsApp</h1>
          <p className="text-muted-foreground mt-1">Gestão de conversas com pacientes</p>
        </div>

        <Card className="bg-card border-border p-12">
          <div className="flex flex-col items-center justify-center gap-4 text-center">
            <MessageCircle className="w-16 h-16 text-primary" />
            <div>
              <h3 className="text-xl font-semibold text-foreground">Interface WhatsApp</h3>
              <p className="text-muted-foreground mt-2">
                Interface de mensagens será configurada posteriormente
              </p>
            </div>
          </div>
        </Card>
      </div>
    </DashboardLayout>
  );
}
