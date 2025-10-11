-- Descrição: Exemplos completos de payloads para envio de mensagens via WhatsApp
-- Data: 2025-10-11
-- Autor: Sistema MedX

# 📤 Exemplos de Payload: Envio WhatsApp

## 📋 Endpoint

```
POST https://webhook.n8nlabz.com.br/webhook/enviar-mensagem
Content-Type: application/json
```

---

## 1️⃣ Mensagem de TEXTO

### Payload

```json
{
  "session_id": "dc435ef1-9959-41dc-a67d-7d8da27d6dd8",
  "numero_paciente": "5519994419319",
  "texto": "Olá! Como posso ajudar você hoje?",
  "nome_login": "Maria Silva",
  "funcao": "text"
}
```

### Descrição dos Campos

| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|-----------|
| `session_id` | string (UUID) | ✅ Sim | ID da conversa (mesmo ID do paciente/pré-paciente) |
| `numero_paciente` | string | ✅ Sim | Número do WhatsApp (apenas dígitos, sem @s.whatsapp.net) |
| `texto` | string | ✅ Sim | Mensagem de texto a ser enviada |
| `nome_login` | string | ✅ Sim | Nome do usuário que está enviando |
| `funcao` | string | ✅ Sim | Tipo de mensagem: **"text"** |

### Exemplo Real

```json
{
  "session_id": "dc435ef1-9959-41dc-a67d-7d8da27d6dd8",
  "numero_paciente": "5519994419319",
  "texto": "Boa tarde! Sua consulta está agendada para amanhã às 14h. Por favor, chegue 15 minutos antes.",
  "nome_login": "Dra. Maria Silva",
  "funcao": "text"
}
```

---

## 2️⃣ Arquivo / IMAGEM

### Payload

```json
{
  "session_id": "dc435ef1-9959-41dc-a67d-7d8da27d6dd8",
  "numero_paciente": "5519994419319",
  "texto": "",
  "nome_login": "Maria Silva",
  "funcao": "arquivo",
  "arquivo_nome": "resultado_exame.pdf",
  "base64": "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
  "tipo_documento": "arquivo"
}
```

### Descrição dos Campos

| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|-----------|
| `session_id` | string (UUID) | ✅ Sim | ID da conversa |
| `numero_paciente` | string | ✅ Sim | Número do WhatsApp |
| `texto` | string | ✅ Sim | **String vazia ""** (campo obrigatório mas vazio) |
| `nome_login` | string | ✅ Sim | Nome do usuário que está enviando |
| `funcao` | string | ✅ Sim | Tipo de mensagem: **"arquivo"** |
| `arquivo_nome` | string | ✅ Sim | Nome original do arquivo com extensão |
| `base64` | string (base64) | ✅ Sim | **Conteúdo do arquivo em base64** |
| `tipo_documento` | string | ✅ Sim | **"imagem"** (se for JPG/PNG/etc.) ou **"arquivo"** (PDF/Word/Excel/etc.) |

### Exemplo Real - PDF (Documento)

```json
{
  "session_id": "dc435ef1-9959-41dc-a67d-7d8da27d6dd8",
  "numero_paciente": "5519994419319",
  "texto": "",
  "nome_login": "Dra. Maria Silva",
  "funcao": "arquivo",
  "arquivo_nome": "resultado_exame_fernando.pdf",
  "base64": "JVBERi0xLjQKJeLjz9MKNCAwIG9iago8PC9MZW5ndGggNSAwIFIvRmlsdGVyL0ZsYXRlRGVjb2RlPj4Kc3RyZWFtCnicY2BgYGJgYGDOL8vPzcnJLEnMUXBxdAXxeRj4GAAAVkAG+gplbmRzdHJlYW0KZW5kb2JqCjUgMCBvYmoKNTkKZW5kb2JqCjYgMCBvYmoKPDwvVHlwZS9FeHRHU3RhdGUvY2EgMT4+CmVuZG9iago3IDAgb2JqCjw8L1R5cGUvRXh0R1N0YXRlL0NBIDE+PgplbmRvYmoKOCAwIG9iago8PC9UeXBlL0ZvbnQvU3VidHlwZS9UeXBlMS9CYXNlRm9udC9IZWx2ZXRpY2EvRW5jb2RpbmcvV2luQW5zaUVuY29kaW5nPj4KZW5kb2JqCjkgMCBvYmoKPDwvVHlwZS9Gb250L1N1YnR5cGUvVHlwZTEvQmFzZUZvbnQvSGVsdmV0aWNhLUJvbGQvRW5jb2RpbmcvV2luQW5zaUVuY29kaW5nPj4KZW5kb2JqCjEwIDAgb2JqCjw8L1R5cGUvRm9udC9TdWJ0eXBlL1R5cGUxL0Jhc2VGb250L0hlbHZldGljYS1PYmxpcXVlL0VuY29kaW5nL1dpbkFuc2lFbmNvZGluZz4+CmVuZG9iagoxMSAwIG9iago8PC9UeXBlL0ZvbnQvU3VidHlwZS9UeXBlMS9CYXNlRm9udC9IZWx2ZXRpY2EtQm9sZE9ibGlxdWUvRW5jb2RpbmcvV2luQW5zaUVuY29kaW5nPj4KZW5kb2JqCjEyIDAgb2JqCjw8L1R5cGUvRm9udC9TdWJ0eXBlL1R5cGUxL0Jhc2VGb250L0NvdXJpZXIvRW5jb2RpbmcvV2luQW5zaUVuY29kaW5nPj4KZW5kb2JqCjEzIDAgb2JqCjw8L1R5cGUvRm9udC9TdWJ0eXBlL1R5cGUxL0Jhc2VGb250L0NvdXJpZXItQm9sZC9FbmNvZGluZy9XaW5BbnNpRW5jb2Rpbmc+PgplbmRvYmoKMTQgMCBvYmoKPDwvVHlwZS9Gb250L1N1YnR5cGUvVHlwZTEvQmFzZUZvbnQvQ291cmllci1PYmxpcXVlL0VuY29kaW5nL1dpbkFuc2lFbmNvZGluZz4+CmVuZG9iagoxNSAwIG9iago8PC9UeXBlL0ZvbnQvU3VidHlwZS9UeXBlMS9CYXNlRm9udC9Db3VyaWVyLUJvbGRPYmxpcXVlL0VuY29kaW5nL1dpbkFuc2lFbmNvZGluZz4+CmVuZG9iagoxNiAwIG9iago8PC9UeXBlL0ZvbnQvU3VidHlwZS9UeXBlMS9CYXNlRm9udC9UaW1lcy1Sb21hbi9FbmNvZGluZy9XaW5BbnNpRW5jb2Rpbmc+PgplbmRvYmoKMTcgMCBvYmoKPDwvVHlwZS9Gb250L1N1YnR5cGUvVHlwZTEvQmFzZUZvbnQvVGltZXMtQm9sZC9FbmNvZGluZy9XaW5BbnNpRW5jb2Rpbmc+PgplbmRvYmoKMTggMCBvYmoKPDwvVHlwZS9Gb250L1N1YnR5cGUvVHlwZTEvQmFzZUZvbnQvVGltZXMtSXRhbGljL0VuY29kaW5nL1dpbkFuc2lFbmNvZGluZz4+CmVuZG9iagoxOSAwIG9iago8PC9UeXBlL0ZvbnQvU3VidHlwZS9UeXBlMS9CYXNlRm9udC9UaW1lcy1Cb2xkSXRhbGljL0VuY29kaW5nL1dpbkFuc2lFbmNvZGluZz4+CmVuZG9iagoyMCAwIG9iago8PC9UeXBlL0ZvbnQvU3VidHlwZS9UeXBlMS9CYXNlRm9udC9TeW1ib2w+PgplbmRvYmoKMjEgMCBvYmoKPDwvVHlwZS9Gb250L1N1YnR5cGUvVHlwZTEvQmFzZUZvbnQvWmFwZkRpbmdiYXRzPj4KZW5kb2JqCjIyIDAgb2JqCjw8L1R5cGUvUGFnZS9QYXJlbnQgMiAwIFIvUmVzb3VyY2VzPDwvRm9udDw8L0YxIDggMCBSL0YyIDkgMCBSL0YzIDEwIDAgUi9GNCA...",
  "tipo_documento": "arquivo"
}
```

### Exemplo Real - Imagem (JPG)

```json
{
  "session_id": "dc435ef1-9959-41dc-a67d-7d8da27d6dd8",
  "numero_paciente": "5519994419319",
  "texto": "",
  "nome_login": "Dra. Maria Silva",
  "funcao": "arquivo",
  "arquivo_nome": "raio_x_torax.jpg",
  "base64": "/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAAMCAgMCAgMDAwMEAwMEBQgFBQQEBQoHBwYIDAoMDAsKCwsNDhIQDQ4RDgsLEBYQERMUFRUVDA8XGBYUGBIUFRT/2wBDAQMEBAUEBQkFBQkUDQsNFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBT/wAARCABkAGQDASIAAhEBAxEB/8QAHwAAAQUBAQEBAQEAAAAAAAAAAAECAwQFBgcICQoL/8QAtRAAAgEDAwIEAwUFBAQAAAF9AQIDAAQRBRIhMUEGE1FhByJxFDKBkaEII0KxwRVS0fAkM2JyggkKFhcYGRolJicoKSo0NTY3ODk6Q0RFRkdISUpTVFVWV1hZWmNkZWZnaGlqc3R1dnd4eXqDhIWGh4iJipKTlJWWl5iZmqKjpKWmp6ipqrKztLW2t7i5usLDxMXGx8jJytLT1NXW19jZ2uHi4+Tl5ufo6erx8vP09fb3+Pn6/8QAHwEAAwEBAQEBAQEBAQAAAAAAAAECAwQFBgcICQoL/8QAtREAAgECBAQDBAcFBAQAAQJ3AAECAxEEBSExBhJBUQdhcRMiMoEIFEKRobHBCSMzUvAVYnLRChYkNOEl8RcYGRomJygpKjU2Nzg5OkNERUZHSElKU1RVVldYWVpjZGVmZ2hpanN0dXZ3eHl6goOEhYaHiImKkpOUlZaXmJmaoqOkpaanqKmqsrO0tba3uLm6wsPExcbHyMnK0tPU1dbX2Nnaw8TFxsfIycrT1NXW19jZ2uHi4+Tl...",
  "tipo_documento": "imagem"
}
```

### Exemplo Real - Documento Word

```json
{
  "session_id": "dc435ef1-9959-41dc-a67d-7d8da27d6dd8",
  "numero_paciente": "5519994419319",
  "texto": "",
  "nome_login": "Maria Silva",
  "funcao": "arquivo",
  "arquivo_nome": "receita_medica.docx",
  "base64": "UEsDBBQABgAIAAAAIQDfpNJsWgEAACAFAAATAAgCW0NvbnRlbnRfVHlwZXNdLnhtbCCiBAIooAAC...",
  "tipo_documento": "arquivo"
}
```

---

## 3️⃣ Mensagem de ÁUDIO

### Payload

```json
{
  "session_id": "dc435ef1-9959-41dc-a67d-7d8da27d6dd8",
  "numero_paciente": "5519994419319",
  "texto": "",
  "nome_login": "Maria Silva",
  "funcao": "audio",
  "arquivo_nome": "audio_1760195956904.webm",
  "base64": "//uQxAAAAAAAAAAAAAAAAAAAAASW5mbwAAAA8AAAASAAAeMwAUFBQUFCIiIiIiIjAwMDAwMD4+Pj4+PkxMTExMTFpaWlpaWmhoaGhoaHZ2dnZ2doSEhISEhJKSkpKSkqCgoKCgoK6urq6urrz8/Pz8zMzMzMzM2tra2tra6Ojo6Ojo9vb29vb2////AAAAOUxBTUUzLjEwMAAAAAAAAAAVCCQCQCEAADgAAB4zNTjmGAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA..."
}
```

### Descrição dos Campos

| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|-----------|
| `session_id` | string (UUID) | ✅ Sim | ID da conversa |
| `numero_paciente` | string | ✅ Sim | Número do WhatsApp |
| `texto` | string | ✅ Sim | **String vazia ""** (campo obrigatório mas vazio) |
| `nome_login` | string | ✅ Sim | Nome do usuário que está enviando |
| `funcao` | string | ✅ Sim | Tipo de mensagem: **"audio"** |
| `arquivo_nome` | string | ✅ Sim | Nome do arquivo de áudio (ex: audio_timestamp.webm) |
| `base64` | string (base64) | ✅ Sim | **Conteúdo do áudio em base64** |

### Exemplo Real - Áudio WebM

```json
{
  "session_id": "dc435ef1-9959-41dc-a67d-7d8da27d6dd8",
  "numero_paciente": "5519994419319",
  "texto": "",
  "nome_login": "Dra. Maria Silva",
  "funcao": "audio",
  "arquivo_nome": "audio_1760195956904.webm",
  "base64": "GkXfowEAAAAAAAAfQoaBAUL3gQFC8oEEQvOBCEKChHdlYm1Ch4ECQoWBAhhTgGcBAAAAAAAVkhFNm3RALE27i1OrhBVJqWZTrIHlTbuMU6uEFlSua1OsggEwTbuMU6uEHFO7a1OsggLMU6uMU6uEIdXBBU27i1OrhBZUrmtTrIIJTbuNBE27jBFNm4xTq4QcU7trU6yCDMxTq4xTq4Qp4OMCBmpd7hFNm4hTq4Qcqw9TrIIBzFOrgxhTu4tTq4QWVq5rU6yCCU27jQRNu4wRTZuMU6uEHFO7a1OsggzMU6uMU6uEL+IgBmpd7hFNm4hTq4QcqxdTrIIBzFOrgxhTu4tTq4QWVq5rU6yCCU27jQRNu4wRTZuMU6uEHFO7a1OsggzMU6uMU6uET+MgBmpd7hFNm4hTq4Qcqx9TrIIBzFOrgxhTu4tTq4QWVq5rU6yCCU27jQRNu4wRTZuMU6uEHFO7a1OsggzMU6uMU6uEb+QgBmpd7hFNm4hTq4QcqydTrIIBzFOrgxhTu4tTq4QWVq5rU6yCCU27jQRNu4wRTZuMU6uEHFO7a1OsggzMU6uMU6uEl+YgBmpd7hFNm4hTq4Qcqy9TrIIBzFOrgxhTu4tTq4QWVq5rU6yCCU27jQRNu4wRTZuMU6uEHFO7a1OsggzMU6uMU6uEr+ggBmpd7hFNm4hTq4Qcqzd..."
}
```

### Exemplo Real - Áudio OGG

```json
{
  "session_id": "dc435ef1-9959-41dc-a67d-7d8da27d6dd8",
  "numero_paciente": "5519994419319",
  "texto": "",
  "nome_login": "Dr. João Santos",
  "funcao": "audio",
  "arquivo_nome": "mensagem_voz.ogg",
  "base64": "T2dnUwACAAAAAAAAAADqnjMlAAAAAOr3Nx4BHgF2b3JiaXMAAAAAAkSsAAAAAAAAgDgBAAAAAAC4AU9nZ1MAAAAAAAAAAAAA6p4zJQEAAABhHzO6Dy3//////////////////8kDdm9yYmlzHQAAAFhpcGguT3JnIGxpYlZvcmJpcyBJIDIwMDQwOTI5AAAAAAEFdm9yYmlzKUJDVgEACAAAADFMIMWE0JBVAAAQAABgJCkOk2ZJKaWUoSh5mJRISSmllMUwiZiUicUYY4wxxhhjjDHGGGOMIDRkFQAABACAKAmOo+ZJas45ZxgnjnKgOWlOOKcYJ45yoznpTElJGGWMac5JKGWMadKJp5xTEhJGGWOac5JKGWMadCIqp6pAImikKAEAoMBQBARRDgIgDAKoMkC..."
}
```

---

## 📊 Comparação dos 3 Tipos

| Aspecto | TEXTO | ARQUIVO/IMAGEM | ÁUDIO |
|---------|-------|----------------|-------|
| **funcao** | `"text"` | `"arquivo"` | `"audio"` |
| **Campo texto** | Mensagem normal | String vazia `""` | String vazia `""` |
| **Campo base64** | ❌ Não enviado | ✅ Conteúdo do arquivo | ✅ Conteúdo do áudio |
| **arquivo_nome** | ❌ Não enviado | ✅ Obrigatório | ✅ Obrigatório |
| **tipo_documento** | ❌ Não enviado | ✅ `"imagem"` ou `"arquivo"` | ❌ Não enviado |
| **Tamanho típico** | < 1KB | 100KB - 10MB | 50KB - 5MB |
| **Exemplo texto** | "Olá, tudo bem?" | `""` | `""` |
| **Exemplo base64** | - | Base64 de PDF/JPG | Base64 de WebM/OGG |

---

## 🔍 Como Identificar no Backend (N8N)

### Exemplo em JavaScript/Node.js

```javascript
// No webhook N8N
const { funcao, texto, numero_paciente, arquivo_nome, base64, tipo_documento } = $input.json;

if (funcao === 'text') {
  // MENSAGEM DE TEXTO
  console.log('📝 Enviando mensagem de texto');
  await sendTextMessage(numero_paciente, texto);
  
} else if (funcao === 'arquivo') {
  // ARQUIVO/IMAGEM
  console.log('📎 Enviando arquivo:', arquivo_nome, 'tipo:', tipo_documento);
  
  // Decodificar base64
  const buffer = Buffer.from(base64, 'base64');
  
  // Usar o campo tipo_documento para decidir
  if (tipo_documento === 'imagem') {
    // É uma imagem
    await sendImageMessage(numero_paciente, buffer, arquivo_nome);
  } else {
    // É um documento (PDF, DOC, Excel, etc.)
    await sendDocumentMessage(numero_paciente, buffer, arquivo_nome);
  }
  
} else if (funcao === 'audio') {
  // ÁUDIO
  console.log('🎤 Enviando áudio:', arquivo_nome);
  
  // Decodificar base64
  const buffer = Buffer.from(base64, 'base64');
  
  // Enviar como mensagem de áudio
  await sendAudioMessage(numero_paciente, buffer);
}
```

---

## 💡 Dicas Importantes

### 1. Base64 NÃO inclui prefixo

❌ **ERRADO:**
```json
{
  "texto": "data:image/png;base64,iVBORw0KGgoAAAA..."
}
```

✅ **CORRETO:**
```json
{
  "texto": "iVBORw0KGgoAAAA..."
}
```

### 2. Tamanhos de Arquivo

| Tipo | Tamanho Máximo Recomendado |
|------|----------------------------|
| Imagem | 5MB |
| PDF | 10MB |
| Áudio | 5MB |
| Documento | 10MB |

### 3. Formatos de Arquivo Suportados

**Imagens** (`tipo_documento: "imagem"`):
- JPG/JPEG
- PNG
- GIF
- WebP
- BMP
- SVG
- ICO

**Documentos** (`tipo_documento: "arquivo"`):
- PDF
- DOC/DOCX
- XLS/XLSX
- TXT

**Áudio:**
- WebM (gravação do navegador)
- OGG
- MP3
- M4A

### 4. Campo `tipo_documento`

- **Para arquivos (`funcao: "arquivo"`):**
  - Se o arquivo for uma **imagem** (jpg, png, gif, webp, bmp, svg, ico) → `tipo_documento: "imagem"`
  - Se o arquivo for um **documento** (pdf, doc, docx, xls, xlsx, txt, etc.) → `tipo_documento: "arquivo"`
- **O sistema detecta automaticamente a extensão do arquivo e define o tipo correto**
- **Para áudio e texto, o campo `tipo_documento` não é enviado**

### 5. Nome do Arquivo

- Sempre incluir a extensão: `documento.pdf` ✅
- Sem extensão: `documento` ❌
- Nome descritivo ajuda: `resultado_exame_fernando_10112025.pdf` ✅

---

## 🧪 Exemplo de Teste com cURL

### Teste 1: Mensagem de Texto

```bash
curl -X POST https://webhook.n8nlabz.com.br/webhook/enviar-mensagem \
  -H "Content-Type: application/json" \
  -d '{
    "session_id": "dc435ef1-9959-41dc-a67d-7d8da27d6dd8",
    "numero_paciente": "5519994419319",
    "texto": "Teste de mensagem via API",
    "nome_login": "Maria Silva",
    "funcao": "text"
  }'
```

### Teste 2: Arquivo - Imagem (pequeno)

```bash
curl -X POST https://webhook.n8nlabz.com.br/webhook/enviar-mensagem \
  -H "Content-Type: application/json" \
  -d '{
    "session_id": "dc435ef1-9959-41dc-a67d-7d8da27d6dd8",
    "numero_paciente": "5519994419319",
    "texto": "",
    "nome_login": "Maria Silva",
    "funcao": "arquivo",
    "arquivo_nome": "teste.png",
    "base64": "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
    "tipo_documento": "imagem"
  }'
```

### Teste 2.1: Arquivo - PDF (documento)

```bash
curl -X POST https://webhook.n8nlabz.com.br/webhook/enviar-mensagem \
  -H "Content-Type: application/json" \
  -d '{
    "session_id": "dc435ef1-9959-41dc-a67d-7d8da27d6dd8",
    "numero_paciente": "5519994419319",
    "texto": "",
    "nome_login": "Maria Silva",
    "funcao": "arquivo",
    "arquivo_nome": "documento.pdf",
    "base64": "JVBERi0xLjQKJeLjz9MKNCAwIG9iago8PC9MZW5ndGggNSAwIFIvRmlsdGVyL0ZsYXRlRGVjb2RlPj4Kc3RyZWFtCnicY2BgYGJgYGDOL8vPzcnJLEnMUXBxdAXxeRj4GAAAVkAG+gplbmRzdHJlYW0KZW5kb2JqCjUgMCBvYmoKNTkKZW5kb2JqCjYgMCBvYmoKPDwvVHlwZS9FeHRHU3RhdGUvY2EgMT4+CmVuZG9iago3IDAgb2JqCjw8L1R5cGUvRXh0R1N0YXRlL0NBIDE+PgplbmRvYmoKOCAwIG9iago8PC9UeXBlL0ZvbnQvU3VidHlwZS9UeXBlMS9CYXNlRm9udC9IZWx2ZXRpY2EvRW5jb2RpbmcvV2luQW5zaUVuY29kaW5nPj4KZW5kb2JqCg==",
    "tipo_documento": "arquivo"
  }'
```

### Teste 3: Áudio (pequeno)

```bash
curl -X POST https://webhook.n8nlabz.com.br/webhook/enviar-mensagem \
  -H "Content-Type: application/json" \
  -d '{
    "session_id": "dc435ef1-9959-41dc-a67d-7d8da27d6dd8",
    "numero_paciente": "5519994419319",
    "texto": "",
    "nome_login": "Maria Silva",
    "funcao": "audio",
    "arquivo_nome": "audio_teste.webm",
    "base64": "GkXfowEAAAAAAAAfQoaBAUL3gQFC8oEEQvOBCEKChHdlYm1Ch4ECQoWBAhhTgGcBAAAAAAAVkhFNm3RALE27i1OrhBVJqWZTrIHlTbuMU6uEFlSua1OsggEwTbuMU6uEHFO7a1OsggLMU6uMU6uEIdXBBU27i1OrhBZUrmtTrIIJTbuNBE27jBFNm4xTq4QcU7trU6yCDMxTq4xTq4Qp4OMCBmpd7hFNm4hTq4Qcqw9TrIIBzFOrgxhTu4tTq4QWVq5rU6yCCU27jQRNu4wRTZuMU6uEHFO7a1OsggzMU6uMU6uEL+IgBmpd7hFNm4hTq4QcqxdTrIIBzFOrgxhTu4tTq4QWVq5rU6yCCU27jQRNu4w="
  }'
```

---

## 📝 Response Esperada

### Sucesso

```json
{
  "success": true,
  "message_id": "wamid.HBgLNTUxMTk4NzY1NDMyMRUCABEYEjFBNUIyQzNENEU1RjZHNzhIAA==",
  "status": "sent",
  "timestamp": "2025-10-11T14:30:00.000Z"
}
```

### Erro

```json
{
  "success": false,
  "error": "Número de telefone inválido",
  "code": "INVALID_PHONE"
}
```

---

## 🎯 Resumo Rápido

| Tipo | funcao | texto contém | arquivo_nome |
|------|--------|--------------|--------------|
| **Texto** | `"text"` | Mensagem normal | Não enviar |
| **Arquivo** | `"arquivo"` | Base64 | Nome com extensão |
| **Áudio** | `"audio"` | Base64 | Nome com extensão |

---

**Documento criado em:** 2025-10-11  
**Status:** ✅ Exemplos completos e testáveis  
**Próximo passo:** Configurar backend para processar cada tipo

