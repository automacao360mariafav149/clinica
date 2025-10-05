# Implementação: Envio de Medicação para Paciente via WhatsApp

**Data:** 2025-10-05  
**Autor:** Sistema MedX  
**Descrição:** Funcionalidade de envio automático de orientações de medicação para pacientes via WhatsApp após vinculação ao prontuário.

## Visão Geral

Após vincular o cálculo de medicação ao prontuário do paciente, o sistema oferece a opção de enviar as orientações diretamente para o WhatsApp do paciente, facilitando a comunicação e garantindo que o paciente receba as instruções corretas.

## Fluxo Completo

```
1. Médico calcula medicação
   ↓
2. Vincula ao paciente
   ↓
3. Modal de confirmação abre automaticamente
   ↓
4. Médico escolhe tipo de mensagem:
   • Automático (modo_usar da API)
   • Personalizado (texto livre)
   ↓
5. Clica em "Enviar"
   ↓
6. Sistema envia via WhatsApp
   ↓
7. Paciente recebe orientações
```

## Componentes Criados

### 1. SendMedicationModal.tsx

**Localização:** `src/components/assistant/SendMedicationModal.tsx`

**Responsabilidades:**
- Exibir modal de confirmação de envio
- Permitir escolha entre mensagem automática ou personalizada
- Validar dados antes do envio
- Enviar para o endpoint de WhatsApp
- Feedback visual (loading, sucesso, erro)

**Props:**
```typescript
interface SendMedicationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  patientName: string;        // Nome do paciente
  patientPhone: string;       // Número do WhatsApp
  medicationName: string;     // Nome do medicamento
  defaultMessage: string;     // modo_usar do resultado
}
```

**Estados:**
- `messageType`: 'automatic' | 'custom'
- `customMessage`: string (texto personalizado)
- `sending`: boolean (indicador de envio)
- `error`: string | null (mensagem de erro)

### 2. Integração no AgentMedicationModal.tsx

**Alterações realizadas:**

1. **Import do novo modal:**
```typescript
import { SendMedicationModal } from './SendMedicationModal';
```

2. **Novos estados:**
```typescript
const [showSendModal, setShowSendModal] = useState(false);
const [selectedPatientData, setSelectedPatientData] = useState<{
  name: string;
  phone: string;
} | null>(null);
```

3. **Interface Patient atualizada:**
```typescript
interface Patient {
  id: string;
  name: string;
  phone: string;  // NOVO campo
}
```

4. **Query do Supabase atualizada:**
```typescript
.select('id, name, phone')  // Incluir telefone
```

5. **Função handleVincularPaciente atualizada:**
```typescript
// Após salvar com sucesso:
const patient = patients.find(p => p.id === selectedPatientId);
if (patient) {
  setSelectedPatientData({
    name: patient.name,
    phone: patient.phone || '',
  });
  setShowSendModal(true);  // Abre modal automaticamente
}
```

6. **Renderização do modal:**
```typescript
{resultado && selectedPatientData && (
  <SendMedicationModal
    open={showSendModal}
    onOpenChange={setShowSendModal}
    patientName={selectedPatientData.name}
    patientPhone={selectedPatientData.phone}
    medicationName={resultado.medicamento}
    defaultMessage={resultado.modo_usar}
  />
)}
```

## Interface do Usuário

### Modal de Envio

```
┌─────────────────────────────────────────────┐
│ 📤 Enviar Orientações ao Paciente           │
│ João Silva • Levotiroxina                   │
├─────────────────────────────────────────────┤
│                                              │
│ Escolha o tipo de mensagem:                 │
│                                              │
│ ○ 📄 Enviar orientações automáticas         │
│   Usa as instruções de uso geradas          │
│   pelo sistema                               │
│                                              │
│ ● ✏️  Escrever mensagem personalizada       │
│   Crie sua própria mensagem                  │
│                                              │
│ ┌─────────────────────────────────────────┐│
│ │ Tomar pela manhã, em jejum, 30 a 60    ││
│ │ minutos antes do café da manhã...       ││
│ │                                          ││
│ └─────────────────────────────────────────┘│
│                                              │
│ 📱 Será enviado via WhatsApp para:          │
│    (11) 98765-4321                          │
│                                              │
│              [Cancelar] [📤 Enviar]         │
└─────────────────────────────────────────────┘
```

### Tipos de Mensagem

#### 1. **Mensagem Automática** (Padrão)
- Usa o campo `modo_usar` retornado pela API
- Exibido como preview em área azul
- Recomendado: Garante consistência

**Exemplo:**
```
Tomar pela manhã, em jejum, 30 a 60 minutos 
antes do café da manhã, com um copo de água. 
Ajustar dose conforme resposta clínica e 
exames laboratoriais.
```

#### 2. **Mensagem Personalizada**
- Permite ao médico escrever texto livre
- Campo de texto com 8 linhas
- Útil para instruções específicas
- Validação: não pode estar vazio

**Exemplo:**
```
Olá [Nome]! 

Seguem as orientações para seu tratamento 
com Levotiroxina:

- Tomar 1 comprimido pela manhã
- Sempre em jejum
- Aguardar 30 minutos para café
- Retorno em 30 dias

Qualquer dúvida, entre em contato!

Dr. [Nome do Médico]
```

## Integração com API de WhatsApp

### Endpoint

**URL:** `https://webhook.n8nlabz.com.br/webhook/enviar-medicacao`  
**Método:** POST  
**Content-Type:** application/json

### Request Body

```json
{
  "texto": "Tomar pela manhã, em jejum...",
  "nome_paciente": "João Silva",
  "numero_paciente": "5511987654321",
  "medicamento": "Levotiroxina"
}
```

### Campos Enviados

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `texto` | string | Mensagem a ser enviada (automática ou personalizada) |
| `nome_paciente` | string | Nome completo do paciente |
| `numero_paciente` | string | Número de WhatsApp (com código do país) |
| `medicamento` | string | Nome do medicamento calculado |

### Response Esperada

```json
{
  "success": true,
  "message_id": "wamid.xxxxx",
  "status": "sent"
}
```

## Validações Implementadas

### Antes do Envio

1. **Mensagem não vazia:**
```typescript
if (!messageToSend.trim()) {
  setError('Por favor, escreva uma mensagem antes de enviar');
  return;
}
```

2. **Paciente tem telefone:**
```typescript
if (!patientPhone || patientPhone.trim() === '') {
  setError('Paciente não possui número de telefone cadastrado');
  return;
}
```

3. **Tipo de mensagem válido:**
- Se automático: usa `defaultMessage`
- Se personalizado: valida `customMessage`

### Durante o Envio

- Estado `sending` desabilita botões
- Loading spinner no botão
- Impossível fechar modal durante envio

### Após o Envio

**Sucesso:**
```typescript
toast.success('Mensagem enviada com sucesso!');
onOpenChange(false);  // Fecha modal
// Limpa estados
```

**Erro:**
```typescript
toast.error(errorMessage);
// Mantém modal aberto
// Exibe erro no alert
```

## Tratamento de Erros

### Erros Possíveis

1. **Paciente sem telefone:**
   - Mensagem: "Paciente não possui número de telefone cadastrado"
   - Ação: Orientar a cadastrar telefone no perfil do paciente

2. **Mensagem vazia (personalizada):**
   - Mensagem: "Por favor, escreva uma mensagem antes de enviar"
   - Ação: Preencher campo de texto

3. **Erro na API (HTTP):**
   - Mensagem: "Erro ao enviar mensagem: 500"
   - Ação: Verificar webhook, tentar novamente

4. **Erro de rede:**
   - Mensagem: "Erro ao enviar mensagem. Tente novamente."
   - Ação: Verificar conexão, tentar novamente

### Logs para Debug

```javascript
console.log('Resposta do envio:', result);
console.error('Erro ao enviar medicação:', err);
```

## Experiência do Usuário

### Fluxo Ideal

1. ✅ Médico calcula medicação
2. ✅ Vincula ao paciente → Toast "Vinculado com sucesso!"
3. ✅ Modal de envio abre automaticamente
4. ✅ Mensagem automática já pré-carregada
5. ✅ Um clique em "Enviar"
6. ✅ Toast "Mensagem enviada com sucesso!"
7. ✅ Modal fecha automaticamente

**Tempo total:** ~5 segundos

### Estados Visuais

**Loading:**
```
[⏳ Enviando...]  (botão desabilitado)
```

**Sucesso:**
```
✅ Mensagem enviada com sucesso!
Modal fecha automaticamente
```

**Erro:**
```
❌ Erro ao enviar mensagem: [detalhes]
Modal permanece aberto para retry
```

## Vantagens

### Para o Médico

✅ **Agilidade:** Envio em poucos cliques  
✅ **Flexibilidade:** Mensagem automática ou personalizada  
✅ **Rastreabilidade:** Registro de que foi enviado  
✅ **Profissionalismo:** Paciente recebe orientações claras  

### Para o Paciente

✅ **Conveniência:** Recebe direto no WhatsApp  
✅ **Clareza:** Instruções escritas e detalhadas  
✅ **Acesso:** Pode consultar a qualquer momento  
✅ **Segurança:** Não esquece como tomar o remédio  

### Para a Clínica

✅ **Eficiência:** Reduz ligações de dúvidas  
✅ **Qualidade:** Padroniza comunicação  
✅ **Tecnologia:** Moderniza atendimento  
✅ **Satisfação:** Paciente se sente cuidado  

## Melhorias Futuras

### 1. Histórico de Envios

- Salvar no banco quando mensagens são enviadas
- Exibir histórico no prontuário
- Status: enviado, lido, entregue

```sql
CREATE TABLE medication_messages (
  id UUID PRIMARY KEY,
  patient_id UUID REFERENCES patients(id),
  doctor_id UUID REFERENCES profiles(id),
  medication_name TEXT,
  message_text TEXT,
  phone_number TEXT,
  sent_at TIMESTAMPTZ,
  status TEXT,  -- sent, delivered, read, failed
  message_id TEXT  -- ID do WhatsApp
);
```

### 2. Templates de Mensagens

- Salvar mensagens personalizadas como templates
- Reutilizar em futuros envios
- Variáveis dinâmicas: `{nome_paciente}`, `{medicamento}`, etc.

### 3. Agendamento de Lembretes

- Enviar lembretes automáticos
- Ex: "Hora de tomar seu remédio!"
- Configurar frequência

### 4. Confirmação de Leitura

- Webhook de status do WhatsApp
- Notificar médico quando paciente ler
- Dashboard de engajamento

### 5. Anexar Bula/PDF

- Gerar PDF com orientações
- Enviar junto com mensagem
- Logo da clínica

## Requisitos de Sistema

### Backend (n8n)

O webhook deve:
1. Receber POST com JSON
2. Validar campos obrigatórios
3. Formatar número de telefone
4. Enviar via API do WhatsApp Business
5. Retornar status de envio
6. Tratar erros (número inválido, etc)

### Banco de Dados

A tabela `patients` deve ter:
- Campo `phone` (TEXT ou VARCHAR)
- Formato recomendado: Com código do país
- Exemplo: `5511987654321`

### API do WhatsApp

- WhatsApp Business API configurada
- Número verificado
- Templates aprovados (se necessário)
- Webhook para status (opcional)

## Testes Recomendados

### Teste 1: Envio Automático
1. Calcular medicação
2. Vincular a paciente com telefone
3. Escolher "Mensagem Automática"
4. Clicar em Enviar
5. ✅ Verificar recebimento no WhatsApp

### Teste 2: Envio Personalizado
1. Calcular medicação
2. Vincular a paciente
3. Escolher "Mensagem Personalizada"
4. Digitar texto
5. Clicar em Enviar
6. ✅ Verificar recebimento com texto correto

### Teste 3: Paciente sem Telefone
1. Calcular medicação
2. Vincular a paciente sem telefone
3. ✅ Verificar erro: "não possui número"

### Teste 4: Mensagem Vazia
1. Vincular medicação
2. Escolher "Personalizada"
3. Deixar campo vazio
4. ✅ Botão desabilitado ou erro ao tentar enviar

### Teste 5: Erro de API
1. Desativar webhook temporariamente
2. Tentar enviar
3. ✅ Verificar tratamento de erro
4. ✅ Modal permanece aberto

## Conclusão

A funcionalidade de envio de medicação para o paciente via WhatsApp complementa perfeitamente o Agent de Cálculo de Medicação, proporcionando um fluxo completo:

**Calcular** → **Vincular** → **Enviar** → **Paciente Informado**

Isso demonstra a integração entre tecnologia de IA, sistema de prontuário e comunicação direta com o paciente, elevando o nível de cuidado e profissionalismo da clínica.

---

**Status:** ✅ Implementado e pronto para uso  
**Última atualização:** 2025-10-05

