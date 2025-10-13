# 🚀 Guia Rápido: Aplicar Sistema de Convênios

## ⚡ Passos para Ativar o Sistema

### 1️⃣ Acessar o Supabase

1. Acesse: https://supabase.com
2. Faça login na sua conta
3. Selecione o projeto da clínica

---

### 2️⃣ Executar a Migration (Criar Tabelas)

1. No menu lateral, clique em **SQL Editor**
2. Clique em **+ New Query**
3. Abra o arquivo: `migrations/27º_Migration_create_insurance_tables.sql`
4. **Copie TODO o conteúdo** do arquivo
5. **Cole** no SQL Editor do Supabase
6. Clique em **Run** (▶️)
7. ✅ Aguarde a mensagem de sucesso

**O que foi criado:**
- ✅ Tabela `insurance_companies` (operadoras)
- ✅ Tabela `insurance_plans` (planos)
- ✅ Tabela `clinic_accepted_insurances` (convênios aceitos)
- ✅ Índices para performance
- ✅ Políticas RLS de segurança

---

### 3️⃣ Executar o Seed (Cadastrar Convênios)

1. Ainda no **SQL Editor**, clique em **+ New Query**
2. Abra o arquivo: `seeds/8º_Seed_insurance_companies_and_plans.sql`
3. **Copie TODO o conteúdo** do arquivo
4. **Cole** no SQL Editor do Supabase
5. Clique em **Run** (▶️)
6. ✅ Aguarde a mensagem de sucesso

**O que foi cadastrado:**
- ✅ 11 operadoras de planos de saúde
- ✅ 47 planos diversos (básicos, intermediários e premium)
- ✅ Dados reais de mercado (participação, beneficiários, etc)

---

### 4️⃣ Verificar Instalação

Execute este SQL para verificar:

```sql
-- Verificar operadoras cadastradas
SELECT COUNT(*) as total_operadoras FROM insurance_companies;
-- Resultado esperado: 11

-- Verificar planos cadastrados
SELECT COUNT(*) as total_planos FROM insurance_plans;
-- Resultado esperado: 47

-- Ver resumo completo
SELECT 
  ic.name as operadora,
  ic.market_share as "participação_mercado_%",
  COUNT(ip.id) as total_planos
FROM insurance_companies ic
LEFT JOIN insurance_plans ip ON ip.insurance_company_id = ic.id
GROUP BY ic.id, ic.name, ic.market_share
ORDER BY ic.market_share DESC;
```

---

### 5️⃣ Testar no Sistema

1. **Recarregue a aplicação** (F5 ou Ctrl+R)
2. Faça login como **Owner** ou **Secretary**
3. Clique no menu **"Convênios"** (ícone de prédio 🏢)
4. Você deve ver:
   - ✅ 11 operadoras disponíveis
   - ✅ Cards com estatísticas
   - ✅ Busca funcionando
   - ✅ Accordion com operadoras

5. **Teste a seleção de planos:**
   - Clique em uma operadora para expandir
   - Clique em um plano para aceitar
   - ✅ Deve aparecer um toast verde de sucesso
   - ✅ O card deve ficar com borda verde
   - ✅ As estatísticas devem atualizar

---

## 🎯 Principais Operadoras Cadastradas

| Operadora | Planos | Market Share |
|-----------|--------|--------------|
| Hapvida | 3 | 8.4% |
| NotreDame Intermédica | 4 | 8.2% |
| Bradesco Saúde | 4 | 7.1% |
| Amil | 3 | 6.0% |
| SulAmérica | 5 | 5.5% |
| Unimed | 9 | 1.7% |
| Porto Seguro | 3 | 1.3% |
| Prevent Senior | 3 | 1.0% |
| Assim Saúde | 3 | 1.0% |
| Golden Cross | 3 | 0.8% |
| Care Plus | 2 | 0.7% |

---

## 🎨 Como Usar a Interface

### Aceitar um Convênio:
1. Clique na operadora para expandir
2. Clique no card do plano ou no checkbox
3. ✅ Pronto! O plano foi aceito

### Remover um Convênio:
1. Clique novamente no plano aceito (verde)
2. ✅ O plano foi removido

### Buscar Operadora:
1. Digite o nome na barra de busca
2. A lista filtra automaticamente

### Ver Estatísticas:
- **Cards no topo** mostram:
  - Total de operadoras disponíveis
  - Quantas operadoras você aceita
  - Total de planos aceitos

---

## 🔍 Tipos de Planos

### 🔵 Básico (Azul)
- Cobertura: Municipal ou Regional
- Ideal para: Atendimento local
- Exemplos: Amil Fácil, Hapvida Mix

### 🟣 Intermediário (Roxo)
- Cobertura: Regional ou Estadual
- Ideal para: Atendimento regional
- Exemplos: Amil Medial, Smart 400

### 🟡 Premium (Âmbar)
- Cobertura: Nacional
- Ideal para: Atendimento completo
- Exemplos: Amil One Health, Unimed Nacional

---

## 🔒 Permissões

✅ **Owner:** Pode adicionar e remover convênios  
✅ **Secretary:** Pode visualizar convênios aceitos  
❌ **Doctor:** Não tem acesso ao menu

---

## ❗ Troubleshooting

### Erro ao executar Migration:
- ✅ Verifique se copiou TODO o conteúdo do arquivo
- ✅ Verifique se há alguma tabela com nome conflitante
- ✅ Execute primeiro o DROP se necessário

### Erro ao executar Seed:
- ✅ Certifique-se que a migration foi executada primeiro
- ✅ Verifique se não há dados duplicados

### Menu não aparece:
- ✅ Recarregue a página (F5)
- ✅ Verifique se seu usuário é Owner ou Secretary
- ✅ Limpe o cache do navegador (Ctrl+Shift+Del)

### Erro ao clicar em plano:
- ✅ Abra o console do navegador (F12)
- ✅ Verifique se há erros de permissão
- ✅ Confirme que o RLS foi criado corretamente

---

## 📱 Responsividade

A interface se adapta automaticamente:

- **Desktop:** 3 planos por linha
- **Tablet:** 2 planos por linha
- **Mobile:** 1 plano por linha

---

## 🎉 Pronto!

Seu sistema de convênios está completamente funcional!

Agora você pode:
- ✅ Gerenciar todos os convênios da clínica
- ✅ Ver estatísticas em tempo real
- ✅ Adicionar/remover planos facilmente
- ✅ Buscar operadoras rapidamente

---

## 📞 Ajuda Adicional

Consulte o arquivo **IMPLEMENTACAO_SISTEMA_CONVENIOS.md** para:
- Documentação técnica completa
- Estrutura do banco de dados
- Sugestões de melhorias futuras
- Detalhes de implementação

---

**Tempo estimado de aplicação:** 5 minutos ⏱️  
**Dificuldade:** ⭐ Fácil  
**Status:** ✅ Pronto para usar

