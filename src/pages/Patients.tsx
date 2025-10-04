import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { MagicBentoCard } from '@/components/bento/MagicBento';
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useRealtimeList } from '@/hooks/useRealtimeList';
import { Users } from 'lucide-react';

export default function Patients() {
  const { data, loading, error } = useRealtimeList<any>({
    table: 'patients',
    order: { column: 'created_at', ascending: false },
  });

  return (
    <DashboardLayout>
      <div className="p-8 space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Pacientes</h1>
          <p className="text-muted-foreground mt-1">Sistema de gestão de pacientes (CRM)</p>
        </div>

        <MagicBentoCard contentClassName="p-6">
          <Table>
            <TableCaption>
              {loading ? 'Carregando…' : error ? `Erro: ${error}` : `${data.length} paciente(s)`}
            </TableCaption>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Telefone</TableHead>
                <TableHead>Data de nascimento</TableHead>
                <TableHead>Criado em</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((p) => (
                <TableRow key={p.id}>
                  <TableCell>{p.name}</TableCell>
                  <TableCell>{p.email ?? '-'}</TableCell>
                  <TableCell>{p.phone ?? '-'}</TableCell>
                  <TableCell>{p.birth_date ?? '-'}</TableCell>
                  <TableCell>{new Date(p.created_at).toLocaleString()}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </MagicBentoCard>
      </div>
    </DashboardLayout>
  );
}
