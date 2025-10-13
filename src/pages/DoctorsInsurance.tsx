import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { supabase } from '@/lib/supabaseClient';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { 
  Users, 
  Building2, 
  Stethoscope, 
  Search, 
  Loader2,
  FileText,
  TrendingUp
} from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

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
  }, []);

  const loadDoctorsData = async () => {
    try {
      setLoading(true);

      const { data, error } = await supabase
        .rpc('get_doctors_insurance_summary');

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

  const filteredDoctors = doctors.filter((doctor) =>
    doctor.doctor_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    doctor.doctor_specialty?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    doctor.insurance_companies?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getTotalDoctors = () => doctors.length;
  const getTotalWithInsurance = () => doctors.filter(d => d.total_insurance_plans > 0).length;
  const getAveragePlans = () => {
    const total = doctors.reduce((sum, d) => sum + d.total_insurance_plans, 0);
    return doctors.length > 0 ? (total / doctors.length).toFixed(1) : '0';
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

  return (
    <DashboardLayout requiredRoles={['owner', 'secretary']}>
      <div className="p-8 space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold mb-2">Médicos e Convênios</h1>
          <p className="text-muted-foreground">
            Visualize todos os médicos e os convênios que cada um aceita
          </p>
        </div>

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
                <div className="p-3 bg-green-500/10 rounded-lg">
                  <Building2 className="w-6 h-6 text-green-500" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Com Convênios</p>
                  <p className="text-2xl font-bold">{getTotalWithInsurance()}</p>
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
                  <p className="text-sm text-muted-foreground">Média de Planos</p>
                  <p className="text-2xl font-bold">{getAveragePlans()}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search */}
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder="Buscar por médico, especialidade ou convênio..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>

        {/* Table */}
        <Card>
          <CardHeader>
            <CardTitle>Lista de Médicos</CardTitle>
            <CardDescription>
              Informações detalhadas sobre cada médico e seus convênios aceitos
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Médico</TableHead>
                    <TableHead>Especialidade</TableHead>
                    <TableHead className="text-center">Operadoras</TableHead>
                    <TableHead className="text-center">Planos</TableHead>
                    <TableHead>Convênios Aceitos</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredDoctors.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8">
                        <Users className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                        <p className="text-muted-foreground">
                          {searchTerm ? 'Nenhum médico encontrado' : 'Nenhum médico cadastrado'}
                        </p>
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredDoctors.map((doctor) => (
                      <TableRow key={doctor.doctor_id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{doctor.doctor_name || 'Sem nome'}</p>
                            <p className="text-sm text-muted-foreground">{doctor.doctor_email}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          {doctor.doctor_specialty ? (
                            <Badge variant="secondary">
                              {doctor.doctor_specialty}
                            </Badge>
                          ) : (
                            <span className="text-sm text-muted-foreground">Não informada</span>
                          )}
                        </TableCell>
                        <TableCell className="text-center">
                          <div className="flex justify-center">
                            <Badge className="bg-primary/10 text-primary hover:bg-primary/20">
                              {doctor.total_insurance_companies}
                            </Badge>
                          </div>
                        </TableCell>
                        <TableCell className="text-center">
                          <div className="flex justify-center">
                            <Badge className="bg-blue-500/10 text-blue-500 hover:bg-blue-500/20">
                              {doctor.total_insurance_plans}
                            </Badge>
                          </div>
                        </TableCell>
                        <TableCell>
                          {doctor.insurance_plans_list ? (
                            <div className="max-w-md">
                              <p className="text-sm text-muted-foreground line-clamp-2">
                                {doctor.insurance_plans_list}
                              </p>
                            </div>
                          ) : (
                            <span className="text-sm text-muted-foreground">Nenhum convênio</span>
                          )}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* Legend */}
        <Card className="bg-muted/50">
          <CardContent className="pt-6">
            <div className="flex items-start gap-2">
              <FileText className="w-5 h-5 text-muted-foreground mt-0.5" />
              <div>
                <p className="text-sm font-medium mb-1">Informações da Tabela</p>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• <strong>Operadoras:</strong> Número de operadoras distintas que o médico aceita</li>
                  <li>• <strong>Planos:</strong> Número total de planos aceitos pelo médico</li>
                  <li>• <strong>Convênios Aceitos:</strong> Lista completa de operadora + plano</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}

