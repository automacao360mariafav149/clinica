# 🚀 Guia de Conexão com Supabase - MedX

**Data:** 31 de Outubro de 2025  
**Status:** Arquivo .env.local criado ✅  
**Próximo Passo:** Configurar credenciais

---

## 📋 CHECKLIST DE CONFIGURAÇÃO

- [x] Arquivo `.env.local` criado
- [ ] Credenciais do Supabase obtidas
- [ ] Arquivo `.env.local` editado com credenciais reais
- [ ] Conexão testada
- [ ] Projeto iniciado

---

## 🎯 PASSO 1: OBTER CREDENCIAIS DO SUPABASE

### 1.1 - Acessar o Dashboard

1. Acesse: **https://app.supabase.com/**
2. Faça login na sua conta Supabase
3. Você tem duas opções:
   - **Usar projeto existente:** Selecione-o na lista
   - **Criar novo projeto:** Clique em "New Project"

### 1.2 - Criar Novo Projeto (se necessário)

Se você está criando um novo projeto:

```
Nome do Projeto: MedX
Database Password: [escolha uma senha FORTE - mínimo 12 caracteres]
Region: South America (São Paulo) ou mais próxima de você
Pricing Plan: Free (para começar)
```

Clique em **"Create new project"** e aguarde ~2 minutos.

### 1.3 - Copiar as Credenciais

1. No dashboard do seu projeto, clique no ícone de **engrenagem** (⚙️ Settings)
2. No menu lateral esquerdo, clique em **"API"**
3. Você verá duas informações importantes:

   **📌 Project URL**
   ```
   Exemplo: https://lmzphqdrrbulmytddsek.supabase.co
   ```
   
   **📌 anon/public key** (chave pública)
   ```
   Exemplo: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxtenBocWRycmJ1bG15dGRkc2VrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE4ODEwMTMsImV4cCI6MjA3NzQ1NzAxM30.yd2ePuRBi0CNvTF0oNgNrzBDdGg1kxiXu9cHaR-D_k0
   ```

**⚠️ IMPORTANTE:** Copie EXATAMENTE como aparece, sem espaços antes ou depois!

---

## ✏️ PASSO 2: EDITAR O ARQUIVO .env.local

O arquivo `.env.local` já foi criado na raiz do projeto. Agora você precisa editá-lo.

### Opção A: Editar no VS Code (RECOMENDADO)

1. Abra o arquivo `.env.local` no VS Code (ele está na raiz do projeto)
2. Localize estas linhas:
   ```env
   VITE_SUPABASE_URL=https://seu-projeto.supabase.co
   VITE_SUPABASE_ANON_KEY=sua-chave-anonima-aqui
   ```

3. Substitua pelos valores REAIS que você copiou:
   ```env
   VITE_SUPABASE_URL=https://lmzphqdrrbulmytddsek.supabase.co
   VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxtenBocWRycmJ1bG15dGRkc2VrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE4ODEwMTMsImV4cCI6MjA3NzQ1NzAxM30.yd2ePuRBi0CNvTF0oNgNrzBDdGg1kxiXu9cHaR-D_k0
   ```

4. Salve o arquivo (`Ctrl+S`)

### Opção B: Editar via PowerShell

Se preferir usar o terminal, execute este comando (substitua pelos seus valores reais):

```powershell
@"
VITE_SUPABASE_URL=https://SEU-PROJETO-AQUI.supabase.co
VITE_SUPABASE_ANON_KEY=SUA-CHAVE-ANONIMA-COMPLETA-AQUI
VITE_ENABLE_COMPONENT_TAGGER=false
"@ | Out-File -FilePath .env.local -Encoding utf8 -Force
```

---

## ✅ PASSO 3: TESTAR A CONEXÃO

Após configurar as credenciais, vamos testar se está tudo funcionando:

### 3.1 - Verificar se as variáveis foram configuradas

Execute no terminal:

```powershell
npm run check-env
```

**Resultado esperado:**
```
VITE_SUPABASE_URL: ✅ Configurada
VITE_SUPABASE_ANON_KEY: ✅ Configurada
```

Se aparecer ❌, revise o arquivo `.env.local`.

### 3.2 - Testar conexão com o banco (Opcional)

Se quiser testar a conexão real com o Supabase:

```powershell
# Instalar dotenv (se necessário)
npm install dotenv

# Executar teste de conexão
node --loader=dotenv/config test-supabase-connection.js
```

**Possíveis resultados:**

✅ **SUCESSO - Conexão estabelecida:**
```
✅ CONEXÃO ESTABELECIDA COM SUCESSO!
   Seu projeto está conectado ao Supabase! 🎉
```

⚠️ **AVISO - Tabelas não existem ainda:**
```
❌ ERRO ao conectar: relation "public.profiles" does not exist
💡 Execute as migrations para criar as tabelas necessárias.
```
*Isso é normal se você ainda não aplicou as migrations!*

❌ **ERRO - Credenciais incorretas:**
```
❌ ERRO ao conectar: Invalid API key
```
*Revise suas credenciais no arquivo .env.local*

---

## 🚀 PASSO 4: INICIAR O PROJETO

Agora que o Supabase está conectado, você pode iniciar o projeto:

```powershell
# Instalar dependências (se ainda não instalou)
npm install

# Iniciar servidor de desenvolvimento
npm run dev
```

O projeto deve iniciar em: **http://localhost:5173**

---

## 🗄️ PASSO 5: CRIAR O BANCO DE DADOS (MIGRATIONS)

Se você ainda não criou as tabelas no Supabase, precisará aplicar as migrations.

### Opção A: Via Supabase CLI (Recomendado)

```powershell
# 1. Fazer login no Supabase
supabase login

# 2. Conectar ao seu projeto (substitua pelo seu project-ref)
supabase link --project-ref lmzphqdrrbulmytddsek

# 3. Aplicar todas as migrations
supabase db push
```

### Opção B: Via Dashboard (Manual)

1. Acesse o **SQL Editor** no dashboard do Supabase
2. Abra os arquivos de migration na pasta `migrations/` do projeto
3. Execute cada migration **NA ORDEM CORRETA** (veja `GUIA_REPLICACAO_COMPLETA.md`)

---

## 📚 PRÓXIMOS PASSOS

Após conectar ao Supabase:

1. ✅ **Aplicar Migrations** - Criar estrutura do banco
2. ✅ **Aplicar Seeds** - Popular dados iniciais (operadoras, configurações, etc)
3. ✅ **Criar primeiro usuário** - Owner/Admin do sistema
4. ✅ **Testar funcionalidades** - Login, dashboard, cadastros

**📖 Consulte o guia completo:** `GUIA_REPLICACAO_COMPLETA.md`

---

## 🆘 TROUBLESHOOTING

### ❌ Problema: "Failed to fetch" ao fazer login

**Solução:**
```powershell
# 1. Verificar se as variáveis estão corretas
Get-Content .env.local

# 2. Verificar se o projeto Supabase está ativo (dashboard)

# 3. Limpar cache do navegador (Ctrl+Shift+Delete)
```

### ❌ Problema: "Invalid API key"

**Solução:**
- Verifique se copiou a chave ANON (não a service_role key)
- Confirme que não há espaços antes/depois da chave
- Confirme que copiou a chave completa (é longa, começando com `eyJ...`)

### ❌ Problema: "relation does not exist"

**Solução:**
- As tabelas ainda não foram criadas
- Execute as migrations (Passo 5 acima)

### ❌ Problema: Variáveis não são reconhecidas

**Solução:**
```powershell
# 1. Reiniciar o servidor de desenvolvimento
# Pressione Ctrl+C e execute novamente:
npm run dev

# 2. O Vite precisa reiniciar para carregar novas variáveis
```

---

## 🔒 SEGURANÇA

**⚠️ IMPORTANTE:**

- ✅ O arquivo `.env.local` já está no `.gitignore` (não será commitado)
- ✅ Use apenas a chave **ANON** no frontend (NUNCA a service_role)
- ✅ Mantenha suas credenciais em segredo
- ✅ Em produção, use variáveis de ambiente da plataforma de deploy

---

## 📞 SUPORTE

Se você encontrar problemas:

1. **Verifique os logs do console** (F12 no navegador → Console)
2. **Consulte a documentação:** https://supabase.com/docs
3. **Verifique o status do Supabase:** https://status.supabase.com/

---

## ✅ CHECKLIST FINAL

Antes de continuar:

- [ ] Arquivo `.env.local` existe e está preenchido
- [ ] Project URL está correta (formato: https://xxxxx.supabase.co)
- [ ] anon key está correta (começa com eyJ...)
- [ ] Comando `npm run check-env` mostra ✅ para ambas variáveis
- [ ] Projeto Supabase está ativo no dashboard
- [ ] Servidor de desenvolvimento iniciou sem erros

---

**🎉 PARABÉNS! Seu projeto está conectado ao Supabase!**

Próximo passo: Execute as migrations para criar o banco de dados.  
Consulte: `GUIA_REPLICACAO_COMPLETA.md` - Parte 3

---

**Última Atualização:** 31 de Outubro de 2025  
**Autor:** Sistema MedX

