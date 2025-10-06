import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, RefreshCw, AlertCircle, CheckCircle2, Plug, User, Calendar, Clock, Phone, Play, Power, Edit } from 'lucide-react';
import { toast } from 'sonner';
import { getApiBaseUrl } from '@/lib/apiConfig';

interface Instance {
  id?: string;
  status?: string;
  name?: string;
  profileName?: string;
  profilePicUrl?: string;
  owner?: string;
  created?: string;
  currentTime?: string;
  [key: string]: any;
}

export default function Integration() {
  const [instances, setInstances] = useState<Instance[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<{ [key: string]: boolean }>({});
  const [editNameModal, setEditNameModal] = useState<{ open: boolean; instanceId: string; currentName: string }>({
    open: false,
    instanceId: '',
    currentName: '',
  });
  const [newName, setNewName] = useState('');
  const [connectModal, setConnectModal] = useState<{ 
    open: boolean; 
    instanceName: string; 
    phoneNumber: string;
    paircode: string;
    isWaitingConnection: boolean;
  }>({
    open: false,
    instanceName: '',
    phoneNumber: '',
    paircode: '',
    isWaitingConnection: false,
  });
  const [pollingInterval, setPollingInterval] = useState<NodeJS.Timeout | null>(null);

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return new Intl.DateTimeFormat('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      }).format(date);
    } catch {
      return dateString;
    }
  };

  const fetchInstances = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const apiBaseUrl = await getApiBaseUrl();
      const response = await fetch(`${apiBaseUrl}/listar-instancias`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({}),
      });
      
      if (!response.ok) {
        throw new Error(`Erro ao buscar instâncias: ${response.status}`);
      }
      
      const data = await response.json();
      
      // Se a resposta for um array, usa diretamente, senão tenta acessar uma propriedade comum
      if (Array.isArray(data)) {
        setInstances(data);
      } else if (data.instances) {
        setInstances(data.instances);
      } else if (data.data) {
        setInstances(data.data);
      } else {
        // Se for um objeto único, coloca em um array
        setInstances([data]);
      }
      
      toast.success('Instâncias carregadas com sucesso!');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
      setError(errorMessage);
      toast.error(`Erro ao carregar instâncias: ${errorMessage}`);
      console.error('Erro ao buscar instâncias:', err);
    } finally {
      setLoading(false);
    }
  };

  const openConnectModal = (instanceName: string) => {
    setConnectModal({ 
      open: true, 
      instanceName, 
      phoneNumber: '',
      paircode: '',
      isWaitingConnection: false,
    });
  };

  const checkConnectionStatus = async (instanceName: string) => {
    try {
      console.log('🔍 Verificando status da instância:', instanceName);
      
      const apiBaseUrl = await getApiBaseUrl();
      const response = await fetch(`${apiBaseUrl}/listar-instancias`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({}),
      });
      
      if (!response.ok) {
        throw new Error(`Erro ao verificar status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('📦 Dados recebidos:', data);
      console.log('📋 Tipo dos dados:', Array.isArray(data) ? 'Array' : 'Objeto');
      
      let foundItem = null;
      
      // Procura a instância - pode ser array [{...}] ou objeto direto {...}
      if (Array.isArray(data)) {
        console.log('🔎 Buscando instância no ARRAY com nome:', instanceName);
        foundItem = data.find((item: any) => {
          console.log('  - Verificando item:', item.name, '===', instanceName, '?', item.name === instanceName);
          return item.name === instanceName;
        });
      } else if (data && typeof data === 'object') {
        console.log('🔎 Verificando OBJETO direto com nome:', data.name);
        // Se for um objeto direto, verifica se o nome bate
        if (data.name === instanceName) {
          foundItem = data;
          console.log('✅ Nome bate!');
        } else {
          console.log('❌ Nome não bate:', data.name, '!==', instanceName);
        }
      }
      
      console.log('✅ Instância encontrada:', foundItem);
      
      // Verifica se a instância está conectada
      if (foundItem) {
        console.log('📊 Status atual:', foundItem.status);
        
        if (foundItem.status === 'connected') {
          console.log('🎉 Status CONNECTED detectado! Fechando modal...');
          
          // Parar polling
          if (pollingInterval) {
            clearInterval(pollingInterval);
            setPollingInterval(null);
          }
          
          // Mostrar sucesso e fechar modal
          toast.success('✅ Instância conectada com sucesso!');
          setConnectModal({ 
            open: false, 
            instanceName: '', 
            phoneNumber: '',
            paircode: '',
            isWaitingConnection: false,
          });
          
          // Atualizar lista
          await fetchInstances();
          
          return true;
        } else {
          console.log('⏳ Status ainda é:', foundItem.status, '- Aguardando...');
        }
      } else {
        console.log('❌ Instância não encontrada');
      }
      
      return false;
    } catch (err) {
      console.error('Erro ao verificar status:', err);
      return false;
    }
  };

  const handleConnect = async () => {
    if (!connectModal.instanceName.trim()) {
      toast.error('Por favor, insira o nome da instância');
      return;
    }

    if (!connectModal.phoneNumber.trim()) {
      toast.error('Por favor, insira o número de telefone');
      return;
    }

    setActionLoading(prev => ({ ...prev, [`connect-${connectModal.instanceName}`]: true }));
    
    try {
      const apiBaseUrl = await getApiBaseUrl();
      const response = await fetch(`${apiBaseUrl}/conectar-instancia`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          name: connectModal.instanceName.trim(),
          phoneNumber: connectModal.phoneNumber.trim(),
        }),
      });
      
      if (!response.ok) {
        throw new Error(`Erro ao conectar instância: ${response.status}`);
      }
      
      const data = await response.json();
      
      // Extrair paircode da resposta do endpoint /conectar-instancia
      // Estrutura: [{instance: {paircode: "5YE9-GA45"}}]
      let paircode = '';
      if (Array.isArray(data) && data.length > 0) {
        paircode = data[0]?.instance?.paircode || '';
      } else if (data.instance?.paircode) {
        paircode = data.instance.paircode || '';
      }
      
      if (paircode) {
        // Atualizar modal com paircode e estado de aguardando
        setConnectModal(prev => ({ 
          ...prev, 
          paircode,
          isWaitingConnection: true,
        }));
        
        toast.success('Código de pareamento gerado! Aguardando conexão...');
        
        // Iniciar polling a cada 2 segundos
        const interval = setInterval(() => {
          checkConnectionStatus(connectModal.instanceName);
        }, 2000);
        
        setPollingInterval(interval);
      } else {
        toast.error('Não foi possível obter o código de pareamento');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
      toast.error(`Erro ao conectar: ${errorMessage}`);
      console.error('Erro ao conectar instância:', err);
    } finally {
      setActionLoading(prev => ({ ...prev, [`connect-${connectModal.instanceName}`]: false }));
    }
  };

  const handleDisconnect = async (instanceName: string) => {
    setActionLoading(prev => ({ ...prev, [`disconnect-${instanceName}`]: true }));
    
    try {
      const apiBaseUrl = await getApiBaseUrl();
      const response = await fetch(`${apiBaseUrl}/desconectar-instancias`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name: instanceName }),
      });
      
      if (!response.ok) {
        throw new Error(`Erro ao desconectar instância: ${response.status}`);
      }
      
      toast.success('Instância desconectada com sucesso!');
      await fetchInstances(); // Atualiza a lista
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
      toast.error(`Erro ao desconectar: ${errorMessage}`);
      console.error('Erro ao desconectar instância:', err);
    } finally {
      setActionLoading(prev => ({ ...prev, [`disconnect-${instanceName}`]: false }));
    }
  };

  const handleUpdateName = async () => {
    if (!newName.trim()) {
      toast.error('Por favor, insira um nome válido');
      return;
    }

    setActionLoading(prev => ({ ...prev, [`update-${editNameModal.instanceId}`]: true }));
    
    try {
      const apiBaseUrl = await getApiBaseUrl();
      const response = await fetch(`${apiBaseUrl}/atualizar-nome-instancia`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          instanceId: editNameModal.instanceId,
          currentName: editNameModal.currentName,
          newName: newName.trim(),
        }),
      });
      
      if (!response.ok) {
        throw new Error(`Erro ao atualizar nome: ${response.status}`);
      }
      
      toast.success('Nome da instância atualizado com sucesso!');
      setEditNameModal({ open: false, instanceId: '', currentName: '' });
      setNewName('');
      await fetchInstances(); // Atualiza a lista
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
      toast.error(`Erro ao atualizar nome: ${errorMessage}`);
      console.error('Erro ao atualizar nome:', err);
    } finally {
      setActionLoading(prev => ({ ...prev, [`update-${editNameModal.instanceId}`]: false }));
    }
  };

  const openEditNameModal = (instanceId: string, currentName: string) => {
    setEditNameModal({ open: true, instanceId, currentName });
    setNewName(currentName);
  };

  useEffect(() => {
    fetchInstances();
  }, []);

  // Limpar polling quando o modal fechar ou componente desmontar
  useEffect(() => {
    if (!connectModal.open && pollingInterval) {
      clearInterval(pollingInterval);
      setPollingInterval(null);
    }
    
    return () => {
      if (pollingInterval) {
        clearInterval(pollingInterval);
      }
    };
  }, [connectModal.open, pollingInterval]);

  return (
    <DashboardLayout>
      <div className="p-6 space-y-8">
        {/* Header com gradiente */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/10 via-primary/5 to-background p-8 border border-primary/20">
          <div className="absolute inset-0 bg-grid-white/10 [mask-image:radial-gradient(white,transparent_85%)]" />
          <div className="relative flex items-center justify-between">
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10 border border-primary/20">
                  <Plug className="w-6 h-6 text-primary" />
                </div>
                <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                  Integração WhatsApp
                </h1>
              </div>
              <p className="text-muted-foreground ml-14">
                Gerencie e monitore suas instâncias do WhatsApp conectadas
              </p>
            </div>
            <Button 
              onClick={fetchInstances} 
              disabled={loading}
              size="lg"
              className="gap-2 shadow-lg hover:shadow-xl transition-all"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Carregando...
                </>
              ) : (
                <>
                  <RefreshCw className="w-5 h-5" />
                  Atualizar
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Error State */}
        {error && (
          <Card className="border-2 border-destructive bg-destructive/5">
            <CardContent className="pt-6">
              <div className="flex items-start gap-4 p-4">
                <div className="p-3 rounded-full bg-destructive/10">
                  <AlertCircle className="w-6 h-6 text-destructive" />
                </div>
                <div className="flex-1 space-y-2">
                  <p className="font-bold text-lg text-destructive">Erro ao carregar dados</p>
                  <p className="text-sm text-muted-foreground">{error}</p>
                  <Button 
                    onClick={fetchInstances} 
                    variant="destructive" 
                    size="sm"
                    className="mt-3 gap-2"
                  >
                    <RefreshCw className="w-4 h-4" />
                    Tentar novamente
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Loading State */}
        {loading && instances.length === 0 && (
          <Card className="border-2 border-dashed">
            <CardContent className="pt-6">
              <div className="flex flex-col items-center justify-center gap-4 py-12">
                <div className="relative">
                  <div className="absolute inset-0 animate-ping">
                    <Plug className="w-12 h-12 text-primary/20" />
                  </div>
                  <Loader2 className="w-12 h-12 animate-spin text-primary relative z-10" />
                </div>
                <div className="text-center">
                  <p className="text-lg font-semibold">Carregando instâncias...</p>
                  <p className="text-sm text-muted-foreground">Aguarde enquanto buscamos os dados</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Instances Grid */}
        {!loading && instances.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {instances.map((instance, index) => (
              <Card 
                key={instance.id || index} 
                className="group relative overflow-hidden hover:shadow-2xl transition-all duration-300 border-2 hover:border-primary/30 hover:-translate-y-1"
              >
                {/* Gradiente de fundo decorativo */}
                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                
                <CardHeader className="relative space-y-4 pb-4">
                  {/* Badge de Status no canto */}
                  {instance.status && (
                    <div className="absolute top-4 right-4">
                      <Badge 
                        variant={instance.status === 'connected' ? 'default' : 'secondary'}
                        className={`
                          shrink-0 px-3 py-1 shadow-md
                          ${instance.status === 'connected' ? 'bg-green-500 hover:bg-green-600' : ''}
                        `}
                      >
                        {instance.status === 'connected' && (
                          <CheckCircle2 className="w-3 h-3 mr-1" />
                        )}
                        {instance.status}
                      </Badge>
                    </div>
                  )}
                  
                  {/* Avatar e Info Principal */}
                  <div className="flex items-center gap-4 pt-2">
                    <div className="relative">
                      <Avatar className="w-16 h-16 border-4 border-primary/20 shadow-lg ring-2 ring-background">
                        <AvatarImage src={instance.profilePicUrl} alt={instance.profileName || instance.name} />
                        <AvatarFallback className="bg-gradient-to-br from-primary/20 to-primary/10">
                          <User className="w-8 h-8 text-primary" />
                        </AvatarFallback>
                      </Avatar>
                      {instance.status === 'connected' && (
                        <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-500 rounded-full border-2 border-background animate-pulse" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-xl font-bold truncate">
                        {instance.name || 'N/A'}
                      </CardTitle>
                      <CardDescription className="text-sm font-medium truncate">
                        {instance.profileName || 'Sem nome'}
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent className="relative space-y-3">
                  {/* Divider */}
                  <div className="h-px bg-gradient-to-r from-transparent via-border to-transparent mb-4" />
                  
                  {/* Owner */}
                  {instance.owner && (
                    <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors">
                      <div className="p-2 rounded-lg bg-primary/10">
                        <Phone className="w-4 h-4 text-primary" />
                      </div>
                      <div className="flex-1">
                        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Proprietário</p>
                        <p className="text-sm font-semibold text-foreground">{instance.owner}</p>
                      </div>
                    </div>
                  )}
                  
                  {/* Criação */}
                  {instance.created && (
                    <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors">
                      <div className="p-2 rounded-lg bg-blue-500/10">
                        <Calendar className="w-4 h-4 text-blue-500" />
                      </div>
                      <div className="flex-1">
                        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Criado em</p>
                        <p className="text-sm font-semibold text-foreground">{formatDate(instance.created)}</p>
                      </div>
                    </div>
                  )}
                  
                  {/* Última Atualização */}
                  {instance.currentTime && (
                    <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors">
                      <div className="p-2 rounded-lg bg-purple-500/10">
                        <Clock className="w-4 h-4 text-purple-500" />
                      </div>
                      <div className="flex-1">
                        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Última atualização</p>
                        <p className="text-sm font-semibold text-foreground">{formatDate(instance.currentTime)}</p>
                      </div>
                    </div>
                  )}

                  {/* Divider */}
                  <div className="h-px bg-gradient-to-r from-transparent via-border to-transparent my-4" />

                  {/* Botões de Ação */}
                  <div className="space-y-2">
                    <div className="grid grid-cols-2 gap-2">
                      {/* Botão Conectar */}
                      <Button
                        variant={instance.status === 'connected' ? 'secondary' : 'default'}
                        size="sm"
                        className="w-full gap-2"
                        disabled={instance.status === 'connected' || actionLoading[`connect-${instance.name}`]}
                        onClick={() => instance.name && openConnectModal(instance.name)}
                      >
                        {actionLoading[`connect-${instance.name}`] ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Play className="w-4 h-4" />
                        )}
                        Conectar
                      </Button>

                      {/* Botão Desconectar */}
                      <Button
                        variant={instance.status !== 'connected' ? 'secondary' : 'destructive'}
                        size="sm"
                        className="w-full gap-2"
                        disabled={instance.status !== 'connected' || actionLoading[`disconnect-${instance.name}`]}
                        onClick={() => instance.name && handleDisconnect(instance.name)}
                      >
                        {actionLoading[`disconnect-${instance.name}`] ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Power className="w-4 h-4" />
                        )}
                        Desconectar
                      </Button>
                    </div>

                    {/* Botão Atualizar Nome */}
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full gap-2"
                      onClick={() => instance.id && openEditNameModal(instance.id, instance.name || '')}
                    >
                      <Edit className="w-4 h-4" />
                      Atualizar nome da Instância
                    </Button>
                  </div>
                </CardContent>
                
                {/* Borda animada no hover */}
                <div className="absolute inset-0 rounded-lg bg-gradient-to-r from-primary/0 via-primary/50 to-primary/0 opacity-0 group-hover:opacity-20 blur-xl transition-opacity duration-300 -z-10" />
              </Card>
            ))}
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && instances.length === 0 && (
          <Card className="border-2 border-dashed">
            <CardContent className="pt-6">
              <div className="flex flex-col items-center justify-center gap-4 py-16 text-center">
                <div className="p-6 rounded-full bg-muted/50">
                  <Plug className="w-16 h-16 text-muted-foreground" />
                </div>
                <div className="space-y-2">
                  <p className="text-xl font-bold">Nenhuma instância encontrada</p>
                  <p className="text-sm text-muted-foreground max-w-md">
                    Não há instâncias do WhatsApp disponíveis no momento. Tente atualizar ou verifique sua conexão.
                  </p>
                </div>
                <Button 
                  onClick={fetchInstances} 
                  variant="outline" 
                  size="lg"
                  className="mt-4 gap-2"
                >
                  <RefreshCw className="w-4 h-4" />
                  Tentar novamente
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Dialog para conectar instância */}
      <Dialog open={connectModal.open} onOpenChange={(open) => {
        if (!open) {
          if (pollingInterval) {
            clearInterval(pollingInterval);
            setPollingInterval(null);
          }
          setConnectModal({ 
            open: false, 
            instanceName: '', 
            phoneNumber: '',
            paircode: '',
            isWaitingConnection: false,
          });
        }
      }}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Play className="w-5 h-5 text-primary" />
              {connectModal.isWaitingConnection ? 'Aguardando Conexão' : 'Conectar Instância WhatsApp'}
            </DialogTitle>
            <DialogDescription>
              {connectModal.isWaitingConnection 
                ? 'Utilize o código abaixo para parear sua instância do WhatsApp' 
                : 'Informe o nome da instância e o número de telefone para conectar.'}
            </DialogDescription>
          </DialogHeader>
          
          {!connectModal.isWaitingConnection ? (
            // Formulário inicial
            <>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="instanceName" className="text-sm font-medium">
                    Nome da Instância
                  </Label>
                  <Input
                    id="instanceName"
                    placeholder="Digite o nome da instância"
                    value={connectModal.instanceName}
                    onChange={(e) => setConnectModal(prev => ({ ...prev, instanceName: e.target.value }))}
                    className="col-span-3"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="phoneNumber" className="text-sm font-medium">
                    Número de Telefone
                  </Label>
                  <Input
                    id="phoneNumber"
                    type="tel"
                    placeholder="Digite o número de telefone (ex: 5511999999999)"
                    value={connectModal.phoneNumber}
                    onChange={(e) => setConnectModal(prev => ({ ...prev, phoneNumber: e.target.value }))}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !actionLoading[`connect-${connectModal.instanceName}`]) {
                        handleConnect();
                      }
                    }}
                    className="col-span-3"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => {
                    setConnectModal({ 
                      open: false, 
                      instanceName: '', 
                      phoneNumber: '',
                      paircode: '',
                      isWaitingConnection: false,
                    });
                  }}
                  disabled={actionLoading[`connect-${connectModal.instanceName}`]}
                >
                  Cancelar
                </Button>
                <Button
                  onClick={handleConnect}
                  disabled={
                    actionLoading[`connect-${connectModal.instanceName}`] || 
                    !connectModal.instanceName.trim() || 
                    !connectModal.phoneNumber.trim()
                  }
                  className="gap-2"
                >
                  {actionLoading[`connect-${connectModal.instanceName}`] ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Conectando...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      Conectar
                    </>
                  )}
                </Button>
              </DialogFooter>
            </>
          ) : (
            // Tela de aguardando com paircode
            <>
              <div className="py-6 space-y-6">
                {/* Código de Pareamento */}
                <div className="flex flex-col items-center justify-center gap-4">
                  <div className="p-6 rounded-2xl bg-gradient-to-br from-primary/10 via-primary/5 to-background border-2 border-primary/20 shadow-lg">
                    <p className="text-5xl font-bold tracking-wider text-primary font-mono">
                      {connectModal.paircode}
                    </p>
                  </div>
                  <div className="text-center space-y-2">
                    <p className="text-sm font-medium text-muted-foreground">
                      Código de Pareamento
                    </p>
                    <p className="text-xs text-muted-foreground max-w-md">
                      Abra o WhatsApp no seu celular, vá em <strong>Aparelhos conectados</strong> e insira o código acima
                    </p>
                  </div>
                </div>

                {/* Indicador de aguardando */}
                <div className="flex items-center justify-center gap-3 p-4 rounded-lg bg-blue-500/10 border border-blue-500/20">
                  <Loader2 className="w-5 h-5 animate-spin text-blue-500" />
                  <div className="flex-1 text-center">
                    <p className="text-sm font-medium text-blue-700 dark:text-blue-300">
                      Aguardando conexão...
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Verificando status a cada 2 segundos
                    </p>
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => {
                    if (pollingInterval) {
                      clearInterval(pollingInterval);
                      setPollingInterval(null);
                    }
                    setConnectModal({ 
                      open: false, 
                      instanceName: '', 
                      phoneNumber: '',
                      paircode: '',
                      isWaitingConnection: false,
                    });
                  }}
                  className="gap-2"
                >
                  Cancelar
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Dialog para editar nome da instância */}
      <Dialog open={editNameModal.open} onOpenChange={(open) => {
        if (!open) {
          setEditNameModal({ open: false, instanceId: '', currentName: '' });
          setNewName('');
        }
      }}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Edit className="w-5 h-5 text-primary" />
              Atualizar Nome da Instância
            </DialogTitle>
            <DialogDescription>
              Digite o novo nome para a instância. O nome atual é: <strong>{editNameModal.currentName}</strong>
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name" className="text-sm font-medium">
                Novo nome
              </Label>
              <Input
                id="name"
                placeholder="Digite o novo nome da instância"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleUpdateName();
                  }
                }}
                className="col-span-3"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setEditNameModal({ open: false, instanceId: '', currentName: '' });
                setNewName('');
              }}
              disabled={actionLoading[`update-${editNameModal.instanceId}`]}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleUpdateName}
              disabled={actionLoading[`update-${editNameModal.instanceId}`] || !newName.trim()}
              className="gap-2"
            >
              {actionLoading[`update-${editNameModal.instanceId}`] ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Atualizando...
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  Atualizar
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}

