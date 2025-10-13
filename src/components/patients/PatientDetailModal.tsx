import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { usePatientData } from '@/hooks/usePatientData';
import { PatientOverview } from './PatientOverview';
import { MedicalRecordsList } from './MedicalRecordsList';
import { MedicalRecordForm } from './MedicalRecordForm';
import { MedicalRecordViewModal } from './MedicalRecordViewModal';
import { MedicalHistorySummary } from './MedicalHistorySummary';
import { AnamnesisForm } from './AnamnesisForm';
import { ClinicalDataForm } from './ClinicalDataForm';
import { PatientTimeline } from './PatientTimeline';
import { FileUploadZone } from './FileUploadZone';
import { AttachmentCard } from './AttachmentCard';
import { supabase } from '@/lib/supabaseClient';
import { toast } from 'sonner';
import { MedicalRecord } from '@/hooks/usePatientData';
import { deleteFile } from '@/lib/storageUtils';
import {
  User,
  FileText,
  Activity,
  Clock,
  Clipboard,
  Upload,
} from 'lucide-react';

interface PatientDetailModalProps {
  patientId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function PatientDetailModal({ patientId, open, onOpenChange }: PatientDetailModalProps) {
  const [activeTab, setActiveTab] = useState('overview');
  const [showMedicalRecordForm, setShowMedicalRecordForm] = useState(false);
  const [showAnamnesisForm, setShowAnamnesisForm] = useState(false);
  const [showClinicalDataForm, setShowClinicalDataForm] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<MedicalRecord | null>(null);
  
  const {
    patient,
    medicalRecords,
    anamnesis,
    clinicalData,
    examHistory,
    attachments,
    agentExams,
    doctors,
    loading,
    error,
    refetch,
  } = usePatientData(patientId);

  // Reset ao abrir/fechar modal
  useEffect(() => {
    if (open) {
      setActiveTab('overview');
      setShowMedicalRecordForm(false);
      setShowAnamnesisForm(false);
      setShowClinicalDataForm(false);
    }
  }, [open, patientId]);

  const handleAvatarUpdate = async (url: string) => {
    if (!patientId) return;

    try {
      const { error } = await supabase
        .from('patients')
        .update({ avatar_url: url })
        .eq('id', patientId);

      if (error) throw error;

      refetch();
      toast.success('Avatar atualizado!');
    } catch (error: any) {
      console.error('Erro ao atualizar avatar:', error);
      toast.error('Erro ao atualizar avatar');
    }
  };

  const handleMedicalRecordSuccess = () => {
    setShowMedicalRecordForm(false);
    refetch();
  };

  const handleAnamnesisSuccess = () => {
    setShowAnamnesisForm(false);
    refetch();
  };

  const handleClinicalDataSuccess = () => {
    setShowClinicalDataForm(false);
    refetch();
  };

  const handleFileUploadSuccess = async (url: string, path: string) => {
    if (!patientId) return;

    try {
      // Registrar anexo no banco
      const { error } = await supabase.from('medical_attachments').insert({
        patient_id: patientId,
        file_name: path.split('/').pop() || 'unknown',
        file_path: path,
        related_to_type: 'general',
      });

      if (error) throw error;

      refetch();
    } catch (error: any) {
      console.error('Erro ao registrar anexo:', error);
    }
  };

  const handleDeleteAttachment = async (attachmentId: string) => {
    if (!patientId) return;

    try {
      // Buscar o arquivo para deletar do storage
      const { data: attachment } = await supabase
        .from('medical_attachments')
        .select('file_path')
        .eq('id', attachmentId)
        .single();

      if (attachment?.file_path) {
        // Deletar do storage
        await deleteFile(attachment.file_path);
      }

      // Deletar do banco de dados
      const { error } = await supabase
        .from('medical_attachments')
        .delete()
        .eq('id', attachmentId);

      if (error) throw error;

      toast.success('Anexo excluído com sucesso!');
      refetch();
    } catch (error: any) {
      console.error('Erro ao excluir anexo:', error);
      toast.error('Erro ao excluir anexo');
    }
  };

  if (!patientId) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-7xl max-h-[90vh] p-0">
        <DialogHeader className="px-6 pt-6">
          <DialogTitle className="text-2xl">Prontuário do Paciente</DialogTitle>
          <DialogDescription>
            {loading ? 'Carregando dados...' : patient?.name || 'Detalhes completos'}
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="p-6 space-y-4">
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-64 w-full" />
          </div>
        ) : error ? (
          <div className="p-6 text-center text-destructive">
            <p>Erro ao carregar dados: {error}</p>
          </div>
        ) : patient ? (
          <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1">
            <div className="border-b px-6">
              <TabsList className="w-full justify-start h-auto p-0 bg-transparent">
                <TabsTrigger
                  value="overview"
                  className="flex items-center gap-2 data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none"
                >
                  <User className="h-4 w-4" />
                  Visão Geral
                </TabsTrigger>
                <TabsTrigger
                  value="medical-records"
                  className="flex items-center gap-2 data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none"
                >
                  <FileText className="h-4 w-4" />
                  Prontuários ({medicalRecords.length})
                </TabsTrigger>
                <TabsTrigger
                  value="anamnesis"
                  className="flex items-center gap-2 data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none"
                >
                  <Clipboard className="h-4 w-4" />
                  Anamnese ({anamnesis.length})
                </TabsTrigger>
                <TabsTrigger
                  value="clinical-data"
                  className="flex items-center gap-2 data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none"
                >
                  <Activity className="h-4 w-4" />
                  Dados Clínicos ({clinicalData.length})
                </TabsTrigger>
                <TabsTrigger
                  value="timeline"
                  className="flex items-center gap-2 data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none"
                >
                  <Clock className="h-4 w-4" />
                  Linha do Tempo
                </TabsTrigger>
                <TabsTrigger
                  value="attachments"
                  className="flex items-center gap-2 data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none"
                >
                  <Upload className="h-4 w-4" />
                  Anexos ({attachments.length + agentExams.length})
                </TabsTrigger>
              </TabsList>
            </div>

            {/* Timeline Tab - Sem ScrollArea para permitir scroll horizontal */}
            {activeTab === 'timeline' ? (
              <div className="h-[calc(90vh-200px)] flex flex-col overflow-hidden">
                <div className="w-full h-full overflow-hidden">
                  <TabsContent value="timeline" className="mt-0 h-full">
                    <PatientTimeline patientId={patientId} />
                  </TabsContent>
                </div>
              </div>
            ) : (
              <ScrollArea className="h-[calc(90vh-200px)]">
                <div className="p-6">
                  {/* Overview Tab */}
                  <TabsContent value="overview" className="mt-0">
                    <PatientOverview
                      patient={patient}
                      doctors={doctors}
                      medicalRecords={medicalRecords}
                      clinicalData={clinicalData}
                      examHistory={examHistory}
                      anamnesis={anamnesis}
                      onAvatarUpdate={handleAvatarUpdate}
                      onPatientUpdate={refetch}
                    />
                  </TabsContent>

                  {/* Medical Records Tab */}
                  <TabsContent value="medical-records" className="mt-0">
                   {showMedicalRecordForm ? (
                     <MedicalRecordForm
                       patientId={patientId}
                       onSuccess={handleMedicalRecordSuccess}
                       onCancel={() => setShowMedicalRecordForm(false)}
                     />
                   ) : (
                     <>
                       {/* Resumo do Histórico */}
                       <MedicalHistorySummary records={medicalRecords} />
                       
                       {/* Lista de Prontuários */}
                       <MedicalRecordsList
                         records={medicalRecords}
                         onAdd={() => setShowMedicalRecordForm(true)}
                         onView={(record) => setSelectedRecord(record)}
                       />
                     </>
                   )}
                 </TabsContent>

                {/* Anamnesis Tab */}
                <TabsContent value="anamnesis" className="mt-0">
                  {showAnamnesisForm ? (
                    <AnamnesisForm
                      patientId={patientId}
                      onSuccess={handleAnamnesisSuccess}
                      onCancel={() => setShowAnamnesisForm(false)}
                    />
                  ) : anamnesis.length > 0 ? (
                    <div className="space-y-4">
                      <div className="flex justify-end">
                        <button
                          onClick={() => setShowAnamnesisForm(true)}
                          className="text-sm text-primary hover:underline"
                        >
                          + Nova Anamnese
                        </button>
                      </div>
                      {anamnesis.map((item) => (
                        <div key={item.id} className="border rounded-lg p-4 space-y-2">
                          <p className="text-sm text-muted-foreground">
                            {new Date(item.created_at).toLocaleDateString('pt-BR')}
                            {item.doctor && ` - Dr(a). ${item.doctor.name}`}
                          </p>
                          {item.chief_complaint && (
                            <p className="text-sm">
                              <strong>Queixa:</strong> {item.chief_complaint}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <p className="text-muted-foreground mb-4">Nenhuma anamnese registrada</p>
                      <button
                        onClick={() => setShowAnamnesisForm(true)}
                        className="text-primary hover:underline"
                      >
                        + Criar primeira anamnese
                      </button>
                    </div>
                  )}
                </TabsContent>

                {/* Clinical Data Tab */}
                <TabsContent value="clinical-data" className="mt-0">
                  {showClinicalDataForm ? (
                    <ClinicalDataForm
                      patientId={patientId}
                      onSuccess={handleClinicalDataSuccess}
                      onCancel={() => setShowClinicalDataForm(false)}
                    />
                  ) : (
                    <div className="space-y-4">
                      <div className="flex justify-end">
                        <button
                          onClick={() => setShowClinicalDataForm(true)}
                          className="text-sm text-primary hover:underline"
                        >
                          + Registrar Dados Clínicos
                        </button>
                      </div>
                      {clinicalData.length > 0 ? (
                        <div className="grid gap-4">
                          {clinicalData.map((data) => (
                            <div key={data.id} className="border rounded-lg p-4">
                              <p className="text-sm text-muted-foreground mb-2">
                                {new Date(data.measurement_date).toLocaleDateString('pt-BR')}
                              </p>
                              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
                                {data.weight_kg && <p>Peso: {data.weight_kg}kg</p>}
                                {data.height_cm && <p>Altura: {data.height_cm}cm</p>}
                                {data.bmi && <p>IMC: {data.bmi}</p>}
                                {data.blood_pressure_systolic && data.blood_pressure_diastolic && (
                                  <p>
                                    PA: {data.blood_pressure_systolic}/{data.blood_pressure_diastolic}
                                  </p>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-12 text-muted-foreground">
                          <p>Nenhum dado clínico registrado</p>
                        </div>
                      )}
                    </div>
                  )}
                </TabsContent>

                {/* Attachments Tab */}
                <TabsContent value="attachments" className="mt-0">
                  <div className="space-y-6">
                    <FileUploadZone
                      patientId={patientId}
                      folder="attachments"
                      onUploadSuccess={handleFileUploadSuccess}
                    />
                    
                    {/* Exames do Agent de Exames */}
                    {agentExams.length > 0 && (
                      <div>
                        <h3 className="font-semibold mb-4 flex items-center gap-2">
                          <span className="text-orange-500">🔬</span>
                          Exames Analisados pelo Agent ({agentExams.length})
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          {agentExams.map((exam) => (
                            <div
                              key={exam.id}
                              className="border rounded-lg p-4 hover:shadow-md transition-shadow bg-gradient-to-br from-orange-500/5 to-amber-500/5"
                            >
                              <div className="flex items-start justify-between mb-2">
                                <div className="flex items-center gap-2">
                                  <div className="p-2 rounded-lg bg-orange-500/10">
                                    <FileText className="w-4 h-4 text-orange-500" />
                                  </div>
                                  <div>
                                    <p className="font-medium text-sm">
                                      {exam.exam_file_name || 'Exame Laboratorial'}
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                      {exam.exam_type || 'Laboratory'}
                                    </p>
                                  </div>
                                </div>
                              </div>
                              
                              {exam.exam_result_summary && (
                                <p className="text-xs text-muted-foreground line-clamp-3 mb-3">
                                  {exam.exam_result_summary}
                                </p>
                              )}
                              
                              <div className="flex items-center justify-between text-xs text-muted-foreground">
                                <span>
                                  {new Date(exam.consultation_date).toLocaleDateString('pt-BR')}
                                </span>
                                {exam.doctor && (
                                  <span className="font-medium">
                                    Dr(a). {exam.doctor.name}
                                  </span>
                                )}
                              </div>
                              
                              <Button
                                variant="outline"
                                size="sm"
                                className="w-full mt-3"
                                onClick={() => {
                                  // Exibir o conteúdo completo do exame
                                  const output = exam.consultation_output?.output || 'Análise não disponível';
                                  const modal = document.createElement('div');
                                  modal.innerHTML = `
                                    <div style="position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 9999; padding: 20px;">
                                      <div style="background: white; border-radius: 8px; max-width: 900px; max-height: 90vh; overflow-y: auto; padding: 24px; position: relative;">
                                        <button onclick="this.closest('div').parentElement.remove()" style="position: absolute; top: 12px; right: 12px; background: none; border: none; font-size: 24px; cursor: pointer; color: #666;">&times;</button>
                                        <h2 style="margin-bottom: 16px; font-size: 20px; font-weight: bold;">📋 ${exam.exam_file_name || 'Análise de Exame'}</h2>
                                        <pre style="white-space: pre-wrap; font-family: system-ui; font-size: 14px; line-height: 1.6;">${output}</pre>
                                      </div>
                                    </div>
                                  `;
                                  document.body.appendChild(modal);
                                }}
                              >
                                Ver Análise Completa
                              </Button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {/* Arquivos Anexados Manualmente */}
                    {attachments.length > 0 && (
                      <div>
                        <h3 className="font-semibold mb-4">Arquivos Anexados ({attachments.length})</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          {attachments.map((att) => (
                            <AttachmentCard
                              key={att.id}
                              attachment={att}
                              onDelete={handleDeleteAttachment}
                            />
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {/* Mensagem quando não há anexos */}
                    {attachments.length === 0 && agentExams.length === 0 && (
                      <div className="text-center py-12 text-muted-foreground">
                        <Upload className="w-12 h-12 mx-auto mb-4 opacity-50" />
                        <p>Nenhum anexo ou exame analisado ainda</p>
                      </div>
                    )}
                  </div>
                </TabsContent>
                </div>
              </ScrollArea>
            )}
          </Tabs>
         ) : null}
       </DialogContent>

       {/* Modal de visualização de prontuário */}
       {selectedRecord && (
         <MedicalRecordViewModal
           record={selectedRecord}
           open={!!selectedRecord}
           onOpenChange={(open) => {
             if (!open) setSelectedRecord(null);
           }}
           patientName={patient?.name}
         />
       )}
     </Dialog>
   );
 }
