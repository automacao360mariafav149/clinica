import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

interface ClinicalDataFormProps {
  patientId: string;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function ClinicalDataForm({ patientId, onSuccess, onCancel }: ClinicalDataFormProps) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    weight_kg: '',
    height_cm: '',
    blood_pressure_systolic: '',
    blood_pressure_diastolic: '',
    heart_rate: '',
    temperature_celsius: '',
    oxygen_saturation: '',
    notes: '',
  });

  const calculateBMI = () => {
    const weight = parseFloat(formData.weight_kg);
    const heightInMeters = parseFloat(formData.height_cm) / 100;

    if (weight > 0 && heightInMeters > 0) {
      return (weight / (heightInMeters * heightInMeters)).toFixed(2);
    }
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const bmi = calculateBMI();

      const { error } = await supabase.from('clinical_data').insert({
        patient_id: patientId,
        doctor_id: user?.id || null,
        weight_kg: formData.weight_kg ? parseFloat(formData.weight_kg) : null,
        height_cm: formData.height_cm ? parseFloat(formData.height_cm) : null,
        bmi: bmi ? parseFloat(bmi) : null,
        blood_pressure_systolic: formData.blood_pressure_systolic
          ? parseInt(formData.blood_pressure_systolic)
          : null,
        blood_pressure_diastolic: formData.blood_pressure_diastolic
          ? parseInt(formData.blood_pressure_diastolic)
          : null,
        heart_rate: formData.heart_rate ? parseInt(formData.heart_rate) : null,
        temperature_celsius: formData.temperature_celsius
          ? parseFloat(formData.temperature_celsius)
          : null,
        oxygen_saturation: formData.oxygen_saturation
          ? parseInt(formData.oxygen_saturation)
          : null,
        notes: formData.notes || null,
      });

      if (error) throw error;

      toast.success('Dados clínicos salvos com sucesso!');
      onSuccess?.();
    } catch (error: any) {
      console.error('Erro ao salvar dados clínicos:', error);
      toast.error(error.message || 'Erro ao salvar dados');
    } finally {
      setLoading(false);
    }
  };

  const bmi = calculateBMI();

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Peso */}
        <div className="space-y-2">
          <Label htmlFor="weight">Peso (kg)</Label>
          <Input
            id="weight"
            type="number"
            step="0.01"
            placeholder="Ex: 70.5"
            value={formData.weight_kg}
            onChange={(e) => setFormData({ ...formData, weight_kg: e.target.value })}
          />
        </div>

        {/* Altura */}
        <div className="space-y-2">
          <Label htmlFor="height">Altura (cm)</Label>
          <Input
            id="height"
            type="number"
            step="0.1"
            placeholder="Ex: 175"
            value={formData.height_cm}
            onChange={(e) => setFormData({ ...formData, height_cm: e.target.value })}
          />
        </div>

        {/* IMC (calculado) */}
        {bmi && (
          <div className="space-y-2 md:col-span-2">
            <Label>IMC (Índice de Massa Corporal)</Label>
            <div className="p-3 bg-muted rounded-md">
              <p className="text-sm font-medium">
                IMC: {bmi} kg/m²
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {parseFloat(bmi) < 18.5 && 'Abaixo do peso'}
                {parseFloat(bmi) >= 18.5 && parseFloat(bmi) < 25 && 'Peso normal'}
                {parseFloat(bmi) >= 25 && parseFloat(bmi) < 30 && 'Sobrepeso'}
                {parseFloat(bmi) >= 30 && 'Obesidade'}
              </p>
            </div>
          </div>
        )}

        {/* Pressão Arterial */}
        <div className="space-y-2">
          <Label htmlFor="bp-systolic">Pressão Sistólica (mmHg)</Label>
          <Input
            id="bp-systolic"
            type="number"
            placeholder="Ex: 120"
            value={formData.blood_pressure_systolic}
            onChange={(e) =>
              setFormData({ ...formData, blood_pressure_systolic: e.target.value })
            }
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="bp-diastolic">Pressão Diastólica (mmHg)</Label>
          <Input
            id="bp-diastolic"
            type="number"
            placeholder="Ex: 80"
            value={formData.blood_pressure_diastolic}
            onChange={(e) =>
              setFormData({ ...formData, blood_pressure_diastolic: e.target.value })
            }
          />
        </div>

        {/* Frequência Cardíaca */}
        <div className="space-y-2">
          <Label htmlFor="heart-rate">Frequência Cardíaca (bpm)</Label>
          <Input
            id="heart-rate"
            type="number"
            placeholder="Ex: 72"
            value={formData.heart_rate}
            onChange={(e) => setFormData({ ...formData, heart_rate: e.target.value })}
          />
        </div>

        {/* Temperatura */}
        <div className="space-y-2">
          <Label htmlFor="temperature">Temperatura (°C)</Label>
          <Input
            id="temperature"
            type="number"
            step="0.1"
            placeholder="Ex: 36.5"
            value={formData.temperature_celsius}
            onChange={(e) =>
              setFormData({ ...formData, temperature_celsius: e.target.value })
            }
          />
        </div>

        {/* Saturação de Oxigênio */}
        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="oxygen">Saturação de Oxigênio (%)</Label>
          <Input
            id="oxygen"
            type="number"
            placeholder="Ex: 98"
            min="0"
            max="100"
            value={formData.oxygen_saturation}
            onChange={(e) =>
              setFormData({ ...formData, oxygen_saturation: e.target.value })
            }
          />
        </div>

        {/* Observações */}
        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="notes">Observações</Label>
          <Textarea
            id="notes"
            placeholder="Observações adicionais sobre as medições..."
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            rows={3}
          />
        </div>
      </div>

      <div className="flex gap-2 justify-end">
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
            'Salvar Dados'
          )}
        </Button>
      </div>
    </form>
  );
}
