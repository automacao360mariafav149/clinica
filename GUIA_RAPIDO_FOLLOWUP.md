# 🚀 Guia Rápido - Menu Follow Up

## 📖 O Que É?

O Menu Follow Up permite configurar e acompanhar automaticamente os 3 períodos de follow-up com seus clientes WhatsApp.

---

## ⚙️ Configuração Inicial (1 minuto)

### Passo 1: Acessar o Menu
```
Sidebar → Follow Up
```

### Passo 2: Definir os Períodos
No card "Configuração de Períodos":
- **1º Follow-up:** Quantos dias após última atividade? (padrão: 7)
- **2º Follow-up:** Quantos dias após última atividade? (padrão: 15)
- **3º Follow-up:** Quantos dias após última atividade? (padrão: 30)

### Passo 3: Salvar
Clique em **"Salvar Configuração"** ✅

---

## 👥 Visualizar Clientes

### O Que Aparece na Tela?

**Cards de clientes** mostrando:
- ✅ Nome do cliente
- ✅ Telefone
- ✅ Última atividade
- ✅ Situação atual
- ✅ Progresso (X/3 follow-ups)
- ✅ Status de cada follow-up (Pendente/Enviado)

### Filtro Automático
❌ **Não aparecem:** Clientes com follow-up encerrado

---

## 🎯 Exemplos de Uso

### Exemplo 1: Clínica com Follow-up Rápido
```
1º Follow-up: 3 dias
2º Follow-up: 7 dias
3º Follow-up: 14 dias
```
**Uso:** Cirurgias, procedimentos que precisam acompanhamento rápido

### Exemplo 2: Clínica com Follow-up Padrão (Recomendado)
```
1º Follow-up: 7 dias
2º Follow-up: 15 dias
3º Follow-up: 30 dias
```
**Uso:** Consultas gerais, retornos padrão

### Exemplo 3: Clínica com Follow-up Espaçado
```
1º Follow-up: 15 dias
2º Follow-up: 30 dias
3º Follow-up: 60 dias
```
**Uso:** Tratamentos longos, acompanhamento de longo prazo

---

## 📊 Entendendo os Status

### Badge de Progresso
| Badge | Significado |
|-------|-------------|
| **0/3** | Nenhum follow-up enviado |
| **1/3** | Primeiro follow-up enviado |
| **2/3** | Dois follow-ups enviados |
| **3/3** 🎉 | Todos follow-ups enviados (Verde) |

### Status Individual
| Status | O Que Significa |
|--------|-----------------|
| **Pendente** (cinza) | Follow-up ainda não enviado |
| **Enviado DD/MM/AAAA** (verde) | Follow-up concluído nesta data |

---

## 🔄 Atualizações Automáticas

### Realtime Ativo! ⚡
- Novos clientes aparecem automaticamente
- Status atualizados em tempo real
- Clientes encerrados somem da lista
- Mudanças na configuração refletem imediatamente

---

## 💡 Dicas Práticas

### ✅ Boas Práticas
1. **Configure uma vez:** Os períodos valem para todos os clientes
2. **Monitore diariamente:** Veja quais follow-ups estão pendentes
3. **Revise periodicamente:** Ajuste os dias conforme necessidade

### ⚠️ Atenções
- Apenas **Owner** pode alterar os períodos
- **Doctor** e **Secretary** podem visualizar
- Clientes encerrados **não aparecem** no menu

---

## 🎬 Workflow Recomendado

```mermaid
1. Cliente entra em contato via WhatsApp
   ↓
2. Sistema adiciona na tabela clientes_followup
   ↓
3. Cliente aparece no menu Follow Up
   ↓
4. Sistema envia follow-ups nos períodos configurados
   ↓
5. Status atualiza automaticamente (Pendente → Enviado)
   ↓
6. Ao completar 3/3 ou encerrar → Cliente some da lista
```

---

## 🔧 Ações Rápidas (SQL)

### Adicionar Cliente Manualmente
```sql
INSERT INTO clientes_followup (
  nome, 
  numero, 
  ultima_atividade, 
  sessionid, 
  followup
) VALUES (
  'Maria Silva',
  '5511999999999@s.whatsapp.net',
  NOW(),
  gen_random_uuid()::text,
  '0'
);
```

### Marcar 1º Follow-up Como Enviado
```sql
UPDATE clientes_followup
SET 
  "follow-up1" = 'concluido',
  data_envio1 = NOW()::text,
  mensagem1 = 'Follow-up enviado com sucesso'
WHERE id = [ID_DO_CLIENTE];
```

### Encerrar Follow-up de Um Cliente
```sql
UPDATE clientes_followup
SET followup = 'encerrado'
WHERE id = [ID_DO_CLIENTE];
```
**Resultado:** Cliente some do menu Follow Up ✅

---

## 📱 Interface Responsiva

### Mobile (Celular)
- 1 card por linha
- Rolagem vertical
- Todos os dados visíveis

### Tablet
- 2 cards por linha
- Layout grid
- Melhor aproveitamento

### Desktop
- 3 cards por linha
- Visualização completa
- Grid espaçado

---

## ❓ Perguntas Frequentes

### Como alterar os períodos?
**R:** Apenas usuários com role **Owner** podem alterar. Acesse o menu Follow Up e edite os campos.

### Posso ter períodos diferentes por especialidade?
**R:** Não na versão atual. Os períodos valem para todos os clientes. (Melhoria futura)

### Como saber quais clientes estão para receber follow-up?
**R:** Veja no card do cliente quais estão "Pendente". Compare a última atividade com os dias configurados.

### O que acontece quando marco como "encerrado"?
**R:** O cliente desaparece do menu Follow Up imediatamente.

### Posso ver histórico de follow-ups enviados?
**R:** Sim, no card do cliente aparecem as datas de envio de cada follow-up.

---

## 📞 Integração com WhatsApp

### Fluxo Atual
```
1. Cliente contacta via WhatsApp
2. Sistema registra em clientes_followup
3. Aparece no menu Follow Up
4. Sistema envia follow-ups (automático/manual)
5. Status atualiza em tempo real
```

### Formato do Número
```
Banco: 5519994419319@s.whatsapp.net
Tela: +55 (19) 99441-9319
```
Formatação automática! ✨

---

## 🎯 Métricas Úteis

### Quantos clientes em follow-up?
Veja no título: **"Clientes em Follow Up (X)"**

### Quantos completaram todos os follow-ups?
Conte os badges **3/3** (verdes)

### Quantos estão pendentes?
Conte badges **0/3, 1/3, 2/3** (cinzas)

---

## 🚨 Solução de Problemas Rápidos

### Não vejo nenhum cliente
✅ Verifique se há clientes com `followup != 'encerrado'`

### Não consigo salvar configuração
✅ Verifique se você é **Owner**

### Cliente não aparece
✅ Verifique se `followup` não está como 'encerrado'

### Status não atualiza
✅ Verifique conexão com internet (Realtime)

---

## 📚 Documentação Completa

Para detalhes técnicos, consulte:
- 📄 `IMPLEMENTACAO_MENU_FOLLOWUP.md` - Documentação técnica completa
- 📄 `RESUMO_FOLLOWUP_COMPLETO.md` - Resumo da implementação
- 📄 `migrations/48º_Migration_create_followup_config.sql` - SQL da migration
- 📄 `seeds/3º_Seed_followup_config_default.sql` - Seed inicial

---

**✨ Pronto! Seu sistema de Follow Up está configurado e funcionando! ✨**

💬 **Dúvidas?** Consulte a documentação completa ou entre em contato com o suporte técnico.

---

Última atualização: 27/10/2025 | Versão: 1.0

