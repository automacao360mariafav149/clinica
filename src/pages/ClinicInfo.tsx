import { useEffect, useMemo, useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Loader2, MapPin, Building2, FileText, Stethoscope } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import { toast } from 'sonner';

interface ClinicInfoRow {
  id?: string;
  address_line: string | null;
  address_number: string | null;
  neighborhood: string | null;
  city: string | null;
  state: string | null;
  zip_code: string | null;
  opening_hours: string | null;
  policy_scheduling: string | null;
  policy_rescheduling: string | null;
  policy_cancellation: string | null;
  doctor_ids?: string[] | null;
  doctor_team?: { name?: string | null; specialization?: string | null; consultation_price?: number | null }[] | null;
}

interface DoctorProfile {
  id: string;
  name: string | null;
  email: string | null;
  specialization: string | null;
  consultation_price: number | null;
}

export default function ClinicInfo() {
  const [loading, setLoading] = useState<boolean>(false);
  const [saving, setSaving] = useState<boolean>(false);
  const [clinicInfo, setClinicInfo] = useState<ClinicInfoRow | null>(null);
  const [doctors, setDoctors] = useState<DoctorProfile[]>([]);
  const [loadingDoctors, setLoadingDoctors] = useState<boolean>(false);
  const [selectedDoctorIds, setSelectedDoctorIds] = useState<string[]>([]);
  const [doctorPrices, setDoctorPrices] = useState<Record<string, number>>({});
  const selectedDoctors = useMemo(() => (
    doctors.filter((d) => selectedDoctorIds.includes(d.id))
  ), [doctors, selectedDoctorIds]);

  const emptyInfo: ClinicInfoRow = useMemo(() => ({
    address_line: '',
    address_number: '',
    neighborhood: '',
    city: '',
    state: '',
    zip_code: '',
    opening_hours: '',
    policy_scheduling: '',
    policy_rescheduling: '',
    policy_cancellation: '',
  }), []);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('clinic_info')
          .select('*')
          .limit(1)
          .maybeSingle();

        if (error) throw error;

        setClinicInfo(data ?? emptyInfo);
        if (data && Array.isArray((data as any).doctor_ids)) {
          setSelectedDoctorIds(((data as any).doctor_ids as string[]) || []);
        } else {
          setSelectedDoctorIds([]);
        }
      } catch (err: any) {
        console.error('Erro ao carregar informações da clínica:', err);
        toast.error(err.message || 'Erro ao carregar informações da clínica');
        setClinicInfo(emptyInfo);
      } finally {
        setLoading(false);
      }
    };

    const fetchDoctors = async () => {
      setLoadingDoctors(true);
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('id, name, email, specialization, role, consultation_price')
          .eq('role', 'doctor')
          .order('name');
        if (error) throw error;
        setDoctors((data as any[] || []).map((d) => ({
          id: d.id,
          name: d.name,
          email: d.email,
          specialization: d.specialization,
          consultation_price: d.consultation_price || 0,
        })));
      } catch (err: any) {
        console.error('Erro ao carregar médicos:', err);
        toast.error('Erro ao carregar lista de médicos');
      } finally {
        setLoadingDoctors(false);
      }
    };

    fetchData();
    fetchDoctors();
  }, [emptyInfo]);

  // Se não houver doctor_ids definidos, tenta derivar seleção a partir de doctor_team persistido (por nome+especialização)
  useEffect(() => {
    if (!clinicInfo) return;
    if (selectedDoctorIds.length > 0) return;
    const team = (clinicInfo as any).doctor_team as { name?: string | null; specialization?: string | null }[] | undefined;
    if (!Array.isArray(team) || team.length === 0) return;
    if (doctors.length === 0) return;
    const ids = doctors
      .filter((d) => team.some((t) => (t.name || '') === (d.name || '') && (t.specialization || null) === (d.specialization || null)))
      .map((d) => d.id);
    if (ids.length > 0) setSelectedDoctorIds(ids);
  }, [clinicInfo, doctors, selectedDoctorIds.length]);

  // Inicializa os preços dos médicos quando a lista for carregada
  useEffect(() => {
    if (doctors.length === 0) return;
    const prices: Record<string, number> = {};
    
    // Primeiro, pega os preços da tabela profiles
    doctors.forEach((d) => {
      prices[d.id] = d.consultation_price || 0;
    });

    // Se houver doctor_team no clinic_info, sobrescreve com esses valores (prioridade)
    const team = (clinicInfo as any)?.doctor_team as { name?: string | null; specialization?: string | null; consultation_price?: number | null }[] | undefined;
    if (Array.isArray(team) && team.length > 0) {
      team.forEach((t) => {
        const doctor = doctors.find((d) => d.name === t.name && d.specialization === t.specialization);
        if (doctor && t.consultation_price !== undefined && t.consultation_price !== null) {
          prices[doctor.id] = t.consultation_price;
        }
      });
    }

    setDoctorPrices(prices);
  }, [doctors, clinicInfo]);

  const handleChange = (field: keyof ClinicInfoRow, value: string) => {
    setClinicInfo((prev) => ({ ...(prev ?? emptyInfo), [field]: value }));
  };

  const handleSave = async () => {
    if (!clinicInfo) return;
    setSaving(true);
    try {
      const payload = {
        address_line: clinicInfo.address_line || null,
        address_number: clinicInfo.address_number || null,
        neighborhood: clinicInfo.neighborhood || null,
        city: clinicInfo.city || null,
        state: clinicInfo.state || null,
        zip_code: clinicInfo.zip_code || null,
        opening_hours: clinicInfo.opening_hours || null,
        policy_scheduling: clinicInfo.policy_scheduling || null,
        policy_rescheduling: clinicInfo.policy_rescheduling || null,
        policy_cancellation: clinicInfo.policy_cancellation || null,
      };

      if (clinicInfo.id) {
        const { error } = await supabase
          .from('clinic_info')
          .update(payload)
          .eq('id', clinicInfo.id);
        if (error) throw error;
      } else {
        const { data, error } = await supabase
          .from('clinic_info')
          .insert(payload)
          .select('*')
          .single();
        if (error) throw error;
        setClinicInfo(data as ClinicInfoRow);
      }

      toast.success('Informações salvas com sucesso');
    } catch (err: any) {
      console.error('Erro ao salvar informações da clínica:', err);
      toast.error(err.message || 'Erro ao salvar informações');
    } finally {
      setSaving(false);
    }
  };

  const toggleDoctor = (doctorId: string, checked: boolean) => {
    setSelectedDoctorIds((prev) => {
      const set = new Set(prev);
      if (checked) set.add(doctorId); else set.delete(doctorId);
      return Array.from(set);
    });
  };

  const handlePriceChange = (doctorId: string, value: string) => {
    // Remove tudo que não é número, vírgula ou ponto
    let cleanValue = value.replace(/[^\d,\.]/g, '');
    
    // Se tem vírgula, garante apenas uma
    if (cleanValue.includes(',')) {
      const parts = cleanValue.split(',');
      cleanValue = parts[0] + ',' + (parts[1] || '').slice(0, 2);
    }
    
    // Se tem ponto, garante apenas um
    if (cleanValue.includes('.')) {
      const parts = cleanValue.split('.');
      cleanValue = parts[0] + '.' + (parts[1] || '').slice(0, 2);
    }
    
    // Converte para número (vírgula ou ponto para ponto)
    const numValue = parseFloat(cleanValue.replace(',', '.')) || 0;
    setDoctorPrices((prev) => ({ ...prev, [doctorId]: numValue }));
  };

  const formatPrice = (price: number): string => {
    // Formata no padrão brasileiro (vírgula para decimais)
    return price.toLocaleString('pt-BR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  const handleSavePrices = async () => {
    try {
      // 1. Salva o preço de cada médico na tabela profiles
      const updates = Object.entries(doctorPrices).map(([doctorId, price]) =>
        supabase
          .from('profiles')
          .update({ consultation_price: price })
          .eq('id', doctorId)
      );

      const results = await Promise.all(updates);
      
      // Verifica se houve algum erro
      const errors = results.filter((r) => r.error);
      if (errors.length > 0) {
        console.error('Erros ao salvar preços:', errors);
        toast.error('Erro ao salvar alguns preços de consulta');
        return;
      }

      // 2. Atualiza o doctor_team na clinic_info com os preços atualizados
      if (clinicInfo?.id && selectedDoctorIds.length > 0) {
        const updatedTeam = doctors
          .filter((d) => selectedDoctorIds.includes(d.id))
          .map((d) => ({ 
            name: d.name || null, 
            specialization: d.specialization || null,
            consultation_price: doctorPrices[d.id] || d.consultation_price || 0
          }));

        const { error: teamError } = await supabase
          .from('clinic_info')
          .update({ doctor_team: updatedTeam })
          .eq('id', clinicInfo.id);

        if (teamError) {
          console.error('Erro ao atualizar doctor_team:', teamError);
          toast.warning('Preços salvos, mas houve erro ao atualizar a equipe');
          return;
        }
      }

      toast.success('Preços de consulta salvos com sucesso');
    } catch (err: any) {
      console.error('Erro ao salvar preços:', err);
      toast.error(err.message || 'Erro ao salvar preços de consulta');
    }
  };

  const handleSaveTeam = async () => {
    const team = doctors
      .filter((d) => selectedDoctorIds.includes(d.id))
      .map((d) => ({ 
        name: d.name || null, 
        specialization: d.specialization || null,
        consultation_price: doctorPrices[d.id] || d.consultation_price || 0
      }));

    // Obtém os IDs atuais antes da atualização
    const currentDoctorIds = (clinicInfo?.doctor_ids as string[]) || [];
    
    // Identifica médicos removidos (desabilitados) e médicos adicionados (habilitados)
    const removedDoctorIds = currentDoctorIds.filter(id => !selectedDoctorIds.includes(id));
    const addedDoctorIds = selectedDoctorIds.filter(id => !currentDoctorIds.includes(id));

    if (!clinicInfo || clinicInfo.id) {
      try {
        const payload = { doctor_ids: selectedDoctorIds, doctor_team: team } as any;
        const { error } = await supabase
          .from('clinic_info')
          .update(payload)
          .eq('id', clinicInfo?.id);
        if (error) throw error;

        // Atualiza os schedules dos médicos removidos (desabilita todos os dias)
        if (removedDoctorIds.length > 0) {
          const { error: disableError } = await supabase
            .from('doctor_schedules')
            .update({
              seg_ativo: false,
              ter_ativo: false,
              qua_ativo: false,
              qui_ativo: false,
              sex_ativo: false,
              sab_ativo: false,
              dom_ativo: false,
            })
            .in('doctor_id', removedDoctorIds);
          
          if (disableError) {
            console.error('Erro ao desabilitar schedules:', disableError);
            toast.warning('Equipe atualizada, mas alguns horários podem não ter sido desabilitados');
          }
        }

        // Atualiza os schedules dos médicos adicionados (habilita todos os dias)
        if (addedDoctorIds.length > 0) {
          // Verifica quais médicos já têm schedules cadastrados
          const { data: existingSchedules, error: fetchError } = await supabase
            .from('doctor_schedules')
            .select('doctor_id')
            .in('doctor_id', addedDoctorIds);

          if (fetchError) {
            console.error('Erro ao buscar schedules existentes:', fetchError);
          } else {
            const existingDoctorIds = (existingSchedules || []).map(s => s.doctor_id);
            const doctorsWithSchedules = addedDoctorIds.filter(id => existingDoctorIds.includes(id));

            // Habilita schedules dos médicos que já têm registro
            if (doctorsWithSchedules.length > 0) {
              const { error: enableError } = await supabase
                .from('doctor_schedules')
                .update({
                  seg_ativo: true,
                  ter_ativo: true,
                  qua_ativo: true,
                  qui_ativo: true,
                  sex_ativo: true,
                  sab_ativo: false,
                  dom_ativo: false,
                })
                .in('doctor_id', doctorsWithSchedules);

              if (enableError) {
                console.error('Erro ao habilitar schedules:', enableError);
                toast.warning('Equipe atualizada, mas alguns horários podem não ter sido habilitados');
              }
            }
          }
        }

        toast.success('Equipe médica atualizada');
      } catch (err: any) {
        console.error('Erro ao salvar equipe médica:', err);
        toast.error(err.message || 'Erro ao salvar equipe médica');
      }
      return;
    }

    // Caso ainda não exista registro, cria um novo com doctor_team (e doctor_ids para manter seleção)
    try {
      const { data, error } = await supabase
        .from('clinic_info')
        .insert({ doctor_ids: selectedDoctorIds, doctor_team: team })
        .select('*')
        .single();
      if (error) throw error;
      setClinicInfo(data as ClinicInfoRow);

      // Para médicos selecionados na criação inicial, habilita seus schedules se existirem
      if (selectedDoctorIds.length > 0) {
        const { data: existingSchedules, error: fetchError } = await supabase
          .from('doctor_schedules')
          .select('doctor_id')
          .in('doctor_id', selectedDoctorIds);

        if (!fetchError && existingSchedules && existingSchedules.length > 0) {
          const existingDoctorIds = existingSchedules.map(s => s.doctor_id);
          
          const { error: enableError } = await supabase
            .from('doctor_schedules')
            .update({
              seg_ativo: true,
              ter_ativo: true,
              qua_ativo: true,
              qui_ativo: true,
              sex_ativo: true,
              sab_ativo: false,
              dom_ativo: false,
            })
            .in('doctor_id', existingDoctorIds);

          if (enableError) {
            console.error('Erro ao habilitar schedules:', enableError);
            toast.warning('Equipe salva, mas alguns horários podem não ter sido habilitados');
          }
        }
      }

      toast.success('Equipe médica salva');
    } catch (err: any) {
      console.error('Erro ao salvar equipe médica:', err);
      toast.error(err.message || 'Erro ao salvar equipe médica');
    }
  };

  return (
    <DashboardLayout requiredRoles={['owner']}>
      <div className="p-8 space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Informações da Clínica</h1>
            <p className="text-muted-foreground mt-1">Gerencie endereço, horário e políticas da clínica</p>
          </div>
          <Button onClick={handleSave} disabled={saving || loading} className="gap-2">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileText className="h-4 w-4" />}
            Salvar
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2">
            <CardHeader className="flex flex-row items-center gap-2">
              <MapPin className="h-5 w-5 text-primary" />
              <span className="font-semibold">Endereço e Horários</span>
            </CardHeader>
            <CardContent className="space-y-4">
              {loading ? (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" /> Carregando...
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
                  <div className="md:col-span-4 space-y-2">
                    <Label>Endereço</Label>
                    <Input
                      placeholder="Rua Exemplo"
                      value={clinicInfo?.address_line ?? ''}
                      onChange={(e) => handleChange('address_line', e.target.value)}
                    />
                  </div>
                  <div className="md:col-span-2 space-y-2">
                    <Label>Número</Label>
                    <Input
                      placeholder="123"
                      value={clinicInfo?.address_number ?? ''}
                      onChange={(e) => handleChange('address_number', e.target.value)}
                    />
                  </div>
                  <div className="md:col-span-3 space-y-2">
                    <Label>Bairro</Label>
                    <Input
                      placeholder="Bairro"
                      value={clinicInfo?.neighborhood ?? ''}
                      onChange={(e) => handleChange('neighborhood', e.target.value)}
                    />
                  </div>
                  <div className="md:col-span-2 space-y-2">
                    <Label>Cidade</Label>
                    <Input
                      placeholder="Cidade"
                      value={clinicInfo?.city ?? ''}
                      onChange={(e) => handleChange('city', e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>UF</Label>
                    <Input
                      placeholder="SP"
                      value={clinicInfo?.state ?? ''}
                      onChange={(e) => handleChange('state', e.target.value.toUpperCase())}
                      maxLength={2}
                    />
                  </div>
                  <div className="md:col-span-2 space-y-2">
                    <Label>CEP</Label>
                    <Input
                      placeholder="00000-000"
                      value={clinicInfo?.zip_code ?? ''}
                      onChange={(e) => handleChange('zip_code', e.target.value)}
                    />
                  </div>
                  <div className="md:col-span-6 space-y-2">
                    <Label>Horário de Atendimento</Label>
                    <Textarea
                      placeholder="Ex.: Seg a Sex 08:00 - 18:00, Sáb 08:00 - 12:00"
                      value={clinicInfo?.opening_hours ?? ''}
                      onChange={(e) => handleChange('opening_hours', e.target.value)}
                      rows={3}
                    />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center gap-2">
              <Building2 className="h-5 w-5 text-primary" />
              <span className="font-semibold">Políticas</span>
            </CardHeader>
            <CardContent className="space-y-4">
              {loading ? (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" /> Carregando...
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Agendamento</Label>
                    <Textarea
                      placeholder="Regras para agendamentos"
                      value={clinicInfo?.policy_scheduling ?? ''}
                      onChange={(e) => handleChange('policy_scheduling', e.target.value)}
                      rows={4}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Reagendamento</Label>
                    <Textarea
                      placeholder="Regras para reagendamentos"
                      value={clinicInfo?.policy_rescheduling ?? ''}
                      onChange={(e) => handleChange('policy_rescheduling', e.target.value)}
                      rows={4}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Cancelamento</Label>
                    <Textarea
                      placeholder="Regras para cancelamentos"
                      value={clinicInfo?.policy_cancellation ?? ''}
                      onChange={(e) => handleChange('policy_cancellation', e.target.value)}
                      rows={4}
                    />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Stethoscope className="h-5 w-5 text-primary" />
              <span className="font-semibold">Equipe Médica e Preços</span>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={handleSavePrices} disabled={loadingDoctors}>
                Salvar preços
              </Button>
              <Button variant="outline" onClick={handleSaveTeam} disabled={loadingDoctors}>
                Salvar equipe médica
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {selectedDoctors.length > 0 && (
              <div className="mb-4">
                <div className="text-sm text-muted-foreground mb-2">Equipe atual selecionada</div>
                <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                  {selectedDoctors.map((d) => (
                    <div key={d.id} className="rounded-md border p-3 bg-blue-50/30">
                      <div className="font-medium text-foreground truncate">{d.name || 'Médico'}</div>
                      {d.specialization && (
                        <div className="text-xs text-muted-foreground truncate">{d.specialization}</div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
            {loadingDoctors ? (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" /> Carregando médicos...
              </div>
            ) : doctors.length === 0 ? (
              <p className="text-muted-foreground">Nenhum médico cadastrado.</p>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {doctors.map((d) => (
                  <div key={d.id} className="border rounded-lg p-4 hover:shadow-sm transition-colors">
                    <div className="flex items-start gap-3 mb-3">
                      <div className="h-10 w-10 rounded-full bg-blue-500/10 flex items-center justify-center">
                        <Stethoscope className="h-5 w-5 text-blue-600" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="font-semibold text-foreground truncate">{d.name || 'Médico'}</div>
                        {d.specialization && (
                          <div className="text-sm text-muted-foreground truncate">{d.specialization}</div>
                        )}
                        {d.email && (
                          <div className="text-xs text-muted-foreground truncate mt-1">{d.email}</div>
                        )}
                      </div>
                      <div className="pt-1">
                        <Checkbox
                          checked={selectedDoctorIds.includes(d.id)}
                          onCheckedChange={(checked) => toggleDoctor(d.id, Boolean(checked))}
                          aria-label={`Selecionar ${d.name || 'médico'}`}
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor={`price-${d.id}`} className="text-xs">Preço da Consulta</Label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
                          R$
                        </span>
                        <Input
                          id={`price-${d.id}`}
                          type="text"
                          placeholder="0,00"
                          value={formatPrice(doctorPrices[d.id] || 0)}
                          onChange={(e) => handlePriceChange(d.id, e.target.value)}
                          className="text-sm pl-10"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}


