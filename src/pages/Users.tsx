import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { MagicBentoCard } from '@/components/bento/MagicBento';
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useRealtimeList } from '@/hooks/useRealtimeList';
import { Settings } from 'lucide-react';

export default function Users() {
  const { data, loading, error } = useRealtimeList<any>({
    table: 'profiles',
    order: { column: 'created_at', ascending: false },
  });

  return (
    <DashboardLayout requiredRoles={['owner']}>
      <div className="p-8 space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Gerenciar Usuários</h1>
          <p className="text-muted-foreground mt-1">Administração de médicos e secretárias</p>
        </div>

        <MagicBentoCard contentClassName="p-6">
          <Table>
            <TableCaption>
              {loading ? 'Carregando…' : error ? `Erro: ${error}` : `${data.length} usuário(s)`}
            </TableCaption>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Perfil</TableHead>
                <TableHead>Auth User</TableHead>
                <TableHead>Criado em</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((u) => (
                <TableRow key={u.id}>
                  <TableCell>{u.name}</TableCell>
                  <TableCell className="capitalize">{u.role}</TableCell>
                  <TableCell className="truncate max-w-[240px]">{u.auth_user_id ?? '-'}</TableCell>
                  <TableCell>{new Date(u.created_at).toLocaleString()}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </MagicBentoCard>
      </div>
    </DashboardLayout>
  );
}
