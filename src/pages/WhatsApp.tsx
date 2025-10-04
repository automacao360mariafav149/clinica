import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card } from '@/components/ui/card';
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useRealtimeList } from '@/hooks/useRealtimeList';
import { MessageCircle } from 'lucide-react';

export default function WhatsApp() {
  const { data, loading, error } = useRealtimeList<any>({
    table: 'messages',
    order: { column: 'sent_at', ascending: false },
  });

  return (
    <DashboardLayout requiredRoles={['owner', 'secretary']}>
      <div className="p-8 space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground">WhatsApp</h1>
          <p className="text-muted-foreground mt-1">Gestão de conversas com pacientes</p>
        </div>

        <Card className="bg-card border-border p-6">
          <Table>
            <TableCaption>
              {loading ? 'Carregando…' : error ? `Erro: ${error}` : `${data.length} mensagem(ns)`}
            </TableCaption>
            <TableHeader>
              <TableRow>
                <TableHead>Paciente</TableHead>
                <TableHead>Direção</TableHead>
                <TableHead>Canal</TableHead>
                <TableHead>Conteúdo</TableHead>
                <TableHead>Enviada em</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((m) => (
                <TableRow key={m.id}>
                  <TableCell>{m.patient_id}</TableCell>
                  <TableCell>{m.direction}</TableCell>
                  <TableCell>{m.channel}</TableCell>
                  <TableCell className="max-w-[480px] truncate">{m.content}</TableCell>
                  <TableCell>{new Date(m.sent_at).toLocaleString()}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      </div>
    </DashboardLayout>
  );
}
