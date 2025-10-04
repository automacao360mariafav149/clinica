import { useState } from 'react';
import { useNavigate, Link, Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { MagicBentoCard } from '@/components/bento/MagicBento';
import { AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import LightRays from '@/components/backgrounds/LightRays';
import Particles from '@/components/backgrounds/Particles';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, isAuthenticated, user } = useAuth();
  const navigate = useNavigate();

  if (isAuthenticated) {
    const roleToRoute: Record<string, string> = {
      owner: '/dashboard',
      doctor: '/agenda',
      secretary: '/agenda',
    };
    const defaultRoute = '/agenda';
    const target = roleToRoute[(user?.role || '')] || defaultRoute;
    return <Navigate to={target} replace />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(email, password);
      // Deixa o redirecionamento para o estado autenticado abaixo
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao fazer login');
    } finally {
      setLoading(false);
    }
  };

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
      <div className="absolute inset-0 z-0 pointer-events-none">
        <LightRays raysOrigin="top-center" raysColor="#66c2ff" raysSpeed={1} lightSpread={1.2} rayLength={2.0} fadeDistance={1.2} saturation={1.0} followMouse={true} mouseInfluence={0.08} noiseAmount={0.05} distortion={0.05} />
      </div>
      <div className="w-full max-w-md space-y-8 relative z-10">
        {/* Logo */}
        <div className="flex flex-col items-center gap-4">
          <img src="/medx-logo.png" alt="MedX" className="w-48 h-48 object-contain drop-shadow-lg" />
          <div className="text-center">
            <p className="text-muted-foreground mt-1">Sistema de Gestão Médica</p>
          </div>
        </div>

        {/* Login Card */}
        <MagicBentoCard>
          <CardHeader>
            <CardTitle className="text-2xl">Entrar</CardTitle>
            <CardDescription>Digite suas credenciais para acessar o sistema</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="usuario@clinic.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="bg-background"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Senha</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="bg-background"
                />
              </div>

              <Button
                type="submit"
                className="w-full bg-gradient-to-r from-primary to-accent hover:opacity-90"
                disabled={loading}
              >
                {loading ? 'Entrando...' : 'Entrar'}
              </Button>
            </form>

            <div className="mt-6 flex items-center justify-between text-sm text-muted-foreground">
              <Link to="/register" className="text-primary">Criar conta</Link>
              <Link to="/forgot-password" className="text-primary">Esqueci minha senha</Link>
            </div>
          </CardContent>
        </MagicBentoCard>
      </div>
    </div>
  );
}
