import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { MagicBentoCard } from '@/components/bento/MagicBento';
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { useRealtimeList } from '@/hooks/useRealtimeList';
import { useAuth } from '@/contexts/AuthContext';
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { UserPlus, Calendar, Loader2, Trash2, Link, Clock, Globe, Shield, Video, Palette, Bell, Star, Check, X, Plus, CheckCircle, Edit, User, Mail, Phone, Stethoscope } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import { toast } from 'sonner';

export default function Users() {
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();
  const { data, loading, error } = useRealtimeList<any>({
    table: 'profiles',
    order: { column: 'created_at', ascending: false },
  });

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [userToDelete, setUserToDelete] = useState<any>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isLinkModalOpen, setIsLinkModalOpen] = useState(false);
  const [isLinkingSchedule, setIsLinkingSchedule] = useState(false);
  const [webhookResponse, setWebhookResponse] = useState<any>(null);
  const [isAddingCalendar, setIsAddingCalendar] = useState(false);
  const [deletingCalendarId, setDeletingCalendarId] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string>('');
  const [isAddCalendarModalOpen, setIsAddCalendarModalOpen] = useState(false);
  const [newCalendarName, setNewCalendarName] = useState('');
  const [linkedCalendarId, setLinkedCalendarId] = useState<string | null>(null);
  const [linkingCalendarId, setLinkingCalendarId] = useState<string | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [userToEdit, setUserToEdit] = useState<any>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [editFormData, setEditFormData] = useState({
    name: '',
    email: '',
    phone: '',
    specialization: '',
    role: 'doctor' as 'doctor' | 'secretary' | 'owner',
  });
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    specialization: '',
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
          email: formData.email,
          phone: formData.phone,
          specialization: formData.specialization,
          role: formData.role,
        });

        if (directError) throw directError;
      } else {
        // Se a RPC funcionou, atualiza os campos adicionais
        const { error: updateError } = await supabase
          .from('profiles')
          .update({
            email: formData.email,
            phone: formData.phone,
            specialization: formData.specialization,
          })
          .eq('auth_user_id', authData.user.id);

        if (updateError) {
          console.error('Erro ao atualizar campos adicionais:', updateError);
        }
      }

      toast.success(`${formData.role === 'doctor' ? 'Médico' : 'Secretária'} criado(a) com sucesso!`);
      
      // Reseta o formulário e fecha o dialog
      setFormData({ name: '', email: '', phone: '', specialization: '', role: 'doctor', password: '' });
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

  const parseCalendarData = (data: any) => {
    // Se vier como string, faz o parse
    if (typeof data === 'string') {
      const lines = data.split('\n').filter(line => line.trim());
      const calendar: any = {};
      lines.forEach((line: string) => {
        const colonIndex = line.indexOf(':');
        if (colonIndex > 0) {
          const key = line.substring(0, colonIndex).trim();
          const value = line.substring(colonIndex + 1).trim();
          calendar[key] = value;
        }
      });
      return calendar;
    }
    // Se já vier como objeto, retorna direto
    return data;
  };

  const renderCalendarCard = (calendar: any, index: number) => {
    const calendarId = calendar['Calendar ID'] || '';
    const calendarName = calendar['Calendar Name'] || 'Agenda sem nome';
    const isDeleting = deletingCalendarId === calendarId;
    const isLinking = linkingCalendarId === calendarId;
    const isLinked = linkedCalendarId === calendarId;
    
    return (
      <Card key={index} className={`border-primary/20 hover:border-primary/40 transition-colors ${isLinked ? 'bg-green-50/50 border-green-500/30' : ''}`}>
        <CardContent className="p-4">
          <div className="flex items-center justify-between gap-4">
            {/* Nome da Agenda com ícone e badge */}
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <Calendar className="h-5 w-5 text-primary shrink-0" />
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <span className="font-medium text-foreground truncate">
                  {calendarName}
                </span>
                {isLinked && (
                  <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-500/20 shrink-0">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Vinculada
                  </Badge>
                )}
              </div>
            </div>
            
            {/* Botões */}
            <div className="flex items-center gap-2 shrink-0">
              {/* Botão Vincular */}
              {!isLinked ? (
                <Button
                  variant="default"
                  size="sm"
                  onClick={() => handleLinkCalendar(currentUserId, calendarId, calendarName)}
                  disabled={isLinking || !calendarId}
                  className="bg-green-600 hover:bg-green-700"
                >
                  {isLinking ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span className="ml-2">Vinculando...</span>
                    </>
                  ) : (
                    <>
                      <Link className="h-4 w-4" />
                      <span className="ml-2">Vincular</span>
                    </>
                  )}
                </Button>
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleLinkCalendar(currentUserId, calendarId, calendarName)}
                  disabled={isLinking}
                  className="border-green-500/30 text-green-600 hover:bg-green-50"
                >
                  <CheckCircle className="h-4 w-4" />
                  <span className="ml-2">Vinculada</span>
                </Button>
              )}
              
              {/* Botão Excluir */}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleDeleteCalendar(currentUserId, calendarId)}
                disabled={isDeleting || !calendarId}
                className="text-destructive hover:text-destructive hover:bg-destructive/10"
              >
                {isDeleting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span className="ml-2">Excluindo...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="h-4 w-4" />
                    <span className="ml-2">Excluir</span>
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  const fetchLinkedCalendar = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profile_calendars')
        .select('calendar_id, calendar_name')
        .eq('profile_id', userId)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 = not found
        console.error('Erro ao buscar calendar vinculado:', error);
        return;
      }

      if (data) {
        setLinkedCalendarId(data.calendar_id);
        console.log('Calendar vinculado:', data);
      } else {
        setLinkedCalendarId(null);
      }
    } catch (err) {
      console.error('Erro ao buscar calendar vinculado:', err);
    }
  };

  const handleLinkCalendar = async (userId: string, calendarId: string, calendarName: string) => {
    setLinkingCalendarId(calendarId);
    try {
      console.log('Vinculando calendar. UserId:', userId, 'CalendarId:', calendarId);

      const { error } = await supabase
        .from('profile_calendars')
        .upsert({
          profile_id: userId,
          calendar_id: calendarId,
          calendar_name: calendarName,
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'profile_id'
        });

      if (error) throw error;

      setLinkedCalendarId(calendarId);
      toast.success(`Agenda "${calendarName}" vinculada com sucesso!`);
    } catch (err: any) {
      console.error('Erro ao vincular calendar:', err);
      toast.error(err.message || 'Erro ao vincular agenda');
    } finally {
      setLinkingCalendarId(null);
    }
  };

  const handleLinkSchedule = async (userId: string) => {
    setCurrentUserId(userId); // Salva o userId para uso posterior
    setIsLinkingSchedule(true);
    try {
      console.log('Iniciando requisição para vincular agenda. UserId:', userId);
      
      // Busca o calendar vinculado
      await fetchLinkedCalendar(userId);
      
      const response = await fetch('https://webhook.n8nlabz.com.br/webhook/gestao-agendas', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          userId,
          funcao: 'leitura'
        }),
      });

      console.log('Status da resposta:', response.status);
      console.log('Headers da resposta:', response.headers);

      if (!response.ok) {
        throw new Error(`Erro na requisição: ${response.status}`);
      }

      // Primeiro pega como texto para ver o que vem
      const textData = await response.text();
      console.log('Resposta como texto:', textData);
      console.log('Tamanho da resposta:', textData.length);

      // Tenta fazer parse se for JSON, senão usa como string
      let data;
      try {
        data = JSON.parse(textData);
        console.log('Parse JSON bem sucedido:', data);
      } catch {
        console.log('Não é JSON, usando como string');
        data = textData;
      }

      console.log('Dados finais:', data);
      console.log('Tipo dos dados:', typeof data);
      
      if (!data || (typeof data === 'string' && data.trim() === '')) {
        throw new Error('Resposta vazia do servidor');
      }

      setWebhookResponse(data);
      toast.success('Agenda vinculada com sucesso!');
      
      // Pequeno delay para garantir que o estado foi atualizado
      setTimeout(() => {
        setIsLinkModalOpen(true);
      }, 100);
      
    } catch (err: any) {
      console.error('Erro ao vincular agenda:', err);
      toast.error(err.message || 'Erro ao vincular agenda');
    } finally {
      setIsLinkingSchedule(false);
    }
  };

  const handleAddCalendar = async (userId: string, calendarName: string) => {
    setIsAddingCalendar(true);
    try {
      console.log('Adicionando calendário. UserId:', userId, 'Nome:', calendarName);
      
      const response = await fetch('https://webhook.n8nlabz.com.br/webhook/gestao-agendas', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          userId,
          funcao: 'adicionar',
          calendarName
        }),
      });

      if (!response.ok) {
        throw new Error(`Erro na requisição: ${response.status}`);
      }

      const textData = await response.text();
      let data;
      try {
        data = JSON.parse(textData);
      } catch {
        data = textData;
      }

      console.log('Resposta da adição:', data);
      toast.success('Calendário adicionado com sucesso!');
      
      // Fecha o modal e limpa o input
      setIsAddCalendarModalOpen(false);
      setNewCalendarName('');
      
      // Recarrega a lista de agendas
      await handleLinkSchedule(userId);
      
    } catch (err: any) {
      console.error('Erro ao adicionar calendário:', err);
      toast.error(err.message || 'Erro ao adicionar calendário');
    } finally {
      setIsAddingCalendar(false);
    }
  };

  const handleAddCalendarSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCalendarName.trim()) {
      toast.error('Por favor, informe o nome da agenda');
      return;
    }
    handleAddCalendar(currentUserId, newCalendarName);
  };

  const handleDeleteCalendar = async (userId: string, calendarId: string) => {
    setDeletingCalendarId(calendarId);
    try {
      console.log('Deletando calendário. UserId:', userId, 'CalendarId:', calendarId);
      
      const response = await fetch('https://webhook.n8nlabz.com.br/webhook/gestao-agendas', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          userId,
          funcao: 'apagar',
          calendarId
        }),
      });

      if (!response.ok) {
        throw new Error(`Erro na requisição: ${response.status}`);
      }

      const textData = await response.text();
      let data;
      try {
        data = JSON.parse(textData);
      } catch {
        data = textData;
      }

      console.log('Resposta da exclusão:', data);
      toast.success('Calendário excluído com sucesso!');
      
      // Recarrega a lista de agendas
      await handleLinkSchedule(userId);
      
    } catch (err: any) {
      console.error('Erro ao deletar calendário:', err);
      toast.error(err.message || 'Erro ao deletar calendário');
    } finally {
      setDeletingCalendarId(null);
    }
  };

  const handleEditClick = (user: any) => {
    setUserToEdit(user);
    setEditFormData({
      name: user.name || '',
      email: user.email || '',
      phone: user.phone || '',
      specialization: user.specialization || '',
      role: user.role,
    });
    setIsEditDialogOpen(true);
  };

  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userToEdit) return;

    setIsUpdating(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          name: editFormData.name,
          email: editFormData.email,
          phone: editFormData.phone,
          specialization: editFormData.specialization,
          role: editFormData.role,
        })
        .eq('id', userToEdit.id);

      if (error) throw error;

      toast.success('Usuário atualizado com sucesso!');
      setIsEditDialogOpen(false);
      setUserToEdit(null);
    } catch (err: any) {
      console.error('Erro ao atualizar usuário:', err);
      toast.error(err.message || 'Erro ao atualizar usuário');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDeleteClick = (user: any) => {
    // Proteção: não permite deletar a si mesmo
    if (user.auth_user_id === currentUser?.auth_id) {
      toast.error('Você não pode deletar seu próprio usuário');
      return;
    }

    // Proteção: não permite deletar outros owners
    if (user.role === 'owner') {
      toast.error('Não é possível deletar usuários com perfil de Dono');
      return;
    }

    setUserToDelete(user);
    setIsDeleteDialogOpen(true);
  };

  const handleDeleteUser = async () => {
    if (!userToDelete) return;

    setIsDeleting(true);
    try {
      // 1. Deleta o perfil da tabela profiles
      // Isso também deletará automaticamente os horários (doctor_schedules) devido ao CASCADE
      const { error: deleteError } = await supabase
        .from('profiles')
        .delete()
        .eq('id', userToDelete.id);

      if (deleteError) throw deleteError;

      // 2. Se houver auth_user_id, tenta deletar o usuário do Auth
      // Nota: Isso pode falhar se não tivermos permissão de Admin API
      // Mas o perfil já foi deletado, então o usuário não conseguirá mais acessar
      if (userToDelete.auth_user_id) {
        try {
          const { error: authError } = await supabase.auth.admin.deleteUser(
            userToDelete.auth_user_id
          );
          
          if (authError) {
            console.warn('Não foi possível deletar usuário do Auth (requer Admin API):', authError);
            // Não lança erro, pois o perfil já foi deletado
          }
        } catch (err) {
          console.warn('Auth Admin API não disponível:', err);
          // Continua normalmente, pois o perfil já foi deletado
        }
      }

      toast.success(`${userToDelete.role === 'doctor' ? 'Médico' : 'Secretária'} deletado(a) com sucesso!`);
      
      // Fecha o dialog e limpa o estado
      setIsDeleteDialogOpen(false);
      setUserToDelete(null);
    } catch (err: any) {
      console.error('Erro ao deletar usuário:', err);
      toast.error(err.message || 'Erro ao deletar usuário');
    } finally {
      setIsDeleting(false);
    }
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
                  <Label htmlFor="phone">Telefone</Label>
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="(00) 00000-0000"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  />
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

                {formData.role === 'doctor' && (
                  <div className="space-y-2">
                    <Label htmlFor="specialization">Especialização</Label>
                    <Input
                      id="specialization"
                      placeholder="Ex: Cardiologista, Pediatra, etc."
                      value={formData.specialization}
                      onChange={(e) => setFormData({ ...formData, specialization: e.target.value })}
                    />
                  </div>
                )}

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

        {/* Contador de usuários */}
        <div className="text-sm text-muted-foreground">
          {loading ? 'Carregando…' : error ? `Erro: ${error}` : `${data.length} usuário(s) encontrado(s)`}
        </div>

        {/* Grid de Cards de Usuários */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {data.map((u) => (
            <Card key={u.id} className="transition-all duration-200 hover:shadow-lg">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    {/* Avatar */}
                    <div className={`
                      flex h-12 w-12 items-center justify-center rounded-full shrink-0
                      ${u.role === 'owner' ? 'bg-purple-500/10' : u.role === 'doctor' ? 'bg-blue-500/10' : 'bg-green-500/10'}
                    `}>
                      <User className={`h-6 w-6 
                        ${u.role === 'owner' ? 'text-purple-500' : u.role === 'doctor' ? 'text-blue-500' : 'text-green-500'}
                      `} />
                    </div>
                    
                    {/* Nome e Role */}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-foreground truncate">
                        {u.name}
                      </h3>
                      <Badge 
                        variant="secondary" 
                        className={`mt-1
                          ${u.role === 'owner' ? 'bg-purple-500/10 text-purple-600' : ''}
                          ${u.role === 'doctor' ? 'bg-blue-500/10 text-blue-600' : ''}
                          ${u.role === 'secretary' ? 'bg-green-500/10 text-green-600' : ''}
                        `}
                      >
                        {u.role === 'owner' ? 'Dono' : u.role === 'doctor' ? 'Médico' : 'Secretária'}
                      </Badge>
                    </div>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="space-y-3 pb-4">
                {/* Email */}
                {u.email && (
                  <div className="flex items-center gap-2 text-sm">
                    <Mail className="h-4 w-4 text-muted-foreground shrink-0" />
                    <span className="text-muted-foreground truncate">{u.email}</span>
                  </div>
                )}

                {/* Telefone */}
                {u.phone && (
                  <div className="flex items-center gap-2 text-sm">
                    <Phone className="h-4 w-4 text-muted-foreground shrink-0" />
                    <span className="text-muted-foreground">{u.phone}</span>
                  </div>
                )}

                {/* Especialização */}
                {u.specialization && u.role === 'doctor' && (
                  <div className="flex items-center gap-2 text-sm">
                    <Stethoscope className="h-4 w-4 text-muted-foreground shrink-0" />
                    <span className="text-muted-foreground">{u.specialization}</span>
                  </div>
                )}

                {/* Data de Criação */}
                <div className="flex items-center gap-2 text-xs text-muted-foreground pt-2 border-t">
                  <Clock className="h-3 w-3" />
                  <span>Criado em {new Date(u.created_at).toLocaleDateString('pt-BR')}</span>
                </div>

                {/* Botões de Ação */}
                <div className="flex flex-wrap gap-2 pt-3">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEditClick(u)}
                    className="flex-1"
                  >
                    <Edit className="mr-2 h-4 w-4" />
                    Editar
                  </Button>

                  {u.role === 'doctor' && (
                    <>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleConfigureSchedule(u.id)}
                        className="flex-1"
                      >
                        <Calendar className="mr-2 h-4 w-4" />
                        Agenda
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleLinkSchedule(u.id)}
                        disabled={isLinkingSchedule}
                        className="flex-1"
                      >
                        {isLinkingSchedule ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Vinculando...
                          </>
                        ) : (
                          <>
                            <Link className="mr-2 h-4 w-4" />
                            Vincular
                          </>
                        )}
                      </Button>
                    </>
                  )}

                  {u.role !== 'owner' && u.auth_user_id !== currentUser?.auth_id && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteClick(u)}
                      className="text-destructive hover:text-destructive hover:bg-destructive/10"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Mensagem quando não há usuários */}
        {!loading && data.length === 0 && (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <User className="h-12 w-12 text-muted-foreground/50 mb-4" />
              <p className="text-muted-foreground text-center">
                Nenhum usuário encontrado
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Modal de resposta do webhook de vinculação */}
      <Dialog open={isLinkModalOpen} onOpenChange={setIsLinkModalOpen}>
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-primary" />
              Agendas Disponíveis
            </DialogTitle>
            <DialogDescription>
              Selecione uma agenda secundária para vincular (agendas principais são ocultadas)
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {webhookResponse ? (() => {
              try {
                const data = webhookResponse;
                
                // Verifica se tem o formato { count, calendars: [] }
                if (data.calendars && Array.isArray(data.calendars)) {
                  // Filtra as agendas para remover as principais
                  const nonPrimaryCalendars = data.calendars.filter((calendar: any) => {
                    const parsed = typeof calendar === 'string' 
                      ? parseCalendarData(calendar) 
                      : calendar;
                    
                    // Retorna false se for agenda principal
                    return parsed['Primary Calendar'] !== 'Yes';
                  });

                  if (nonPrimaryCalendars.length === 0) {
                    return (
                      <Card className="border-muted">
                        <CardContent className="pt-6 text-center py-8">
                          <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                          <p className="text-muted-foreground">
                            Nenhuma agenda secundária encontrada.
                          </p>
                          <p className="text-sm text-muted-foreground/70 mt-1">
                            Apenas agendas principais foram detectadas.
                          </p>
                        </CardContent>
                      </Card>
                    );
                  }

                  return (
                    <>
                      {/* Header com contagem e botão adicionar */}
                      <div className="flex items-center justify-between p-4 bg-primary/5 rounded-lg mb-4">
                        <div className="flex items-center gap-3">
                          <Calendar className="h-5 w-5 text-primary" />
                          <span className="font-semibold text-foreground">
                            {nonPrimaryCalendars.length} {nonPrimaryCalendars.length === 1 ? 'Agenda Disponível' : 'Agendas Disponíveis'}
                          </span>
                          <Badge variant="secondary">
                            {data.calendars.length} no total
                          </Badge>
                        </div>
                        <Button
                          size="sm"
                          onClick={() => setIsAddCalendarModalOpen(true)}
                          className="gap-2"
                        >
                          <Plus className="h-4 w-4" />
                          Adicionar Calendário
                        </Button>
                      </div>

                      {/* Lista de agendas em cards */}
                      <div className="space-y-4">
                        {nonPrimaryCalendars.map((calendar: any, index: number) => {
                          // Se a agenda vier como string, faz o parse
                          const parsedCalendar = typeof calendar === 'string' 
                            ? parseCalendarData(calendar) 
                            : calendar;
                          
                          return renderCalendarCard(parsedCalendar, index);
                        })}
                      </div>
                    </>
                  );
                }
                
                // Se não for o formato esperado, tenta renderizar como agenda única
                const calendar = parseCalendarData(data);
                const hasFields = calendar && (
                  calendar['Calendar Name'] || 
                  calendar['Calendar ID'] || 
                  Object.keys(calendar).length > 0
                );

                if (hasFields) {
                  return renderCalendarCard(calendar, 0);
                }

                // Fallback: mostra JSON raw
                return (
                  <Card className="border-yellow-500/20">
                    <CardContent className="pt-6">
                      <p className="text-sm text-muted-foreground mb-3">
                        Formato não reconhecido. Dados brutos:
                      </p>
                      <div className="bg-muted/50 p-4 rounded-lg">
                        <pre className="text-xs overflow-auto">
                          {typeof webhookResponse === 'string' 
                            ? webhookResponse 
                            : JSON.stringify(webhookResponse, null, 2)}
                        </pre>
                      </div>
                    </CardContent>
                  </Card>
                );
              } catch (error) {
                console.error('Erro ao renderizar calendar:', error);
                return (
                  <Card className="border-red-500/20">
                    <CardContent className="pt-6">
                      <p className="text-sm text-red-500 mb-3">
                        Erro ao processar dados. Dados brutos:
                      </p>
                      <div className="bg-muted/50 p-4 rounded-lg">
                        <pre className="text-xs overflow-auto">
                          {typeof webhookResponse === 'string' 
                            ? webhookResponse 
                            : JSON.stringify(webhookResponse, null, 2)}
                        </pre>
                      </div>
                    </CardContent>
                  </Card>
                );
              }
            })() : (
              <div className="text-center text-muted-foreground py-8">
                Nenhum dado recebido
              </div>
            )}
          </div>
          <DialogFooter>
            <Button onClick={() => setIsLinkModalOpen(false)}>
              Fechar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal de edição de usuário */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Edit className="h-5 w-5 text-primary" />
              Editar Usuário
            </DialogTitle>
            <DialogDescription>
              Atualize as informações do usuário
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleUpdateUser} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Nome Completo</Label>
              <Input
                id="edit-name"
                placeholder="Nome do usuário"
                value={editFormData.name}
                onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                required
                disabled={isUpdating}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-email">Email</Label>
              <Input
                id="edit-email"
                type="email"
                placeholder="email@exemplo.com"
                value={editFormData.email}
                onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })}
                disabled={isUpdating}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-phone">Telefone</Label>
              <Input
                id="edit-phone"
                type="tel"
                placeholder="(00) 00000-0000"
                value={editFormData.phone}
                onChange={(e) => setEditFormData({ ...editFormData, phone: e.target.value })}
                disabled={isUpdating}
              />
            </div>

            {editFormData.role === 'doctor' && (
              <div className="space-y-2">
                <Label htmlFor="edit-specialization">Especialização</Label>
                <Input
                  id="edit-specialization"
                  placeholder="Ex: Cardiologista, Pediatra, etc."
                  value={editFormData.specialization}
                  onChange={(e) => setEditFormData({ ...editFormData, specialization: e.target.value })}
                  disabled={isUpdating}
                />
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="edit-role">Perfil</Label>
              <Select
                value={editFormData.role}
                onValueChange={(value: 'doctor' | 'secretary' | 'owner') => 
                  setEditFormData({ ...editFormData, role: value })
                }
                disabled={isUpdating || userToEdit?.role === 'owner'}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="doctor">Médico</SelectItem>
                  <SelectItem value="secretary">Secretária</SelectItem>
                  {userToEdit?.role === 'owner' && (
                    <SelectItem value="owner">Dono</SelectItem>
                  )}
                </SelectContent>
              </Select>
              {userToEdit?.role === 'owner' && (
                <p className="text-xs text-muted-foreground">
                  Não é possível alterar o perfil de Dono
                </p>
              )}
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsEditDialogOpen(false);
                  setUserToEdit(null);
                }}
                disabled={isUpdating}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={isUpdating}>
                {isUpdating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  'Salvar Alterações'
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Modal de adicionar calendário */}
      <Dialog open={isAddCalendarModalOpen} onOpenChange={setIsAddCalendarModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5 text-primary" />
              Adicionar Novo Calendário
            </DialogTitle>
            <DialogDescription>
              Informe o nome do calendário que deseja adicionar
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleAddCalendarSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="calendarName">Nome do Calendário</Label>
              <Input
                id="calendarName"
                placeholder="Ex: Consultas Particulares"
                value={newCalendarName}
                onChange={(e) => setNewCalendarName(e.target.value)}
                disabled={isAddingCalendar}
                autoFocus
              />
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsAddCalendarModalOpen(false);
                  setNewCalendarName('');
                }}
                disabled={isAddingCalendar}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={isAddingCalendar || !newCalendarName.trim()}>
                {isAddingCalendar ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Adicionando...
                  </>
                ) : (
                  <>
                    <Plus className="mr-2 h-4 w-4" />
                    Adicionar
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Dialog de confirmação de exclusão */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja deletar o usuário <strong>{userToDelete?.name}</strong>?
              <br /><br />
              Esta ação não pode ser desfeita. Todos os dados associados a este usuário serão removidos permanentemente.
              {userToDelete?.role === 'doctor' && (
                <>
                  <br /><br />
                  <strong>Atenção:</strong> Os horários de trabalho configurados para este médico também serão deletados.
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteUser}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deletando...
                </>
              ) : (
                'Deletar'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
}
