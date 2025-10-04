import { useEffect, useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Link2, CheckCircle2, XCircle, Loader2 } from 'lucide-react';
import { supabase, testConnection } from '@/lib/supabaseClient';

export default function Connections() {
  const [status, setStatus] = useState<'idle' | 'loading' | 'ok' | 'error'>('idle');
  const [message, setMessage] = useState<string>('');

  const runTest = async () => {
    setStatus('loading');
    setMessage('');
    const { data, error } = await testConnection();
    if (error) {
      setStatus('error');
      setMessage(error.message);
    } else {
      setStatus('ok');
      setMessage(`Conexão OK. Registros retornados: ${data?.length ?? 0}`);
    }
  };

  useEffect(() => {
    // Opcional: testar automaticamente ao abrir a página
    // runTest();
  }, []);

  return (
    <DashboardLayout requiredRoles={['owner']}>
      <div className="p-8 space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Conexões</h1>
          <p className="text-muted-foreground mt-1">Integrações e APIs externas</p>
        </div>

        <Card className="bg-card border-border p-12">
          <div className="flex flex-col items-center justify-center gap-6 text-center">
            <Link2 className="w-16 h-16 text-primary" />
            <div>
              <h3 className="text-xl font-semibold text-foreground">Conexão com Supabase</h3>
              <p className="text-muted-foreground mt-2">
                Use o botão abaixo para validar a conexão usando as variáveis
                <br />
                <code>VITE_SUPABASE_URL</code> e <code>VITE_SUPABASE_ANON_KEY</code>
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Button onClick={runTest} disabled={status === 'loading'}>
                {status === 'loading' ? (
                  <span className="inline-flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" /> Testando...
                  </span>
                ) : (
                  'Testar Conexão'
                )}
              </Button>
              {status === 'ok' && (
                <span className="inline-flex items-center text-green-600 dark:text-green-500">
                  <CheckCircle2 className="h-5 w-5 mr-1" /> OK
                </span>
              )}
              {status === 'error' && (
                <span className="inline-flex items-center text-red-600 dark:text-red-500">
                  <XCircle className="h-5 w-5 mr-1" /> Erro
                </span>
              )}
            </div>
            {message && (
              <p className="text-sm text-muted-foreground max-w-md">{message}</p>
            )}
          </div>
        </Card>
      </div>
    </DashboardLayout>
  );
}
