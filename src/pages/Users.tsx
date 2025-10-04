import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { MagicBentoCard } from '@/components/bento/MagicBento';
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useRealtimeList } from '@/hooks/useRealtimeList';
import { Button } from '@/components/ui/button';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger,
  DialogFooter
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { UserPlus, Calendar, Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import { toast } from 'sonner';

export default function Users() {
  const navigate = useNavigate();
  const { data, loading, error, fetchSchedules } = useRealtimeList<any>({
    table: 'profiles',
    order: { column: 'created_at', ascending: false },
  });

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: 'doctor' as 'doctor' | 'secretary',
    password: '',
  });

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreating(true);

    try {
      // 1. Cria o usuário no Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            name: formData.name,
            role: formData.role,
          },
          emailRedirectTo: `${window.location.origin}/reset-password`,
        },
      });

      if (authError) throw authError;

      if (!authData.user) {
        throw new Error('Falha ao criar usuário no sistema de autenticação');
      }

      // 2. Cria ou atualiza o perfil na tabela profiles
      const { error: profileError } = await supabase.rpc('create_or_update_doctor_profile', {
        p_auth_user_id: authData.user.id,
        p_name: formData.name,
        p_role: formData.role,
      });

      if (profileError) {
        console.error('Erro ao criar perfil:', profileError);
        // Tenta criar diretamente se a RPC falhar
        const { error: directError } = await supabase.from('profiles').insert({
          auth_user_id: authData.user.id,
          name: formData.name,
          role: formData.role,
        });

        if (directError) throw directError;
      }

      toast.success(`${formData.role === 'doctor' ? 'Médico' : 'Secretária'} criado(a) com sucesso!`);
      
      // Reseta o formulário e fecha o dialog
      setFormData({ name: '', email: '', role: 'doctor', password: '' });
      setIsDialogOpen(false);
    } catch (err: any) {
      console.error('Erro ao criar usuário:', err);
      toast.error(err.message || 'Erro ao criar usuário');
    } finally {
      setIsCreating(false);
    }
  };

  const handleConfigureSchedule = (userId: string) => {
    navigate(`/users/${userId}/schedule`);
  };

  return (
    <DashboardLayout requiredRoles={['owner']}>
      <div className="p-8 space-y-8">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Gerenciar Usuários</h1>
            <p className="text-muted-foreground mt-1">Administração de médicos e secretárias</p>
          </div>
          
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <UserPlus className="mr-2 h-4 w-4" />
                Novo Usuário
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Criar Novo Usuário</DialogTitle>
                <DialogDescription>
                  Adicione um novo médico ou secretária ao sistema
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleCreateUser} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nome Completo</Label>
                  <Input
                    id="name"
                    placeholder="Dr. João Silva"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="joao@exemplo.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">Senha Temporária</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="Mínimo 6 caracteres"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    required
                    minLength={6}
                  />
                  <p className="text-xs text-muted-foreground">
                    O usuário receberá um email para redefinir a senha
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="role">Perfil</Label>
                  <Select
                    value={formData.role}
                    onValueChange={(value: 'doctor' | 'secretary') => 
                      setFormData({ ...formData, role: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="doctor">Médico</SelectItem>
                      <SelectItem value="secretary">Secretária</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <DialogFooter>
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setIsDialogOpen(false)}
                    disabled={isCreating}
                  >
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={isCreating}>
                    {isCreating ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Criando...
                      </>
                    ) : (
                      'Criar Usuário'
                    )}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <MagicBentoCard contentClassName="p-6">
          <Table>
            <TableCaption>
              {loading ? 'Carregando…' : error ? `Erro: ${error}` : `${data.length} usuário(s)`}
            </TableCaption>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Perfil</TableHead>
                <TableHead>Email/Auth</TableHead>
                <TableHead>Criado em</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((u) => (
                <TableRow key={u.id}>
                  <TableCell className="font-medium">{u.name}</TableCell>
                  <TableCell>
                    <span className="capitalize inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary">
                      {u.role === 'owner' ? 'Dono' : u.role === 'doctor' ? 'Médico' : 'Secretária'}
                    </span>
                  </TableCell>
                  <TableCell className="truncate max-w-[240px]">
                    {u.auth_user_id ?? 'Sem vínculo'}
                  </TableCell>
                  <TableCell>{new Date(u.created_at).toLocaleDateString('pt-BR')}</TableCell>
                  <TableCell className="text-right">
                    {u.role === 'doctor' && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleConfigureSchedule(u.id)}
                      >
                        <Calendar className="mr-2 h-4 w-4" />
                        Configurar Agenda
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </MagicBentoCard>
      </div>
    </DashboardLayout>
  );
}
