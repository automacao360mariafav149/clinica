/**
 * Componente de exemplo demonstrando como usar as configurações do sistema
 * Este arquivo serve como referência - você pode deletá-lo após implementar
 */

import React from 'react';
import { useSystemSettings } from '@/hooks/useSystemSettings';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, CheckCircle2, AlertCircle, Settings } from 'lucide-react';

/**
 * Exemplo 1: Componente que exibe todas as configurações
 */
export function SystemSettingsDisplay() {
  const { settings, loading, error } = useSystemSettings();

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Carregando configurações...</span>
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Erro ao carregar configurações: {error.message}
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="h-5 w-5" />
          Configurações do Sistema
        </CardTitle>
        <CardDescription>
          Configurações carregadas do banco de dados
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {Object.entries(settings).map(([key, value]) => (
            <div key={key} className="flex items-center justify-between border-b pb-2">
              <div className="flex flex-col">
                <span className="font-medium text-sm">{key}</span>
                <span className="text-xs text-muted-foreground">{value}</span>
              </div>
              <Badge variant="outline">
                <CheckCircle2 className="h-3 w-3 mr-1" />
                Ativo
              </Badge>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Exemplo 2: Componente que usa uma configuração específica
 */
export function ApiStatusDisplay() {
  const { settings, loading } = useSystemSettings('api_base_url');

  if (loading) {
    return <Badge variant="secondary">Carregando...</Badge>;
  }

  const apiUrl = settings.api_base_url || 'Não configurado';

  return (
    <div className="flex items-center gap-2">
      <span className="text-sm font-medium">URL da API:</span>
      <Badge variant="default">{apiUrl}</Badge>
    </div>
  );
}

/**
 * Exemplo 3: Componente que usa configuração para controlar comportamento
 */
export function MaintenanceCheck({ children }: { children: React.ReactNode }) {
  const { settings, loading } = useSystemSettings('maintenance_mode');

  // Enquanto carrega, mostra o conteúdo normal
  if (loading) {
    return <>{children}</>;
  }

  // Se está em manutenção, mostra mensagem
  if (settings.maintenance_mode === 'true') {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle>Sistema em Manutenção</CardTitle>
            <CardDescription>
              Estamos realizando melhorias no sistema
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Por favor, tente novamente em alguns instantes.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Sistema normal
  return <>{children}</>;
}

/**
 * Exemplo 4: Uso em requisições API
 */
export function ApiDataFetcher() {
  const [data, setData] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const { settings } = useSystemSettings();

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      const apiUrl = settings.api_base_url || 'https://api.exemplo.com';
      const timeout = parseInt(settings.api_timeout || '30000');

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);

      const response = await fetch(`${apiUrl}/endpoint`, {
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP Error: ${response.status}`);
      }

      const result = await response.json();
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Exemplo de Requisição API</CardTitle>
        <CardDescription>
          Usando URL configurada no banco de dados
        </CardDescription>
      </CardHeader>
      <CardContent>
        <button
          onClick={fetchData}
          disabled={loading}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? 'Carregando...' : 'Buscar Dados'}
        </button>

        {error && (
          <Alert variant="destructive" className="mt-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {data && (
          <div className="mt-4">
            <pre className="bg-gray-100 p-4 rounded text-sm overflow-auto">
              {JSON.stringify(data, null, 2)}
            </pre>
          </div>
        )}

        <div className="mt-4 text-xs text-muted-foreground">
          <p>URL Atual: {settings.api_base_url || 'Não configurado'}</p>
          <p>Timeout: {settings.api_timeout || 'Não configurado'}ms</p>
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Como usar estes exemplos:
 * 
 * 1. Importe o componente que você precisa
 * 2. Use em suas páginas ou componentes
 * 
 * Exemplo de uso no App.tsx:
 * 
 * import { MaintenanceCheck } from '@/components/examples/SystemSettingsExample';
 * 
 * function App() {
 *   return (
 *     <MaintenanceCheck>
 *       <MeuApp />
 *     </MaintenanceCheck>
 *   );
 * }
 */

