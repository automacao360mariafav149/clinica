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
import { Loader2, FileSearch, AlertCircle, CheckCircle, Info, Lightbulb, UserPlus, Link2 } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface AgentCIDModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface CIDData {
  codigo_cid: string;
  descricao: string;
  categoria: string;
  confianca: string;
  observacoes: string;
  processo_pensamento: string;
}

interface CIDResponse {
  output: string;
}

interface Patient {
  id: string;
  name: string;
}

export function AgentCIDModal({ open, onOpenChange }: AgentCIDModalProps) {
  const { user } = useAuth();
  const [termo, setTermo] = useState('');
  const [idade, setIdade] = useState('');
  const [sexo, setSexo] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resultado, setResultado] = useState<CIDData | null>(null);
  
  // Estados para vinculação com paciente
  const [patients, setPatients] = useState<Patient[]>([]);
  const [selectedPatientId, setSelectedPatientId] = useState('');
  const [showPatientSelect, setShowPatientSelect] = useState(false);
  const [savingToPatient, setSavingToPatient] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!termo.trim()) {
      setError('Por favor, insira um termo para buscar');
      return;
    }

    if (!idade.trim()) {
      setError('Por favor, insira a idade do paciente');
      return;
    }

    if (!sexo) {
      setError('Por favor, selecione o sexo do paciente');
      return;
    }

    setLoading(true);
    setError(null);
    setResultado(null);

    try {
      const response = await fetch('https://webhook.n8nlabz.com.br/webhook/agent-cid', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          termo: termo.trim(),
          idade: parseInt(idade),
          sexo: sexo,
        }),
      });

      if (!response.ok) {
        throw new Error(`Erro na requisição: ${response.status} ${response.statusText}`);
      }

      const data: CIDResponse = await response.json();
      
      // Parsear o campo output que vem como string JSON
      try {
        const cidData: CIDData = JSON.parse(data.output);
        setResultado(cidData);
      } catch (parseError) {
        throw new Error('Erro ao processar resposta do servidor');
      }
    } catch (err) {
      console.error('Erro ao buscar CID:', err);
      setError(
        err instanceof Error 
          ? err.message 
          : 'Erro ao buscar informações do CID. Tente novamente.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setTermo('');
    setIdade('');
    setSexo('');
    setError(null);
    setResultado(null);
    onOpenChange(false);
  };

  const handleNovaBusca = () => {
    setTermo('');
    setIdade('');
    setSexo('');
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
        const { data, error } = await supabase
          .from('patients')
          .select('id, name')
          .order('name');

        if (error) throw error;
        setPatients(data || []);
      } catch (err) {
        console.error('Erro ao carregar pacientes:', err);
      }
    };

    loadPatients();
  }, [open]);

  // Função para vincular consulta ao paciente
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
      // user.id já é o profiles.id, conforme definido no AuthContext
      // Salvar a consulta do agente
      const { error: insertError } = await supabase
        .from('agent_consultations')
        .insert({
          patient_id: selectedPatientId,
          doctor_id: user.id, // user.id já é o profiles.id
          agent_type: 'cid',
          consultation_input: {
            termo,
            idade: parseInt(idade),
            sexo,
          },
          consultation_output: resultado,
          cid_code: resultado.codigo_cid,
          cid_description: resultado.descricao,
          confidence_level: resultado.confianca,
        });

      if (insertError) {
        console.error('Erro ao inserir consulta:', insertError);
        throw insertError;
      }

      toast.success('Consulta vinculada ao paciente com sucesso!');
      setShowPatientSelect(false);
      setSelectedPatientId('');
    } catch (err) {
      console.error('Erro ao vincular consulta:', err);
      toast.error('Erro ao vincular consulta ao paciente');
    } finally {
      setSavingToPatient(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[95vh] flex flex-col gap-0 p-0">
        <DialogHeader className="flex-shrink-0 px-6 pt-6 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500/20 to-cyan-500/20 border border-border/50">
              <FileSearch className="w-6 h-6 text-blue-500" />
            </div>
            <div>
              <DialogTitle>Agent CID</DialogTitle>
              <DialogDescription>
                Consulta de códigos CID-10 e CID-11 para diagnósticos
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col">
          {/* Área com Scroll quando necessário */}
          <div className="overflow-y-auto px-6 py-4 space-y-6">
            {/* Campo de Termo */}
            <div className="space-y-2">
              <Label htmlFor="termo">Termo de Busca *</Label>
              <Input
                id="termo"
                type="text"
                placeholder="Ex: febre, cefaleia, hipertensão..."
                value={termo}
                onChange={(e) => setTermo(e.target.value)}
                disabled={loading}
                className="w-full"
              />
              <p className="text-xs text-muted-foreground">
                Digite o sintoma, doença ou condição para buscar o CID correspondente
              </p>
            </div>

            {/* Campos de Idade e Sexo */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="idade">Idade do Paciente *</Label>
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
                <Label htmlFor="sexo">Sexo *</Label>
                <Select value={sexo} onValueChange={setSexo} disabled={loading}>
                  <SelectTrigger id="sexo">
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="masculino">Masculino</SelectItem>
                    <SelectItem value="feminino">Feminino</SelectItem>
                    <SelectItem value="outro">Outro</SelectItem>
                  </SelectContent>
                </Select>
              </div>
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
              <div className="rounded-lg border bg-gradient-to-br from-blue-500/5 to-cyan-500/5 p-6 space-y-4 mb-4">
                {/* Cabeçalho do Resultado */}
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <CheckCircle className="w-5 h-5 text-green-500" />
                      <h4 className="font-bold text-lg">CID Encontrado</h4>
                    </div>
                    <div className="flex items-baseline gap-3 flex-wrap">
                      <span className="text-4xl font-bold text-blue-600 dark:text-blue-400">
                        {resultado.codigo_cid}
                      </span>
                      <Badge 
                        variant={
                          resultado.confianca === 'ALTA' ? 'default' : 
                          resultado.confianca === 'MÉDIA' ? 'secondary' : 
                          'outline'
                        }
                        className="text-sm px-3 py-1"
                      >
                        Confiança: {resultado.confianca}
                      </Badge>
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Descrição */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <FileSearch className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm font-semibold text-muted-foreground">
                      Descrição
                    </span>
                  </div>
                  <p className="text-base font-medium leading-relaxed">
                    {resultado.descricao}
                  </p>
                </div>

                <Separator />

                {/* Categoria */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Info className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm font-semibold text-muted-foreground">
                      Categoria
                    </span>
                  </div>
                  <p className="text-sm leading-relaxed text-muted-foreground">
                    {resultado.categoria}
                  </p>
                </div>

                <Separator />

                {/* Observações */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-amber-500" />
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

                <Separator />

                {/* Processo de Pensamento */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Lightbulb className="w-4 h-4 text-purple-500" />
                    <span className="text-sm font-semibold text-muted-foreground">
                      Processo de Análise
                    </span>
                  </div>
                  <div className="p-3 rounded-lg bg-purple-500/10 border border-purple-500/20">
                    <p className="text-sm leading-relaxed italic">
                      {resultado.processo_pensamento}
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
                        Esta consulta será salva no prontuário do paciente selecionado
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
                  onClick={handleNovaBusca}
                >
                  <FileSearch className="w-4 h-4 mr-2" />
                  Nova Busca
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
                      Buscando...
                    </>
                  ) : (
                    <>
                      <FileSearch className="w-4 h-4 mr-2" />
                      Buscar CID
                    </>
                  )}
                </Button>
              </>
            )}
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
