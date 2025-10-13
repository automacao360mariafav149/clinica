import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { supabase } from '@/lib/supabaseClient';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { Building2, Search, CheckCircle2, Users, TrendingUp, MapPin, Loader2 } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';

interface InsuranceCompany {
  id: string;
  name: string;
  short_name: string;
  market_share: number;
  beneficiaries: number;
  headquarters: string;
  is_active: boolean;
}

interface InsurancePlan {
  id: string;
  insurance_company_id: string;
  name: string;
  plan_type: string;
  coverage_type: string;
  is_active: boolean;
}

interface AcceptedInsurance {
  id: string;
  insurance_plan_id: string;
  doctor_id: string;
  is_active: boolean;
}

interface CompanyWithPlans extends InsuranceCompany {
  plans: InsurancePlan[];
  acceptedPlanIds: string[];
}

export default function Convenios() {
  const [companies, setCompanies] = useState<CompanyWithPlans[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCompany, setSelectedCompany] = useState<string | null>(null);
  const { toast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    if (user?.id) {
      loadInsuranceData();
    }
  }, [user?.id]);

  const loadInsuranceData = async () => {
    try {
      setLoading(true);

      if (!user?.id) {
        console.log('User não carregado ainda');
        setLoading(false);
        return;
      }

      console.log('Carregando convênios para user:', user.id, 'role:', user.role);

      // Carregar operadoras
      const { data: companiesData, error: companiesError } = await supabase
        .from('insurance_companies')
        .select('*')
        .eq('is_active', true)
        .order('market_share', { ascending: false });

      if (companiesError) {
        console.error('Erro ao carregar operadoras:', companiesError);
        throw companiesError;
      }

      console.log('Operadoras carregadas:', companiesData?.length);

      // Carregar planos
      const { data: plansData, error: plansError } = await supabase
        .from('insurance_plans')
        .select('*')
        .eq('is_active', true)
        .order('plan_type', { ascending: true });

      if (plansError) {
        console.error('Erro ao carregar planos:', plansError);
        throw plansError;
      }

      console.log('Planos carregados:', plansData?.length);

      // Carregar convênios aceitos
      // Se for médico, carrega apenas os dele. Se for owner/secretary, carrega todos
      let acceptedQuery = supabase
        .from('clinic_accepted_insurances')
        .select('*')
        .eq('is_active', true);

      // Se for médico, filtra apenas os convênios dele
      if (user.role === 'doctor') {
        console.log('Filtrando convênios do médico:', user.id);
        acceptedQuery = acceptedQuery.eq('doctor_id', user.id);
      }

      const { data: acceptedData, error: acceptedError } = await acceptedQuery;

      if (acceptedError) {
        console.error('Erro ao carregar convênios aceitos:', acceptedError);
        throw acceptedError;
      }

      console.log('Convênios aceitos carregados:', acceptedData?.length);

      // Combinar os dados
      const companiesWithPlans: CompanyWithPlans[] = (companiesData || []).map((company) => ({
        ...company,
        plans: (plansData || []).filter((plan) => plan.insurance_company_id === company.id),
        acceptedPlanIds: (acceptedData || [])
          .filter((accepted) =>
            (plansData || []).some(
              (plan) => plan.id === accepted.insurance_plan_id && plan.insurance_company_id === company.id
            )
          )
          .map((accepted) => accepted.insurance_plan_id),
      }));

      console.log('Dados combinados:', companiesWithPlans.length, 'operadoras');
      setCompanies(companiesWithPlans);
    } catch (error) {
      console.error('Erro ao carregar convênios:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar os convênios.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const togglePlanAcceptance = async (planId: string, currentlyAccepted: boolean) => {
    try {
      setSaving(true);

      if (!user?.id) {
        console.error('Usuário não autenticado');
        toast({
          title: 'Erro',
          description: 'Usuário não autenticado.',
          variant: 'destructive',
        });
        return;
      }

      console.log('Toggle convênio:', {
        planId,
        doctorId: user.id,
        doctorRole: user.role,
        currentlyAccepted,
        action: currentlyAccepted ? 'REMOVER' : 'ADICIONAR'
      });

      if (currentlyAccepted) {
        // Remover convênio aceito
        console.log('Tentando remover convênio...');
        const { data, error } = await supabase
          .from('clinic_accepted_insurances')
          .delete()
          .eq('insurance_plan_id', planId)
          .eq('doctor_id', user.id)
          .select();

        if (error) {
          console.error('Erro ao remover:', error);
          throw error;
        }

        console.log('Convênio removido com sucesso:', data);

        toast({
          title: 'Convênio removido',
          description: 'O plano foi removido dos seus convênios aceitos.',
        });
      } else {
        // Adicionar convênio aceito
        const insertData = {
          insurance_plan_id: planId,
          doctor_id: user.id,
          is_active: true,
        };

        console.log('Tentando inserir convênio:', insertData);

        const { data, error } = await supabase
          .from('clinic_accepted_insurances')
          .insert(insertData)
          .select();

        if (error) {
          console.error('Erro ao inserir:', error);
          console.error('Detalhes do erro:', {
            message: error.message,
            details: error.details,
            hint: error.hint,
            code: error.code
          });
          throw error;
        }

        console.log('Convênio adicionado com sucesso:', data);

        toast({
          title: 'Convênio adicionado',
          description: 'O plano foi adicionado aos seus convênios aceitos.',
        });
      }

      // Recarregar dados
      await loadInsuranceData();
    } catch (error: any) {
      console.error('Erro completo ao atualizar convênio:', error);
      
      let errorMessage = 'Não foi possível atualizar o convênio.';
      
      if (error.message) {
        errorMessage += ` Detalhes: ${error.message}`;
      }
      
      if (error.code === '42501') {
        errorMessage = 'Você não tem permissão para realizar esta ação.';
      }
      
      toast({
        title: 'Erro',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const filteredCompanies = companies.filter(
    (company) =>
      company.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      company.short_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getPlanTypeBadgeColor = (type: string) => {
    switch (type.toLowerCase()) {
      case 'básico':
        return 'bg-blue-500/10 text-blue-500 hover:bg-blue-500/20';
      case 'intermediário':
        return 'bg-purple-500/10 text-purple-500 hover:bg-purple-500/20';
      case 'premium':
        return 'bg-amber-500/10 text-amber-500 hover:bg-amber-500/20';
      default:
        return 'bg-gray-500/10 text-gray-500 hover:bg-gray-500/20';
    }
  };

  const getTotalAcceptedPlans = () => {
    return companies.reduce((total, company) => total + company.acceptedPlanIds.length, 0);
  };

  const getAcceptedCompaniesCount = () => {
    return companies.filter((company) => company.acceptedPlanIds.length > 0).length;
  };

  if (loading) {
    return (
      <DashboardLayout requiredRoles={['owner', 'secretary', 'doctor']}>
        <div className="flex items-center justify-center h-full">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout requiredRoles={['owner', 'secretary', 'doctor']}>
      <div className="p-8 space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold mb-2">Gerenciamento de Convênios</h1>
          <p className="text-muted-foreground">
            {user?.role === 'doctor' 
              ? 'Selecione os convênios e planos que você aceita'
              : 'Visualize os convênios aceitos pelos médicos'}
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-primary/10 rounded-lg">
                  <Building2 className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Operadoras Disponíveis</p>
                  <p className="text-2xl font-bold">{companies.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-green-500/10 rounded-lg">
                  <CheckCircle2 className="w-6 h-6 text-green-500" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Operadoras Aceitas</p>
                  <p className="text-2xl font-bold">{getAcceptedCompaniesCount()}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-blue-500/10 rounded-lg">
                  <TrendingUp className="w-6 h-6 text-blue-500" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Planos Aceitos</p>
                  <p className="text-2xl font-bold">{getTotalAcceptedPlans()}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search Bar */}
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder="Buscar operadora..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>

        {/* Insurance Companies List */}
        <Accordion type="single" collapsible className="space-y-4">
          {filteredCompanies.map((company) => (
            <AccordionItem key={company.id} value={company.id} className="border rounded-lg">
              <AccordionTrigger className="px-6 hover:no-underline">
                <div className="flex items-center justify-between w-full pr-4">
                  <div className="flex items-center gap-4">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      <Building2 className="w-5 h-5 text-primary" />
                    </div>
                    <div className="text-left">
                      <h3 className="text-lg font-semibold">{company.name}</h3>
                      <div className="flex items-center gap-3 mt-1">
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <MapPin className="w-3 h-3" />
                          {company.headquarters}
                        </div>
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Users className="w-3 h-3" />
                          {(company.beneficiaries / 1000000).toFixed(2)}M beneficiários
                        </div>
                        <Badge variant="secondary" className="text-xs">
                          {company.market_share}% do mercado
                        </Badge>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {company.acceptedPlanIds.length > 0 && (
                      <Badge className="bg-green-500/10 text-green-500 hover:bg-green-500/20">
                        {company.acceptedPlanIds.length} {company.acceptedPlanIds.length === 1 ? 'plano aceito' : 'planos aceitos'}
                      </Badge>
                    )}
                  </div>
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-6 pb-6">
                {user?.role === 'doctor' && (
                  <div className="mb-4 p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                    <p className="text-sm text-blue-700">
                      💡 <strong>Clique nos cards ou nos checkboxes</strong> para adicionar/remover convênios que você aceita
                    </p>
                  </div>
                )}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 mt-4">
                  {company.plans.map((plan) => {
                    const isAccepted = company.acceptedPlanIds.includes(plan.id);
                    const canModify = user?.role === 'doctor' || user?.role === 'owner';
                    return (
                      <Card
                        key={plan.id}
                        className={`transition-all ${canModify ? 'cursor-pointer hover:shadow-md hover:scale-[1.02]' : ''} ${
                          isAccepted ? 'border-green-500 bg-green-500/5' : 'hover:border-primary/50'
                        }`}
                        onClick={() => canModify && togglePlanAcceptance(plan.id, isAccepted)}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1">
                              <h4 className="font-semibold text-sm mb-2">{plan.name}</h4>
                              <div className="flex flex-col gap-1">
                                <Badge className={getPlanTypeBadgeColor(plan.plan_type)} variant="secondary">
                                  {plan.plan_type}
                                </Badge>
                                <span className="text-xs text-muted-foreground">
                                  Cobertura: {plan.coverage_type}
                                </span>
                              </div>
                            </div>
                            {canModify && (
                              <Checkbox
                                checked={isAccepted}
                                disabled={saving}
                                className="mt-1"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  togglePlanAcceptance(plan.id, isAccepted);
                                }}
                              />
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>

        {filteredCompanies.length === 0 && (
          <Card>
            <CardContent className="p-8 text-center">
              <Building2 className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-semibold mb-2">Nenhuma operadora encontrada</h3>
              <p className="text-muted-foreground">
                Tente ajustar os filtros de busca
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
