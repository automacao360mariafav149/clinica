# ✅ Checklist Pré-Deploy - Hostinger

## 🚀 Verificações Obrigatórias ANTES do Build

### 1️⃣ Verificar Arquivo `.env.local`

Execute no terminal (na raiz do projeto):

```bash
# Windows PowerShell
type .env.local

# Windows CMD
type .env.local

# Linux/Mac
cat .env.local
```

**Deve conter:**
```env
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_ANON_KEY=sua-chave-aqui
```

⚠️ **ATENÇÃO:**
- As variáveis **DEVEM** começar com `VITE_`
- Não use aspas nas URLs
- Não deixe espaços antes ou depois do `=`

---

### 2️⃣ Verificar se o arquivo `.htaccess` existe

```bash
# Windows
dir public\.htaccess

# Linux/Mac
ls -la public/.htaccess
```

Se NÃO existir, o arquivo já foi criado por mim! Verifique novamente. ✅

---

### 3️⃣ Executar o Build

```bash
npm run build
```

**Verifique a saída:**
- ✅ Build deve completar sem erros
- ✅ Pasta `dist` deve ser criada
- ⚠️ Avisos de tamanho de chunk são normais (não são erros)

---

### 4️⃣ Verificar Conteúdo da Pasta `dist`

```bash
# Windows
dir dist
dir dist\.htaccess

# Linux/Mac
ls -la dist/
ls -la dist/.htaccess
```

**A pasta `dist` DEVE conter:**
```
dist/
├── index.html          ✅ Obrigatório
├── .htaccess           ✅ ESSENCIAL (se não existir, o F5 dará erro 404)
├── assets/             ✅ Obrigatório
│   ├── index-[hash].js
│   └── index-[hash].css
├── favicon.ico
├── logo-interno.png
└── [outros arquivos estáticos]
```

---

### 5️⃣ Testar Localmente (Opcional mas Recomendado)

```bash
npm run preview
```

Acesse `http://localhost:4173` e teste:
- ✅ Navegação entre páginas funciona
- ✅ Dar F5 em qualquer página não dá erro 404
- ✅ Login funciona
- ✅ Dados do Supabase carregam

---

## 📤 Upload para Hostinger

### Passo 1: Acessar Gerenciador de Arquivos
1. Acesse o painel da Hostinger
2. Vá em **Gerenciador de Arquivos**
3. Navegue até a pasta do subdomínio (ex: `public_html/subdominio`)

### Passo 2: Limpar Arquivos Antigos
⚠️ **DELETE todos os arquivos antigos** na pasta do subdomínio antes de enviar os novos

### Passo 3: Upload dos Arquivos
1. Selecione **TODOS** os arquivos dentro da pasta `dist`
2. Faça o upload
3. **IMPORTANTE:** Certifique-se de que o `.htaccess` foi enviado
   - Alguns sistemas escondem arquivos que começam com `.`
   - Verifique manualmente se ele está lá

### Passo 4: Verificar Permissões
- Arquivos: `644`
- Pastas: `755`

---

## 🧪 Testes Pós-Deploy

### Teste 1: Acessar o Site
```
https://seusubdominio.seudominio.com
```
✅ Deve carregar normalmente

### Teste 2: Erro 404
1. Navegue para uma rota interna (ex: `/dashboard`)
2. Dê **F5** (refresh)
3. ✅ Deve carregar a página normalmente (NÃO deve dar erro 404)

Se der erro 404:
- ❌ O arquivo `.htaccess` não foi enviado ou está na pasta errada
- ❌ O módulo `mod_rewrite` não está habilitado (entre em contato com o suporte)

### Teste 3: Console do Navegador
1. Pressione **F12**
2. Vá na aba **Console**
3. Digite e execute:

```javascript
console.log('URL:', import.meta.env.VITE_SUPABASE_URL)
console.log('Key:', import.meta.env.VITE_SUPABASE_ANON_KEY?.substring(0, 20) + '...')
```

✅ **Resultado esperado:** Deve exibir os valores (não `undefined`)

❌ **Se exibir `undefined`:**
- As variáveis não foram incluídas no build
- Verifique se o `.env.local` estava na raiz durante o build
- Verifique se as variáveis começam com `VITE_`
- Refaça o build: `npm run build`

### Teste 4: Login
1. Tente fazer login
2. ✅ Deve funcionar normalmente

❌ **Se der erro de conexão:**
- Verifique se as credenciais do Supabase estão corretas
- Adicione a URL do subdomínio no Supabase:
  - Acesse: **Authentication** > **URL Configuration**
  - Adicione em **Site URL** e **Redirect URLs**

---

## 🐛 Erros Comuns e Soluções Rápidas

| Erro | Causa Provável | Solução |
|------|----------------|---------|
| **404 ao dar F5** | `.htaccess` não foi enviado | Envie o arquivo `.htaccess` para a raiz do subdomínio |
| **Variáveis undefined** | `.env.local` não estava presente no build | Crie `.env.local` e refaça o build |
| **Erro de conexão Supabase** | Credenciais incorretas | Verifique URL e anon key no painel do Supabase |
| **CSS não carrega** | `base` URL incorreta no `vite.config.ts` | Verifique se `base: '/'` está correto |
| **Página em branco** | Erro no JavaScript | Abra o Console (F12) e veja o erro |

---

## 📞 Suporte

Se após seguir todos os passos ainda tiver problemas:

1. **Abra o Console do Navegador (F12)** e copie os erros
2. **Verifique o checklist completo** no arquivo `GUIA_DEPLOY_HOSTINGER.md`
3. **Entre em contato com o suporte da Hostinger** se o problema for com o servidor

---

## 🎯 Resumo do Processo

```bash
# 1. Verificar .env.local
type .env.local

# 2. Fazer build
npm run build

# 3. Verificar .htaccess na pasta dist
dir dist\.htaccess

# 4. Upload de TODOS os arquivos da pasta dist

# 5. Testar no navegador
# - Acessar site
# - Dar F5 em rotas internas
# - Verificar console (F12)
# - Testar login
```

**Tempo estimado:** 10-15 minutos ⏱️

---

**Última atualização:** 2025-10-06

