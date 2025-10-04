import { useState } from 'react';
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

export default function Register() {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'owner' | 'doctor' | 'secretary'>('doctor');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name,
          role,
        },
        emailRedirectTo: window.location.origin + '/login',
      },
    });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    navigate('/login');
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
      <div className="w-full max-w-md space-y-8 relative z-10">
        <div className="flex flex-col items-center gap-4">
          <img src="/medx-logo.png" alt="MedX" className="w-32 h-32 object-contain drop-shadow-lg" />
          <div className="text-center">
            <p className="text-muted-foreground mt-1">Criar conta</p>
          </div>
        </div>

        <MagicBentoCard>
          <CardHeader>
            <CardTitle className="text-2xl">Cadastro</CardTitle>
            <CardDescription>Crie sua conta para acessar o sistema</CardDescription>
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
                <Label htmlFor="name">Nome</Label>
                <Input id="name" value={name} onChange={(e) => setName(e.target.value)} required />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Senha</Label>
                <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
              </div>

              <div className="space-y-2">
                <Label htmlFor="role">Perfil</Label>
                <select
                  id="role"
                  className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={role}
                  onChange={(e) => setRole(e.target.value as any)}
                >
                  <option value="owner">Dono</option>
                  <option value="doctor">Médico</option>
                  <option value="secretary">Secretária</option>
                </select>
              </div>

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? 'Criando...' : 'Criar conta'}
              </Button>

              <div className="text-sm text-muted-foreground text-center">
                Já possui conta? <Link to="/login" className="text-primary">Entrar</Link>
              </div>
            </form>
          </CardContent>
        </MagicBentoCard>
      </div>
    </div>
  );
}


