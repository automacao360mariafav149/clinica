import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

interface AnamnesisFormProps {
  patientId: string;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function AnamnesisForm({ patientId, onSuccess, onCancel }: AnamnesisFormProps) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    chief_complaint: '',
    history_present_illness: '',
    past_medical_history: '',
    family_history: '',
    social_history: '',
    allergies: '',
    current_medications: '',
    review_of_systems: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      toast.error('Usuário não autenticado');
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase.from('anamnesis').insert({
        patient_id: patientId,
        doctor_id: user.id,
        chief_complaint: formData.chief_complaint || null,
        history_present_illness: formData.history_present_illness || null,
        past_medical_history: formData.past_medical_history || null,
        family_history: formData.family_history || null,
        social_history: formData.social_history || null,
        allergies: formData.allergies || null,
        current_medications: formData.current_medications || null,
        review_of_systems: formData.review_of_systems || null,
      });

      if (error) throw error;

      toast.success('Anamnese salva com sucesso!');
      onSuccess?.();
    } catch (error: any) {
      console.error('Erro ao salvar anamnese:', error);
      toast.error(error.message || 'Erro ao salvar anamnese');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Queixa Principal */}
      <div className="space-y-2">
        <Label htmlFor="chief_complaint">Queixa Principal (QP)</Label>
        <Textarea
          id="chief_complaint"
          placeholder="Motivo principal da consulta..."
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
          placeholder="Descrição detalhada dos sintomas atuais, início, evolução..."
          value={formData.history_present_illness}
          onChange={(e) =>
            setFormData({ ...formData, history_present_illness: e.target.value })
          }
          rows={4}
        />
      </div>

      {/* História Patológica Pregressa */}
      <div className="space-y-2">
        <Label htmlFor="past_medical_history">História Patológica Pregressa (HPP)</Label>
        <Textarea
          id="past_medical_history"
          placeholder="Doenças prévias, cirurgias, hospitalizações..."
          value={formData.past_medical_history}
          onChange={(e) => setFormData({ ...formData, past_medical_history: e.target.value })}
          rows={3}
        />
      </div>

      {/* História Familiar */}
      <div className="space-y-2">
        <Label htmlFor="family_history">História Familiar</Label>
        <Textarea
          id="family_history"
          placeholder="Doenças na família, casos de câncer, diabetes, hipertensão..."
          value={formData.family_history}
          onChange={(e) => setFormData({ ...formData, family_history: e.target.value })}
          rows={3}
        />
      </div>

      {/* Hábitos de Vida */}
      <div className="space-y-2">
        <Label htmlFor="social_history">Hábitos de Vida e História Social</Label>
        <Textarea
          id="social_history"
          placeholder="Tabagismo, etilismo, atividade física, alimentação..."
          value={formData.social_history}
          onChange={(e) => setFormData({ ...formData, social_history: e.target.value })}
          rows={3}
        />
      </div>

      {/* Alergias */}
      <div className="space-y-2">
        <Label htmlFor="allergies">Alergias</Label>
        <Textarea
          id="allergies"
          placeholder="Alergias a medicamentos, alimentos, substâncias..."
          value={formData.allergies}
          onChange={(e) => setFormData({ ...formData, allergies: e.target.value })}
          rows={2}
        />
      </div>

      {/* Medicamentos em Uso */}
      <div className="space-y-2">
        <Label htmlFor="current_medications">Medicamentos em Uso</Label>
        <Textarea
          id="current_medications"
          placeholder="Medicamentos atualmente em uso, dosagens e frequência..."
          value={formData.current_medications}
          onChange={(e) => setFormData({ ...formData, current_medications: e.target.value })}
          rows={3}
        />
      </div>

      {/* Revisão de Sistemas */}
      <div className="space-y-2">
        <Label htmlFor="review_of_systems">Revisão de Sistemas</Label>
        <Textarea
          id="review_of_systems"
          placeholder="Sintomas por sistemas: cardiovascular, respiratório, digestivo, urinário, neurológico..."
          value={formData.review_of_systems}
          onChange={(e) => setFormData({ ...formData, review_of_systems: e.target.value })}
          rows={4}
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
            'Salvar Anamnese'
          )}
        </Button>
      </div>
    </form>
  );
}
