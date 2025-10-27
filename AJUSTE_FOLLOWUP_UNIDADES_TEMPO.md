# ✅ Ajuste - Follow Up com Unidades de Tempo Flexíveis

**Data:** 2025-10-27  
**Status:** ✅ **IMPLEMENTADO E FUNCIONANDO**

---

## 🎯 Objetivo

Permitir que o usuário configure os períodos de follow-up usando diferentes unidades de tempo:
- ⏱️ **Segundos**
- ⏱️ **Minutos**  
- ⏱️ **Horas**
- ⏱️ **Dias**

**Regra:** Todos os valores são **convertidos e salvos em segundos** no banco de dados.

---

## 📊 Exemplo de Conversão

### Input do Usuário → Valor no Banco

| Usuário Digita | Unidade Escolhida | Salvo no Banco (segundos) |
|----------------|-------------------|---------------------------|
| 1 | Minuto | 60 |
| 5 | Minutos | 300 |
| 2 | Horas | 7200 |
| 1 | Dia | 86400 |
| 7 | Dias | 604800 |
| 30 | Segundos | 30 |

### Fórmulas de Conversão

```typescript
segundos = valor // 1 segundo = 1 segundo
minutos = valor * 60 // 1 minuto = 60 segundos
horas = valor * 3600 // 1 hora = 3600 segundos
dias = valor * 86400 // 1 dia = 86400 segundos
```

---

## 🗄️ Mudanças no Banco de Dados

### Migration: `50º_Migration_followup_config_usar_segundos.sql`

#### Renomeação de Colunas
```sql
-- Antes (dias)
followup1_days
followup2_days
followup3_days

-- Depois (segundos)
followup1_seconds
followup2_seconds
followup3_seconds
```

#### Conversão de Dados Existentes
```sql
-- Valores padrão atualizados
followup1_seconds = 604800   -- 7 dias em segundos
followup2_seconds = 1296000  -- 15 dias em segundos
followup3_seconds = 2592000  -- 30 dias em segundos
```

---

## 🎨 Interface Atualizada

### Antes
```
[  7  ] dias
[ 15  ] dias
[ 30  ] dias
```

### Depois
```
[  7  ] [Dias ▼]
[ 15  ] [Dias ▼]
[ 30  ] [Dias ▼]
```

### Layout Visual

```
┌─────────────────────────────────────────┐
│  1º Follow-up                           │
│  ┌──────┐  ┌──────────────┐            │
│  │  7   │  │ Dias      ▼  │            │
│  └──────┘  └──────────────┘            │
└─────────────────────────────────────────┘

Opções no dropdown:
- Segundos
- Minutos
- Horas
- Dias (padrão)
```

---

## 💻 Código Implementado

### 1. TypeScript - Types

```typescript
type TimeUnit = 'seconds' | 'minutes' | 'hours' | 'days';

interface FollowUpConfig {
  id: string;
  followup1_seconds: number;  // ✅ Mudou de _days para _seconds
  followup2_seconds: number;
  followup3_seconds: number;
}
```

### 2. Funções de Conversão

```typescript
// Converter qualquer unidade para segundos
const toSeconds = (value: number, unit: TimeUnit): number => {
  switch (unit) {
    case 'seconds': return value;
    case 'minutes': return value * 60;
    case 'hours': return value * 3600;
    case 'days': return value * 86400;
    default: return value;
  }
};

// Converter segundos para a melhor unidade de exibição
const fromSeconds = (seconds: number): { value: number; unit: TimeUnit } => {
  if (seconds % 86400 === 0) return { value: seconds / 86400, unit: 'days' };
  if (seconds % 3600 === 0) return { value: seconds / 3600, unit: 'hours' };
  if (seconds % 60 === 0) return { value: seconds / 60, unit: 'minutes' };
  return { value: seconds, unit: 'seconds' };
};
```

### 3. Estado do Componente

```typescript
const [editConfig, setEditConfig] = useState({
  followup1: { value: 7, unit: 'days' as TimeUnit },
  followup2: { value: 15, unit: 'days' as TimeUnit },
  followup3: { value: 30, unit: 'days' as TimeUnit },
});
```

### 4. Salvar Configuração

```typescript
const handleSaveConfig = async () => {
  // Converter para segundos antes de salvar
  const dataToSave = {
    followup1_seconds: toSeconds(editConfig.followup1.value, editConfig.followup1.unit),
    followup2_seconds: toSeconds(editConfig.followup2.value, editConfig.followup2.unit),
    followup3_seconds: toSeconds(editConfig.followup3.value, editConfig.followup3.unit),
  };
  
  // Salvar no banco...
};
```

### 5. Carregar Configuração

```typescript
useEffect(() => {
  async function loadConfig() {
    const { data } = await supabase.from('followup_config').select('*').single();
    
    // Converter segundos para unidade apropriada
    setEditConfig({
      followup1: fromSeconds(data.followup1_seconds),
      followup2: fromSeconds(data.followup2_seconds),
      followup3: fromSeconds(data.followup3_seconds),
    });
  }
  loadConfig();
}, []);
```

---

## 🧪 Exemplos de Uso

### Caso 1: Seguimento Rápido (Cirurgias)
```
1º Follow-up: 30  Minutos  → Salva: 1800 segundos
2º Follow-up: 2   Horas    → Salva: 7200 segundos
3º Follow-up: 1   Dia      → Salva: 86400 segundos
```

### Caso 2: Seguimento Padrão
```
1º Follow-up: 7   Dias → Salva: 604800 segundos
2º Follow-up: 15  Dias → Salva: 1296000 segundos
3º Follow-up: 30  Dias → Salva: 2592000 segundos
```

### Caso 3: Seguimento Ultra-Rápido (Emergências)
```
1º Follow-up: 120 Segundos → Salva: 120 segundos
2º Follow-up: 5   Minutos  → Salva: 300 segundos
3º Follow-up: 30  Minutos  → Salva: 1800 segundos
```

### Caso 4: Seguimento de Longo Prazo
```
1º Follow-up: 1  Dia     → Salva: 86400 segundos
2º Follow-up: 1  Semana* → Salva: 604800 segundos (7 dias)
3º Follow-up: 2  Meses*  → Salva: 5184000 segundos (60 dias)

* Ainda não implementado, mas pode configurar manualmente
```

---

## 📊 Tabela de Referência Rápida

### Conversões Comuns

| Valor | Unidade | Segundos | Equivalente |
|-------|---------|----------|-------------|
| 30 | Segundos | 30 | 0.5 minutos |
| 1 | Minuto | 60 | 60 segundos |
| 5 | Minutos | 300 | 5 minutos |
| 15 | Minutos | 900 | 0.25 horas |
| 30 | Minutos | 1800 | 0.5 horas |
| 1 | Hora | 3600 | 60 minutos |
| 2 | Horas | 7200 | 120 minutos |
| 6 | Horas | 21600 | 0.25 dias |
| 12 | Horas | 43200 | 0.5 dias |
| 1 | Dia | 86400 | 24 horas |
| 7 | Dias | 604800 | 1 semana |
| 15 | Dias | 1296000 | ~2 semanas |
| 30 | Dias | 2592000 | 1 mês |
| 60 | Dias | 5184000 | 2 meses |
| 90 | Dias | 7776000 | 3 meses |

---

## 🔄 Fluxo Completo

### 1. Usuário Configura
```
Interface: 
  1º Follow-up: [  2  ] [Horas ▼]
  2º Follow-up: [ 15  ] [Dias  ▼]
  3º Follow-up: [  1  ] [Mês*  ▼]  (* configurar como 30 dias)
```

### 2. Frontend Converte
```typescript
{
  followup1_seconds: 7200,     // 2 horas
  followup2_seconds: 1296000,  // 15 dias
  followup3_seconds: 2592000   // 30 dias
}
```

### 3. Banco Armazena
```sql
INSERT INTO followup_config VALUES (
  '...uuid...',
  NULL,
  7200,      -- followup1_seconds
  1296000,   -- followup2_seconds
  2592000,   -- followup3_seconds
  NOW(),
  NOW()
);
```

### 4. Frontend Carrega
```typescript
// Banco retorna: 7200 segundos
// Frontend converte: 2 horas
// Exibe: [  2  ] [Horas ▼]
```

---

## 🎯 Benefícios

### ✅ Flexibilidade
- Configurações rápidas (minutos/horas)
- Configurações médias (dias)
- Configurações longas (semanas/meses via dias)

### ✅ Precisão
- Valores exatos em segundos no banco
- Conversão automática e confiável
- Sem perda de precisão

### ✅ UX Amigável
- Usuário escolhe a unidade que faz sentido
- Conversão transparente
- Interface intuitiva

### ✅ Compatibilidade
- Sistema de automação pode usar segundos diretamente
- Fácil integração com schedulers
- Padrão universal (segundos)

---

## 🧪 Testes Realizados

### ✅ Teste 1: Salvar em Minutos
```typescript
Input: 5 minutos
Esperado no banco: 300 segundos
✅ Resultado: 300 segundos
```

### ✅ Teste 2: Salvar em Horas
```typescript
Input: 2 horas
Esperado no banco: 7200 segundos
✅ Resultado: 7200 segundos
```

### ✅ Teste 3: Salvar em Dias
```typescript
Input: 7 dias
Esperado no banco: 604800 segundos
✅ Resultado: 604800 segundos
```

### ✅ Teste 4: Carregar e Converter
```typescript
Banco: 604800 segundos
Esperado na interface: 7 dias
✅ Resultado: 7 dias
```

### ✅ Teste 5: Valores Irregulares
```typescript
Banco: 150 segundos
Esperado: 2.5 minutos (exibe como 150 segundos)
✅ Resultado: 150 segundos
```

---

## 📝 Arquivos Modificados

### Migration
- ✅ `migrations/50º_Migration_followup_config_usar_segundos.sql`

### Frontend
- ✅ `src/pages/FollowUp.tsx` (atualizado completamente)

### Documentação
- ✅ `AJUSTE_FOLLOWUP_UNIDADES_TEMPO.md` (este arquivo)

---

## 🚀 Como Usar Agora

### 1. Acesse a Página
```
/follow-up
```

### 2. Configure os Períodos
```
1º Follow-up: [  5  ] [Minutos ▼]
2º Follow-up: [  2  ] [Horas   ▼]
3º Follow-up: [  7  ] [Dias    ▼]
```

### 3. Salve
```
Clique em "Salvar Configuração"
✅ Toast: "Configuração salva com sucesso!"
```

### 4. Verifique no Banco (Opcional)
```sql
SELECT 
  followup1_seconds,
  followup2_seconds,
  followup3_seconds,
  followup1_seconds / 60 as minutos1,
  followup2_seconds / 3600 as horas2,
  followup3_seconds / 86400 as dias3
FROM followup_config;

-- Resultado:
-- followup1_seconds: 300    (5 minutos)
-- followup2_seconds: 7200   (2 horas)
-- followup3_seconds: 604800 (7 dias)
```

---

## 🔍 Troubleshooting

### Problema: Valores não aparecem corretamente
**Solução:** Limpe o cache e recarregue

### Problema: Não salva no banco
**Solução:** Verifique as políticas RLS (já corrigidas)

### Problema: Conversão errada
**Solução:** Verifique a unidade selecionada no dropdown

---

## ✅ Checklist de Implementação

- [x] Migration criada e executada
- [x] Colunas renomeadas (_days → _seconds)
- [x] Valores convertidos no banco (dias → segundos)
- [x] Interface atualizada com dropdowns
- [x] Funções de conversão implementadas
- [x] toSeconds() funcionando
- [x] fromSeconds() funcionando
- [x] handleSaveConfig() convertendo
- [x] useEffect() convertendo na carga
- [x] Testes realizados e validados
- [x] Sem erros de lint
- [x] Sem erros de TypeScript
- [x] Documentação completa

---

## 🎉 **IMPLEMENTAÇÃO 100% CONCLUÍDA!**

Agora o sistema de Follow Up suporta:
- ⏱️ Segundos
- ⏱️ Minutos
- ⏱️ Horas
- ⏱️ Dias

Tudo convertido e armazenado de forma padronizada em **segundos** no banco de dados! ✨

---

**Data de conclusão:** 27/10/2025  
**Versão:** 2.0  
**Status:** ✅ OPERACIONAL

