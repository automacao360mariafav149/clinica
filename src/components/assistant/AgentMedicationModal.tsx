import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2, Calculator, AlertCircle, CheckCircle, Info, Lightbulb, Pill, UserPlus, Link2 } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Checkbox } from '@/components/ui/checkbox';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { SendMedicationModal } from './SendMedicationModal';

interface AgentMedicationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface MedicationData {
  sucesso: boolean;
  medicamento: string;
  apresentacao: string;
  dose_calculada: string;
  dose_por_tomada: string;
  frequencia: string;
  via_administracao: string;
  duracao_tratamento_dias: number | null;
  dose_maxima_dia: string;
  modo_usar: string;
  ajustes_aplicados: string;
  alertas: string[];
  contraindicacoes: string[];
  categoria_risco_gestacao: string;
  observacoes: string;
}

interface Patient {
  id: string;
  name: string;
  phone: string;
}

export function AgentMedicationModal({ open, onOpenChange }: AgentMedicationModalProps) {
  const { user } = useAuth();
  const [medicamento, setMedicamento] = useState('');
  const [idade, setIdade] = useState('');
  const [peso, setPeso] = useState('');
  const [viaAdministracao, setViaAdministracao] = useState('');
  const [condicaoRenal, setCondicaoRenal] = useState(false);
  const [condicaoHepatica, setCondicaoHepatica] = useState(false);
  const [gestante, setGestante] = useState(false);
  const [lactante, setLactante] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resultado, setResultado] = useState<MedicationData | null>(null);
  
  // Estados para vinculação com paciente
  const [patients, setPatients] = useState<Patient[]>([]);
  const [selectedPatientId, setSelectedPatientId] = useState('');
  const [showPatientSelect, setShowPatientSelect] = useState(false);
  const [savingToPatient, setSavingToPatient] = useState(false);
  
  // Estados para modal de envio
  const [showSendModal, setShowSendModal] = useState(false);
  const [selectedPatientData, setSelectedPatientData] = useState<{
    name: string;
    phone: string;
  } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!medicamento.trim()) {
      setError('Por favor, insira o nome do medicamento');
      return;
    }

    if (!idade.trim()) {
      setError('Por favor, insira a idade do paciente');
      return;
    }

    if (!peso.trim()) {
      setError('Por favor, insira o peso do paciente');
      return;
    }

    if (!viaAdministracao) {
      setError('Por favor, selecione a via de administração');
      return;
    }

    setLoading(true);
    setError(null);
    setResultado(null);

    try {
      // Construir array de condições especiais
      const condicoesEspeciais: string[] = [];
      if (condicaoRenal) condicoesEspeciais.push('problema_renal');
      if (condicaoHepatica) condicoesEspeciais.push('problema_hepatico');
      if (gestante) condicoesEspeciais.push('gestante');
      if (lactante) condicoesEspeciais.push('lactante');

      const response = await fetch('https://webhook.n8nlabz.com.br/webhook/agent-calc-medicacao', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          medicamento: medicamento.trim(),
          idade: parseInt(idade),
          peso: parseFloat(peso),
          via_administracao: viaAdministracao,
          condicoes_especiais: condicoesEspeciais,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Erro HTTP:', response.status, errorText);
        throw new Error(`Erro na requisição: ${response.status} ${response.statusText}`);
      }

      const rawData = await response.json();
      console.log('Resposta bruta da API:', rawData);
      
      // A API pode retornar em diferentes formatos:
      // Formato 1: { output: "{\"sucesso\": true, ...}" } - Objeto com campo output (string JSON)
      // Formato 2: [{ output: "{\"sucesso\": true, ...}" }] - Array com objeto output (string JSON)
      // Formato 3: { sucesso: true, ... } - Objeto direto
      let medicationData: MedicationData;
      
      try {
        // Verificar se tem campo output (objeto ou array)
        const dataWithOutput = Array.isArray(rawData) ? rawData[0] : rawData;
        
        if (dataWithOutput && dataWithOutput.output && typeof dataWithOutput.output === 'string') {
          // Parsear o campo output que vem como string JSON
          console.log('Parseando campo output (string JSON)...');
          medicationData = JSON.parse(dataWithOutput.output);
          console.log('Dados parseados com sucesso:', medicationData);
        } else if (rawData.sucesso !== undefined) {
          // Se já vier no formato esperado (sem output)
          console.log('Resposta já no formato de objeto direto');
          medicationData = rawData;
        } else if (Array.isArray(rawData) && rawData[0]?.sucesso !== undefined) {
          // Se vier como array de objetos diretos
          console.log('Resposta como array de objetos');
          medicationData = rawData[0];
        } else {
          console.error('Formato de resposta não reconhecido:', rawData);
          throw new Error('Formato de resposta da API não reconhecido. Verifique o console para mais detalhes.');
        }
      } catch (parseError) {
        console.error('Erro ao processar resposta:', parseError, 'Dados brutos:', rawData);
        throw new Error('Erro ao processar resposta do servidor. Verifique o console para detalhes.');
      }
      
      // Verificar se o cálculo foi bem-sucedido
      if (medicationData.sucesso === false) {
        const errorMessage = medicationData.observacoes || 'Não foi possível calcular a dosagem para este medicamento';
        console.error('API retornou sucesso=false:', errorMessage);
        throw new Error(errorMessage);
      }
      
      // Validar campos obrigatórios
      if (!medicationData.medicamento || !medicationData.dose_calculada) {
        console.error('Resposta da API está incompleta:', medicationData);
        throw new Error('A resposta da API está incompleta. Faltam campos obrigatórios.');
      }
      
      console.log('✅ Dados validados e prontos para exibição:', medicationData);
      setResultado(medicationData);
    } catch (err) {
      console.error('Erro ao calcular medicação:', err);
      
      // Extrair mensagem de erro mais detalhada
      let errorMessage = 'Erro ao calcular dosagem de medicação. Tente novamente.';
      
      if (err instanceof Error) {
        errorMessage = err.message;
      } else if (typeof err === 'string') {
        errorMessage = err;
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setMedicamento('');
    setIdade('');
    setPeso('');
    setViaAdministracao('');
    setCondicaoRenal(false);
    setCondicaoHepatica(false);
    setGestante(false);
    setLactante(false);
    setError(null);
    setResultado(null);
    setShowPatientSelect(false);
    setSelectedPatientId('');
    onOpenChange(false);
  };

  const handleNovoBusca = () => {
    setMedicamento('');
    setIdade('');
    setPeso('');
    setViaAdministracao('');
    setCondicaoRenal(false);
    setCondicaoHepatica(false);
    setGestante(false);
    setLactante(false);
    setError(null);
    setResultado(null);
    setShowPatientSelect(false);
    setSelectedPatientId('');
  };

  // Carregar lista de pacientes
  useEffect(() => {
    const loadPatients = async () => {
      if (!open) return;

      try {
        console.log('Carregando pacientes...');
        const { data, error } = await supabase
          .from('patients')
          .select('id, name, phone')
          .order('name');

        if (error) {
          console.error('Erro do Supabase ao carregar pacientes:', error);
          toast.error(`Erro ao carregar pacientes: ${error.message}`);
          throw error;
        }

        console.log(`✅ ${data?.length || 0} paciente(s) carregado(s):`, data);
        setPatients(data || []);

        if (!data || data.length === 0) {
          console.warn('⚠️ Nenhum paciente encontrado no banco de dados');
          toast.info('Nenhum paciente cadastrado. Cadastre um paciente primeiro.');
        }
      } catch (err) {
        console.error('Erro ao carregar pacientes:', err);
      }
    };

    loadPatients();
  }, [open]);

  // Função para vincular cálculo ao paciente
  const handleVincularPaciente = async () => {
    if (!selectedPatientId) {
      toast.error('Selecione um paciente');
      return;
    }

    if (!resultado || !user) {
      toast.error('Dados incompletos');
      return;
    }

    setSavingToPatient(true);

    try {
      // Construir array de condições especiais usadas no cálculo
      const condicoesEspeciais: string[] = [];
      if (condicaoRenal) condicoesEspeciais.push('problema_renal');
      if (condicaoHepatica) condicoesEspeciais.push('problema_hepatico');
      if (gestante) condicoesEspeciais.push('gestante');
      if (lactante) condicoesEspeciais.push('lactante');

      // Salvar a consulta do agente
      const { error: insertError } = await supabase
        .from('agent_consultations')
        .insert({
          patient_id: selectedPatientId,
          doctor_id: user.id,
          agent_type: 'medication',
          consultation_input: {
            medicamento,
            idade: parseInt(idade),
            peso: parseFloat(peso),
            via_administracao: viaAdministracao,
            condicoes_especiais: condicoesEspeciais,
          },
          consultation_output: resultado,
          // Campos específicos para medicação
          medication_name: resultado.medicamento,
          medication_dosage: resultado.dose_calculada,
          medication_frequency: resultado.frequencia,
        });

      if (insertError) {
        console.error('Erro ao inserir consulta:', insertError);
        throw insertError;
      }

      toast.success('Cálculo de medicação vinculado ao paciente com sucesso!');
      
      // Buscar dados do paciente para envio
      const patient = patients.find(p => p.id === selectedPatientId);
      if (patient) {
        setSelectedPatientData({
          name: patient.name,
          phone: patient.phone || '',
        });
        setShowSendModal(true);
      }
      
      setShowPatientSelect(false);
      setSelectedPatientId('');
    } catch (err) {
      console.error('Erro ao vincular cálculo:', err);
      toast.error('Erro ao vincular cálculo ao paciente');
    } finally {
      setSavingToPatient(false);
    }
  };

  return (
    <>
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className={`max-w-4xl max-h-[90vh] flex flex-col gap-0 p-0 transition-all duration-300 ${resultado ? 'h-[90vh]' : 'h-auto'}`}>
        <DialogHeader className="flex-shrink-0 px-6 pt-6 pb-4 border-b">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-border/50">
              <Calculator className="w-6 h-6 text-purple-500" />
            </div>
            <div>
              <DialogTitle>Agent de Cálculo de Medicação</DialogTitle>
              <DialogDescription>
                Cálculo preciso de dosagens e posologias medicamentosas
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col min-h-0 flex-1">
          {/* Área com Scroll quando necessário */}
          <div className={`overflow-y-auto overflow-x-hidden px-6 py-4 space-y-6 ${resultado ? 'flex-1' : ''}`}>
            {/* Campo de Medicamento */}
            <div className="space-y-2">
              <Label htmlFor="medicamento">Medicamento *</Label>
              <Input
                id="medicamento"
                type="text"
                placeholder="Ex: Dipirona, Amoxicilina, Paracetamol..."
                value={medicamento}
                onChange={(e) => setMedicamento(e.target.value)}
                disabled={loading}
                className="w-full"
              />
              <p className="text-xs text-muted-foreground">
                Digite o nome do medicamento para calcular a dosagem apropriada
              </p>
            </div>

            {/* Campos de Idade e Peso */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="idade">Idade do Paciente (anos) *</Label>
                <Input
                  id="idade"
                  type="number"
                  min="0"
                  max="150"
                  placeholder="Ex: 35"
                  value={idade}
                  onChange={(e) => setIdade(e.target.value)}
                  disabled={loading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="peso">Peso do Paciente (kg) *</Label>
                <Input
                  id="peso"
                  type="number"
                  min="0"
                  step="0.1"
                  placeholder="Ex: 70.5"
                  value={peso}
                  onChange={(e) => setPeso(e.target.value)}
                  disabled={loading}
                />
              </div>
            </div>

            {/* Via de Administração */}
            <div className="space-y-2">
              <Label htmlFor="via">Via de Administração *</Label>
              <Select value={viaAdministracao} onValueChange={setViaAdministracao} disabled={loading}>
                <SelectTrigger id="via">
                  <SelectValue placeholder="Selecione a via de administração" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="oral">Oral</SelectItem>
                  <SelectItem value="injetavel_iv">Injetável - Intravenoso (IV)</SelectItem>
                  <SelectItem value="injetavel_im">Injetável - Intramuscular (IM)</SelectItem>
                  <SelectItem value="injetavel_sc">Injetável - Subcutâneo (SC)</SelectItem>
                  <SelectItem value="topico">Tópico</SelectItem>
                  <SelectItem value="inalatoria">Inalatória</SelectItem>
                  <SelectItem value="sublingual">Sublingual</SelectItem>
                  <SelectItem value="retal">Retal</SelectItem>
                  <SelectItem value="outro">Outro</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Condições Especiais */}
            <div className="space-y-3">
              <Label className="text-base">Condições Especiais</Label>
              <div className="space-y-3 p-4 rounded-lg border bg-muted/30">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="renal"
                    checked={condicaoRenal}
                    onCheckedChange={(checked) => setCondicaoRenal(checked as boolean)}
                    disabled={loading}
                  />
                  <label
                    htmlFor="renal"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                  >
                    Problema Renal (Insuficiência Renal)
                  </label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="hepatico"
                    checked={condicaoHepatica}
                    onCheckedChange={(checked) => setCondicaoHepatica(checked as boolean)}
                    disabled={loading}
                  />
                  <label
                    htmlFor="hepatico"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                  >
                    Problema Hepático (Insuficiência Hepática)
                  </label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="gestante"
                    checked={gestante}
                    onCheckedChange={(checked) => setGestante(checked as boolean)}
                    disabled={loading}
                  />
                  <label
                    htmlFor="gestante"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                  >
                    Gestante
                  </label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="lactante"
                    checked={lactante}
                    onCheckedChange={(checked) => setLactante(checked as boolean)}
                    disabled={loading}
                  />
                  <label
                    htmlFor="lactante"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                  >
                    Lactante
                  </label>
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                Marque as condições especiais que se aplicam ao paciente
              </p>
            </div>

            {/* Mensagem de Erro */}
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {/* Resultado */}
            {resultado && (
              <div className="rounded-lg border bg-gradient-to-br from-purple-500/5 to-pink-500/5 p-6 space-y-4 mb-4">
                {/* Cabeçalho do Resultado */}
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <CheckCircle className="w-5 h-5 text-green-500" />
                      <h4 className="font-bold text-lg">Dosagem Calculada</h4>
                    </div>
                    <div className="flex items-center gap-2 mb-2">
                      <Pill className="w-5 h-5 text-purple-500" />
                      <span className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                        {resultado.medicamento}
                      </span>
                    </div>
                    <Badge variant="secondary" className="text-xs">
                      {resultado.apresentacao}
                    </Badge>
                  </div>
                </div>

                <Separator />

                {/* Dosagem Calculada - Destaque Principal */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Calculator className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm font-semibold text-muted-foreground">
                      Dose Calculada
                    </span>
                  </div>
                  <div className="p-4 rounded-lg bg-purple-500/10 border border-purple-500/20">
                    <p className="text-lg font-bold text-purple-700 dark:text-purple-300">
                      {resultado.dose_calculada}
                    </p>
                  </div>
                </div>

                <Separator />

                {/* Posologia Simplificada */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Pill className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm font-semibold text-muted-foreground">
                        Dose por Tomada
                      </span>
                    </div>
                    <p className="text-sm font-medium">{resultado.dose_por_tomada}</p>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Info className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm font-semibold text-muted-foreground">
                        Frequência
                      </span>
                    </div>
                    <p className="text-sm font-medium">{resultado.frequencia}</p>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Info className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm font-semibold text-muted-foreground">
                        Via de Administração
                      </span>
                    </div>
                    <Badge variant="outline" className="text-sm">
                      {resultado.via_administracao}
                    </Badge>
                  </div>

                  {resultado.duracao_tratamento_dias && (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Info className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm font-semibold text-muted-foreground">
                          Duração do Tratamento
                        </span>
                      </div>
                      <p className="text-sm font-medium">{resultado.duracao_tratamento_dias} dias</p>
                    </div>
                  )}
                </div>

                <Separator />

                {/* Dose Máxima */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-orange-500" />
                    <span className="text-sm font-semibold text-muted-foreground">
                      Dose Máxima por Dia
                    </span>
                  </div>
                  <div className="p-3 rounded-lg bg-orange-500/10 border border-orange-500/20">
                    <p className="text-sm font-bold text-orange-700 dark:text-orange-300">
                      {resultado.dose_maxima_dia}
                    </p>
                  </div>
                </div>

                <Separator />

                {/* Modo de Usar */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Info className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm font-semibold text-muted-foreground">
                      Modo de Usar
                    </span>
                  </div>
                  <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
                    <p className="text-sm leading-relaxed">
                      {resultado.modo_usar}
                    </p>
                  </div>
                </div>

                <Separator />

                {/* Ajustes Aplicados */}
                {resultado.ajustes_aplicados && (
                  <>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Lightbulb className="w-4 h-4 text-purple-500" />
                        <span className="text-sm font-semibold text-muted-foreground">
                          Ajustes Aplicados
                        </span>
                      </div>
                      <div className="p-3 rounded-lg bg-purple-500/10 border border-purple-500/20">
                        <p className="text-sm leading-relaxed italic">
                          {resultado.ajustes_aplicados}
                        </p>
                      </div>
                    </div>
                    <Separator />
                  </>
                )}

                {/* Alertas Importantes */}
                {resultado.alertas && resultado.alertas.length > 0 && (
                  <>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <AlertCircle className="w-4 h-4 text-red-500" />
                        <span className="text-sm font-semibold text-muted-foreground">
                          Alertas Importantes
                        </span>
                      </div>
                      <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/20 space-y-2">
                        {resultado.alertas.map((alerta, index) => (
                          <div key={index} className="flex items-start gap-2">
                            <AlertCircle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
                            <p className="text-sm leading-relaxed text-red-700 dark:text-red-400">
                              {alerta}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                    <Separator />
                  </>
                )}

                {/* Contraindicações */}
                {resultado.contraindicacoes && resultado.contraindicacoes.length > 0 && (
                  <>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <AlertCircle className="w-4 h-4 text-red-600" />
                        <span className="text-sm font-semibold text-muted-foreground">
                          Contraindicações
                        </span>
                      </div>
                      <div className="p-4 rounded-lg bg-red-600/10 border border-red-600/20 space-y-2">
                        {resultado.contraindicacoes.map((contraindicacao, index) => (
                          <div key={index} className="flex items-start gap-2">
                            <span className="text-red-600 font-bold text-xs mt-0.5 flex-shrink-0">⚠</span>
                            <p className="text-sm leading-relaxed text-red-800 dark:text-red-300">
                              {contraindicacao}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                    <Separator />
                  </>
                )}

                {/* Categoria de Risco na Gestação */}
                {resultado.categoria_risco_gestacao && (
                  <>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Info className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm font-semibold text-muted-foreground">
                          Categoria de Risco na Gestação
                        </span>
                      </div>
                      <Badge 
                        variant={
                          resultado.categoria_risco_gestacao === 'A' ? 'default' : 
                          resultado.categoria_risco_gestacao === 'B' ? 'secondary' : 
                          'destructive'
                        }
                        className="text-sm px-3 py-1"
                      >
                        Categoria {resultado.categoria_risco_gestacao}
                      </Badge>
                    </div>
                    <Separator />
                  </>
                )}

                {/* Observações Clínicas */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Info className="w-4 h-4 text-amber-500" />
                    <span className="text-sm font-semibold text-muted-foreground">
                      Observações Clínicas
                    </span>
                  </div>
                  <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
                    <p className="text-sm leading-relaxed">
                      {resultado.observacoes}
                    </p>
                  </div>
                </div>

                {/* Seção de Vincular a Paciente */}
                <Separator />
                
                {!showPatientSelect ? (
                  <div className="flex justify-center">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setShowPatientSelect(true)}
                      className="gap-2"
                    >
                      <UserPlus className="w-4 h-4" />
                      Vincular a um Paciente
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4 p-4 rounded-lg bg-muted/50 border">
                    <div className="flex items-center gap-2 mb-2">
                      <Link2 className="w-4 h-4 text-primary" />
                      <h5 className="font-semibold text-sm">Vincular ao Prontuário</h5>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="patient-select">Selecione o Paciente</Label>
                      <Select 
                        value={selectedPatientId} 
                        onValueChange={setSelectedPatientId}
                        disabled={savingToPatient}
                      >
                        <SelectTrigger id="patient-select">
                          <SelectValue placeholder="Escolha um paciente..." />
                        </SelectTrigger>
                        <SelectContent>
                          {patients.length === 0 ? (
                            <div className="p-2 text-sm text-muted-foreground text-center">
                              Nenhum paciente cadastrado
                            </div>
                          ) : (
                            patients.map((patient) => (
                              <SelectItem key={patient.id} value={patient.id}>
                                {patient.name}
                              </SelectItem>
                            ))
                          )}
                        </SelectContent>
                      </Select>
                      <p className="text-xs text-muted-foreground">
                        Este cálculo de medicação será salvo no prontuário do paciente selecionado
                      </p>
                    </div>

                    <div className="flex gap-2 justify-end">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setShowPatientSelect(false);
                          setSelectedPatientId('');
                        }}
                        disabled={savingToPatient}
                      >
                        Cancelar
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        onClick={handleVincularPaciente}
                        disabled={!selectedPatientId || savingToPatient}
                      >
                        {savingToPatient ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Salvando...
                          </>
                        ) : (
                          <>
                            <Link2 className="w-4 h-4 mr-2" />
                            Confirmar Vinculação
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Botões de Ação */}
          <div className="flex gap-3 justify-end px-6 py-4 border-t bg-background flex-shrink-0">
            {resultado ? (
              <>
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleClose}
                >
                  Fechar
                </Button>
                <Button
                  type="button"
                  onClick={handleNovoBusca}
                >
                  <Calculator className="w-4 h-4 mr-2" />
                  Novo Cálculo
                </Button>
              </>
            ) : (
              <>
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleClose}
                  disabled={loading}
                >
                  Cancelar
                </Button>
                <Button type="submit" disabled={loading}>
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Calculando...
                    </>
                  ) : (
                    <>
                      <Calculator className="w-4 h-4 mr-2" />
                      Calcular Dosagem
                    </>
                  )}
                </Button>
              </>
            )}
          </div>
        </form>
      </DialogContent>
    </Dialog>

    {/* Modal de envio para o paciente */}
    {resultado && selectedPatientData && (
      <SendMedicationModal
        open={showSendModal}
        onOpenChange={setShowSendModal}
        patientName={selectedPatientData.name}
        patientPhone={selectedPatientData.phone}
        medicationName={resultado.medicamento}
        defaultMessage={resultado.modo_usar}
      />
    )}
  </>
  );
}

