# 🚀 Guia de Deploy na Hostinger

## 📋 Índice
1. [Problemas Resolvidos](#problemas-resolvidos)
2. [Pré-requisitos](#pré-requisitos)
3. [Configuração das Variáveis de Ambiente](#configuração-das-variáveis-de-ambiente)
4. [Processo de Build e Deploy](#processo-de-build-e-deploy)
5. [Verificação Pós-Deploy](#verificação-pós-deploy)
6. [Troubleshooting](#troubleshooting)

---

## 🎯 Problemas Resolvidos

### ✅ Problema 1: Erro 404 ao dar F5 (Resolvido)
**Causa:** SPAs (Single Page Applications) gerenciam as rotas no client-side com JavaScript. Quando você dá F5 ou acessa uma rota diretamente, o servidor Apache tenta buscar um arquivo físico naquele caminho, que não existe.

**Solução:** Criamos um arquivo `.htaccess` na pasta `public` que redireciona todas as requisições para o `index.html`, permitindo que o React Router gerencie as rotas.

### ✅ Problema 2: Erro de Conexão com Supabase (Resolvido)
**Causa:** As variáveis de ambiente não estão sendo incluídas corretamente no build de produção.

**Solução:** Garantir que as variáveis de ambiente tenham o prefixo `VITE_` e estejam configuradas no arquivo `.env.local` antes do build.

---

## 📦 Pré-requisitos

- Node.js instalado (versão 16 ou superior)
- NPM ou Bun instalado
- Acesso ao painel da Hostinger
- Projeto Supabase configurado
- Acesso SSH ou FTP para o subdomínio (opcional, mas recomendado)

---

## 🔐 Configuração das Variáveis de Ambiente

### Passo 1: Criar arquivo `.env.local`

Na raiz do seu projeto, crie um arquivo chamado `.env.local` com o seguinte conteúdo:

```env
# ======================================
# CONFIGURAÇÕES DO SUPABASE
# ======================================
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_ANON_KEY=sua-chave-anonima-aqui

# ======================================
# CONFIGURAÇÕES OPCIONAIS
# ======================================
VITE_ENABLE_COMPONENT_TAGGER=false
```

### Passo 2: Obter as Credenciais do Supabase

1. Acesse o [Painel do Supabase](https://app.supabase.com/)
2. Selecione seu projeto
3. Vá em **Project Settings** (ícone de engrenagem)
4. Clique em **API** no menu lateral
5. Copie:
   - **Project URL** → Cole em `VITE_SUPABASE_URL`
   - **anon/public key** → Cole em `VITE_SUPABASE_ANON_KEY`

### ⚠️ IMPORTANTE
- As variáveis **DEVEM** começar com `VITE_` para serem incluídas no build
- O arquivo `.env.local` é ignorado pelo git (não será enviado ao repositório)
- Nunca exponha a `service_role_key` no frontend (use apenas `anon key`)

---

## 🏗️ Processo de Build e Deploy

### Passo 1: Verificar as Variáveis

Antes de fazer o build, verifique se o arquivo `.env.local` está correto:

```bash
# No terminal, na raiz do projeto
cat .env.local  # Linux/Mac
type .env.local # Windows
```

### Passo 2: Executar o Build

```bash
# Usando NPM
npm run build

# Ou usando Bun
bun run build
```

Isso irá gerar a pasta `dist` com os arquivos otimizados para produção.

### Passo 3: Verificar o Build

Verifique se os arquivos foram gerados corretamente:

```bash
# A pasta dist deve conter:
dist/
  ├── index.html
  ├── .htaccess  # ← IMPORTANTE! Este arquivo deve estar aqui
  ├── assets/
  │   ├── index-[hash].js
  │   └── index-[hash].css
  └── [outros arquivos estáticos]
```

### Passo 4: Upload para a Hostinger

#### Opção A: Via Gerenciador de Arquivos (Painel)

1. Acesse o **Painel da Hostinger**
2. Vá em **Gerenciador de Arquivos**
3. Navegue até a pasta do seu subdomínio (ex: `public_html/subdominio`)
4. **DELETE todos os arquivos antigos da pasta** (se houver)
5. **Faça upload de TODOS os arquivos da pasta `dist`**, incluindo:
   - `index.html`
   - `.htaccess` ← **ESSENCIAL!**
   - Pasta `assets/`
   - Todos os outros arquivos estáticos

#### Opção B: Via FTP/SFTP (Recomendado)

```bash
# Usando FileZilla ou outro cliente FTP
# Conecte-se ao servidor e faça upload da pasta dist completa
```

### ⚠️ Verificações Importantes

- ✅ O arquivo `.htaccess` **DEVE** estar na raiz do subdomínio
- ✅ Todos os arquivos da pasta `dist` devem ser copiados
- ✅ As permissões dos arquivos devem estar corretas (geralmente 644 para arquivos e 755 para pastas)

---

## 🧪 Verificação Pós-Deploy

### 1. Testar o Erro 404

1. Acesse seu subdomínio: `https://seusubdominio.seudominio.com`
2. Navegue para uma rota interna (ex: `/dashboard`, `/patients`)
3. Dê **F5** na página
4. ✅ A página deve carregar normalmente (não deve dar erro 404)

### 2. Testar a Conexão com Supabase

1. Abra as **Ferramentas do Desenvolvedor** (F12)
2. Vá na aba **Console**
3. Tente fazer login na aplicação
4. Verifique se há erros no console

#### Se aparecer: `"Variáveis VITE_SUPABASE_URL e/ou VITE_SUPABASE_ANON_KEY não configuradas"`

**Solução:**
- As variáveis não foram incluídas no build
- Verifique se o arquivo `.env.local` estava na raiz do projeto durante o build
- Verifique se as variáveis começam com `VITE_`
- Refaça o build com `npm run build`

### 3. Verificar se as Variáveis Estão no Build

Você pode verificar se as variáveis foram incluídas no build:

1. Abra as **Ferramentas do Desenvolvedor** (F12)
2. Vá na aba **Console**
3. Digite e execute:

```javascript
console.log(import.meta.env.VITE_SUPABASE_URL)
console.log(import.meta.env.VITE_SUPABASE_ANON_KEY?.substring(0, 20) + '...')
```

Se ambos exibirem valores (não `undefined`), as variáveis foram incluídas corretamente! ✅

---

## 🔧 Troubleshooting

### Problema: Ainda aparece erro 404 ao dar F5

**Possíveis causas e soluções:**

1. **O arquivo `.htaccess` não foi enviado**
   - Verifique no Gerenciador de Arquivos da Hostinger se o arquivo `.htaccess` está presente
   - Alguns clientes FTP escondem arquivos que começam com `.` (ponto)
   - Configure seu cliente FTP para exibir arquivos ocultos

2. **O arquivo `.htaccess` está na pasta errada**
   - Ele deve estar na **raiz do subdomínio**, não em subpastas
   - Caminho correto: `public_html/subdominio/.htaccess`

3. **Módulo mod_rewrite não está habilitado**
   - Entre em contato com o suporte da Hostinger
   - Solicite a habilitação do `mod_rewrite` para Apache

4. **Permissões incorretas**
   - O arquivo `.htaccess` deve ter permissão **644**
   - Ajuste via Gerenciador de Arquivos ou FTP

### Problema: Erro de conexão com Supabase

**Possíveis causas e soluções:**

1. **Variáveis de ambiente não incluídas no build**
   
   ```bash
   # Solução: Recrie o arquivo .env.local e refaça o build
   
   # 1. Crie/edite .env.local na raiz do projeto
   VITE_SUPABASE_URL=https://seu-projeto.supabase.co
   VITE_SUPABASE_ANON_KEY=sua-chave-aqui
   
   # 2. Refaça o build
   npm run build
   
   # 3. Faça upload da nova pasta dist
   ```

2. **Variáveis sem o prefixo VITE_**
   - ❌ `SUPABASE_URL=...` (ERRADO)
   - ✅ `VITE_SUPABASE_URL=...` (CORRETO)

3. **Credenciais incorretas ou expiradas**
   - Verifique se as credenciais do Supabase estão corretas
   - Acesse o painel do Supabase e confirme a URL e anon key

4. **CORS bloqueando requisições**
   - Acesse o Painel do Supabase
   - Vá em **Authentication** > **URL Configuration**
   - Adicione a URL do seu subdomínio em **Site URL** e **Redirect URLs**

### Problema: CSS ou JS não carregam

**Possíveis causas e soluções:**

1. **Base URL incorreta no Vite**
   
   Edite o `vite.config.ts`:
   
   ```typescript
   export default defineConfig(({ mode }) => {
     return {
       base: '/', // ou '/subpasta/' se estiver em subpasta
       // ... resto da config
     };
   });
   ```

2. **Arquivos não foram enviados**
   - Verifique se a pasta `assets/` foi enviada completamente
   - Verifique as permissões dos arquivos

### Problema: Página em branco após deploy

**Possíveis causas e soluções:**

1. **Abra o Console do Navegador (F12)** e verifique os erros
2. **Verifique o caminho base** no `vite.config.ts`
3. **Limpe o cache do navegador** (Ctrl + Shift + Delete)
4. **Verifique se todos os arquivos da pasta `dist` foram enviados**

---

## 📝 Checklist Completo de Deploy

Use esta lista para garantir que tudo foi feito corretamente:

- [ ] Arquivo `.env.local` criado na raiz do projeto
- [ ] Variáveis `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY` configuradas
- [ ] Arquivo `.htaccess` existe na pasta `public/`
- [ ] Build executado com sucesso (`npm run build`)
- [ ] Pasta `dist` gerada com todos os arquivos
- [ ] Arquivo `.htaccess` presente na pasta `dist`
- [ ] Todos os arquivos da pasta `dist` foram enviados para o servidor
- [ ] Arquivo `.htaccess` está na raiz do subdomínio
- [ ] Testado navegação entre páginas
- [ ] Testado F5 em rotas internas (não dá 404)
- [ ] Testado login/autenticação com Supabase
- [ ] Console do navegador sem erros críticos
- [ ] URL do subdomínio adicionada no Supabase (Authentication > URL Configuration)

---

## 🎉 Conclusão

Seguindo este guia, você terá sua aplicação rodando perfeitamente na Hostinger com:

- ✅ Rotas funcionando corretamente (sem erro 404 ao dar F5)
- ✅ Conexão com Supabase funcionando
- ✅ Performance otimizada com cache e compressão
- ✅ Deploy reproduzível e documentado

Se ainda tiver problemas, revise o checklist e a seção de troubleshooting. Em caso de dúvidas, verifique os logs do console do navegador para mais detalhes sobre o erro.

---

**Última atualização:** 2025-10-06  
**Autor:** Sistema de Deploy Automatizado

