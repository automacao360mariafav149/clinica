# 🔧 Troubleshooting: Erro 404 da API Gemini

## ❌ Problema
Você está recebendo o erro:
```
Erro na API do Gemini: 404
```

---

## ✅ Solução Implementada

O código foi **atualizado** para resolver automaticamente esse problema! Agora ele:

1. ✅ **Tenta múltiplos modelos** automaticamente
2. ✅ **Usa endpoint correto** (`v1` ao invés de `v1beta`)
3. ✅ **Fallback inteligente** entre modelos disponíveis

### Modelos Testados (na ordem):
1. `gemini-2.0-flash-exp` (mais recente)
2. `gemini-1.5-flash-latest`
3. `gemini-1.5-flash`
4. `gemini-pro-vision`

O sistema tentará cada um automaticamente até encontrar um que funcione!

---

## 🔍 Verificações

### 1. API Key Correta? ✅

Verifique se sua API key está configurada corretamente:

```sql
-- Verificar no banco
SELECT key, value, is_active 
FROM public.system_settings 
WHERE key = 'gemini_api_key';
```

A API key deve:
- ✅ Começar com `AIza...`
- ✅ Ter 39 caracteres
- ✅ Estar marcada como `is_active = true`

### 2. API Key Válida? ✅

Teste sua API key diretamente:

```bash
curl "https://generativelanguage.googleapis.com/v1/models/gemini-2.0-flash-exp:generateContent?key=SUA_API_KEY_AQUI" \
  -H 'Content-Type: application/json' \
  -d '{"contents":[{"parts":[{"text":"Olá"}]}]}'
```

**Resposta esperada:** JSON com `candidates[0].content`

**Se retornar 404:** Sua API key pode não ter acesso aos modelos

### 3. Gerar Nova API Key 🆕

Se o problema persistir, **gere uma nova API key**:

1. Acesse: https://makersuite.google.com/app/apikey
2. **Delete** a chave antiga (se houver)
3. Clique em **"Create API Key"**
4. Selecione **"Create API key in new project"**
5. Copie a nova chave
6. Atualize no banco:

```sql
UPDATE public.system_settings 
SET value = 'sua-nova-api-key-aqui' 
WHERE key = 'gemini_api_key';
```

---

## 🌍 Restrições Regionais

Alguns modelos podem não estar disponíveis em todas as regiões:

### ✅ Regiões Suportadas:
- 🇺🇸 Estados Unidos
- 🇪🇺 Europa
- 🇯🇵 Japão
- 🇰🇷 Coreia do Sul
- 🇸🇬 Singapura

### ⚠️ Se você estiver no Brasil:
Alguns usuários relatam que precisam:
1. **Criar o projeto da API key em uma região suportada**
2. **Ou usar VPN** para testar inicialmente

---

## 📊 Verificar Logs no Console

Abra o **Console do Navegador (F12)** e procure por:

### ✅ **Sucesso:**
```
🔄 Tentando modelo: gemini-2.0-flash-exp...
✅ Modelo gemini-2.0-flash-exp funcionou!
📥 Resposta recebida do Gemini
✅ Análise gerada com sucesso!
```

### ❌ **Erro 404 (múltiplos modelos):**
```
🔄 Tentando modelo: gemini-2.0-flash-exp...
⚠️ Modelo gemini-2.0-flash-exp não disponível (404), tentando próximo...
🔄 Tentando modelo: gemini-1.5-flash-latest...
⚠️ Modelo gemini-1.5-flash-latest não disponível (404), tentando próximo...
```

Se **TODOS os modelos** retornarem 404, o problema é com sua API key ou região.

---

## 🔑 Problemas Comuns com API Key

### **1. API Key de Projeto Antigo**
- Projetos criados antes de 2024 podem ter restrições
- **Solução:** Crie uma nova API key em um projeto novo

### **2. API Key sem Permissões**
- Algumas API keys são criadas sem acesso ao Gemini
- **Solução:** No Google Cloud Console, habilite "Generative Language API"

### **3. Quota Excedida**
- Tier gratuito: 15 req/min
- **Solução:** Aguarde 1 minuto ou faça upgrade

---

## 🧪 Teste Manual da API

Teste diretamente no navegador usando `fetch`:

```javascript
// Cole isso no Console (F12) do navegador
const apiKey = 'SUA_API_KEY_AQUI';

fetch(`https://generativelanguage.googleapis.com/v1/models/gemini-2.0-flash-exp:generateContent?key=${apiKey}`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    contents: [{ parts: [{ text: 'Olá, teste!' }] }]
  })
})
.then(r => r.json())
.then(d => console.log('✅ Sucesso:', d))
.catch(e => console.error('❌ Erro:', e));
```

---

## 📞 Última Opção: Suporte Google

Se nada funcionar:

1. Acesse: https://support.google.com/
2. Selecione **"Google AI Studio"**
3. Relate o problema do erro 404
4. Informe que tentou os 4 modelos e todos retornam 404

---

## ✅ Checklist Completo

- [ ] API key configurada no `system_settings`
- [ ] API key começa com `AIza` e tem 39 caracteres
- [ ] Testei criar uma nova API key
- [ ] Testei a API key com `curl` ou `fetch`
- [ ] Console mostra tentativa dos 4 modelos
- [ ] Verifiquei que não excedi a quota (15 req/min)
- [ ] Considerei criar API key em projeto novo
- [ ] Considerei usar VPN para testar (se fora dos EUA/EU)

---

## 🎯 TL;DR (Solução Rápida)

**Se ainda dá erro 404 depois da atualização:**

1. **Gere uma nova API key** (projeto novo): https://makersuite.google.com/app/apikey
2. **Atualize no banco**:
   ```sql
   UPDATE system_settings 
   SET value = 'nova-key-aqui' 
   WHERE key = 'gemini_api_key';
   ```
3. **Teste novamente**

---

**O código agora tenta 4 modelos diferentes automaticamente. Se ainda assim der erro 404 em todos, o problema é com a API key!** 🔑

**Geralmente, criar uma nova API key em um projeto novo resolve o problema.** ✅

