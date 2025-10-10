import { useMemo, useState, useRef } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Badge } from '@/components/ui/badge';
import { FileText, Loader2, AlertTriangle, CheckCircle2, Clock, TrendingUp, MessageSquare, Bot, User as UserIcon, AlertCircle, Download } from 'lucide-react';
import { toast } from 'sonner';
import { getApiBaseUrl } from '@/lib/apiConfig';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Progress } from '@/components/ui/progress';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

type SummaryPeriod = 'dia_atual' | 'ultimos_7_dias' | 'ultimos_15_dias' | 'ultimos_30_dias';

interface SummaryModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sessionId: string | null;
  patientPhone: string | null;
}

export function SummaryModal({ open, onOpenChange, sessionId, patientPhone }: SummaryModalProps) {
  const [period, setPeriod] = useState<SummaryPeriod>('dia_atual');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [parsed, setParsed] = useState<any | null>(null);
  const [downloading, setDownloading] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);

  const handleClose = () => {
    if (loading) return;
    setError(null);
    setPeriod('dia_atual');
    setParsed(null);
    onOpenChange(false);
  };

  const handleGenerate = async () => {
    if (!sessionId) {
      setError('Nenhuma conversa selecionada.');
      return;
    }
    if (!patientPhone || patientPhone.trim() === '') {
      setError('Paciente sem telefone cadastrado.');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const baseUrl = await getApiBaseUrl();
      const res = await fetch(`${baseUrl}/gerar-resumo`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id: sessionId,
          numero_paciente: patientPhone,
          periodo: period,
        }),
      });
      if (!res.ok) throw new Error(`Erro ao gerar resumo: ${res.status}`);
      const data = await res.json();
      const first = Array.isArray(data) ? data[0] : data;
      const output = first?.output ?? first;
      let parsedObj: any = null;
      if (typeof output === 'string') {
        try { parsedObj = JSON.parse(output); } catch { parsedObj = { raw: output }; }
      } else {
        parsedObj = output;
      }
      setParsed(parsedObj);
      toast.success('Resumo gerado com sucesso!');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao gerar resumo';
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPDF = async () => {
    if (!contentRef.current || !parsed) return;
    
    setDownloading(true);
    try {
      const element = contentRef.current;
      
      // Criar estilo temporário para modo PDF
      const styleElement = document.createElement('style');
      styleElement.id = 'pdf-print-styles';
      styleElement.textContent = `
        .pdf-mode * {
          color: #000000 !important;
          background-color: #ffffff !important;
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
        }
        .pdf-mode .text-muted-foreground {
          color: #374151 !important;
          font-weight: 500 !important;
        }
        .pdf-mode .text-xs,
        .pdf-mode .text-sm {
          color: #1f2937 !important;
          font-weight: 500 !important;
        }
        .pdf-mode .text-lg,
        .pdf-mode .text-xl,
        .pdf-mode .text-2xl,
        .pdf-mode .text-3xl,
        .pdf-mode .text-4xl,
        .pdf-mode .text-5xl,
        .pdf-mode .font-bold,
        .pdf-mode .font-semibold {
          color: #000000 !important;
          font-weight: 700 !important;
        }
        .pdf-mode h3,
        .pdf-mode h2,
        .pdf-mode h1 {
          color: #000000 !important;
          font-weight: 700 !important;
        }
        .pdf-mode .text-primary,
        .pdf-mode .text-blue-600,
        .pdf-mode .text-blue-500,
        .pdf-mode .text-purple-600 {
          color: #1e40af !important;
          font-weight: 600 !important;
        }
        .pdf-mode .text-green-500,
        .pdf-mode .text-green-600,
        .pdf-mode .text-emerald-500 {
          color: #15803d !important;
          font-weight: 600 !important;
        }
        .pdf-mode .text-amber-500,
        .pdf-mode .text-amber-600,
        .pdf-mode .text-orange-500 {
          color: #b45309 !important;
          font-weight: 600 !important;
        }
        .pdf-mode .text-red-500,
        .pdf-mode .text-destructive {
          color: #b91c1c !important;
          font-weight: 600 !important;
        }
        .pdf-mode .bg-gradient-to-br,
        .pdf-mode .bg-gradient-to-r,
        .pdf-mode [class*="bg-gradient"] {
          background: #e5e7eb !important;
        }
        .pdf-mode .border,
        .pdf-mode .border-2,
        .pdf-mode [class*="border-"] {
          border-color: #6b7280 !important;
          border-width: 2px !important;
        }
        .pdf-mode .bg-muted,
        .pdf-mode .bg-card,
        .pdf-mode .bg-accent {
          background-color: #f3f4f6 !important;
        }
        .pdf-mode svg {
          opacity: 1 !important;
        }
        .pdf-mode .rounded-xl,
        .pdf-mode .rounded-2xl {
          box-shadow: 0 1px 3px rgba(0,0,0,0.1) !important;
        }
      `;
      document.head.appendChild(styleElement);
      
      // Adicionar classe PDF ao elemento
      element.classList.add('pdf-mode');
      
      // Aguardar um frame para estilos aplicarem
      await new Promise(resolve => requestAnimationFrame(resolve));
      
      const canvas = await html2canvas(element, {
        scale: 4,
        useCORS: true,
        allowTaint: true,
        logging: false,
        backgroundColor: '#ffffff',
        windowWidth: element.scrollWidth,
        windowHeight: element.scrollHeight,
        imageTimeout: 0,
        removeContainer: true,
        foreignObjectRendering: false,
        onclone: (clonedDoc) => {
          const clonedElement = clonedDoc.getElementById(element.id) || clonedDoc.querySelector('.pdf-mode');
          if (clonedElement) {
            clonedElement.style.backgroundColor = '#ffffff';
            clonedElement.style.color = '#000000';
            // Forçar todos os textos para preto
            const allTexts = clonedElement.querySelectorAll('*');
            allTexts.forEach((el: any) => {
              if (el.style) {
                el.style.color = '#000000';
                if (el.classList.contains('text-lg') || el.classList.contains('font-bold')) {
                  el.style.fontWeight = '700';
                }
              }
            });
          }
        }
      });
      
      // Remover classe e estilo temporário
      element.classList.remove('pdf-mode');
      document.head.removeChild(styleElement);
      
      const imgData = canvas.toDataURL('image/png', 1.0);
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
        compress: true
      });
      
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 10;
      const imgWidth = pageWidth - (2 * margin);
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      
      let heightLeft = imgHeight;
      let position = margin;
      
      // Primeira página
      pdf.addImage(imgData, 'PNG', margin, position, imgWidth, imgHeight, undefined, 'FAST');
      heightLeft -= (pageHeight - 2 * margin);
      
      // Páginas adicionais se necessário
      while (heightLeft > 0) {
        position = -(imgHeight - heightLeft) + margin;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', margin, position, imgWidth, imgHeight, undefined, 'FAST');
        heightLeft -= (pageHeight - 2 * margin);
      }
      
      const fileName = `resumo-conversa-${new Date().toISOString().split('T')[0]}.pdf`;
      pdf.save(fileName);
      toast.success('PDF baixado com sucesso!');
    } catch (err) {
      console.error('Erro ao gerar PDF:', err);
      toast.error('Erro ao gerar PDF. Tente novamente.');
      // Garantir limpeza em caso de erro
      const styleElement = document.getElementById('pdf-print-styles');
      if (styleElement) document.head.removeChild(styleElement);
      if (contentRef.current) contentRef.current.classList.remove('pdf-mode');
    } finally {
      setDownloading(false);
    }
  };

  const resumo = useMemo(() => parsed?.resumo_conversa as string | undefined, [parsed]);
  const nota = useMemo(() => Number(parsed?.nota_atendimento ?? 0), [parsed]);
  const metricas = parsed?.metricas as any | undefined;
  const qualidade = parsed?.qualidade as any | undefined;
  const flags = parsed?.flags as any | undefined;

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'aberto': return 'bg-amber-500/10 text-amber-600 border-amber-500/30';
      case 'fechado': return 'bg-green-500/10 text-green-600 border-green-500/30';
      case 'pendente': return 'bg-blue-500/10 text-blue-600 border-blue-500/30';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const getNotaColor = (n: number) => {
    if (n >= 4) return 'text-green-500';
    if (n >= 3) return 'text-amber-500';
    return 'text-red-500';
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[85vh] overflow-hidden grid grid-rows-[auto_1fr_auto] gap-0 p-0">
        {/* Header com gradiente */}
        <div className="relative px-6 pt-6 pb-4 border-b bg-gradient-to-br from-blue-500/5 via-purple-500/5 to-pink-500/5">
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl blur-md opacity-50"></div>
              <div className="relative p-3 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600">
                <FileText className="w-7 h-7 text-white" />
              </div>
            </div>
            <div>
              <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Análise Inteligente de Conversa
              </DialogTitle>
              <DialogDescription className="text-base mt-1">
                {parsed ? 'Resultados da análise' : 'Selecione o período para gerar o resumo'}
              </DialogDescription>
            </div>
          </div>
        </div>

        {!parsed && (
          <>
            <div className="min-h-0 overflow-hidden px-6">
              <ScrollArea className="h-full pr-2">
                <div className="space-y-4 py-6">
                  <div className="space-y-4">
                    <Label className="text-base font-semibold">Período de Análise</Label>
                    <RadioGroup value={period} onValueChange={(v) => setPeriod(v as SummaryPeriod)}>
                      {[
                        { value: 'dia_atual', label: 'Dia atual', icon: Clock, desc: 'Apenas conversas de hoje' },
                        { value: 'ultimos_7_dias', label: 'Últimos 7 dias', icon: TrendingUp, desc: 'Semana completa' },
                        { value: 'ultimos_15_dias', label: 'Últimos 15 dias', icon: TrendingUp, desc: 'Quinzena' },
                        { value: 'ultimos_30_dias', label: 'Últimos 30 dias', icon: TrendingUp, desc: 'Mês completo' }
                      ].map(({ value, label, icon: Icon, desc }) => (
                        <label
                          key={value}
                          className="relative flex items-center gap-4 p-4 rounded-xl border-2 hover:border-primary/50 hover:bg-accent/50 cursor-pointer transition-all group"
                        >
                          <RadioGroupItem value={value} className="mt-0.5" />
                          <Icon className="w-5 h-5 text-primary group-hover:scale-110 transition-transform" />
                          <div className="flex-1">
                            <div className="font-medium">{label}</div>
                            <div className="text-xs text-muted-foreground">{desc}</div>
                          </div>
                        </label>
                      ))}
                    </RadioGroup>
                  </div>

                  {error && (
                    <div className="p-4 rounded-xl bg-destructive/10 border-2 border-destructive/20 flex items-start gap-3 animate-in fade-in-0 zoom-in-95 duration-200">
                      <AlertCircle className="w-5 h-5 text-destructive mt-0.5" />
                      <div className="text-sm text-destructive">{error}</div>
                    </div>
                  )}
                </div>
              </ScrollArea>
            </div>

            <div className="flex justify-end gap-3 px-6 py-4 border-t bg-muted/30">
              <Button variant="outline" onClick={handleClose} disabled={loading}>
                Cancelar
              </Button>
              <Button onClick={handleGenerate} disabled={loading} className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Analisando...
                  </>
                ) : (
                  <>
                    <FileText className="w-4 h-4 mr-2" />
                    Gerar Análise
                  </>
                )}
              </Button>
            </div>
          </>
        )}

        {parsed && (
          <>
            <div className="min-h-0 overflow-hidden px-6">
              <ScrollArea className="h-full pr-2">
                <div ref={contentRef} className="space-y-6 py-6 animate-in fade-in-0 slide-in-from-bottom-4 duration-500">
                  {/* Header com nota e status */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="relative overflow-hidden rounded-2xl border-2 bg-gradient-to-br from-background to-muted/30 p-6">
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <div className="text-sm text-muted-foreground mb-1">Nota do Atendimento</div>
                          <div className={`text-5xl font-bold ${getNotaColor(nota)}`}>{nota}<span className="text-2xl text-muted-foreground">/5</span></div>
                        </div>
                        <div className={`p-3 rounded-xl ${nota >= 4 ? 'bg-green-500/10' : nota >= 3 ? 'bg-amber-500/10' : 'bg-red-500/10'}`}>
                          {nota >= 4 ? <CheckCircle2 className="w-8 h-8 text-green-500" /> : <AlertTriangle className="w-8 h-8 text-amber-500" />}
                        </div>
                      </div>
                      <Progress value={(nota / 5) * 100} className="h-2" />
                    </div>

                    <div className="relative overflow-hidden rounded-2xl border-2 bg-gradient-to-br from-background to-muted/30 p-6">
                      <div className="text-sm text-muted-foreground mb-2">Status do Atendimento</div>
                      <Badge className={`text-base px-4 py-2 ${getStatusColor(parsed?.status_atendimento)}`}>
                        {parsed?.status_atendimento?.toUpperCase() ?? 'N/A'}
                      </Badge>
                      {metricas && (
                        <div className="mt-4 grid grid-cols-3 gap-2">
                          <div className="text-center">
                            <MessageSquare className="w-4 h-4 mx-auto text-muted-foreground mb-1" />
                            <div className="text-xl font-bold">{metricas.total_mensagens ?? 0}</div>
                            <div className="text-[10px] text-muted-foreground">Total</div>
                          </div>
                          <div className="text-center">
                            <Bot className="w-4 h-4 mx-auto text-primary mb-1" />
                            <div className="text-xl font-bold">{metricas.mensagens_ia ?? 0}</div>
                            <div className="text-[10px] text-muted-foreground">IA</div>
                          </div>
                          <div className="text-center">
                            <UserIcon className="w-4 h-4 mx-auto text-green-500 mb-1" />
                            <div className="text-xl font-bold">{metricas.mensagens_human ?? 0}</div>
                            <div className="text-[10px] text-muted-foreground">Usuário</div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Resumo */}
                  {resumo && (
                    <div className="relative overflow-hidden rounded-2xl border-2 bg-gradient-to-br from-blue-500/5 to-purple-500/5 p-6">
                      <div className="flex items-center gap-2 mb-3">
                        <FileText className="w-5 h-5 text-primary" />
                        <h3 className="font-semibold text-lg">Resumo da Conversa</h3>
                      </div>
                      <p className="text-sm leading-relaxed text-muted-foreground">{resumo}</p>
                    </div>
                  )}

                  {/* Qualidade */}
                  {qualidade && (
                    <div className="rounded-2xl border-2 bg-gradient-to-br from-background to-muted/30 p-6">
                      <h3 className="font-semibold text-lg mb-4">Métricas de Qualidade</h3>
                      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                        {Object.entries(qualidade).map(([key, value]) => (
                          <div key={key} className="text-center">
                            <div className="text-3xl font-bold text-primary mb-1">{String(value)}</div>
                            <Progress value={(Number(value) / 5) * 100} className="h-1 mb-2" />
                            <div className="text-xs text-muted-foreground capitalize">{key}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Próximas ações */}
                    {Array.isArray(parsed?.proximas_acoes) && parsed.proximas_acoes.length > 0 && (
                      <div className="rounded-2xl border-2 bg-gradient-to-br from-green-500/5 to-emerald-500/5 p-6">
                        <div className="flex items-center gap-2 mb-4">
                          <CheckCircle2 className="w-5 h-5 text-green-500" />
                          <h3 className="font-semibold text-lg">Próximas Ações</h3>
                        </div>
                        <ul className="space-y-2">
                          {parsed.proximas_acoes.map((acao: string, i: number) => (
                            <li key={i} className="flex items-start gap-2 text-sm">
                              <div className="w-1.5 h-1.5 rounded-full bg-green-500 mt-2 flex-shrink-0"></div>
                              <span>{acao}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Pendências */}
                    {Array.isArray(parsed?.pendencias) && parsed.pendencias.length > 0 && (
                      <div className="rounded-2xl border-2 bg-gradient-to-br from-amber-500/5 to-orange-500/5 p-6">
                        <div className="flex items-center gap-2 mb-4">
                          <Clock className="w-5 h-5 text-amber-500" />
                          <h3 className="font-semibold text-lg">Pendências</h3>
                        </div>
                        <ul className="space-y-2">
                          {parsed.pendencias.map((pend: string, i: number) => (
                            <li key={i} className="flex items-start gap-2 text-sm">
                              <div className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-2 flex-shrink-0"></div>
                              <span>{pend}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>

                  {/* Flags */}
                  {flags && (
                    <div className="rounded-2xl border-2 bg-gradient-to-br from-background to-muted/30 p-6">
                      <h3 className="font-semibold text-lg mb-4">Alertas e Indicadores</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {Object.entries(flags).map(([key, value]) => {
                          const hasAlert = Boolean(value);
                          return (
                            <div
                              key={key}
                              className={`flex items-center justify-between p-3 rounded-xl border-2 transition-all ${
                                hasAlert
                                  ? 'bg-red-500/10 border-red-500/30 animate-pulse'
                                  : 'bg-green-500/5 border-green-500/20'
                              }`}
                            >
                              <span className="text-sm capitalize">{key.replace(/_/g, ' ')}</span>
                              {hasAlert ? (
                                <AlertTriangle className="w-5 h-5 text-red-500" />
                              ) : (
                                <CheckCircle2 className="w-5 h-5 text-green-500" />
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              </ScrollArea>
            </div>

            <div className="flex justify-between gap-3 px-6 py-4 border-t bg-muted/30">
              <Button variant="outline" onClick={handleDownloadPDF} disabled={downloading}>
                {downloading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Gerando PDF...
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4 mr-2" />
                    Baixar PDF
                  </>
                )}
              </Button>
              <div className="flex gap-3">
                <Button variant="outline" onClick={() => setParsed(null)}>
                  Nova Análise
                </Button>
                <Button onClick={handleClose} className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
                  Concluir
                </Button>
              </div>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
