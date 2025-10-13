# 📘 Exemplos Práticos - Sistema de Convênios

## 🎯 Cenários de Uso Real

### Cenário 1: Clínica Nova - Primeiras Configurações

**Situação:** Você acabou de abrir uma clínica e quer configurar os convênios aceitos.

**Passo a passo:**

1. **Acesse o menu Convênios**
   ```
   Sidebar → Convênios 🏢
   ```

2. **Analise os convênios disponíveis**
   - Veja as 11 maiores operadoras
   - Verifique market share e beneficiários
   - Avalie a cobertura (Regional, Estadual, Nacional)

3. **Comece pelos mais populares da sua região**
   
   **Se você está em SP/RJ:**
   - ✅ Amil (3.13M beneficiários)
   - ✅ SulAmérica (2.88M beneficiários)
   - ✅ Bradesco Saúde (3.72M beneficiários)

   **Se você está no Nordeste:**
   - ✅ Hapvida (4.41M beneficiários)
   - ✅ Unimed Regional
   
4. **Selecione os planos básicos primeiro**
   - Clique na operadora para expandir
   - Marque os planos Básicos e Intermediários
   - Depois adicione Premium conforme demanda

---

### Cenário 2: Expandir Convênios Aceitos

**Situação:** Sua clínica já aceita alguns convênios e quer expandir.

**Recomendação de expansão:**

```
Fase 1 - Convênios Regionais:
├─ Unimed Regional
├─ Assim Saúde (se RJ)
└─ Porto Seguro Saúde 200

Fase 2 - Convênios Nacionais:
├─ Bradesco Saúde Nacional Flex
├─ Amil One Health
└─ SulAmérica Executivo

Fase 3 - Convênios Premium:
├─ Care Plus
├─ Golden Cross Premium
└─ Unimed Absoluto
```

**Como fazer:**

1. Busque a operadora desejada
2. Expanda para ver os planos
3. Analise tipo e cobertura
4. Clique para aceitar
5. Verifique o toast de confirmação ✅

---

### Cenário 3: Remover Convênio Não Rentável

**Situação:** Você percebeu que um convênio específico não compensa financeiramente.

**Como remover:**

1. **Identifique o convênio:**
   ```
   Menu Convênios → Buscar operadora → Expandir
   ```

2. **Localize o plano:**
   - Planos aceitos têm borda verde
   - Ícone de checkbox marcado ✓

3. **Remova:**
   - Clique no plano aceito (borda verde)
   - Ou clique no checkbox
   - Confirme no toast que aparece

4. **Verifique:**
   - Plano não tem mais borda verde
   - Estatísticas foram atualizadas
   - Contador de "Planos Aceitos" diminuiu

---

### Cenário 4: Análise de Cobertura

**Situação:** Você quer saber quantos beneficiários potenciais sua clínica atende.

**Como verificar:**

1. **Via Interface:**
   ```
   Cards no topo mostram:
   - Operadoras Aceitas
   - Planos Aceitos
   ```

2. **Via SQL (detalhado):**
   ```sql
   -- Execute no Supabase SQL Editor
   SELECT 
     COUNT(DISTINCT ic.id) as operadoras,
     SUM(DISTINCT ic.beneficiaries) as beneficiarios_potenciais,
     ROUND(AVG(ic.market_share), 2) as market_share_medio
   FROM insurance_companies ic
   JOIN insurance_plans ip ON ip.insurance_company_id = ic.id
   JOIN clinic_accepted_insurances cai ON cai.insurance_plan_id = ip.id
   WHERE cai.is_active = true;
   ```

3. **Exemplo de resultado:**
   ```
   ✅ 5 operadoras aceitas
   ✅ 15 planos aceitos
   ✅ ~12M beneficiários potenciais
   ✅ 6.2% market share médio
   ```

---

### Cenário 5: Preparar para Integração com Pacientes

**Situação:** Você quer começar a cadastrar convênios dos pacientes.

**Preparação:**

1. **Execute a query de integração:**
   ```sql
   -- Adicionar campos de convênio na tabela patients
   ALTER TABLE patients 
   ADD COLUMN IF NOT EXISTS insurance_plan_id UUID 
   REFERENCES insurance_plans(id);

   ALTER TABLE patients 
   ADD COLUMN IF NOT EXISTS insurance_card_number VARCHAR(50);

   ALTER TABLE patients 
   ADD COLUMN IF NOT EXISTS insurance_card_expiry DATE;

   CREATE INDEX IF NOT EXISTS idx_patients_insurance_plan 
   ON patients(insurance_plan_id);
   ```

2. **Modifique o cadastro de pacientes:**
   - Adicione dropdown para selecionar convênio
   - Adicione campo para número da carteirinha
   - Adicione campo para validade

3. **Valide automaticamente:**
   ```sql
   -- Criar função para validar se convênio é aceito
   CREATE OR REPLACE FUNCTION is_insurance_accepted(plan_id UUID)
   RETURNS BOOLEAN AS $$
   BEGIN
     RETURN EXISTS (
       SELECT 1 FROM clinic_accepted_insurances
       WHERE insurance_plan_id = plan_id AND is_active = true
     );
   END;
   $$ LANGUAGE plpgsql;
   ```

---

## 🎨 Exemplos Visuais de Fluxo

### Fluxo 1: Aceitar Novo Convênio

```
1. Login como Owner
   ↓
2. Menu → Convênios
   ↓
3. Buscar "Amil"
   ↓
4. Expandir Amil
   ↓
5. Ver 3 planos:
   - Amil Fácil (Básico - Regional)      [ ]
   - Amil Medial (Intermediário - Est.)   [ ]
   - Amil One Health (Premium - Nac.)     [ ]
   ↓
6. Clicar em "Amil Medial"
   ↓
7. Toast verde: "Convênio adicionado" ✅
   ↓
8. Card fica com borda verde [✓]
   ↓
9. Estatística atualiza: "Planos Aceitos: 1"
```

---

### Fluxo 2: Filtrar e Selecionar Múltiplos

```
1. Acessar Convênios
   ↓
2. Ver 11 operadoras listadas
   ↓
3. Buscar "Unimed"
   ↓
4. Lista filtra → mostra apenas Unimed
   ↓
5. Expandir Unimed → 9 planos
   ↓
6. Selecionar:
   ✅ Unimed Regional
   ✅ Unimed Nacional
   ✅ Unimed Pleno
   ↓
7. Estatísticas:
   - Operadoras Aceitas: 1
   - Planos Aceitos: 3
   ↓
8. Badge na operadora: "3 planos aceitos"
```

---

## 📊 Relatórios Úteis

### Relatório 1: Convênios Aceitos por Tipo

```sql
SELECT 
  ip.plan_type as "Tipo de Plano",
  COUNT(*) as "Total",
  STRING_AGG(ic.short_name || ' - ' || ip.name, ', ') as "Planos"
FROM clinic_accepted_insurances cai
JOIN insurance_plans ip ON ip.id = cai.insurance_plan_id
JOIN insurance_companies ic ON ic.id = ip.insurance_company_id
WHERE cai.is_active = true
GROUP BY ip.plan_type
ORDER BY COUNT(*) DESC;
```

**Resultado exemplo:**
```
Tipo          | Total | Planos
--------------|-------|----------------------------------------
Premium       |   5   | Amil - One Health, Bradesco - Top, ...
Intermediário |   7   | Unimed - Regional, Porto - 400, ...
Básico        |   3   | Hapvida - Mix, Assim - Essencial, ...
```

---

### Relatório 2: Cobertura por Região

```sql
SELECT 
  ip.coverage_type as "Tipo de Cobertura",
  COUNT(*) as "Total de Planos",
  ROUND(AVG(ic.market_share), 2) as "Market Share Médio %"
FROM clinic_accepted_insurances cai
JOIN insurance_plans ip ON ip.id = cai.insurance_plan_id
JOIN insurance_companies ic ON ic.id = ip.insurance_company_id
WHERE cai.is_active = true
GROUP BY ip.coverage_type
ORDER BY COUNT(*) DESC;
```

**Resultado exemplo:**
```
Cobertura | Total | Market Share Médio
----------|-------|-------------------
Nacional  |   8   | 6.5%
Estadual  |   4   | 4.2%
Regional  |   3   | 5.8%
```

---

### Relatório 3: Top 3 Operadoras Aceitas

```sql
SELECT 
  ic.name as "Operadora",
  COUNT(cai.id) as "Planos Aceitos",
  ic.beneficiaries as "Beneficiários",
  ic.market_share as "Market Share %"
FROM insurance_companies ic
JOIN insurance_plans ip ON ip.insurance_company_id = ic.id
JOIN clinic_accepted_insurances cai ON cai.insurance_plan_id = ip.id
WHERE cai.is_active = true
GROUP BY ic.id, ic.name, ic.beneficiaries, ic.market_share
ORDER BY COUNT(cai.id) DESC
LIMIT 3;
```

---

## 💡 Dicas Práticas

### ✅ Boas Práticas

1. **Comece pequeno:**
   - Aceite 3-5 convênios principais
   - Expanda gradualmente

2. **Analise por região:**
   - Priorize convênios locais
   - Depois expanda para nacionais

3. **Balanceie tipos:**
   - Mix de Básico, Intermediário e Premium
   - Não foque apenas em Premium

4. **Documente restrições:**
   - Use o campo "notes" (futuro)
   - Anote carências, limites, etc.

5. **Revise periodicamente:**
   - A cada 3 meses, analise
   - Remova convênios não utilizados
   - Adicione os mais solicitados

---

### ⚠️ Cuidados

1. **Não aceite todos:**
   - Ser seletivo é melhor
   - Foco em qualidade, não quantidade

2. **Verifique credenciamento:**
   - Sistema mostra convênios disponíveis
   - Você precisa fazer credenciamento oficial

3. **Considere custos:**
   - Alguns convênios têm taxas
   - Analise viabilidade financeira

4. **Comunique mudanças:**
   - Avise pacientes sobre novos convênios
   - Informe remoções com antecedência

---

## 🎯 Casos de Uso Avançados

### Caso 1: Dashboard Personalizado

Crie uma view para dashboard:

```sql
CREATE OR REPLACE VIEW v_insurance_dashboard AS
SELECT 
  'Total de Operadoras Aceitas' as metrica,
  COUNT(DISTINCT ic.id)::text as valor
FROM insurance_companies ic
JOIN insurance_plans ip ON ip.insurance_company_id = ic.id
JOIN clinic_accepted_insurances cai ON cai.insurance_plan_id = ip.id
WHERE cai.is_active = true

UNION ALL

SELECT 
  'Total de Planos Aceitos',
  COUNT(*)::text
FROM clinic_accepted_insurances
WHERE is_active = true

UNION ALL

SELECT 
  'Beneficiários Potenciais',
  (SUM(DISTINCT ic.beneficiaries) / 1000000)::text || 'M'
FROM insurance_companies ic
JOIN insurance_plans ip ON ip.insurance_company_id = ic.id
JOIN clinic_accepted_insurances cai ON cai.insurance_plan_id = ip.id
WHERE cai.is_active = true;
```

---

### Caso 2: Alertas de Expiração (Futuro)

```sql
-- Alertar sobre carteirinhas expirando em 30 dias
SELECT 
  p.name as paciente,
  ic.name as operadora,
  ip.name as plano,
  p.insurance_card_number as carteirinha,
  p.insurance_card_expiry as validade,
  p.insurance_card_expiry - CURRENT_DATE as dias_restantes
FROM patients p
JOIN insurance_plans ip ON ip.id = p.insurance_plan_id
JOIN insurance_companies ic ON ic.id = ip.insurance_company_id
WHERE p.insurance_card_expiry <= CURRENT_DATE + INTERVAL '30 days'
  AND p.insurance_card_expiry >= CURRENT_DATE
ORDER BY p.insurance_card_expiry;
```

---

## 🚀 Próximos Passos Sugeridos

### Semana 1-2:
- [x] Configurar convênios aceitos
- [ ] Testar interface
- [ ] Treinar equipe

### Semana 3-4:
- [ ] Adicionar campo de convênio no cadastro de pacientes
- [ ] Migrar pacientes existentes
- [ ] Validar dados

### Mês 2:
- [ ] Criar relatórios de uso
- [ ] Analisar convênios mais utilizados
- [ ] Ajustar lista de aceitos

### Mês 3+:
- [ ] Implementar validação de carteirinhas
- [ ] Criar tabela de honorários
- [ ] Exportar relatórios

---

## 📞 Precisa de Ajuda?

### Consulte:

1. **GUIA_RAPIDO_APLICAR_CONVENIOS.md**
   - Instalação passo a passo

2. **QUERIES_UTEIS_CONVENIOS.md**
   - Consultas SQL prontas

3. **IMPLEMENTACAO_SISTEMA_CONVENIOS.md**
   - Documentação técnica completa

4. **RESUMO_SISTEMA_CONVENIOS.md**
   - Visão geral do sistema

---

**Documento criado em:** 13/10/2025  
**Exemplos baseados em:** Casos reais de uso  
**Sistema:** MedX - Módulo de Convênios v1.0

