# 📊 Gráficos de Métricas - Dashboard MedX

## Visão Geral

Sistema de visualização de métricas clínicas com gráficos interativos e dinâmicos usando **Recharts**.

---

## 🎨 Componentes de Gráficos

### 1. **PeakHoursChartCard** - Horários Mais Procurados
**Tipo:** Gráfico de Barras (BarChart)  
**Dados:** appointments.scheduled_at  
**Visualização:**
- Barras verticais com cores degradê (roxo)
- Ordenado por horário (8h - 22h)
- Tooltip mostra contagem de consultas por horário
- CartesianGrid para melhor leitura

**Cores:** `['#5227FF', '#8B5CF6', '#A78BFA', '#C4B5FD', '#DDD6FE']`

---

### 2. **WeekdayChartCard** - Agendamentos por Dia da Semana
**Tipo:** Gráfico de Barras (BarChart)  
**Dados:** appointments.scheduled_at (day of week)  
**Visualização:**
- 7 barras (Dom-Sáb), cada uma com cor diferente
- Cores vibrantes para cada dia da semana
- Tooltip mostra contagem por dia
- Fácil identificação de dias mais movimentados

**Cores:** `['#EF4444', '#F59E0B', '#10B981', '#3B82F6', '#8B5CF6', '#EC4899', '#F97316']`

---

### 3. **DoctorPieChartCard** - Ranking de Profissionais ⭐ PREMIUM
**Tipo:** Ranking Visual + Gráfico de Radar  
**Dados:** appointments.doctor_id + profiles  
**Visualização:**
- 🥇🥈🥉 Medalhas para Top 3
- Cards com gradiente para destaque
- Avatares coloridos com iniciais
- Estatísticas grandes (consultas + percentual)
- Barras de progresso animadas (1s duration)
- Gráfico de radar comparativo (top 5)
- Hover effects com scale
- Lista compacta para 4º+ posições

**Elementos Visuais:**
- Top 3: Cards grandes com gradiente e medalhas
- Badge de posição no topo direito
- Avatar 56x56px com gradiente
- Número grande (2xl) colorido
- Barra de progresso com gradiente
- Ícone Award para 1º lugar
- Mini radar chart na parte inferior

**Cores:** `['#5227FF', '#8B5CF6', '#A78BFA', '#C4B5FD', '#DDD6FE']`

---

### 4. **InsuranceDonutCard** - Mix de Convênios ⭐ PREMIUM
**Tipo:** Cards Coloridos + Gráfico de Barras  
**Dados:** patients.health_insurance  
**Visualização:**
- Cards individuais para cada convênio
- Percentual grande (2xl) em box com gradiente
- Ícones: 🏥 (convênios) / 💰 (particular)
- Barra de progresso com percentual inline
- Mini gráfico de barras comparativo
- Resumo com 3 métricas (Total/Convênios/Particular)
- Cores específicas por operadora
- Hover effects com scale + shadow

**Cores por Convênio:**
- Unimed: Verde `#10B981`
- Amil: Azul `#3B82F6`
- Bradesco: Vermelho `#EF4444`
- SulAmérica: Laranja `#F59E0B`
- Particular: Roxo `#8B5CF6`
- Padrão: Rosa `#EC4899`

---

### 5. **DiseaseTreemapCard** - Top Diagnósticos e Motivos
**Tipo:** Gráfico de Barras Horizontal (BarChart - layout vertical)  
**Dados:** 
- agent_consultations.cid_code + cid_description (Azul)
- appointments.reason (Verde)

**Visualização:**
- Top 12 diagnósticos/motivos
- Barras horizontais com cores por tipo:
  - 🔵 Azul (#3B82F6) = Diagnóstico CID
  - 🟢 Verde (#10B981) = Motivo Consulta
- Tooltip customizado mostra nome completo e tipo
- Legenda explicativa na parte inferior
- Nomes truncados no eixo Y (máx 40 caracteres)

---

## 🎯 Características Técnicas

### Responsividade
Todos os gráficos usam `<ResponsiveContainer width="100%" height={300}>` (ou 400px para diagnósticos)

### Dados em Tempo Real
Todos os componentes usam `useRealtimeList` do Supabase para atualização automática

### Tema Dark Mode
- Background tooltips: `#1a1a1a`
- Border: `#333`
- Textos: `#fff` / `#888`
- Grid: `#333` com opacity 0.1

### Performance
- Cálculos com `useMemo` para evitar re-renders desnecessários
- Filtragem eficiente de dados
- Componentes otimizados

---

## 📦 Estrutura de Arquivos

```
src/components/metrics/
├── PeakHoursChartCard.tsx      # Gráfico de barras - Horários
├── WeekdayChartCard.tsx        # Gráfico de barras - Dias da semana
├── DoctorPieChartCard.tsx      # Gráfico de pizza - Médicos
├── InsuranceDonutCard.tsx      # Gráfico donut - Convênios
├── DiseaseTreemapCard.tsx      # Gráfico horizontal - Diagnósticos
├── index.ts                    # Exportações centralizadas
└── README_GRAFICOS_METRICAS.md # Esta documentação
```

---

## 🚀 Como Usar

### Importação Individual
```tsx
import { PeakHoursChartCard } from '@/components/metrics/PeakHoursChartCard';
```

### Importação do Index
```tsx
import { 
  PeakHoursChartCard,
  WeekdayChartCard,
  DoctorPieChartCard,
  InsuranceDonutCard,
  DiseaseTreemapCard
} from '@/components/metrics';
```

### Uso no Dashboard
```tsx
<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
  <PeakHoursChartCard />
  <WeekdayChartCard />
</div>
```

---

## 📊 Dados Necessários

### Tabelas do Banco de Dados
- `appointments` - Consultas agendadas (scheduled_at, doctor_id, reason)
- `patients` - Pacientes (health_insurance)
- `profiles` - Usuários/Médicos (full_name, role)
- `agent_consultations` - Consultas de IA (cid_code, cid_description)

### Migrations Relacionadas
- `10º_Migration_add_health_insurance_and_reason.sql` - Adiciona campos necessários

### Seeds Recomendados
- `3º_Seed_metrics_test_data.sql` - Dados de teste para visualizar gráficos

---

## 🎨 Customização

### Alterar Cores
Modifique o array `COLORS` em cada componente:

```tsx
const COLORS = ['#5227FF', '#8B5CF6', '#A78BFA']; // Suas cores aqui
```

### Alterar Altura
Modifique a prop `height` do ResponsiveContainer:

```tsx
<ResponsiveContainer width="100%" height={400}> // Altere aqui
```

### Alterar Dados Exibidos
Modifique os filtros no `useMemo`:

```tsx
.slice(0, 10) // Mostrar top 10 em vez de 12
.filter(d => d.value > 5) // Filtrar valores maiores que 5
```

---

## 🐛 Troubleshooting

### Gráfico não aparece
1. Verifique se há dados no banco
2. Execute o seed: `3º_Seed_metrics_test_data.sql`
3. Verifique o console do browser

### Cores não aparecem
1. Verifique se o Tailwind CSS está configurado
2. Certifique-se de que as cores hex estão corretas

### Performance lenta
1. Limite o número de dados exibidos (`.slice(0, N)`)
2. Adicione índices no banco de dados
3. Use paginação se necessário

---

## 📝 Notas

- Recharts versão: `^2.15.4`
- Compatível com React 18+
- Suporta TypeScript
- Acessível (ARIA labels)
- Mobile-friendly

---

## 🔮 Melhorias Futuras

- [ ] Adicionar filtros de data (últimos 7/30/90 dias)
- [ ] Exportar gráficos como PNG/SVG
- [ ] Adicionar animações de entrada
- [ ] Adicionar drill-down (clique para detalhes)
- [ ] Modo de comparação (período anterior)
- [ ] Gráficos de linha para tendências temporais

---

**Data de Criação:** 2025-10-06  
**Autor:** Sistema MedX  
**Versão:** 1.0.0
