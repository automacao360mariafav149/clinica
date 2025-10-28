import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { supabase } from '@/lib/supabaseClient';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { 
  Building2, 
  Stethoscope, 
  Search, 
  Loader2,
  FileText,
  TrendingUp,
  Mail,
  Award
} from 'lucide-react';

interface DoctorSummary {
  doctor_id: string;
  doctor_name: string;
  doctor_email: string;
  doctor_specialty: string | null;
  total_insurance_companies: number;
  total_insurance_plans: number;
  insurance_companies: string | null;
  insurance_plans_list: string | null;
}

export default function DoctorsInsurance() {
  const [doctors, setDoctors] = useState<DoctorSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const { toast } = useToast();

  useEffect(() => {
    loadDoctorsData();

    // REALTIME: Escutar mudanças na tabela doctors_insurance_summary
    const channel = supabase
      .channel('doctors-insurance-changes')
      .on(
        'postgres_changes',
        {
          event: '*', // INSERT, UPDATE, DELETE
          schema: 'public',
          table: 'doctors_insurance_summary',
        },
        (payload) => {
          console.log('Realtime: Mudança detectada!', payload);
          // Recarregar dados quando houver alteração
          loadDoctorsData();
        }
      )
      .subscribe();

    // Cleanup ao desmontar componente
    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const loadDoctorsData = async () => {
    try {
      setLoading(true);

      // Usa TABELA REAL ao invés de VIEW/função para suportar Realtime
      const { data, error } = await supabase
        .from('doctors_insurance_summary')
        .select('*')
        .order('doctor_name', { ascending: true });

      if (error) {
        console.error('Erro ao carregar dados:', error);
        throw error;
      }

      console.log('Médicos carregados:', data?.length);
      setDoctors(data || []);
    } catch (error) {
      console.error('Erro ao carregar médicos:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar os dados dos médicos.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  // Filtrar apenas médicos com convênios
  const doctorsWithInsurance = doctors.filter((doctor) => doctor.total_insurance_plans > 0);
  
  const filteredDoctors = doctorsWithInsurance.filter((doctor) =>
    doctor.doctor_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    doctor.doctor_specialty?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    doctor.insurance_companies?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getTotalDoctors = () => doctorsWithInsurance.length;
  const getTotalWithInsurance = () => doctorsWithInsurance.length;
  const getAveragePlans = () => {
    const total = doctorsWithInsurance.reduce((sum, d) => sum + d.total_insurance_plans, 0);
    return doctorsWithInsurance.length > 0 ? (total / doctorsWithInsurance.length).toFixed(1) : '0';
  };

  if (loading) {
    return (
      <DashboardLayout requiredRoles={['owner', 'secretary']}>
        <div className="flex items-center justify-center h-full">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  const hasAnyInsurance = getTotalWithInsurance() > 0;

  return (
    <DashboardLayout requiredRoles={['owner', 'secretary']}>
      <div className="p-8 space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold mb-2">Visão de Convênios</h1>
          <p className="text-muted-foreground">
            Visualize todos os médicos da clínica e os convênios que cada um aceita
          </p>
        </div>

        {/* Info Alert quando não há convênios */}
        {!hasAnyInsurance && (
          <Card className="border-blue-200 bg-blue-50/50">
            <CardContent className="pt-6">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <FileText className="w-5 h-5 text-blue-600" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-blue-900 mb-1">
                    Nenhum convênio cadastrado ainda
                  </h3>
                  <p className="text-sm text-blue-700 mb-3">
                    Para que os convênios apareçam aqui, cada médico precisa acessar o menu 
                    <strong className="mx-1">"Convênios"</strong> 
                    e selecionar quais operadoras e planos aceita atender.
                  </p>
                  <div className="bg-white/80 rounded-lg p-3 border border-blue-200">
                    <p className="text-sm font-medium text-blue-900 mb-2">💡 Como funciona:</p>
                    <ol className="text-sm text-blue-700 space-y-1 list-decimal list-inside">
                      <li>Médico faz login no sistema</li>
                      <li>Acessa o menu <strong>"Convênios"</strong></li>
                      <li>Seleciona as operadoras e planos que aceita</li>
                      <li>As informações aparecem automaticamente aqui</li>
                    </ol>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-primary/10 rounded-lg">
                  <Stethoscope className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total de Médicos</p>
                  <p className="text-2xl font-bold">{getTotalDoctors()}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className={`p-3 rounded-lg ${hasAnyInsurance ? 'bg-green-500/10' : 'bg-gray-500/10'}`}>
                  <Building2 className={`w-6 h-6 ${hasAnyInsurance ? 'text-green-500' : 'text-gray-500'}`} />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Médicos com Convênios</p>
                  <p className="text-2xl font-bold">{getTotalWithInsurance()}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className={`p-3 rounded-lg ${hasAnyInsurance ? 'bg-blue-500/10' : 'bg-gray-500/10'}`}>
                  <TrendingUp className={`w-6 h-6 ${hasAnyInsurance ? 'text-blue-500' : 'text-gray-500'}`} />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Média de Planos</p>
                  <p className="text-2xl font-bold">{getAveragePlans()}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input
            placeholder="Buscar por médico, especialidade ou convênio..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>

        {/* Cards View */}
        <div className="space-y-4">
          {filteredDoctors.length === 0 ? (
            <Card>
              <CardContent className="py-12">
                <div className="text-center">
                  <Building2 className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                  <p className="text-muted-foreground font-medium">
                    {searchTerm ? 'Nenhum médico encontrado com esse filtro' : 'Nenhum médico com convênios cadastrados'}
                  </p>
                  {searchTerm && (
                    <p className="text-sm text-muted-foreground mt-2">
                      Tente buscar por outro termo
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          ) : (
            filteredDoctors.map((doctor) => {
              const insuranceList = doctor.insurance_plans_list?.split(', ') || [];
              
              return (
                <Card key={doctor.doctor_id} className="border-l-4 border-l-green-500 hover:shadow-md transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <div className="w-3 h-3 rounded-full bg-green-500 animate-pulse" />
                          <CardTitle className="text-xl">{doctor.doctor_name || 'Sem nome'}</CardTitle>
                        </div>
                        <div className="flex items-center gap-3 flex-wrap">
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Mail className="w-4 h-4" />
                            {doctor.doctor_email}
                          </div>
                          {doctor.doctor_specialty && (
                            <div className="flex items-center gap-2">
                              <Award className="w-4 h-4 text-primary" />
                              <Badge variant="secondary" className="font-normal">
                                {doctor.doctor_specialty}
                              </Badge>
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <div className="text-center">
                          <Badge className="bg-primary/10 text-primary">
                            {doctor.total_insurance_companies}
                          </Badge>
                          <p className="text-xs text-muted-foreground mt-1">Operadoras</p>
                        </div>
                        <div className="text-center">
                          <Badge className="bg-blue-500/10 text-blue-600 font-semibold">
                            {doctor.total_insurance_plans}
                          </Badge>
                          <p className="text-xs text-muted-foreground mt-1">Planos</p>
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 mb-3">
                        <Building2 className="w-4 h-4 text-primary" />
                        <h4 className="font-semibold text-sm">Convênios Aceitos</h4>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                        {insuranceList.map((insurance, index) => {
                          const [company, ...planParts] = insurance.split(' - ');
                          const plan = planParts.join(' - ');
                          return (
                            <div
                              key={index}
                              className="flex items-start gap-2 p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                            >
                              <div className="flex-1">
                                <p className="font-semibold text-sm text-primary">{company}</p>
                                <p className="text-xs text-muted-foreground mt-0.5">{plan}</p>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}

