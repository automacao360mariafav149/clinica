import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

interface MedicalRecordFormProps {
  patientId: string;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function MedicalRecordForm({ patientId, onSuccess, onCancel }: MedicalRecordFormProps) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    appointment_date: new Date().toISOString().slice(0, 16),
    chief_complaint: '',
    history_present_illness: '',
    physical_examination: '',
    diagnosis: '',
    treatment_plan: '',
    prescriptions: '',
    notes: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      toast.error('Usuário não autenticado');
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase.from('medical_records').insert({
        patient_id: patientId,
        doctor_id: user.id,
        appointment_date: formData.appointment_date,
        chief_complaint: formData.chief_complaint || null,
        history_present_illness: formData.history_present_illness || null,
        physical_examination: formData.physical_examination || null,
        diagnosis: formData.diagnosis || null,
        treatment_plan: formData.treatment_plan || null,
        prescriptions: formData.prescriptions || null,
        notes: formData.notes || null,
      });

      if (error) throw error;

      toast.success('Prontuário criado com sucesso!');
      onSuccess?.();
    } catch (error: any) {
      console.error('Erro ao criar prontuário:', error);
      toast.error(error.message || 'Erro ao criar prontuário');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Data da Consulta */}
      <div className="space-y-2">
        <Label htmlFor="appointment_date">Data da Consulta *</Label>
        <Input
          id="appointment_date"
          type="datetime-local"
          value={formData.appointment_date}
          onChange={(e) => setFormData({ ...formData, appointment_date: e.target.value })}
          required
        />
      </div>

      {/* Queixa Principal */}
      <div className="space-y-2">
        <Label htmlFor="chief_complaint">Queixa Principal</Label>
        <Textarea
          id="chief_complaint"
          placeholder="Motivo da consulta..."
          value={formData.chief_complaint}
          onChange={(e) => setFormData({ ...formData, chief_complaint: e.target.value })}
          rows={2}
        />
      </div>

      {/* História da Doença Atual */}
      <div className="space-y-2">
        <Label htmlFor="history_present_illness">História da Doença Atual (HDA)</Label>
        <Textarea
          id="history_present_illness"
          placeholder="Descrição detalhada dos sintomas..."
          value={formData.history_present_illness}
          onChange={(e) =>
            setFormData({ ...formData, history_present_illness: e.target.value })
          }
          rows={3}
        />
      </div>

      {/* Exame Físico */}
      <div className="space-y-2">
        <Label htmlFor="physical_examination">Exame Físico</Label>
        <Textarea
          id="physical_examination"
          placeholder="Resultados do exame físico..."
          value={formData.physical_examination}
          onChange={(e) => setFormData({ ...formData, physical_examination: e.target.value })}
          rows={3}
        />
      </div>

      {/* Diagnóstico */}
      <div className="space-y-2">
        <Label htmlFor="diagnosis">Diagnóstico</Label>
        <Textarea
          id="diagnosis"
          placeholder="Diagnóstico clínico..."
          value={formData.diagnosis}
          onChange={(e) => setFormData({ ...formData, diagnosis: e.target.value })}
          rows={2}
        />
      </div>

      {/* Plano de Tratamento */}
      <div className="space-y-2">
        <Label htmlFor="treatment_plan">Plano de Tratamento</Label>
        <Textarea
          id="treatment_plan"
          placeholder="Orientações e tratamento proposto..."
          value={formData.treatment_plan}
          onChange={(e) => setFormData({ ...formData, treatment_plan: e.target.value })}
          rows={3}
        />
      </div>

      {/* Prescrições */}
      <div className="space-y-2">
        <Label htmlFor="prescriptions">Prescrições</Label>
        <Textarea
          id="prescriptions"
          placeholder="Medicamentos prescritos..."
          value={formData.prescriptions}
          onChange={(e) => setFormData({ ...formData, prescriptions: e.target.value })}
          rows={3}
        />
      </div>

      {/* Observações */}
      <div className="space-y-2">
        <Label htmlFor="notes">Observações</Label>
        <Textarea
          id="notes"
          placeholder="Observações adicionais..."
          value={formData.notes}
          onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
          rows={2}
        />
      </div>

      {/* Botões */}
      <div className="flex gap-2 justify-end pt-4">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel} disabled={loading}>
            Cancelar
          </Button>
        )}
        <Button type="submit" disabled={loading}>
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Salvando...
            </>
          ) : (
            'Salvar Prontuário'
          )}
        </Button>
      </div>
    </form>
  );
}
