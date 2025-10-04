import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card } from '@/components/ui/card';
import { ClipboardList } from 'lucide-react';

export default function FollowUp() {
  return (
    <DashboardLayout>
      <div className="p-8 space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Follow Up</h1>
          <p className="text-muted-foreground mt-1">Acompanhamento de pacientes</p>
        </div>

        <Card className="bg-card border-border p-12">
          <div className="flex flex-col items-center justify-center gap-4 text-center">
            <ClipboardList className="w-16 h-16 text-primary" />
            <div>
              <h3 className="text-xl font-semibold text-foreground">Painel de Follow Up</h3>
              <p className="text-muted-foreground mt-2">
                Sistema de acompanhamento de retornos será configurado em breve
              </p>
            </div>
          </div>
        </Card>
      </div>
    </DashboardLayout>
  );
}
