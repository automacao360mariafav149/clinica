-- Descrição: Adição de botões de anexo de arquivo/imagem e gravação de áudio no menu WhatsApp
-- Data: 2025-10-11
-- Autor: Sistema MedX

# 📎🎤 Adição: Botões de Anexo e Áudio no WhatsApp

## 📋 Visão Geral

Foram adicionados dois novos botões na barra de mensagens do WhatsApp para futura implementação de:

1. **📎 Anexar Arquivo/Imagem** - Upload de documentos, imagens, PDFs, etc.
2. **🎤 Gravar Áudio** - Gravação de mensagens de voz

**Status Atual:** Botões visuais criados, funcionalidade a ser implementada posteriormente.

---

## 🎨 Interface Implementada

### Layout da Barra de Mensagens

```
┌──────────────────────────────────────────────────────┐
│  [📎]  [Input de texto...]  [🎤]  [📤]              │
└──────────────────────────────────────────────────────┘
```

**Ordem dos elementos:**
1. **Botão Anexar** (📎) - Esquerda
2. **Input de Texto** - Centro (flex-1)
3. **Botão Áudio** (🎤) - Antes do enviar
4. **Botão Enviar** (📤) - Direita

---

## 🔧 Implementação Técnica

### 1. Imports Adicionados

```typescript
import { Paperclip, Mic } from 'lucide-react';
```

### 2. Handlers Criados

#### Handler de Anexo

```typescript
const handleAttachFile = () => {
  console.log('[WhatsApp] 📎 Botão de anexar arquivo clicado');
  toast.info('Funcionalidade de anexo será implementada em breve');
  // TODO: Implementar upload de arquivo/imagem
};
```

**Funcionalidades futuras:**
- Abrir dialog de seleção de arquivo
- Suportar imagens (JPG, PNG, GIF, WebP)
- Suportar documentos (PDF, DOC, XLS, etc.)
- Preview antes do envio
- Upload para Supabase Storage
- Enviar URL via API de WhatsApp

#### Handler de Áudio

```typescript
const handleRecordAudio = () => {
  console.log('[WhatsApp] 🎤 Botão de gravar áudio clicado');
  toast.info('Funcionalidade de áudio será implementada em breve');
  // TODO: Implementar gravação de áudio
};
```

**Funcionalidades futuras:**
- Iniciar gravação ao clicar
- Mostrar timer de gravação
- Botão para parar gravação
- Preview do áudio gravado
- Upload para Supabase Storage
- Enviar URL via API de WhatsApp

### 3. Componentes da Interface

#### Botão de Anexar

```tsx
<TooltipProvider delayDuration={200}>
  <Tooltip>
    <TooltipTrigger asChild>
      <Button
        variant="ghost"
        size="icon"
        onClick={handleAttachFile}
        disabled={!selectedSessionId || sending}
        className="shrink-0 hover:bg-accent"
      >
        <Paperclip className="h-4 w-4" />
      </Button>
    </TooltipTrigger>
    <TooltipContent side="top">
      <p>Anexar arquivo ou imagem</p>
    </TooltipContent>
  </Tooltip>
</TooltipProvider>
```

**Características:**
- ✅ Ícone: `Paperclip` (clipe de papel)
- ✅ Tooltip: "Anexar arquivo ou imagem"
- ✅ Variante: `ghost` (transparente)
- ✅ Hover: Fundo cinza claro
- ✅ Desabilitado quando: Sem conversa selecionada OU enviando mensagem

#### Botão de Áudio

```tsx
<TooltipProvider delayDuration={200}>
  <Tooltip>
    <TooltipTrigger asChild>
      <Button
        variant="ghost"
        size="icon"
        onClick={handleRecordAudio}
        disabled={!selectedSessionId || sending}
        className="shrink-0 hover:bg-accent"
      >
        <Mic className="h-4 w-4" />
      </Button>
    </TooltipTrigger>
    <TooltipContent side="top">
      <p>Gravar mensagem de áudio</p>
    </TooltipContent>
  </Tooltip>
</TooltipProvider>
```

**Características:**
- ✅ Ícone: `Mic` (microfone)
- ✅ Tooltip: "Gravar mensagem de áudio"
- ✅ Variante: `ghost` (transparente)
- ✅ Hover: Fundo cinza claro
- ✅ Desabilitado quando: Sem conversa selecionada OU enviando mensagem

---

## 🎯 Estados dos Botões

| Estado | Condição | Visual |
|--------|----------|--------|
| **Normal** | Conversa selecionada + não enviando | Cinza claro, clicável |
| **Hover** | Mouse sobre o botão | Fundo cinza mais escuro |
| **Desabilitado** | Sem conversa OU enviando | Cinza claro, não clicável |
| **Ativo (futuro)** | Gravando áudio | Vermelho pulsante |

---

## 📱 Comportamento Atual

### Ao Clicar no Botão de Anexo (📎)

1. **Log no console:**
   ```
   [WhatsApp] 📎 Botão de anexar arquivo clicado
   ```

2. **Toast informativo:**
   ```
   ℹ️ Funcionalidade de anexo será implementada em breve
   ```

### Ao Clicar no Botão de Áudio (🎤)

1. **Log no console:**
   ```
   [WhatsApp] 🎤 Botão de gravar áudio clicado
   ```

2. **Toast informativo:**
   ```
   ℹ️ Funcionalidade de áudio será implementada em breve
   ```

---

## 🚀 Próximos Passos - Implementação de Anexo

### 1. Criar Input de Arquivo Oculto

```tsx
const fileInputRef = useRef<HTMLInputElement>(null);

const handleAttachFile = () => {
  fileInputRef.current?.click();
};

const handleFileSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
  const file = e.target.files?.[0];
  if (!file) return;

  console.log('Arquivo selecionado:', file.name, file.type, file.size);
  
  // TODO: Implementar upload e envio
};

// No JSX, adicionar input oculto:
<input
  ref={fileInputRef}
  type="file"
  accept="image/*,.pdf,.doc,.docx,.xls,.xlsx"
  onChange={handleFileSelected}
  style={{ display: 'none' }}
/>
```

### 2. Upload para Supabase Storage

```typescript
const uploadFile = async (file: File) => {
  const fileName = `${Date.now()}_${file.name}`;
  const filePath = `whatsapp/${selectedSessionId}/${fileName}`;

  const { data, error } = await supabase.storage
    .from('attachments')
    .upload(filePath, file);

  if (error) throw error;

  // Obter URL pública
  const { data: publicUrl } = supabase.storage
    .from('attachments')
    .getPublicUrl(filePath);

  return publicUrl.publicUrl;
};
```

### 3. Enviar via API

```typescript
const sendFileMessage = async (fileUrl: string, fileName: string, fileType: string) => {
  const apiBaseUrl = await getApiBaseUrl();
  
  const response = await fetch(`${apiBaseUrl}/enviar-arquivo`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      session_id: selectedSessionId,
      numero_paciente: cleanPhone,
      file_url: fileUrl,
      file_name: fileName,
      file_type: fileType,
      nome_login: user.name,
    }),
  });

  return await response.json();
};
```

### 4. Preview Modal (Opcional)

```tsx
<Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Enviar arquivo</DialogTitle>
    </DialogHeader>
    <div className="space-y-4">
      {/* Preview da imagem ou ícone do arquivo */}
      {fileType.startsWith('image/') ? (
        <img src={filePreviewUrl} alt="Preview" className="max-w-full rounded" />
      ) : (
        <div className="flex items-center gap-2 p-4 border rounded">
          <FileText className="h-8 w-8" />
          <div>
            <div className="font-medium">{fileName}</div>
            <div className="text-sm text-muted-foreground">{fileSize}</div>
          </div>
        </div>
      )}
      
      {/* Input de legenda */}
      <Input
        placeholder="Adicionar legenda (opcional)"
        value={caption}
        onChange={(e) => setCaption(e.target.value)}
      />
    </div>
    <DialogFooter>
      <Button variant="outline" onClick={() => setPreviewOpen(false)}>
        Cancelar
      </Button>
      <Button onClick={handleSendFile}>
        <Send className="h-4 w-4 mr-2" />
        Enviar
      </Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
```

---

## 🚀 Próximos Passos - Implementação de Áudio

### 1. Criar Estados de Gravação

```tsx
const [isRecording, setIsRecording] = useState(false);
const [recordingTime, setRecordingTime] = useState(0);
const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
const mediaRecorderRef = useRef<MediaRecorder | null>(null);
```

### 2. Iniciar Gravação

```typescript
const handleRecordAudio = async () => {
  if (isRecording) {
    // Parar gravação
    mediaRecorderRef.current?.stop();
    setIsRecording(false);
    return;
  }

  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const mediaRecorder = new MediaRecorder(stream);
    mediaRecorderRef.current = mediaRecorder;

    const chunks: BlobPart[] = [];
    
    mediaRecorder.ondataavailable = (e) => {
      chunks.push(e.data);
    };

    mediaRecorder.onstop = () => {
      const blob = new Blob(chunks, { type: 'audio/webm' });
      setAudioBlob(blob);
      setIsRecording(false);
      
      // Abrir modal de preview
      setAudioPreviewOpen(true);
    };

    mediaRecorder.start();
    setIsRecording(true);
    
  } catch (error) {
    console.error('Erro ao acessar microfone:', error);
    toast.error('Não foi possível acessar o microfone');
  }
};
```

### 3. Timer de Gravação

```typescript
useEffect(() => {
  if (!isRecording) return;

  const interval = setInterval(() => {
    setRecordingTime((prev) => prev + 1);
  }, 1000);

  return () => clearInterval(interval);
}, [isRecording]);
```

### 4. Interface Durante Gravação

```tsx
{isRecording ? (
  <div className="flex items-center gap-2 text-red-500">
    <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
    <span className="text-sm font-medium">
      {formatTime(recordingTime)}
    </span>
  </div>
) : null}
```

### 5. Upload e Envio

```typescript
const sendAudioMessage = async (audioBlob: Blob) => {
  // Converter blob para file
  const audioFile = new File([audioBlob], `audio_${Date.now()}.webm`, {
    type: 'audio/webm',
  });

  // Upload para Supabase
  const audioUrl = await uploadFile(audioFile);

  // Enviar via API
  const apiBaseUrl = await getApiBaseUrl();
  
  const response = await fetch(`${apiBaseUrl}/enviar-audio`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      session_id: selectedSessionId,
      numero_paciente: cleanPhone,
      audio_url: audioUrl,
      duration: recordingTime,
      nome_login: user.name,
    }),
  });

  return await response.json();
};
```

---

## 📊 Endpoints de API Necessários

### 1. POST /enviar-arquivo

**Request:**
```json
{
  "session_id": "uuid",
  "numero_paciente": "5511987654321",
  "file_url": "https://storage.supabase.co/...",
  "file_name": "documento.pdf",
  "file_type": "application/pdf",
  "caption": "Segue o exame solicitado",
  "nome_login": "Maria Silva"
}
```

**Response:**
```json
{
  "success": true,
  "message_id": "wamid.xxx",
  "status": "sent"
}
```

### 2. POST /enviar-audio

**Request:**
```json
{
  "session_id": "uuid",
  "numero_paciente": "5511987654321",
  "audio_url": "https://storage.supabase.co/...",
  "duration": 15,
  "nome_login": "Maria Silva"
}
```

**Response:**
```json
{
  "success": true,
  "message_id": "wamid.xxx",
  "status": "sent"
}
```

---

## 🎨 Melhorias de UX Futuras

### Botão de Anexo

1. **Menu dropdown** ao invés de abrir file picker direto:
   ```tsx
   <DropdownMenu>
     <DropdownMenuTrigger>
       <Button variant="ghost" size="icon">
         <Paperclip />
       </Button>
     </DropdownMenuTrigger>
     <DropdownMenuContent>
       <DropdownMenuItem onClick={handleAttachImage}>
         <Image className="mr-2 h-4 w-4" />
         Imagem
       </DropdownMenuItem>
       <DropdownMenuItem onClick={handleAttachDocument}>
         <FileText className="mr-2 h-4 w-4" />
         Documento
       </DropdownMenuItem>
     </DropdownMenuContent>
   </DropdownMenu>
   ```

2. **Drag & Drop:** Arrastar arquivo para a área de mensagens

3. **Paste:** Colar imagem do clipboard (Ctrl+V)

### Botão de Áudio

1. **Segurar para gravar:** Padrão WhatsApp (hold-to-record)

2. **Cancelar gravação:** Arrastar para esquerda

3. **Enviar rápido:** Soltar o botão

4. **Bloqueio de gravação:** Arrastar para cima para travar

---

## ✅ Checklist de Implementação Futura

### Anexo de Arquivo

- [ ] Adicionar input file oculto
- [ ] Implementar seleção de arquivo
- [ ] Validar tipo e tamanho do arquivo
- [ ] Criar preview modal
- [ ] Implementar upload para Supabase Storage
- [ ] Criar endpoint `/enviar-arquivo` no webhook
- [ ] Integrar com API de envio
- [ ] Adicionar progress bar de upload
- [ ] Implementar drag & drop
- [ ] Implementar paste de clipboard

### Gravação de Áudio

- [ ] Solicitar permissão de microfone
- [ ] Implementar MediaRecorder
- [ ] Criar timer de gravação
- [ ] Adicionar botão de pausar/retomar
- [ ] Criar preview do áudio gravado
- [ ] Implementar upload para Supabase Storage
- [ ] Criar endpoint `/enviar-audio` no webhook
- [ ] Integrar com API de envio
- [ ] Adicionar limite de duração (ex: 5 minutos)
- [ ] Implementar hold-to-record (segurar para gravar)

---

## 📝 Arquivos Modificados

### `src/pages/WhatsApp.tsx`

**Linhas adicionadas:**

1. **Linha 14:** Import dos ícones `Paperclip` e `Mic`
2. **Linhas 518-530:** Handlers `handleAttachFile` e `handleRecordAudio`
3. **Linhas 757-820:** Nova interface da barra de mensagens com os botões

**Total:** ~70 linhas adicionadas

---

## 🎯 Resultado Visual

```
┌─────────────────────────────────────────────────────────┐
│                  Conversa Selecionada                   │
│  ─────────────────────────────────────────────────────  │
│  Mensagens...                                           │
│  ─────────────────────────────────────────────────────  │
│  [📎]  [Digite sua mensagem...]  [🎤]  [📤]            │
└─────────────────────────────────────────────────────────┘

Legenda:
📎 = Anexar arquivo/imagem (Paperclip)
🎤 = Gravar áudio (Mic)
📤 = Enviar mensagem (Send)
```

---

## 🧪 Como Testar Agora

1. **Recarregue a página** (Ctrl+R)
2. **Selecione uma conversa**
3. **Veja os novos botões** na barra inferior
4. **Passe o mouse** sobre cada botão para ver o tooltip
5. **Clique no botão de anexo (📎)**
   - Verá toast: "Funcionalidade de anexo será implementada em breve"
   - Console: `[WhatsApp] 📎 Botão de anexar arquivo clicado`
6. **Clique no botão de áudio (🎤)**
   - Verá toast: "Funcionalidade de áudio será implementada em breve"
   - Console: `[WhatsApp] 🎤 Botão de gravar áudio clicado`

---

**Implementação visual concluída em:** 2025-10-11  
**Status:** ✅ Interface pronta, lógica a ser implementada  
**Próximo passo:** Implementar upload e envio de arquivos/áudio

