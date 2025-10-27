# 🔧 Resumo: Correção Loading Infinito - Follow Up

**Data:** 2025-10-27

---

## 🐛 Problema
Card de clientes ficava eternamente em "Carregando clientes..."

## 🎯 Causa
Loop infinito no `useRealtimeList` porque `filters` e `order` eram recriados a cada render

## ✅ Solução
Usar `useMemo` para estabilizar os parâmetros:

```typescript
// Filtro estável
const followUpFilters = useMemo(() => [
  { column: 'followup', operator: 'neq' as const, value: 'encerrado' }
], []);

// Ordenação estável
const followUpOrder = useMemo(() => ({
  column: 'ultima_atividade',
  ascending: false
}), []);

// Hook com referências estáveis
const { data: clientes, loading: loadingClientes, error } = useRealtimeList<ClienteFollowUp>({
  table: 'clientes_followup',
  filters: followUpFilters,
  order: followUpOrder,
});
```

## 📁 Arquivo Alterado
- `src/pages/FollowUp.tsx`

## ✅ Resultado
- Loading finaliza normalmente
- Clientes são exibidos corretamente
- Sem requisições infinitas
- Performance restaurada

