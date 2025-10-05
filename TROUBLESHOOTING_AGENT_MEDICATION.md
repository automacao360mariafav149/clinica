# Troubleshooting - Agent de Cálculo de Medicação

**Data:** 2025-10-05  
**Autor:** Sistema MedX

## Problema Comum: "Não foi possível calcular a dosagem"

### Sintomas

- Erro no console: `Erro ao calcular medicação: Error: Não foi possível calcular a dosagem para este medicamento`
- Modal exibe mensagem de erro
- Cálculo não é realizado

### Diagnóstico

Com as melhorias implementadas, agora você verá logs detalhados no console:

```javascript
// 1. Resposta completa da API
console.log('Resposta da API:', data);

// 2. Se sucesso = false
console.error('API retornou sucesso=false:', errorMessage);

// 3. Se não tem campo sucesso
console.warn('API não retornou campo "sucesso". Assumindo sucesso...');
```

### Possíveis Causas e Soluções

#### 1. **Endpoint não configurado ou inativo**

**Sintoma:**
```
Erro HTTP: 404 Not Found
Erro HTTP: 500 Internal Server Error
```

**Solução:**
- Verificar se o endpoint está ativo no n8n: `https://webhook.n8nlabz.com.br/webhook/agent-calc-medicacao`
- Testar o webhook diretamente usando Postman ou curl
- Verificar logs do n8n para erros

**Teste manual:**
```bash
curl -X POST https://webhook.n8nlabz.com.br/webhook/agent-calc-medicacao \
  -H "Content-Type: application/json" \
  -d '{
    "medicamento": "Dipirona",
    "idade": 30,
    "peso": 70,
    "via_administracao": "oral",
    "condicoes_especiais": []
  }'
```

#### 2. **API retornando sucesso=false**

**Sintoma:**
```
API retornou sucesso=false: [mensagem de erro da API]
```

**Possíveis razões:**
- Medicamento não encontrado na base de dados
- Parâmetros inválidos
- Erro no processamento da IA
- Timeout na API externa

**Solução:**
- Verificar a mensagem de erro específica retornada
- Conferir se o nome do medicamento está correto
- Tentar com medicamentos comuns (Dipirona, Paracetamol, etc)
- Verificar logs do n8n/IA

#### 3. **Estrutura de resposta diferente do esperado**

**Sintoma:**
```
API não retornou campo "sucesso". Assumindo sucesso...
```

**Solução:**
Se a API está retornando dados mas em formato diferente:

**Formato esperado:**
```json
{
  "sucesso": true,
  "medicamento": "Levotiroxina",
  "apresentacao": "comprimido 50 mcg",
  "dose_calculada": "50 mcg a 100 mcg por dia",
  "dose_por_tomada": "1 comprimido de 50 mcg",
  "frequencia": "1x ao dia",
  "via_administracao": "oral",
  "duracao_tratamento_dias": null,
  "dose_maxima_dia": "200 mcg por dia",
  "modo_usar": "...",
  "ajustes_aplicados": "...",
  "alertas": ["..."],
  "contraindicacoes": ["..."],
  "categoria_risco_gestacao": "A",
  "observacoes": "..."
}
```

**Se o formato for diferente:**
1. Veja no console qual é o formato real: `Resposta da API: {...}`
2. Ajuste a interface TypeScript `MedicationData` para corresponder
3. Ou ajuste o webhook para retornar no formato esperado

#### 4. **Problemas de CORS**

**Sintoma:**
```
Access to fetch at '...' from origin '...' has been blocked by CORS policy
```

**Solução:**
- Configurar CORS no webhook n8n
- Adicionar headers permitindo origem do frontend
- Usar proxy se necessário

#### 5. **Timeout na requisição**

**Sintoma:**
- Loading infinito
- Erro de timeout
- Requisição demora muito

**Solução:**
- Verificar performance do webhook
- Adicionar timeout na requisição do frontend
- Otimizar processamento da IA

### Checklist de Diagnóstico

Execute estes passos em ordem:

- [ ] **Passo 1:** Abra o Console do navegador (F12 → Console)
- [ ] **Passo 2:** Preencha o formulário e clique em "Calcular Dosagem"
- [ ] **Passo 3:** Observe a mensagem "Resposta da API:" no console
- [ ] **Passo 4:** Copie o JSON completo da resposta
- [ ] **Passo 5:** Verifique se tem o campo `sucesso`
- [ ] **Passo 6:** Se `sucesso: false`, veja o campo `mensagem`, `error` ou `message`
- [ ] **Passo 7:** Teste o endpoint manualmente com curl/Postman

### Logs Úteis para Debug

Com a versão atualizada, você terá:

```javascript
// Console do navegador
console.log('Resposta da API:', data);
// ↑ Mostra EXATAMENTE o que a API retornou

console.error('API retornou sucesso=false:', errorMessage);
// ↑ Mostra por que a API falhou

console.warn('API não retornou campo "sucesso". Assumindo sucesso...');
// ↑ Avisa que a estrutura pode estar incorreta

console.error('Erro HTTP:', response.status, errorText);
// ↑ Mostra erros de rede/HTTP
```

### Exemplo de Resposta de Erro da API

Se a API retornar erro, pode ser algo assim:

```json
{
  "sucesso": false,
  "mensagem": "Medicamento não encontrado na base de dados",
  "error_code": "MED_NOT_FOUND"
}
```

Ou:

```json
{
  "sucesso": false,
  "message": "Dose não pode ser calculada para pacientes com menos de 1 ano",
  "details": {
    "idade_fornecida": 0,
    "idade_minima": 1
  }
}
```

### Testando Conexão com a API

Para testar se o problema é no frontend ou no backend:

```bash
# Teste básico (deve retornar 200 OK)
curl -i https://webhook.n8nlabz.com.br/webhook/agent-calc-medicacao

# Teste com dados reais
curl -X POST https://webhook.n8nlabz.com.br/webhook/agent-calc-medicacao \
  -H "Content-Type: application/json" \
  -d '{
    "medicamento": "Dipirona",
    "idade": 30,
    "peso": 70,
    "via_administracao": "oral",
    "condicoes_especiais": []
  }' | jq '.'
```

### Contato com Suporte

Se o problema persistir, forneça as seguintes informações:

1. **Console logs completos** (copiar todo o output)
2. **Dados enviados** (medicamento, idade, peso, via, condições)
3. **Resposta da API** (o JSON completo do console.log)
4. **Status HTTP** da requisição
5. **Navegador e versão** utilizado
6. **Screenshot** do erro no modal

### Soluções Rápidas

**Problema:** Endpoint retorna 404
**Solução:** Verificar se o webhook está ativo no n8n

**Problema:** Endpoint retorna 500
**Solução:** Verificar logs do n8n, pode ser erro na IA ou configuração

**Problema:** Resposta vazia ou null
**Solução:** Verificar se o workflow do n8n está retornando dados

**Problema:** CORS error
**Solução:** Configurar CORS no webhook ou usar proxy

**Problema:** Timeout
**Solução:** Aumentar timeout ou otimizar processamento

### Próximos Passos

Após identificar o problema:

1. ✅ Verificar logs do console
2. ✅ Testar endpoint manualmente
3. ✅ Verificar configuração do n8n
4. ✅ Ajustar estrutura de resposta se necessário
5. ✅ Reportar bug se for problema do sistema

---

**Última atualização:** 2025-10-05  
**Status:** Troubleshooting ativo

