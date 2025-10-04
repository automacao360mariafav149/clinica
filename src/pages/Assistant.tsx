import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { MagicBentoCard } from '@/components/bento/MagicBento';
import { MessageSquare } from 'lucide-react';

export default function Assistant() {
  return (
    <DashboardLayout>
      <div className="p-8 space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Assistente Pessoal</h1>
          <p className="text-muted-foreground mt-1">Chat inteligente para auxiliar no atendimento</p>
        </div>

        <MagicBentoCard contentClassName="p-12">
          <div className="flex flex-col items-center justify-center gap-4 text-center">
            <MessageSquare className="w-16 h-16 text-primary" />
            <div>
              <h3 className="text-xl font-semibold text-foreground">Assistente em Desenvolvimento</h3>
              <p className="text-muted-foreground mt-2">
                Interface de chat com IA será configurada posteriormente
              </p>
            </div>
          </div>
        </MagicBentoCard>
      </div>
    </DashboardLayout>
  );
}
