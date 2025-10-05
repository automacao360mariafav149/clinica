import { useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileSearch, Calculator, Microscope, ArrowRight } from 'lucide-react';
import { AgentCIDModal } from '@/components/assistant/AgentCIDModal';
import { AgentMedicationModal } from '@/components/assistant/AgentMedicationModal';
import { AgentExamModal } from '@/components/assistant/AgentExamModal';

export default function Assistant() {
  const [cidModalOpen, setCidModalOpen] = useState(false);
  const [medicationModalOpen, setMedicationModalOpen] = useState(false);
  const [examModalOpen, setExamModalOpen] = useState(false);

  const agents = [
    {
      id: 'cid',
      title: 'Agent CID',
      description: 'Consulta e busca de códigos CID-10 e CID-11 para diagnósticos',
      icon: FileSearch,
      color: 'from-blue-500/20 to-cyan-500/20',
      iconColor: 'text-blue-500',
    },
    {
      id: 'medication',
      title: 'Agent de Cálculo de Medicação',
      description: 'Cálculo preciso de dosagens e posologias medicamentosas',
      icon: Calculator,
      color: 'from-purple-500/20 to-pink-500/20',
      iconColor: 'text-purple-500',
    },
    {
      id: 'exams',
      title: 'Agent de Exames',
      description: 'Auxílio na interpretação e solicitação de exames laboratoriais',
      icon: Microscope,
      color: 'from-orange-500/20 to-amber-500/20',
      iconColor: 'text-orange-500',
    },
  ];

  const handleAgentClick = (agentId: string) => {
    switch (agentId) {
      case 'cid':
        setCidModalOpen(true);
        break;
      case 'medication':
        setMedicationModalOpen(true);
        break;
      case 'exams':
        setExamModalOpen(true);
        break;
      default:
        console.log(`Agent desconhecido: ${agentId}`);
    }
  };

  return (
    <DashboardLayout>
      <div className="p-8 space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Assistente Inteligente</h1>
          <p className="text-muted-foreground mt-1">
            Ferramentas de IA para auxiliar no seu dia a dia clínico
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {agents.map((agent) => {
            const Icon = agent.icon;
            return (
              <Card
                key={agent.id}
                className="group relative overflow-hidden border-2 hover:border-primary/50 transition-all duration-300 hover:shadow-lg cursor-pointer"
                onClick={() => handleAgentClick(agent.id)}
              >
                {/* Background gradient */}
                <div
                  className={`absolute inset-0 bg-gradient-to-br ${agent.color} opacity-0 group-hover:opacity-100 transition-opacity duration-300`}
                />

                <CardHeader className="relative">
                  <div className="flex items-start justify-between">
                    <div
                      className={`p-3 rounded-lg bg-gradient-to-br ${agent.color} border border-border/50`}
                    >
                      <Icon className={`w-8 h-8 ${agent.iconColor}`} />
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <ArrowRight className="w-5 h-5" />
                    </Button>
                  </div>
                  <CardTitle className="text-xl mt-4">{agent.title}</CardTitle>
                  <CardDescription className="text-base">
                    {agent.description}
                  </CardDescription>
                </CardHeader>

                <CardContent className="relative">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                    <span>Disponível</span>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Info section */}
        <Card className="border-dashed">
          <CardContent className="py-6">
            <p className="text-sm text-muted-foreground text-center">
              💡 Clique em qualquer card para acessar o assistente correspondente. 
              Cada agente será configurado com funcionalidades específicas.
            </p>
          </CardContent>
        </Card>

        {/* Medical Disclaimer */}
        <Card className="border-amber-500/30 bg-amber-500/5">
          <CardContent className="py-6">
            <h3 className="text-xs font-bold text-amber-700 dark:text-amber-400 mb-3 text-center uppercase tracking-wide">
              Isenção de Responsabilidade Médica
            </h3>
            <div className="text-xs text-muted-foreground space-y-2 leading-relaxed">
              <p>
                Estas ferramentas são fornecidas apenas para fins informativos e educacionais.
              </p>
              <p>
                As Ferramentas NÃO:
              </p>
              <ul className="list-disc list-inside space-y-1 ml-2">
                <li>Constituem aconselhamento médico, diagnóstico ou tratamento</li>
                <li>Substituem a consulta com profissionais de saúde qualificados</li>
                <li>Garantem a precisão ou adequação para casos individuais</li>
                <li>Consideram todas as variáveis clínicas possíveis</li>
              </ul>
              <p className="mt-3">
                O usuário assume total responsabilidade pelo uso das informações 
                fornecidas. Os desenvolvedores não se responsabilizam por quaisquer 
                danos diretos, indiretos ou consequenciais resultantes do uso ou 
                impossibilidade de uso destas Ferramentas.
              </p>
              <p className="mt-2 font-medium text-center">
                Ao utilizar estas Ferramentas, você concorda com estes termos.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Modals */}
      <AgentCIDModal open={cidModalOpen} onOpenChange={setCidModalOpen} />
      <AgentMedicationModal open={medicationModalOpen} onOpenChange={setMedicationModalOpen} />
      <AgentExamModal open={examModalOpen} onOpenChange={setExamModalOpen} />
    </DashboardLayout>
  );
}
