# Implementação de Gravação e Envio de Áudio - Menu WhatsApp

**Data:** 2025-10-11  
**Autor:** Sistema MedX - Aura Clinic  
**Contexto:** Menu WhatsApp - Gravação e Envio de Mensagens de Áudio

---

## 📋 Objetivo

Implementar gravação de áudio via microfone do navegador com conversão automática para base64 e envio para o endpoint `/enviar-mensagem` com `funcao: "audio"`.

---

## ✅ Funcionalidades Implementadas

### 1️⃣ **Gravação de Áudio**
- ✅ Solicita permissão ao microfone do navegador
- ✅ Usa MediaRecorder API para gravar em formato WebM
- ✅ Feedback visual durante gravação (botão vermelho pulsante)
- ✅ Contador de tempo em tempo real (formato MM:SS)
- ✅ Botão muda de estado: normal → gravando → processando

### 2️⃣ **Processamento Automático**
- ✅ Conversão automática de Blob para base64
- ✅ Validação de tamanho (máximo 5MB)
- ✅ Geração automática de nome de arquivo com timestamp
- ✅ Envio automático após parar gravação

### 3️⃣ **Integração com Endpoint Existente**
- ✅ Usa o mesmo endpoint `/enviar-mensagem`
- ✅ Payload estruturado corretamente:
  - `funcao: "audio"`
  - `texto: ""`
  - `base64: "..."`
  - `arquivo_nome: "audio_timestamp.webm"`

---

## 🎨 Interface do Usuário

### **Estado Normal (Não Gravando)**
```
🎤 Ícone de microfone cinza
Tooltip: "Gravar mensagem de áudio"
```

### **Estado Gravando**
```
🔴 🎤 00:15 (botão vermelho pulsante)
Tooltip: "🔴 Clique para parar a gravação"
```

### **Feedback durante processo**
- **Iniciando:** Toast "🎤 Gravando áudio..."
- **Processando:** Toast "Convertendo áudio..."
- **Sucesso:** Toast de mensagem enviada
- **Erro:** Toast com mensagem de erro específica

---

## 🔧 Implementação Técnica

### **Estados Adicionados**

```typescript
const [isRecording, setIsRecording] = useState(false);
const [recordingTime, setRecordingTime] = useState(0);
const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
const [audioChunks, setAudioChunks] = useState<Blob[]>([]);
const recordingTimerRef = useRef<NodeJS.Timeout | null>(null);
```

### **Função de Conversão para Base64**

```typescript
const audioToBase64 = (blob: Blob): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(blob);
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        const base64 = reader.result.split(',')[1];
        resolve(base64);
      } else {
        reject(new Error('Erro ao converter áudio'));
      }
    };
    reader.onerror = (error) => reject(error);
  });
};
```

### **Handler Principal**

```typescript
const handleRecordAudio = async () => {
  if (isRecording) {
    // PARAR GRAVAÇÃO
    if (mediaRecorder && mediaRecorder.state !== 'inactive') {
      mediaRecorder.stop(); // Dispara evento 'onstop'
    }
    
    if (recordingTimerRef.current) {
      clearInterval(recordingTimerRef.current);
    }
    
    setIsRecording(false);
    
  } else {
    // INICIAR GRAVAÇÃO
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    
    const recorder = new MediaRecorder(stream, {
      mimeType: 'audio/webm',
    });
    
    const chunks: Blob[] = [];
    
    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) {
        chunks.push(e.data);
      }
    };
    
    recorder.onstop = async () => {
      stream.getTracks().forEach((track) => track.stop());
      
      const audioBlob = new Blob(chunks, { type: 'audio/webm' });
      
      // Validar tamanho (máx 5MB)
      if (audioBlob.size > 5 * 1024 * 1024) {
        toast.error('Áudio muito grande! Máximo: 5MB');
        return;
      }
      
      const base64 = await audioToBase64(audioBlob);
      const fileName = `audio_${Date.now()}.webm`;
      
      await handleSendMessage('audio', base64, fileName);
      setRecordingTime(0);
    };
    
    recorder.start();
    setMediaRecorder(recorder);
    setIsRecording(true);
    setRecordingTime(0);
    
    recordingTimerRef.current = setInterval(() => {
      setRecordingTime((prev) => prev + 1);
    }, 1000);
  }
};
```

### **Limpeza de Recursos**

```typescript
useEffect(() => {
  return () => {
    if (recordingTimerRef.current) {
      clearInterval(recordingTimerRef.current);
    }
  };
}, []);
```

---

## 📦 Payload Gerado

### **Exemplo de Payload Enviado**

```json
{
  "session_id": "dc435ef1-9959-41dc-a67d-7d8da27d6dd8",
  "numero_paciente": "5519994419319",
  "texto": "",
  "nome_login": "Maria Silva",
  "funcao": "audio",
  "arquivo_nome": "audio_1697045678901.webm",
  "base64": "GkXfowEAAAAAAAAfQoaBAUL3gQFC8oEEQvOBCEKChHdlYm1Ch4ECQoWBAhhTgGcBAAAAAAAVkhFNm3RALE27i1OrhBVJqWZTrIHlTbuMU6uEFlSua1OsggEwTbuMU6uEHFO7a1OsggLMU6uMU6uEIdXBBU27i1OrhBZUrmtTrIIJTbuNBE27jBFNm4xTq4QcU7trU6yCDMxTq4xTq4Qp4OMCBmpd7hFNm4hTq4Qcqw9TrIIBzFOrgxhTu4tTq4QWVq5rU6yCCU27jQRNu4wRTZuMU6uEHFO7a1OsggzMU6uMU6uEL+IgBmpd7hFNm4hTq4Qcqxd..."
}
```

---

## 🎯 Fluxo Completo

```
1. Usuário clica no botão 🎤
   ↓
2. Sistema solicita permissão ao microfone
   ↓
3. Usuário concede permissão
   ↓
4. Gravação inicia
   - Botão muda para vermelho pulsante
   - Timer começa a contar (00:01, 00:02...)
   - Toast: "🎤 Gravando áudio..."
   ↓
5. Usuário clica novamente para parar
   ↓
6. Sistema processa:
   - Para o stream do microfone
   - Cria Blob do áudio
   - Valida tamanho (< 5MB)
   - Converte para base64
   - Toast: "Convertendo áudio..."
   ↓
7. Sistema envia:
   - POST para /enviar-mensagem
   - funcao: "audio"
   - base64 contém o áudio
   - arquivo_nome: "audio_timestamp.webm"
   ↓
8. Resetar estados:
   - isRecording = false
   - recordingTime = 0
   - Toast de sucesso
```

---

## ⚠️ Validações e Tratamento de Erros

### **1. Permissão Negada**
```typescript
catch (error) {
  toast.error('Não foi possível acessar o microfone. Verifique as permissões.');
}
```

### **2. Arquivo Muito Grande**
```typescript
if (audioBlob.size > 5 * 1024 * 1024) {
  toast.error('Áudio muito grande! Máximo: 5MB');
  return;
}
```

### **3. Sessão Não Selecionada**
```typescript
disabled={!selectedSessionId || sending}
```

### **4. Erro na Conversão**
```typescript
catch (error) {
  toast.error('Erro ao processar áudio');
}
```

---

## 🌐 Compatibilidade

### **Navegadores Suportados:**
- ✅ Chrome 49+
- ✅ Firefox 25+
- ✅ Edge 79+
- ✅ Opera 36+
- ✅ Safari 14.1+ (com limitações no formato)

### **Formato de Áudio:**
- **Padrão:** WebM (suportado pela maioria dos navegadores)
- **Codec:** Opus
- **Extensão:** `.webm`

---

## 🔍 Como o Backend Deve Processar

### **Exemplo no N8N (Webhook)**

```javascript
const { funcao, base64, arquivo_nome, numero_paciente } = $input.json;

if (funcao === 'audio') {
  console.log('🎤 Enviando áudio:', arquivo_nome);
  
  // Decodificar base64
  const buffer = Buffer.from(base64, 'base64');
  
  // Enviar como mensagem de áudio no WhatsApp
  await sendAudioMessage(numero_paciente, buffer);
}
```

---

## 📊 Tamanhos e Limites

| Duração | Tamanho Aproximado | Status |
|---------|-------------------|--------|
| 10 segundos | ~50KB | ✅ OK |
| 30 segundos | ~150KB | ✅ OK |
| 1 minuto | ~300KB | ✅ OK |
| 2 minutos | ~600KB | ✅ OK |
| 5 minutos | ~1.5MB | ✅ OK |
| 10 minutos | ~3MB | ✅ OK |
| 15 minutos | ~4.5MB | ✅ OK |
| 20+ minutos | >5MB | ❌ Muito grande |

---

## 🎨 Classes CSS Utilizadas

```tsx
// Normal
className="shrink-0 hover:bg-accent"

// Gravando
className="shrink-0 gap-2 animate-pulse"
variant="destructive"
```

---

## 🚀 Melhorias Futuras (Opcional)

1. **Visualização de Forma de Onda**
   - Mostrar amplitude do áudio durante gravação
   - Usar Web Audio API

2. **Pausa/Retomar**
   - Permitir pausar gravação sem perder o áudio

3. **Pré-visualização**
   - Ouvir áudio antes de enviar
   - Opção de regravar

4. **Escolha de Formato**
   - Suporte para MP3, OGG, etc.
   - Seleção de qualidade

5. **Cancelar Gravação**
   - Botão para descartar gravação sem enviar

---

## ✅ Status

✅ **Implementado e funcionando**  
✅ **Integrado com endpoint existente**  
✅ **Feedback visual completo**  
✅ **Tratamento de erros**  
✅ **Validações de tamanho**  
✅ **Documentação completa**  

---

## 🔗 Arquivos Modificados

| Arquivo | Alterações |
|---------|-----------|
| `src/pages/WhatsApp.tsx` | • Estados de gravação adicionados<br>• Função `audioToBase64`<br>• Handler `handleRecordAudio` completo<br>• UI do botão atualizada<br>• useEffect para limpeza |

---

## 📝 Exemplo de Uso

1. **Usuário abre menu WhatsApp**
2. **Seleciona uma conversa**
3. **Clica no botão de microfone 🎤**
4. **Navegador solicita permissão ao microfone**
5. **Usuário permite**
6. **Botão fica vermelho e começa a contar: 🔴 🎤 00:01**
7. **Usuário fala a mensagem**
8. **Clica novamente no botão vermelho para parar**
9. **Sistema processa: "Convertendo áudio..."**
10. **Mensagem de áudio é enviada automaticamente**
11. **Confirmação visual: "Mensagem enviada!"**

---

## 🎯 Conclusão

A implementação está **completa e funcional**, seguindo as melhores práticas do mercado:

✅ UX intuitiva (botão muda de cor e mostra tempo)  
✅ Feedback em tempo real  
✅ Tratamento robusto de erros  
✅ Validações de segurança  
✅ Conversão automática  
✅ Integração perfeita com backend existente  

O usuário agora pode **gravar e enviar mensagens de áudio** de forma rápida e profissional! 🎤✨

