import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { DoctorAvatarUpload } from '@/components/doctors/DoctorAvatarUpload';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabaseClient';
import { toast } from 'sonner';
import { Loader2, Save, User, Mail, Phone, Stethoscope, DollarSign } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export default function Profile() {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [profileData, setProfileData] = useState({
    id: '',
    name: '',
    email: '',
    phone: '',
    specialization: '',
    role: '',
    avatar_url: '',
    consultation_price: 0,
  });

  useEffect(() => {
    loadProfile();
  }, [user]);

  const loadProfile = async () => {
    if (!user?.id) return;

    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error) throw error;

      if (data) {
        setProfileData({
          id: data.id,
          name: data.name || '',
          email: data.email || '',
          phone: data.phone || '',
          specialization: data.specialization || '',
          role: data.role || '',
          avatar_url: data.avatar_url || '',
          consultation_price: data.consultation_price || 0,
        });
      }
    } catch (error: any) {
      console.error('Erro ao carregar perfil:', error);
      toast.error('Erro ao carregar dados do perfil');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    if (!user?.id) return;

    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          name: profileData.name,
          email: profileData.email,
          phone: profileData.phone,
          specialization: profileData.specialization,
          avatar_url: profileData.avatar_url,
          consultation_price: profileData.consultation_price,
        })
        .eq('id', user.id);

      if (error) throw error;

      toast.success('Perfil atualizado com sucesso!');
    } catch (error: any) {
      console.error('Erro ao salvar perfil:', error);
      toast.error('Erro ao salvar alterações');
    } finally {
      setIsSaving(false);
    }
  };

  const getRoleBadge = (role: string) => {
    if (role === 'owner') return <Badge className="bg-purple-500">Dono</Badge>;
    if (role === 'doctor') return <Badge className="bg-blue-500">Médico</Badge>;
    if (role === 'secretary') return <Badge className="bg-green-500">Secretária</Badge>;
    return null;
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-[calc(100vh-200px)]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="container max-w-4xl mx-auto p-8 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Meu Perfil</h1>
            <p className="text-muted-foreground mt-1">
              Gerencie suas informações pessoais e profissionais
            </p>
          </div>
          {getRoleBadge(profileData.role)}
        </div>

        {/* Avatar Card */}
        <Card>
          <CardHeader>
            <CardTitle>Foto de Perfil</CardTitle>
            <CardDescription>
              Adicione ou altere sua foto de perfil
            </CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center py-6">
            <DoctorAvatarUpload
              doctorId={profileData.id}
              avatarUrl={profileData.avatar_url}
              doctorName={profileData.name}
              onUploadSuccess={(url) => setProfileData({ ...profileData, avatar_url: url })}
              onRemoveSuccess={() => setProfileData({ ...profileData, avatar_url: '' })}
              size="lg"
            />
          </CardContent>
        </Card>

        {/* Informações Pessoais */}
        <Card>
          <CardHeader>
            <CardTitle>Informações Pessoais</CardTitle>
            <CardDescription>
              Atualize seus dados pessoais e de contato
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name" className="flex items-center gap-2">
                <User className="h-4 w-4" />
                Nome Completo
              </Label>
              <Input
                id="name"
                value={profileData.name}
                onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                placeholder="Seu nome completo"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" className="flex items-center gap-2">
                <Mail className="h-4 w-4" />
                Email
              </Label>
              <Input
                id="email"
                type="email"
                value={profileData.email}
                onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
                placeholder="seu@email.com"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone" className="flex items-center gap-2">
                <Phone className="h-4 w-4" />
                Telefone
              </Label>
              <Input
                id="phone"
                type="tel"
                value={profileData.phone}
                onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
                placeholder="(00) 00000-0000"
              />
            </div>

            {profileData.role === 'doctor' && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="specialization" className="flex items-center gap-2">
                    <Stethoscope className="h-4 w-4" />
                    Especialização
                  </Label>
                  <Input
                    id="specialization"
                    value={profileData.specialization}
                    onChange={(e) => setProfileData({ ...profileData, specialization: e.target.value })}
                    placeholder="Ex: Cardiologista, Pediatra, etc."
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="consultation_price" className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4" />
                    Preço da Consulta (R$)
                  </Label>
                  <Input
                    id="consultation_price"
                    type="number"
                    step="0.01"
                    min="0"
                    value={profileData.consultation_price}
                    onChange={(e) => setProfileData({ ...profileData, consultation_price: parseFloat(e.target.value) || 0 })}
                    placeholder="0.00"
                  />
                  <p className="text-xs text-muted-foreground">
                    Valor cobrado por consulta (opcional)
                  </p>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Botão de Salvar */}
        <div className="flex justify-end">
          <Button onClick={handleSave} disabled={isSaving} size="lg">
            {isSaving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Salvando...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Salvar Alterações
              </>
            )}
          </Button>
        </div>
      </div>
    </DashboardLayout>
  );
}

