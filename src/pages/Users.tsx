import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card } from '@/components/ui/card';
import { Settings } from 'lucide-react';

export default function Users() {
  return (
    <DashboardLayout requiredRoles={['owner']}>
      <div className="p-8 space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Gerenciar Usuários</h1>
          <p className="text-muted-foreground mt-1">Administração de médicos e secretárias</p>
        </div>

        <Card className="bg-card border-border p-12">
          <div className="flex flex-col items-center justify-center gap-4 text-center">
            <Settings className="w-16 h-16 text-primary" />
            <div>
              <h3 className="text-xl font-semibold text-foreground">Gestão de Usuários</h3>
              <p className="text-muted-foreground mt-2">
                Sistema de cadastro e gerenciamento será configurado posteriormente
              </p>
            </div>
          </div>
        </Card>
      </div>
    </DashboardLayout>
  );
}
