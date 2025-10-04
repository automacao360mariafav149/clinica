import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card } from '@/components/ui/card';
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useRealtimeList } from '@/hooks/useRealtimeList';
import { Calendar } from 'lucide-react';

export default function Agenda() {
  const { data, loading, error } = useRealtimeList<any>({
    table: 'appointments',
    order: { column: 'scheduled_at', ascending: true },
  });

  return (
    <DashboardLayout>
      <div className="p-8 space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Agenda</h1>
          <p className="text-muted-foreground mt-1">Gerencie seus agendamentos</p>
        </div>

        <Card className="bg-card border-border p-6">
          <Table>
            <TableCaption>
              {loading ? 'Carregando…' : error ? `Erro: ${error}` : `${data.length} consulta(s)`}
            </TableCaption>
            <TableHeader>
              <TableRow>
                <TableHead>Paciente</TableHead>
                <TableHead>Médico</TableHead>
                <TableHead>Data/Hora</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Notas</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((a) => (
                <TableRow key={a.id}>
                  <TableCell>{a.patient_id}</TableCell>
                  <TableCell>{a.doctor_id ?? '-'}</TableCell>
                  <TableCell>{new Date(a.scheduled_at).toLocaleString()}</TableCell>
                  <TableCell>{a.status}</TableCell>
                  <TableCell>{a.notes ?? '-'}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      </div>
    </DashboardLayout>
  );
}
