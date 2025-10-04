import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card } from '@/components/ui/card';
import { Users } from 'lucide-react';

export default function Patients() {
  return (
    <DashboardLayout>
      <div className="p-8 space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Pacientes</h1>
          <p className="text-muted-foreground mt-1">Sistema de gestão de pacientes (CRM)</p>
        </div>

        <Card className="bg-card border-border p-12">
          <div className="flex flex-col items-center justify-center gap-4 text-center">
            <Users className="w-16 h-16 text-primary" />
            <div>
              <h3 className="text-xl font-semibold text-foreground">CRM de Pacientes</h3>
              <p className="text-muted-foreground mt-2">
                Sistema completo de gestão será configurado em breve
              </p>
            </div>
          </div>
        </Card>
      </div>
    </DashboardLayout>
  );
}
