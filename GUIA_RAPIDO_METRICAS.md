# 🚀 Guia Rápido - Métricas do Dashboard MedX

---

## 📊 Acesso Rápido

### Ver Métricas no Dashboard
```
1. Faça login como 'owner'
2. Acesse o menu "Métricas"
3. Visualize as 8 métricas em tempo real
```

### Consultar Métricas no Banco
```sql
SELECT * FROM get_dashboard_metrics();
```

---

## 🎯 Métricas Disponíveis

| # | Métrica | O Que Mostra | Origem |
|---|---------|--------------|--------|
| 1 | **Consultas Hoje** | Agendamentos para hoje | `appointments` |
| 2 | **Pacientes CRM** | Total de pacientes cadastrados | `patients` |
| 3 | **Pré Pacientes** | Leads aguardando conversão | `pre_patients` |
| 4 | **Equipe Médica** | Médicos + secretárias | `profiles` |
| 5 | **Mensagens WhatsApp** | Mensagens hoje | `messages` |
| 6 | **Follow-ups Pendentes** | Ações aguardando | `follow_ups` |
| 7 | **Prontuários** | Registros criados | `medical_records` |
| 8 | **Consultas IA** | Agentes utilizados | `agent_consultations` |

---

## 💻 Como Usar no Código

### Importar o Hook
```typescript
import { useDashboardMetrics } from '@/hooks/useDashboardMetrics';
```

### Usar no Componente
```typescript
function MeuComponente() {
  const metrics = useDashboardMetrics();
  
  // Verificar loading
  if (metrics.loading) return <div>Carregando...</div>;
  
  // Verificar erro
  if (metrics.error) return <div>Erro: {metrics.error}</div>;
  
  // Usar métricas
  return (
    <div>
      <h1>Consultas Hoje: {metrics.consultasHoje}</h1>
      <h2>Pacientes: {metrics.pacientesCRM}</h2>
      <h3>Médicos: {metrics.totalMedicos}</h3>
    </div>
  );
}
```

### Calcular Tendências
```typescript
const trend = metrics.calculateTrend(
  metrics.consultasMesAtual,    // Mês atual
  metrics.consultasMesAnterior  // Mês anterior
);
// Resultado: "+50%" ou "-25%" ou "0%"
```

### Atualizar Métricas
```typescript
<button onClick={metrics.refresh}>
  Atualizar Métricas
</button>
```

---

## 🗄️ Consultas SQL Úteis

### Ver Todas as Métricas
```sql
SELECT * FROM get_dashboard_metrics();
```

### Consultas de Hoje
```sql
SELECT * FROM appointments 
WHERE DATE(scheduled_at) = CURRENT_DATE;
```

### Pacientes Novos Este Mês
```sql
SELECT * FROM patients 
WHERE created_at >= DATE_TRUNC('month', CURRENT_DATE);
```

### Follow-ups Pendentes
```sql
SELECT * FROM follow_ups 
WHERE status = 'pending'
ORDER BY due_date;
```

### Top 5 Médicos (por consultas)
```sql
SELECT 
  p.name,
  COUNT(a.id) as total_consultas
FROM profiles p
LEFT JOIN appointments a ON p.id = a.doctor_id
WHERE p.role = 'doctor'
GROUP BY p.id, p.name
ORDER BY total_consultas DESC
LIMIT 5;
```

---

## 🎨 Tipos de Dados

```typescript
interface DashboardMetrics {
  // Consultas
  consultasHoje: number;
  consultasMesAtual: number;
  consultasMesAnterior: number;
  
  // Pacientes
  pacientesCRM: number;
  pacientesCRMMesAtual: number;
  pacientesCRMMesAnterior: number;
  prePatientes: number;
  
  // Equipe
  totalMedicos: number;
  totalSecretarias: number;
  
  // Comunicação
  mensagensHoje: number;
  mensagensMesAtual: number;
  
  // Outros
  followupsPendentes: number;
  prontuariosCriados: number;
  consultasIA: number;
  
  // Estado
  loading: boolean;
  error: string | null;
}
```

---

## 🔧 Troubleshooting

### Métricas não aparecem?
1. Verifique se está logado como `owner`
2. Verifique a conexão com o Supabase
3. Verifique se a function `get_dashboard_metrics()` existe:
   ```sql
   SELECT proname FROM pg_proc WHERE proname = 'get_dashboard_metrics';
   ```

### Erro "RPC not found"?
Execute a migration:
```sql
-- Ver arquivo: migrations/25º_Migration_create_dashboard_metrics_function.sql
```

### Métricas sempre em 0?
É normal em ambientes novos. Para testar:
1. Crie alguns pacientes
2. Agende consultas
3. Envie mensagens
4. Ou use o seed de teste: `seeds/3º_Seed_dados_teste_metricas.sql`

---

## 📊 Exemplos de Uso

### Dashboard Simples
```typescript
function SimpleDashboard() {
  const { consultasHoje, pacientesCRM, loading } = useDashboardMetrics();
  
  if (loading) return <Spinner />;
  
  return (
    <div className="grid grid-cols-2 gap-4">
      <Card>
        <h3>Consultas Hoje</h3>
        <p className="text-4xl">{consultasHoje}</p>
      </Card>
      <Card>
        <h3>Pacientes</h3>
        <p className="text-4xl">{pacientesCRM}</p>
      </Card>
    </div>
  );
}
```

### Com Trends
```typescript
function DashboardWithTrends() {
  const metrics = useDashboardMetrics();
  
  const consultasTrend = metrics.calculateTrend(
    metrics.consultasMesAtual,
    metrics.consultasMesAnterior
  );
  
  return (
    <Card>
      <h3>Consultas Este Mês</h3>
      <p className="text-4xl">{metrics.consultasMesAtual}</p>
      <p className={
        consultasTrend.startsWith('+') ? 'text-green-500' : 'text-red-500'
      }>
        {consultasTrend} vs. mês anterior
      </p>
    </Card>
  );
}
```

### Com Refresh
```typescript
function RefreshableDashboard() {
  const metrics = useDashboardMetrics();
  
  return (
    <div>
      <button 
        onClick={metrics.refresh}
        disabled={metrics.loading}
      >
        {metrics.loading ? 'Atualizando...' : 'Atualizar'}
      </button>
      
      <div className="grid grid-cols-3 gap-4 mt-4">
        <MetricCard 
          title="Consultas Hoje" 
          value={metrics.consultasHoje} 
        />
        <MetricCard 
          title="Pacientes" 
          value={metrics.pacientesCRM} 
        />
        <MetricCard 
          title="Médicos" 
          value={metrics.totalMedicos} 
        />
      </div>
    </div>
  );
}
```

---

## 🎯 Melhores Práticas

✅ **Use o hook** ao invés de consultas diretas  
✅ **Implemente loading states** para melhor UX  
✅ **Trate erros** adequadamente  
✅ **Cache métricas** se necessário (React Query)  
✅ **Atualize periodicamente** (ex: a cada 5 minutos)  
✅ **Documente** novas métricas adicionadas  

---

## 📚 Referências Rápidas

| Recurso | Localização |
|---------|-------------|
| Hook | `src/hooks/useDashboardMetrics.ts` |
| Dashboard | `src/pages/Dashboard.tsx` |
| Migration | `migrations/25º_Migration_create_dashboard_metrics_function.sql` |
| Seed Teste | `seeds/3º_Seed_dados_teste_metricas.sql` |
| Docs Completa | `AJUSTE_METRICAS_DASHBOARD_2025-10-28.md` |
| Resumo | `RESUMO_AJUSTE_METRICAS_2025-10-28.md` |

---

## 🆘 Suporte

Problemas? Verifique:
1. `AJUSTE_METRICAS_DASHBOARD_2025-10-28.md` - Documentação completa
2. `RESUMO_AJUSTE_METRICAS_2025-10-28.md` - Resumo executivo
3. Console do navegador para erros JavaScript
4. Logs do Supabase para erros de banco

---

**✅ Pronto para usar!**

Todas as métricas estão funcionando e mostrando dados reais do banco de dados.


