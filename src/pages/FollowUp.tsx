import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { MagicBentoCard } from '@/components/bento/MagicBento';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useRealtimeList } from '@/hooks/useRealtimeList';
import { Clock, Save, User, Phone, Calendar, MessageCircle } from 'lucide-react';
import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { toast } from 'sonner';

type TimeUnit = 'minutes' | 'hours' | 'days';

interface FollowUpConfig {
  id: string;
  followup1_minutes: number;
  followup2_minutes: number;
  followup3_minutes: number;
}

interface ClienteFollowUp {
  id: number;
  nome: string;
  numero: string;
  ultima_atividade: string;
  sessionid: string;
  'follow-up1': string | null;
  data_envio1: string | null;
  mensagem1: string | null;
  'follow-up2': string | null;
  data_envio2: string | null;
  mensagem2: string | null;
  'follow-up3': string | null;
  data_envio3: string | null;
  mensagem3: string | null;
  situacao: string | null;
  followup: string;
}

export default function FollowUp() {
  const [config, setConfig] = useState<FollowUpConfig | null>(null);
  const [editConfig, setEditConfig] = useState({
    followup1: { value: 7, unit: 'days' as TimeUnit },
    followup2: { value: 15, unit: 'days' as TimeUnit },
    followup3: { value: 30, unit: 'days' as TimeUnit },
  });
  const [loadingConfig, setLoadingConfig] = useState(true);
  const [savingConfig, setSavingConfig] = useState(false);

  // Função para converter unidades para minutos
  const toMinutes = (value: number, unit: TimeUnit): number => {
    switch (unit) {
      case 'minutes': return value;
      case 'hours': return value * 60;
      case 'days': return value * 1440; // 1 dia = 24 horas * 60 minutos = 1440
      default: return value;
    }
  };

  // Função para converter minutos para a melhor unidade
  const fromMinutes = (minutes: number): { value: number; unit: TimeUnit } => {
    if (minutes % 1440 === 0) return { value: minutes / 1440, unit: 'days' };
    if (minutes % 60 === 0) return { value: minutes / 60, unit: 'hours' };
    return { value: minutes, unit: 'minutes' };
  };

  // Filtro estável para evitar loops infinitos
  const followUpFilters = useMemo(() => [
    { column: 'followup', operator: 'neq' as const, value: 'encerrado' }
  ], []);

  // Ordenação estável
  const followUpOrder = useMemo(() => ({
    column: 'ultima_atividade',
    ascending: false
  }), []);

  // Buscar clientes de follow-up (excluindo os encerrados)
  const { data: clientes, loading: loadingClientes, error } = useRealtimeList<ClienteFollowUp>({
    table: 'clientes_followup',
    filters: followUpFilters,
    order: followUpOrder,
  });

  // Carregar configuração
  useEffect(() => {
    async function loadConfig() {
      try {
        const { data, error } = await supabase
          .from('followup_config')
          .select('*')
          .limit(1)
          .single();

        if (error) {
          console.error('Erro ao carregar config:', error);
          return;
        }

        if (data) {
          setConfig(data);
          // Converter minutos para unidade apropriada
          setEditConfig({
            followup1: fromMinutes(data.followup1_minutes),
            followup2: fromMinutes(data.followup2_minutes),
            followup3: fromMinutes(data.followup3_minutes),
          });
        }
      } catch (err) {
        console.error('Erro ao carregar configuração:', err);
      } finally {
        setLoadingConfig(false);
      }
    }

    loadConfig();
  }, []);

  const handleSaveConfig = async () => {
    setSavingConfig(true);
    try {
      // Converter valores para minutos antes de salvar
      const dataToSave = {
        followup1_minutes: toMinutes(editConfig.followup1.value, editConfig.followup1.unit),
        followup2_minutes: toMinutes(editConfig.followup2.value, editConfig.followup2.unit),
        followup3_minutes: toMinutes(editConfig.followup3.value, editConfig.followup3.unit),
      };

      if (config?.id) {
        // Atualizar configuração existente
        const { error } = await supabase
          .from('followup_config')
          .update(dataToSave)
          .eq('id', config.id);

        if (error) throw error;
        toast.success('Configuração salva com sucesso!');
      } else {
        // Criar nova configuração
        const { data, error } = await supabase
          .from('followup_config')
          .insert([dataToSave])
          .select()
          .single();

        if (error) throw error;
        setConfig(data);
        toast.success('Configuração criada com sucesso!');
      }
    } catch (err: any) {
      console.error('Erro ao salvar configuração:', err);
      toast.error('Erro ao salvar configuração: ' + err.message);
    } finally {
      setSavingConfig(false);
    }
  };

  const formatPhone = (numero: string) => {
    return numero.replace('@s.whatsapp.net', '').replace(/(\d{2})(\d{2})(\d{5})(\d{4})/, '+$1 ($2) $3-$4');
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '-';
    try {
      return new Date(dateString).toLocaleDateString('pt-BR');
    } catch {
      return dateString;
    }
  };

  const getFollowUpStatus = (cliente: ClienteFollowUp) => {
    const followups = [
      { num: 1, status: cliente['follow-up1'], date: cliente.data_envio1 },
      { num: 2, status: cliente['follow-up2'], date: cliente.data_envio2 },
      { num: 3, status: cliente['follow-up3'], date: cliente.data_envio3 },
    ];

    const completed = followups.filter(f => f.status === 'concluido').length;
    return { completed, total: 3, followups };
  };

  return (
    <DashboardLayout>
      <div className="p-8 space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-foreground">Follow Up</h1>
          <p className="text-muted-foreground mt-1">Configure os períodos e acompanhe seus clientes</p>
        </div>

        {/* Card de Configuração Minimalista */}
        <MagicBentoCard>
          <CardHeader className="space-y-4 pb-8">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Clock className="w-5 h-5 text-primary" />
              </div>
              <div>
                <CardTitle className="text-xl font-semibold">Configuração de Períodos</CardTitle>
                <CardDescription className="text-sm mt-1">
                  Defina o intervalo de tempo para cada follow-up
                </CardDescription>
              </div>
            </div>
          </CardHeader>

          <CardContent className="pb-8 px-6">
            {loadingConfig ? (
              <div className="flex items-center justify-center py-12">
                <Clock className="w-6 h-6 animate-spin text-muted-foreground mr-2" />
                <span className="text-sm text-muted-foreground">Carregando...</span>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Grid Minimalista de Follow-ups */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  
                  {/* 1º Follow-up - Clean */}
                  <div className="group">
                    <div className="text-sm font-medium text-muted-foreground mb-3 flex items-center gap-2">
                      <span className="w-6 h-6 rounded-md bg-foreground text-background flex items-center justify-center text-xs font-bold">1</span>
                      Primeiro Follow-up
                    </div>
                    <div className="space-y-3">
                      <div>
                        <Label htmlFor="followup1" className="text-xs text-muted-foreground mb-1.5 block">Período</Label>
                        <Input
                          id="followup1"
                          type="number"
                          min="1"
                          value={editConfig.followup1.value}
                          onChange={(e) => setEditConfig({ 
                            ...editConfig, 
                            followup1: { ...editConfig.followup1, value: parseInt(e.target.value) || 0 }
                          })}
                          className="text-center text-lg font-semibold h-11"
                        />
                      </div>
                      <div>
                        <Label className="text-xs text-muted-foreground mb-1.5 block">Unidade</Label>
                        <select
                          value={editConfig.followup1.unit}
                          onChange={(e) => setEditConfig({ 
                            ...editConfig, 
                            followup1: { ...editConfig.followup1, unit: e.target.value as TimeUnit }
                          })}
                          className="w-full h-11 rounded-md border border-input bg-background px-3 text-sm"
                        >
                          <option value="minutes">Minutos</option>
                          <option value="hours">Horas</option>
                          <option value="days">Dias</option>
                        </select>
                      </div>
                      <div className="text-xs text-muted-foreground text-center pt-1">
                        = {toMinutes(editConfig.followup1.value, editConfig.followup1.unit)} minutos
                      </div>
                    </div>
                  </div>

                  {/* 2º Follow-up - Clean */}
                  <div className="group">
                    <div className="text-sm font-medium text-muted-foreground mb-3 flex items-center gap-2">
                      <span className="w-6 h-6 rounded-md bg-foreground text-background flex items-center justify-center text-xs font-bold">2</span>
                      Segundo Follow-up
                    </div>
                    <div className="space-y-3">
                      <div>
                        <Label htmlFor="followup2" className="text-xs text-muted-foreground mb-1.5 block">Período</Label>
                        <Input
                          id="followup2"
                          type="number"
                          min="1"
                          value={editConfig.followup2.value}
                          onChange={(e) => setEditConfig({ 
                            ...editConfig, 
                            followup2: { ...editConfig.followup2, value: parseInt(e.target.value) || 0 }
                          })}
                          className="text-center text-lg font-semibold h-11"
                        />
                      </div>
                      <div>
                        <Label className="text-xs text-muted-foreground mb-1.5 block">Unidade</Label>
                        <select
                          value={editConfig.followup2.unit}
                          onChange={(e) => setEditConfig({ 
                            ...editConfig, 
                            followup2: { ...editConfig.followup2, unit: e.target.value as TimeUnit }
                          })}
                          className="w-full h-11 rounded-md border border-input bg-background px-3 text-sm"
                        >
                          <option value="minutes">Minutos</option>
                          <option value="hours">Horas</option>
                          <option value="days">Dias</option>
                        </select>
                      </div>
                      <div className="text-xs text-muted-foreground text-center pt-1">
                        = {toMinutes(editConfig.followup2.value, editConfig.followup2.unit)} minutos
                      </div>
                    </div>
                  </div>

                  {/* 3º Follow-up - Clean */}
                  <div className="group">
                    <div className="text-sm font-medium text-muted-foreground mb-3 flex items-center gap-2">
                      <span className="w-6 h-6 rounded-md bg-foreground text-background flex items-center justify-center text-xs font-bold">3</span>
                      Terceiro Follow-up
                    </div>
                    <div className="space-y-3">
                      <div>
                        <Label htmlFor="followup3" className="text-xs text-muted-foreground mb-1.5 block">Período</Label>
                        <Input
                          id="followup3"
                          type="number"
                          min="1"
                          value={editConfig.followup3.value}
                          onChange={(e) => setEditConfig({ 
                            ...editConfig, 
                            followup3: { ...editConfig.followup3, value: parseInt(e.target.value) || 0 }
                          })}
                          className="text-center text-lg font-semibold h-11"
                        />
                      </div>
                      <div>
                        <Label className="text-xs text-muted-foreground mb-1.5 block">Unidade</Label>
                        <select
                          value={editConfig.followup3.unit}
                          onChange={(e) => setEditConfig({ 
                            ...editConfig, 
                            followup3: { ...editConfig.followup3, unit: e.target.value as TimeUnit }
                          })}
                          className="w-full h-11 rounded-md border border-input bg-background px-3 text-sm"
                        >
                          <option value="minutes">Minutos</option>
                          <option value="hours">Horas</option>
                          <option value="days">Dias</option>
                        </select>
                      </div>
                      <div className="text-xs text-muted-foreground text-center pt-1">
                        = {toMinutes(editConfig.followup3.value, editConfig.followup3.unit)} minutos
                      </div>
                    </div>
                  </div>
                </div>

                {/* Botão Minimalista */}
                <div className="flex justify-end pt-6 border-t">
                  <Button 
                    onClick={handleSaveConfig} 
                    disabled={savingConfig}
                    className="px-6"
                  >
                    <Save className="w-4 h-4 mr-2" />
                    {savingConfig ? 'Salvando...' : 'Salvar'}
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </MagicBentoCard>

        {/* Lista de Clientes */}
        <div>
          <h2 className="text-2xl font-semibold mb-4">
            Clientes em Follow Up ({clientes.length})
          </h2>
          
          {loadingClientes ? (
            <MagicBentoCard contentClassName="p-6">
              <div className="text-center text-muted-foreground">Carregando clientes...</div>
            </MagicBentoCard>
          ) : error ? (
            <MagicBentoCard contentClassName="p-6">
              <div className="text-center text-destructive">Erro: {error}</div>
            </MagicBentoCard>
          ) : clientes.length === 0 ? (
            <MagicBentoCard contentClassName="p-6">
              <div className="text-center text-muted-foreground">
                Nenhum cliente em follow-up no momento
              </div>
            </MagicBentoCard>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {clientes.map((cliente) => {
                const status = getFollowUpStatus(cliente);
                return (
                  <Card key={cliente.id} className="hover:shadow-lg transition-shadow">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-2">
                          <User className="w-5 h-5 text-primary" />
                          <CardTitle className="text-lg">{cliente.nome}</CardTitle>
                        </div>
                        <Badge variant={status.completed === 3 ? "default" : "secondary"}>
                          {status.completed}/3
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Phone className="w-4 h-4" />
                        <span className="truncate">{formatPhone(cliente.numero)}</span>
                      </div>
                      
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Calendar className="w-4 h-4" />
                        <span>Última atividade: {formatDate(cliente.ultima_atividade)}</span>
                      </div>

                      {cliente.situacao && (
                        <div className="text-sm">
                          <span className="font-medium">Situação:</span> {cliente.situacao}
                        </div>
                      )}

                      <div className="pt-3 border-t space-y-2">
                        <div className="text-sm font-medium mb-2">Status dos Follow-ups:</div>
                        {status.followups.map((f) => (
                          <div key={f.num} className="flex items-center justify-between text-sm">
                            <span className="flex items-center gap-2">
                              <MessageCircle className="w-3 h-3" />
                              Follow-up {f.num}
                            </span>
                            {f.status === 'concluido' ? (
                              <Badge variant="default" className="text-xs">
                                Enviado {formatDate(f.date)}
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="text-xs">
                                Pendente
                              </Badge>
                            )}
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
