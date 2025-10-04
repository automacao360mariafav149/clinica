import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card } from '@/components/ui/card';
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useRealtimeList } from '@/hooks/useRealtimeList';
import { Video } from 'lucide-react';

export default function Teleconsulta() {
  const { data, loading, error } = useRealtimeList<any>({
    table: 'teleconsultations',
    order: { column: 'created_at', ascending: false },
  });

  return (
    <DashboardLayout requiredRoles={['owner', 'doctor']}>
      <div className="p-8 space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Teleconsulta</h1>
          <p className="text-muted-foreground mt-1">Atendimento remoto por vídeo</p>
        </div>

        <Card className="bg-card border-border p-6">
          <Table>
            <TableCaption>
              {loading ? 'Carregando…' : error ? `Erro: ${error}` : `${data.length} sessão(ões)`}
            </TableCaption>
            <TableHeader>
              <TableRow>
                <TableHead>Consulta</TableHead>
                <TableHead>Início</TableHead>
                <TableHead>Fim</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>URL</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((t) => (
                <TableRow key={t.id}>
                  <TableCell>{t.appointment_id}</TableCell>
                  <TableCell>{t.start_time ? new Date(t.start_time).toLocaleString() : '-'}</TableCell>
                  <TableCell>{t.end_time ? new Date(t.end_time).toLocaleString() : '-'}</TableCell>
                  <TableCell>{t.status}</TableCell>
                  <TableCell className="truncate max-w-[320px]">{t.meeting_url ?? '-'}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      </div>
    </DashboardLayout>
  );
}
