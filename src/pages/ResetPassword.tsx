import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import { MagicBentoCard } from '@/components/bento/MagicBento';
import Particles from '@/components/backgrounds/Particles';

export default function ResetPassword() {
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    // Supabase envia o usuário para esta rota com um token na URL
    // Basta mostrar o formulário e chamar updateUser
    setReady(true);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    const { error } = await supabase.auth.updateUser({ password });
    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    setSuccess('Senha redefinida com sucesso. Redirecionando...');
    setTimeout(() => navigate('/login'), 1500);
  };

  if (!ready) return null;

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-background p-4 relative overflow-hidden">
      <div className="absolute inset-0 z-0 pointer-events-none opacity-30">
        <Particles
          particleCount={100}
          particleColor="#5227FF"
          particleSize={3}
          speed={0.3}
          connectionDistance={150}
          showConnections={true}
        />
      </div>
      <div className="w-full max-w-md space-y-8 relative z-10">
        <div className="flex flex-col items-center gap-4">
          <img src="/medx-logo.png" alt="MedX" className="w-32 h-32 object-contain drop-shadow-lg" />
          <div className="text-center">
            <p className="text-muted-foreground mt-1">Redefinir senha</p>
          </div>
        </div>

        <MagicBentoCard>
          <CardHeader>
            <CardTitle className="text-2xl">Nova Senha</CardTitle>
            <CardDescription>Defina uma nova senha para sua conta</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              {success && (
                <Alert>
                  <AlertDescription>{success}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <Label htmlFor="password">Nova Senha</Label>
                <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
              </div>

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? 'Salvando...' : 'Salvar senha'}
              </Button>

              <div className="text-sm text-muted-foreground text-center">
                Lembrou? <Link to="/login" className="text-primary">Entrar</Link>
              </div>
            </form>
          </CardContent>
        </MagicBentoCard>
      </div>
    </div>
  );
}


