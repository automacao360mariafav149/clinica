import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { MagicBentoCard } from '@/components/bento/MagicBento';
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useRealtimeList } from '@/hooks/useRealtimeList';
import { ClipboardList } from 'lucide-react';

export default function FollowUp() {
  const { data, loading, error } = useRealtimeList<any>({
    table: 'follow_ups',
    order: { column: 'due_date', ascending: true, nullsFirst: true },
  });

  return (
    <DashboardLayout>
      <div className="p-8 space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Follow Up</h1>
          <p className="text-muted-foreground mt-1">Acompanhamento de pacientes</p>
        </div>

        <MagicBentoCard contentClassName="p-6">
          <Table>
            <TableCaption>
              {loading ? 'Carregando…' : error ? `Erro: ${error}` : `${data.length} pendência(s)`}
            </TableCaption>
            <TableHeader>
              <TableRow>
                <TableHead>Paciente</TableHead>
                <TableHead>Responsável</TableHead>
                <TableHead>Para</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Notas</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((f) => (
                <TableRow key={f.id}>
                  <TableCell>{f.patient_id}</TableCell>
                  <TableCell>{f.assigned_to ?? '-'}</TableCell>
                  <TableCell>{f.due_date ?? '-'}</TableCell>
                  <TableCell>{f.status}</TableCell>
                  <TableCell>{f.notes ?? '-'}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </MagicBentoCard>
      </div>
    </DashboardLayout>
  );
}
