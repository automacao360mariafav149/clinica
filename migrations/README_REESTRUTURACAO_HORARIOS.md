# Reestruturação da Tabela `doctor_schedules`

## 📅 Data: 2025-10-06

## 🎯 Objetivo

Reestruturar a tabela `doctor_schedules` de um modelo **vertical** (normalizado) para um modelo **horizontal** (desnormalizado), onde cada médico tem **apenas 1 linha** no banco com colunas para todos os dias da semana.

---

## 🔄 Mudanças na Estrutura

### **ANTES** (Modelo Vertical - Normalizado)

```sql
-- 7 linhas por médico (uma para cada dia da semana)
CREATE TABLE doctor_schedules (
  id UUID PRIMARY KEY,
  doctor_id UUID REFERENCES profiles(id),
  day_of_week INTEGER (0-6),
  start_time TIME,
  end_time TIME,
  appointment_duration INTEGER,
  break_start_time TIME,
  break_end_time TIME,
  is_active BOOLEAN,
  UNIQUE(doctor_id, day_of_week)
);
```

**Exemplo de dados:**
| id | doctor_id | day_of_week | start_time | end_time | is_active |
|----|-----------|-------------|------------|----------|-----------|
| 1  | abc-123   | 1 (Segunda) | 08:00      | 18:00    | true      |
| 2  | abc-123   | 2 (Terça)   | 08:00      | 18:00    | true      |
| 3  | abc-123   | 3 (Quarta)  | 08:00      | 18:00    | true      |
| ...| ...       | ...         | ...        | ...      | ...       |

---

### **DEPOIS** (Modelo Horizontal - Desnormalizado)

```sql
-- 1 linha por médico com todas as informações dos 7 dias
CREATE TABLE doctor_schedules (
  id UUID PRIMARY KEY,
  doctor_id UUID UNIQUE REFERENCES profiles(id),
  appointment_duration INTEGER,
  
  -- Segunda-feira
  seg_inicio TIME,
  seg_pausa_inicio TIME,
  seg_pausa_fim TIME,
  seg_fim TIME,
  seg_ativo BOOLEAN,
  
  -- Terça-feira
  ter_inicio TIME,
  ter_pausa_inicio TIME,
  ter_pausa_fim TIME,
  ter_fim TIME,
  ter_ativo BOOLEAN,
  
  -- ... (Quarta, Quinta, Sexta, Sábado, Domingo)
  ...
);
```

**Exemplo de dados:**
| id | doctor_id | appointment_duration | seg_inicio | seg_fim | seg_ativo | ter_inicio | ter_fim | ter_ativo | ... |
|----|-----------|---------------------|------------|---------|-----------|------------|---------|-----------|-----|
| 1  | abc-123   | 30                  | 08:00      | 18:00   | true      | 08:00      | 18:00   | true      | ... |

---

## ✅ Vantagens da Nova Estrutura

1. **Performance**: 
   - Apenas **1 query** para buscar todos os horários de um médico
   - **1 UPDATE** para salvar todas as alterações
   - Sem necessidade de JOINs ou filtros por `day_of_week`

2. **Simplicidade**:
   - Uma linha = um médico completo
   - Mais fácil de visualizar e entender

3. **Atomicidade**:
   - Todas as alterações são salvas de uma vez
   - Menos chances de inconsistências

4. **UPSERT Simplificado**:
   - Conflito apenas por `doctor_id` (antes era `doctor_id + day_of_week`)

---

## ⚠️ Desvantagens

1. **Muitas Colunas**: 
   - 40 colunas no total (5 campos × 7 dias + campos de controle)
   
2. **Menos Normalizado**:
   - Pode ter dados NULL em muitas colunas

3. **Alterações no Schema**:
   - Adicionar novos campos requer adicionar 7 colunas (uma por dia)

---

## 📊 Estrutura Detalhada

### Colunas por Dia da Semana

Cada dia tem **5 colunas**:

| Coluna | Tipo | Descrição | Exemplo |
|--------|------|-----------|---------|
| `{dia}_inicio` | TIME | Horário de início do expediente | `08:00` |
| `{dia}_pausa_inicio` | TIME | Início do intervalo (almoço) | `12:00` |
| `{dia}_pausa_fim` | TIME | Fim do intervalo | `14:00` |
| `{dia}_fim` | TIME | Horário de término do expediente | `18:00` |
| `{dia}_ativo` | BOOLEAN | Se o médico trabalha neste dia | `true` |

### Prefixos dos Dias

- `seg_` - Segunda-feira (day_of_week = 1)
- `ter_` - Terça-feira (day_of_week = 2)
- `qua_` - Quarta-feira (day_of_week = 3)
- `qui_` - Quinta-feira (day_of_week = 4)
- `sex_` - Sexta-feira (day_of_week = 5)
- `sab_` - Sábado (day_of_week = 6)
- `dom_` - Domingo (day_of_week = 0)

---

## 🔧 Migração Automática

A migration **11º_Migration_restructure_doctor_schedules.sql** realiza:

1. ✅ Backup dos dados existentes (tabela temporária)
2. ✅ Drop da tabela antiga
3. ✅ Criação da nova estrutura
4. ✅ Migração dos dados (vertical → horizontal)
5. ✅ Recriação das políticas RLS
6. ✅ Recriação dos índices
7. ✅ Limpeza do backup

**Nota**: A migração é segura e preserva todos os dados existentes.

---

## 💻 Mudanças no Código Frontend

### Hook: `useDoctorSchedule.ts`

**Novas Funcionalidades:**

1. **Interface `DoctorScheduleDB`**: Representa a estrutura horizontal do banco
2. **Função `dbToSchedules()`**: Converte de horizontal (banco) para vertical (componente)
3. **Função `schedulesToDb()`**: Converte de vertical (componente) para horizontal (banco)
4. **Método `saveAllSchedules()`**: Salva todos os 7 dias de uma vez (UPSERT)

**Funções Deprecated:**
- `saveSchedule()` - Use `saveAllSchedules()`
- `toggleScheduleActive()` - Use `saveAllSchedules()`

### Página: `DoctorSchedule.tsx`

**Mudanças:**

```typescript
// ANTES
const { saveSchedule } = useDoctorSchedule(doctorId);

// DEPOIS
const { saveAllSchedules } = useDoctorSchedule(doctorId);
```

```typescript
// ANTES - Salvava um por um
await Promise.all(Object.values(schedules).map(schedule => saveSchedule(schedule)));

// DEPOIS - Salva todos de uma vez
await saveAllSchedules(localSchedules);
```

---

## 📝 Exemplos de Uso

### 1. Inserir Horário de um Médico

```sql
INSERT INTO doctor_schedules (
  doctor_id,
  appointment_duration,
  seg_inicio, seg_pausa_inicio, seg_pausa_fim, seg_fim, seg_ativo,
  ter_inicio, ter_pausa_inicio, ter_pausa_fim, ter_fim, ter_ativo,
  qua_inicio, qua_pausa_inicio, qua_pausa_fim, qua_fim, qua_ativo,
  qui_inicio, qui_pausa_inicio, qui_pausa_fim, qui_fim, qui_ativo,
  sex_inicio, sex_pausa_inicio, sex_pausa_fim, sex_fim, sex_ativo,
  sab_inicio, sab_pausa_inicio, sab_pausa_fim, sab_fim, sab_ativo,
  dom_inicio, dom_pausa_inicio, dom_pausa_fim, dom_fim, dom_ativo
) VALUES (
  'uuid-do-medico',
  30,
  '08:00', '12:00', '14:00', '18:00', true,  -- Segunda
  '08:00', '12:00', '14:00', '18:00', true,  -- Terça
  '08:00', '12:00', '14:00', '18:00', true,  -- Quarta
  '08:00', '12:00', '14:00', '18:00', true,  -- Quinta
  '08:00', '12:00', '14:00', '18:00', true,  -- Sexta
  '08:00', NULL, NULL, '12:00', true,        -- Sábado (meio período)
  NULL, NULL, NULL, NULL, false              -- Domingo (inativo)
)
ON CONFLICT (doctor_id) DO UPDATE SET
  seg_inicio = EXCLUDED.seg_inicio,
  seg_fim = EXCLUDED.seg_fim,
  -- ... (outros campos)
  updated_at = NOW();
```

### 2. Consultar Horários

```sql
-- Busca todos os horários de um médico (1 linha)
SELECT * FROM doctor_schedules 
WHERE doctor_id = 'uuid-do-medico';
```

### 3. Atualizar Apenas Segunda-feira

```sql
UPDATE doctor_schedules
SET 
  seg_inicio = '09:00',
  seg_fim = '17:00',
  updated_at = NOW()
WHERE doctor_id = 'uuid-do-medico';
```

---

## 🧪 Teste Realizado

**Médico de Teste**: Arthur Riolo (Cardiologista)
- **UUID**: `a3efa07f-d3db-4729-ab56-7e61e8921a13`
- **Horários Configurados**: Segunda, Quarta, Quinta, Sexta (08:00-18:00 com pausa 12:00-13:00)
- **Status**: ✅ Funcionando corretamente

---

## 📚 Arquivos Relacionados

- **Migration**: `migrations/11º_Migration_restructure_doctor_schedules.sql`
- **Seed**: `seeds/4º_Seed_example_doctor_schedules_horizontal.sql`
- **Hook**: `src/hooks/useDoctorSchedule.ts`
- **Página**: `src/pages/DoctorSchedule.tsx`

---

## 🚀 Como Aplicar

1. Execute a migration no banco:
   ```bash
   # Via MCP do Supabase (já aplicada)
   ```

2. O código frontend já está atualizado e pronto para uso

3. Configure os horários através do menu:
   - Usuários → Agenda (botão ao lado do médico)

---

## ✨ Conclusão

A nova estrutura simplifica drasticamente as operações de leitura e escrita dos horários dos médicos, reduzindo a quantidade de queries e facilitando a manutenção do código.

**Autor**: Sistema MedX
**Data**: 2025-10-06

