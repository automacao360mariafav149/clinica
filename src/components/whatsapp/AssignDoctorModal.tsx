import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { supabase } from '@/lib/supabaseClient';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

interface AssignDoctorModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sessionId: string;
  patientId: string;
  isPrePatient: boolean;
  currentPatientName?: string;
  onSuccess?: () => void;
}

interface Doctor {
  id: string;
  name: string;
  specialization: string | null;
}

export function AssignDoctorModal({
  open,
  onOpenChange,
  sessionId,
  patientId,
  isPrePatient,
  currentPatientName,
  onSuccess,
}: AssignDoctorModalProps) {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingDoctors, setLoadingDoctors] = useState(false);
  const [selectedDoctorId, setSelectedDoctorId] = useState<string>('');
  const [patientName, setPatientName] = useState('');

  // Carregar médicos quando o modal abre
  useEffect(() => {
    if (open) {
      fetchDoctors();
      setPatientName(currentPatientName || '');
      setSelectedDoctorId('');
    }
  }, [open, currentPatientName]);

  const fetchDoctors = async () => {
    setLoadingDoctors(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, name, specialization')
        .eq('role', 'doctor')
        .order('name');

      if (error) throw error;
      setDoctors(data || []);
    } catch (error: any) {
      console.error('Erro ao carregar médicos:', error);
      toast.error('Erro ao carregar lista de médicos');
    } finally {
      setLoadingDoctors(false);
    }
  };

  const handleAssign = async () => {
    if (!selectedDoctorId) {
      toast.error('Por favor, selecione um médico');
      return;
    }

    if (isPrePatient && !patientName.trim()) {
      toast.error('Por favor, informe o nome do paciente');
      return;
    }

    setLoading(true);
    try {
      if (isPrePatient) {
        // Atualizar pré-paciente com o nome (vai triggerar a promoção automática)
        const { error: updateError } = await supabase
          .from('pre_patients')
          .update({ 
            name: patientName.trim(),
            updated_at: new Date().toISOString()
          })
          .eq('id', patientId);

        if (updateError) throw updateError;

        // Aguardar um momento para a trigger de promoção executar
        await new Promise(resolve => setTimeout(resolve, 500));

        // Agora inserir na tabela patient_doctors (o paciente já foi promovido com o mesmo UUID)
        const { error: assignError } = await supabase
          .from('patient_doctors')
          .insert({
            patient_id: patientId, // Mesmo ID que era do pré-paciente
            doctor_id: selectedDoctorId,
            is_primary: true,
          });

        if (assignError) {
          // Se der erro de constraint duplicate, significa que já existe, então fazemos update
          if (assignError.code === '23505') {
            const { error: updateAssignError } = await supabase
              .from('patient_doctors')
              .update({
                doctor_id: selectedDoctorId,
                is_primary: true,
              })
              .eq('patient_id', patientId)
              .eq('doctor_id', selectedDoctorId);

            if (updateAssignError) throw updateAssignError;
          } else {
            throw assignError;
          }
        }

        toast.success('Paciente promovido e médico atribuído com sucesso!');
      } else {
        // Apenas atribuir médico ao paciente existente
        // Verificar se já existe uma atribuição
        const { data: existing } = await supabase
          .from('patient_doctors')
          .select('id')
          .eq('patient_id', patientId)
          .eq('doctor_id', selectedDoctorId)
          .single();

        if (existing) {
          toast.info('Este médico já está atribuído a este paciente');
        } else {
          // Inserir nova atribuição
          const { error: assignError } = await supabase
            .from('patient_doctors')
            .insert({
              patient_id: patientId,
              doctor_id: selectedDoctorId,
              is_primary: true,
            });

          if (assignError) throw assignError;
          toast.success('Médico atribuído com sucesso!');
        }
      }

      onSuccess?.();
      onOpenChange(false);
    } catch (error: any) {
      console.error('Erro ao atribuir médico:', error);
      toast.error(error.message || 'Erro ao atribuir médico');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {isPrePatient ? 'Promover e Atribuir Médico' : 'Atribuir Médico'}
          </DialogTitle>
          <DialogDescription>
            {isPrePatient
              ? 'Informe o nome completo do paciente e selecione o médico responsável para promover este pré-paciente.'
              : 'Selecione o médico que será responsável por este paciente.'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {isPrePatient && (
            <div className="space-y-2">
              <Label htmlFor="patient-name">Nome Completo do Paciente *</Label>
              <Input
                id="patient-name"
                placeholder="Ex: João da Silva"
                value={patientName}
                onChange={(e) => setPatientName(e.target.value)}
                disabled={loading}
              />
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="doctor">Médico Responsável *</Label>
            {loadingDoctors ? (
              <div className="flex items-center justify-center p-4">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <Select
                value={selectedDoctorId}
                onValueChange={setSelectedDoctorId}
                disabled={loading}
              >
                <SelectTrigger id="doctor">
                  <SelectValue placeholder="Selecione um médico" />
                </SelectTrigger>
                <SelectContent>
                  {doctors.map((doctor) => (
                    <SelectItem key={doctor.id} value={doctor.id}>
                      {doctor.name}
                      {doctor.specialization && ` - ${doctor.specialization}`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            {doctors.length === 0 && !loadingDoctors && (
              <p className="text-sm text-muted-foreground">
                Nenhum médico cadastrado no sistema
              </p>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={loading}
          >
            Cancelar
          </Button>
          <Button onClick={handleAssign} disabled={loading || loadingDoctors}>
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processando...
              </>
            ) : isPrePatient ? (
              'Promover e Atribuir'
            ) : (
              'Atribuir Médico'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

