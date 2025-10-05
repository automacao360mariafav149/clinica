import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  ReferenceLine
} from 'recharts';
import { ClinicalData } from '@/hooks/usePatientData';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ArrowUp, ArrowDown, Minus, TrendingUp } from 'lucide-react';

interface ClinicalEvolutionChartProps {
  clinicalData: ClinicalData[];
}

type TimeFilter = '1m' | '3m' | '6m' | '1y' | 'all';

export function ClinicalEvolutionChart({ clinicalData }: ClinicalEvolutionChartProps) {
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('6m');

  // Filtrar dados por período
  const filteredData = useMemo(() => {
    if (!clinicalData.length) return [];

    const now = new Date();
    const filterDate = (() => {
      switch (timeFilter) {
        case '1m':
          return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        case '3m':
          return new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        case '6m':
          return new Date(now.getTime() - 180 * 24 * 60 * 60 * 1000);
        case '1y':
          return new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
        default:
          return new Date(0);
      }
    })();

    return clinicalData
      .filter(d => new Date(d.measurement_date) >= filterDate)
      .sort((a, b) => 
        new Date(a.measurement_date).getTime() - new Date(b.measurement_date).getTime()
      )
      .map(d => ({
        ...d,
        date: format(new Date(d.measurement_date), 'dd/MM', { locale: ptBR }),
        fullDate: format(new Date(d.measurement_date), 'dd/MM/yyyy', { locale: ptBR }),
      }));
  }, [clinicalData, timeFilter]);

  // Calcular comparação com medição anterior
  const getComparison = (current: number | null, previous: number | null) => {
    if (!current || !previous) return null;
    const diff = current - previous;
    const percentage = ((diff / previous) * 100).toFixed(1);
    return { diff, percentage, trend: diff > 0 ? 'up' : diff < 0 ? 'down' : 'stable' };
  };

  // Últimas medições para tabela resumo
  const latestMeasurements = useMemo(() => {
    if (!clinicalData.length) return null;
    
    const latest = clinicalData[0];
    const previous = clinicalData[1];

    return {
      weight: {
        current: latest.weight_kg,
        comparison: getComparison(latest.weight_kg, previous?.weight_kg),
      },
      bmi: {
        current: latest.bmi,
        comparison: getComparison(latest.bmi, previous?.bmi),
      },
      bloodPressure: {
        current: latest.blood_pressure_systolic && latest.blood_pressure_diastolic
          ? `${latest.blood_pressure_systolic}/${latest.blood_pressure_diastolic}`
          : null,
        systolic: latest.blood_pressure_systolic,
        diastolic: latest.blood_pressure_diastolic,
      },
      heartRate: {
        current: latest.heart_rate,
        comparison: getComparison(latest.heart_rate, previous?.heart_rate),
      },
    };
  }, [clinicalData]);

  const ComparisonIcon = ({ trend }: { trend: 'up' | 'down' | 'stable' | undefined }) => {
    if (!trend) return null;
    if (trend === 'up') return <ArrowUp className="h-3 w-3 text-red-500" />;
    if (trend === 'down') return <ArrowDown className="h-3 w-3 text-green-500" />;
    return <Minus className="h-3 w-3 text-gray-500" />;
  };

  if (!clinicalData.length) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-muted-foreground">
          <TrendingUp className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>Nenhum dado clínico registrado ainda</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filtros de período */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Evolução Clínica</h3>
        <div className="flex gap-2">
          {[
            { value: '1m' as TimeFilter, label: '1 mês' },
            { value: '3m' as TimeFilter, label: '3 meses' },
            { value: '6m' as TimeFilter, label: '6 meses' },
            { value: '1y' as TimeFilter, label: '1 ano' },
            { value: 'all' as TimeFilter, label: 'Tudo' },
          ].map(filter => (
            <Button
              key={filter.value}
              variant={timeFilter === filter.value ? 'default' : 'outline'}
              size="sm"
              onClick={() => setTimeFilter(filter.value)}
            >
              {filter.label}
            </Button>
          ))}
        </div>
      </div>

      {/* Tabela de resumo das últimas medições */}
      {latestMeasurements && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Última Medição</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-xs text-muted-foreground">Peso</p>
                <div className="flex items-center gap-2 mt-1">
                  <p className="text-lg font-semibold">
                    {latestMeasurements.weight.current ? `${latestMeasurements.weight.current} kg` : 'N/A'}
                  </p>
                  {latestMeasurements.weight.comparison && (
                    <ComparisonIcon trend={latestMeasurements.weight.comparison.trend} />
                  )}
                </div>
              </div>

              <div>
                <p className="text-xs text-muted-foreground">IMC</p>
                <div className="flex items-center gap-2 mt-1">
                  <p className="text-lg font-semibold">
                    {latestMeasurements.bmi.current || 'N/A'}
                  </p>
                  {latestMeasurements.bmi.comparison && (
                    <ComparisonIcon trend={latestMeasurements.bmi.comparison.trend} />
                  )}
                </div>
              </div>

              <div>
                <p className="text-xs text-muted-foreground">Pressão Arterial</p>
                <p className="text-lg font-semibold mt-1">
                  {latestMeasurements.bloodPressure.current || 'N/A'}
                </p>
              </div>

              <div>
                <p className="text-xs text-muted-foreground">FC</p>
                <div className="flex items-center gap-2 mt-1">
                  <p className="text-lg font-semibold">
                    {latestMeasurements.heartRate.current ? `${latestMeasurements.heartRate.current} bpm` : 'N/A'}
                  </p>
                  {latestMeasurements.heartRate.comparison && (
                    <ComparisonIcon trend={latestMeasurements.heartRate.comparison.trend} />
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Gráficos */}
      <Tabs defaultValue="weight" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="weight">Peso</TabsTrigger>
          <TabsTrigger value="bmi">IMC</TabsTrigger>
          <TabsTrigger value="bp">Pressão</TabsTrigger>
          <TabsTrigger value="hr">FC</TabsTrigger>
        </TabsList>

        {/* Gráfico de Peso */}
        <TabsContent value="weight">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Evolução do Peso (kg)</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={filteredData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip 
                    labelFormatter={(value) => {
                      const item = filteredData.find(d => d.date === value);
                      return item?.fullDate || value;
                    }}
                  />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="weight_kg" 
                    stroke="#3b82f6" 
                    strokeWidth={2}
                    name="Peso (kg)"
                    dot={{ fill: '#3b82f6', r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Gráfico de IMC */}
        <TabsContent value="bmi">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Evolução do IMC</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={filteredData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis domain={[15, 40]} />
                  <Tooltip 
                    labelFormatter={(value) => {
                      const item = filteredData.find(d => d.date === value);
                      return item?.fullDate || value;
                    }}
                  />
                  <Legend />
                  <ReferenceLine y={18.5} stroke="#10b981" strokeDasharray="3 3" label="Abaixo do peso" />
                  <ReferenceLine y={25} stroke="#10b981" strokeDasharray="3 3" label="Peso normal" />
                  <ReferenceLine y={30} stroke="#f59e0b" strokeDasharray="3 3" label="Sobrepeso" />
                  <Line 
                    type="monotone" 
                    dataKey="bmi" 
                    stroke="#8b5cf6" 
                    strokeWidth={2}
                    name="IMC"
                    dot={{ fill: '#8b5cf6', r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Gráfico de Pressão Arterial */}
        <TabsContent value="bp">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Evolução da Pressão Arterial (mmHg)</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={filteredData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip 
                    labelFormatter={(value) => {
                      const item = filteredData.find(d => d.date === value);
                      return item?.fullDate || value;
                    }}
                  />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="blood_pressure_systolic" 
                    stroke="#ef4444" 
                    strokeWidth={2}
                    name="Sistólica"
                    dot={{ fill: '#ef4444', r: 4 }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="blood_pressure_diastolic" 
                    stroke="#3b82f6" 
                    strokeWidth={2}
                    name="Diastólica"
                    dot={{ fill: '#3b82f6', r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Gráfico de Frequência Cardíaca */}
        <TabsContent value="hr">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Evolução da Frequência Cardíaca (bpm)</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={filteredData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis domain={[40, 120]} />
                  <Tooltip 
                    labelFormatter={(value) => {
                      const item = filteredData.find(d => d.date === value);
                      return item?.fullDate || value;
                    }}
                  />
                  <Legend />
                  <ReferenceLine y={60} stroke="#10b981" strokeDasharray="3 3" label="Normal mín" />
                  <ReferenceLine y={100} stroke="#10b981" strokeDasharray="3 3" label="Normal máx" />
                  <Line 
                    type="monotone" 
                    dataKey="heart_rate" 
                    stroke="#ec4899" 
                    strokeWidth={2}
                    name="FC (bpm)"
                    dot={{ fill: '#ec4899', r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
