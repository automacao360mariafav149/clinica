import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Loader2, RefreshCw, AlertCircle, CheckCircle2, Plug, User, Calendar, Clock, Phone } from 'lucide-react';
import { toast } from 'sonner';

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
      const response = await fetch('https://webhook.n8nlabz.com.br/webhook/listar-instancias', {
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

  useEffect(() => {
    fetchInstances();
  }, []);

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
    </DashboardLayout>
  );
}

