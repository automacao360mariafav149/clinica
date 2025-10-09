import { useEffect, useMemo, useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { MagicBentoCard } from '@/components/bento/MagicBento';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useRealtimeList } from '@/hooks/useRealtimeList';
import { supabase } from '@/lib/supabaseClient';
import { toast } from 'sonner';
import { Loader2, Plus, Search, Pencil, Trash2 } from 'lucide-react';

interface PrePatient {
  id: string;
  name: string | null;
  email: string | null;
  phone: string | null;
  health_insurance: string | null;
  status: string | null;
  area_interest: string | null;
  created_at: string;
}

export default function PrePatients() {
  const { data, loading, error } = useRealtimeList<PrePatient>({
    table: 'pre_patients',
    order: { column: 'created_at', ascending: false },
  });

  const [searchTerm, setSearchTerm] = useState('');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    health_insurance: '',
    status: '',
    area_interest: '',
  });

  const filtered = useMemo(() => {
    const s = searchTerm.toLowerCase();
    return data.filter((p) => (
      (p.name ?? '').toLowerCase().includes(s) ||
      (p.email ?? '').toLowerCase().includes(s) ||
      (p.phone ?? '').includes(s) ||
      (p.health_insurance ?? '').toLowerCase().includes(s) ||
      (p.status ?? '').toLowerCase().includes(s) ||
      (p.area_interest ?? '').toLowerCase().includes(s)
    ));
  }, [data, searchTerm]);

  const openEdit = (p: PrePatient) => {
    setSelectedId(p.id);
    setFormData({
      name: p.name ?? '',
      email: p.email ?? '',
      phone: p.phone ?? '',
      health_insurance: p.health_insurance ?? '',
      status: p.status ?? '',
      area_interest: p.area_interest ?? '',
    });
    setIsEditDialogOpen(true);
  };

  const resetForm = () => {
    setFormData({ name: '', email: '', phone: '', health_insurance: '', status: '', area_interest: '' });
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const { error } = await supabase.from('pre_patients').insert({
        name: formData.name || null,
        email: formData.email || null,
        phone: formData.phone || null,
        health_insurance: formData.health_insurance || null,
        status: formData.status || null,
        area_interest: formData.area_interest || null,
      });
      if (error) throw error;
      toast.success('Pré paciente criado.');
      setIsCreateDialogOpen(false);
      resetForm();
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || 'Erro ao criar pré paciente');
    } finally {
      setIsSaving(false);
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedId) return;
    setIsSaving(true);
    try {
      const { error } = await supabase.from('pre_patients').update({
        name: formData.name || null,
        email: formData.email || null,
        phone: formData.phone || null,
        health_insurance: formData.health_insurance || null,
        status: formData.status || null,
        area_interest: formData.area_interest || null,
      }).eq('id', selectedId);
      if (error) throw error;
      toast.success('Pré paciente atualizado.');
      setIsEditDialogOpen(false);
      setSelectedId(null);
      resetForm();
      // Se name tiver sido preenchido, a trigger irá promover e remover desta lista automaticamente
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || 'Erro ao atualizar pré paciente');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase.from('pre_patients').delete().eq('id', id);
      if (error) throw error;
      toast.success('Pré paciente removido.');
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || 'Erro ao remover');
    }
  };

  const formatWhatsappToDDDNumber = (raw?: string | null) => {
    if (!raw) return '-';
    const atIdx = raw.indexOf('@');
    const withoutDomain = atIdx >= 0 ? raw.slice(0, atIdx) : raw;
    const digits = withoutDomain.replace(/\D/g, '');
    if (!digits) return '-';
    // Mantém apenas os últimos 11 dígitos (ou menos) para capturar DDD + número
    const local = digits.length > 11 ? digits.slice(-11) : digits;
    if (local.length < 10) return local; // não há dígitos suficientes para DDD + número
    const ddd = local.slice(0, 2);
    const number = local.slice(2);
    return `(${ddd}) ${number}`;
  };

  return (
    <DashboardLayout>
      <div className="p-8 space-y-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Pré Pacientes</h1>
            <p className="text-muted-foreground mt-1">Leads antes de se tornarem pacientes do CRM.</p>
            <p className="text-xs text-muted-foreground mt-1">Ao preencher o campo Nome e salvar, o lead é promovido para o CRM automaticamente (com deduplicação por email/telefone).</p>
          </div>
          <Button onClick={() => { resetForm(); setIsCreateDialogOpen(true); }}>
            <Plus className="mr-2 h-4 w-4" />
            Novo Pré Paciente
          </Button>
        </div>

        <MagicBentoCard contentClassName="p-4">
          <div className="flex items-center gap-2">
            <Search className="h-5 w-5 text-muted-foreground" />
            <Input
              placeholder="Buscar por nome, email, telefone, convênio, status..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="border-0 focus-visible:ring-0 shadow-none"
            />
          </div>
        </MagicBentoCard>

        <MagicBentoCard contentClassName="p-6">
          <Table>
            <TableCaption>
              {loading
                ? 'Carregando…'
                : error
                ? `Erro: ${error}`
                : `${filtered.length} lead(s) encontrado(s)`}
            </TableCaption>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Contato</TableHead>
                <TableHead>Convênio</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Área de Interesse</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((p) => (
                <TableRow key={p.id}>
                  <TableCell>{p.name ?? '-'}</TableCell>
                  <TableCell>
                    <div className="space-y-0.5">
                      <span className="text-sm">{p.email ?? '-'}</span>
                      <div className="text-xs text-muted-foreground">{formatWhatsappToDDDNumber(p.phone)}</div>
                    </div>
                  </TableCell>
                  <TableCell>{p.health_insurance ?? '-'}</TableCell>
                  <TableCell>{p.status ?? '-'}</TableCell>
                  <TableCell>{p.area_interest ?? '-'}</TableCell>
                  <TableCell className="text-right space-x-2">
                    <Button variant="outline" size="sm" onClick={() => openEdit(p)}>
                      <Pencil className="w-4 h-4 mr-1" /> Editar
                    </Button>
                    <Button variant="destructive" size="sm" onClick={() => handleDelete(p.id)}>
                      <Trash2 className="w-4 h-4 mr-1" /> Remover
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </MagicBentoCard>
      </div>

      {/* Dialog Criar */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-auto">
          <DialogHeader>
            <DialogTitle>Novo Pré Paciente</DialogTitle>
            <DialogDescription>Cadastre as informações do lead</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nome</Label>
                <Input id="name" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Telefone</Label>
                <Input id="phone" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="health_insurance">Convênio</Label>
                <Input id="health_insurance" value={formData.health_insurance} onChange={(e) => setFormData({ ...formData, health_insurance: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Input id="status" value={formData.status} onChange={(e) => setFormData({ ...formData, status: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="area_interest">Área de interesse</Label>
                <Input id="area_interest" value={formData.area_interest} onChange={(e) => setFormData({ ...formData, area_interest: e.target.value })} />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsCreateDialogOpen(false)} disabled={isSaving}>Cancelar</Button>
              <Button type="submit" disabled={isSaving}>{isSaving ? (<><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Salvando...</>) : 'Salvar'}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Dialog Editar */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-auto">
          <DialogHeader>
            <DialogTitle>Editar Pré Paciente</DialogTitle>
            <DialogDescription>Atualize as informações do lead</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleUpdate} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name_edit">Nome</Label>
                <Input id="name_edit" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email_edit">Email</Label>
                <Input id="email_edit" type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone_edit">Telefone</Label>
                <Input id="phone_edit" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="health_insurance_edit">Convênio</Label>
                <Input id="health_insurance_edit" value={formData.health_insurance} onChange={(e) => setFormData({ ...formData, health_insurance: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="status_edit">Status</Label>
                <Input id="status_edit" value={formData.status} onChange={(e) => setFormData({ ...formData, status: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="area_interest_edit">Área de interesse</Label>
                <Input id="area_interest_edit" value={formData.area_interest} onChange={(e) => setFormData({ ...formData, area_interest: e.target.value })} />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsEditDialogOpen(false)} disabled={isSaving}>Cancelar</Button>
              <Button type="submit" disabled={isSaving}>{isSaving ? (<><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Salvando...</>) : 'Salvar'}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}


