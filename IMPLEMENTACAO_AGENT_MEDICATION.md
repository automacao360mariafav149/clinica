# Implementação do Agent de Cálculo de Medicação

**Data:** 2025-10-05  
**Autor:** Sistema AI  
**Descrição:** Documentação da implementação do modal de cálculo de medicação para o assistente inteligente.

## Visão Geral

Foi implementado um novo modal no assistente inteligente para realizar cálculos precisos de dosagens e posologias medicamentosas, considerando características do paciente e condições especiais de saúde.

## Estrutura de Arquivos

### 1. AgentMedicationModal.tsx
**Localização:** `src/components/assistant/AgentMedicationModal.tsx`

**Funcionalidades:**
- Modal responsivo com scroll para conteúdos extensos
- Formulário para entrada de dados do paciente e medicamento
- Validação de campos obrigatórios
- Integração com webhook para processamento da dosagem
- Exibição detalhada dos resultados calculados

**Campos do Formulário:**
- **Medicamento:** Nome do medicamento (campo de texto)
- **Idade:** Idade do paciente em anos (campo numérico)
- **Peso:** Peso do paciente em kg (campo numérico com decimais)
- **Via de Administração:** (seleção única)
  - Oral
  - Injetável - Intravenoso (IV)
  - Injetável - Intramuscular (IM)
  - Injetável - Subcutâneo (SC)
  - Tópico
  - Inalatória
  - Sublingual
  - Retal
  - Outro

**Condições Especiais:** (checkboxes múltiplas)
- Problema Renal (Insuficiência Renal)
- Problema Hepático (Insuficiência Hepática)
- Gestante
- Lactante

### 2. Assistant.tsx (Atualizado)
**Localização:** `src/pages/Assistant.tsx`

**Alterações:**
- Importação do componente `AgentMedicationModal`
- Adição do estado `medicationModalOpen`
- Atualização da função `handleAgentClick` para abrir o modal de medicação
- Inclusão do modal na renderização

## Fluxo de Dados

### Request (Envio para API)
```json
{
  "medicamento": "string",
  "idade": number,
  "peso": number,
  "via_administracao": "string",
  "condicoes_especiais": ["string"]
}
```

### Response (Resposta da API)

**⚠️ IMPORTANTE: O sistema processa múltiplos formatos automaticamente**

A API pode retornar em diferentes formatos, e o sistema detecta e processa todos eles:

**Formato 1: Objeto com campo output (mais comum):**
```json
{
  "output": "{\"sucesso\": true, \"medicamento\": \"Levotiroxina\", ...}"
}
```

**Formato 2: Array com objeto output:**
```json
[
  {
    "output": "{\"sucesso\": true, \"medicamento\": \"Levotiroxina\", ...}"
  }
]
```

**Formato 3: Objeto direto (futuro):**
```json
{
  "sucesso": true,
  "medicamento": "Levotiroxina",
  ...
}
```

**Processamento Inteligente no Frontend:**

O sistema automaticamente:
1. Recebe a resposta bruta
2. Detecta se é array ou objeto
3. Se for array, pega o primeiro elemento
4. Verifica se tem campo `output` como string
5. Se sim, parseia: `JSON.parse(output)`
6. Se não, usa o objeto direto
7. Valida campos obrigatórios
8. Exibe os dados

**Estrutura dos Dados Após Parsing:**

```json
{
  "sucesso": true,
  "medicamento": "Levotiroxina",
  "apresentacao": "comprimido 50 mcg",
  "dose_calculada": "50 a 100 mcg",
  "dose_por_tomada": "1 comprimido de 50 mcg",
  "frequencia": "1x ao dia",
  "via_administracao": "oral",
  "duracao_tratamento_dias": null,
  "dose_maxima_dia": "200 mcg",
  "modo_usar": "Tomar pela manhã, em jejum, 30 a 60 minutos antes do café da manhã, com um copo de água",
  "ajustes_aplicados": "Dose padrão para adulto sem necessidade de ajuste por idade ou condições especiais",
  "alertas": [
    "Não interromper o tratamento sem orientação médica",
    "Monitorar função tireoidiana regularmente",
    "Evitar tomar junto com alimentos ou suplementos que possam interferir na absorção"
  ],
  "contraindicacoes": [
    "Hipersensibilidade à levotiroxina",
    "Infarto agudo do miocárdio recente",
    "Hipertireoidismo não tratado"
  ],
  "categoria_risco_gestacao": "A",
  "observacoes": "Dose inicial geralmente 50 mcg/dia para adultos, ajustada conforme resposta clínica e níveis hormonais. Dose máxima diária segura até 200 mcg."
}
```

## Interface do Usuário

### Design
- **Cores:** Gradiente roxo/rosa (`from-purple-500/20 to-pink-500/20`)
- **Ícone:** Calculator (calculadora)
- **Layout:** Responsivo com duas colunas para idade/peso
- **Tema:** Dark/Light mode suportado
- **Altura Adaptativa:** O modal ajusta automaticamente sua altura baseado no conteúdo:
  - Formulário vazio: altura compacta e automática
  - Com resultado: altura máxima (90vh) com scroll
  - Transição suave entre estados (300ms)

### Seções do Resultado

A interface exibe os resultados de forma organizada e hierárquica:

1. **Cabeçalho:**
   - Nome do medicamento (destaque em roxo)
   - Apresentação (badge secundário)
   - Status de sucesso

2. **Dose Calculada:** 
   - Destaque principal em roxo
   - Valor da dose recomendada

3. **Posologia Simplificada (Grid 2 colunas):**
   - Dose por Tomada
   - Frequência
   - Via de Administração (badge)
   - Duração do Tratamento (se aplicável)

4. **Dose Máxima por Dia:**
   - Alerta em laranja
   - Valor limite de segurança

5. **Modo de Usar:**
   - Instruções detalhadas em azul
   - Orientações práticas de administração

6. **Ajustes Aplicados:**
   - Em roxo (se houver)
   - Justificativa dos ajustes baseados nas condições especiais

7. **Alertas Importantes:**
   - Em vermelho (se houver)
   - Lista de avisos críticos com ícones

8. **Contraindicações:**
   - Em vermelho intenso (se houver)
   - Lista de situações que impedem o uso

9. **Categoria de Risco na Gestação:**
   - Badge colorido por categoria
   - A (verde) | B (cinza) | C/D/X (vermelho)

10. **Observações Clínicas:**
    - Em amarelo
    - Informações complementares e contexto

11. **Vinculação ao Paciente:**
    - Botão "Vincular a um Paciente"
    - Seletor de paciente
    - Salvamento no banco de dados
    - Integração com prontuário

### Código de Cores das Seções

O modal utiliza um sistema de cores intuitivo para transmitir informações:

- 🟣 **Roxo:** Informações principais (dose calculada, ajustes aplicados)
- 🔵 **Azul:** Instruções de uso (modo de usar)
- 🟠 **Laranja:** Limites de segurança (dose máxima)
- 🔴 **Vermelho:** Alertas e contraindicações (crítico)
- 🟡 **Amarelo:** Observações e contexto (informativo)
- ⚪ **Cinza:** Informações complementares (apresentação, via)

## Validações Implementadas

- ✅ Campo medicamento obrigatório
- ✅ Campo idade obrigatório (0-150 anos)
- ✅ Campo peso obrigatório (> 0 kg)
- ✅ Via de administração obrigatória
- ✅ Condições especiais opcionais
- ✅ Validação de resposta JSON da API
- ✅ Verificação do campo `sucesso` na resposta
- ✅ Tratamento de erros HTTP
- ✅ Exibição condicional de campos opcionais (duração, ajustes, alertas, contraindicações)

## Estados do Modal

1. **Inicial:** Formulário vazio pronto para entrada (altura automática e compacta)
2. **Loading:** Indicador de carregamento durante processamento
3. **Erro:** Alerta vermelho com mensagem de erro
4. **Resultado:** Exibição completa dos cálculos e recomendações (altura máxima com scroll)

### Comportamento Responsivo

O modal implementa um sistema inteligente de altura adaptativa:

- **Sem Resultado (`h-auto`):**
  - Modal compacto que se ajusta ao conteúdo do formulário
  - Sem desperdício de espaço em tela
  - Melhor experiência em telas menores

- **Com Resultado (`h-[90vh]`):**
  - Modal expande para 90% da altura da viewport
  - Scroll suave para navegar pelo conteúdo extenso
  - Cabeçalho e rodapé fixos para melhor navegação

- **Transição Suave:**
  - Animação de 300ms entre estados
  - Transição fluida sem saltos visuais
  - Melhora a experiência do usuário

## Integração com Backend

**Endpoint:** `https://webhook.n8nlabz.com.br/webhook/agent-calc-medicacao`  
**Método:** POST  
**Content-Type:** application/json

**Nota:** O endpoint está configurado no n8n para processar os cálculos de medicação usando IA.

## Vinculação ao Prontuário do Paciente

### Funcionalidade Implementada

O Agent de Medicação agora permite vincular os cálculos realizados ao prontuário de pacientes específicos, permitindo:

1. **Seleção de Paciente:**
   - Lista todos os pacientes cadastrados
   - Ordenados alfabeticamente por nome
   - Interface dropdown com busca

2. **Salvamento no Banco:**
   - Tabela: `agent_consultations`
   - Tipo: `'medication'`
   - Campos específicos salvos:
     - `medication_name`: Nome do medicamento
     - `medication_dosage`: Dosagem calculada
     - `medication_frequency`: Frequência de administração

3. **Dados Armazenados:**
   ```json
   {
     "patient_id": "uuid",
     "doctor_id": "uuid",
     "agent_type": "medication",
     "consultation_input": {
       "medicamento": "string",
       "idade": number,
       "peso": number,
       "via_administracao": "string",
       "condicoes_especiais": ["array"]
     },
     "consultation_output": { /* Resposta completa da API */ },
     "medication_name": "string",
     "medication_dosage": "string",
     "medication_frequency": "string"
   }
   ```

4. **Fluxo de Vinculação:**
   - Após calcular a dosagem
   - Clique em "Vincular a um Paciente"
   - Selecione o paciente da lista
   - Clique em "Confirmar Vinculação"
   - Toast de sucesso/erro

5. **Permissões:**
   - Apenas médicos e owners podem vincular
   - RLS aplicado automaticamente
   - Vinculação associada ao médico logado

### Migration Criada

**Arquivo:** `8º_Migration_add_medication_fields_agent_consultations.sql`

Adiciona os seguintes campos à tabela `agent_consultations`:
- `medication_name` TEXT
- `medication_dosage` TEXT
- `medication_frequency` TEXT

Com índice para busca rápida por nome de medicamento.

## Melhorias Futuras

1. **Histórico de Cálculos:**
   - Exibir histórico de cálculos no prontuário
   - Permitir consulta de cálculos anteriores do paciente
   - Timeline com todos os medicamentos prescritos

2. **Interações Medicamentosas:**
   - Verificar interações entre medicamentos do paciente
   - Alertar sobre contraindicações baseado no histórico
   - Integração com base de dados de interações

3. **Banco de Dados de Medicamentos:**
   - Autocomplete de nomes de medicamentos
   - Informações de bula integradas
   - Sugestões baseadas em diagnóstico (CID)

4. **Impressão/Exportação:**
   - Gerar PDF com a prescrição
   - Exportar dados para sistemas externos
   - Integração com receita digital

## Considerações de Segurança

⚠️ **IMPORTANTE:**
- Este sistema é uma ferramenta de **auxílio** à decisão médica
- Não substitui o julgamento clínico do profissional
- Sempre verificar as recomendações antes de prescrever
- Manter bulas e protocolos atualizados no sistema de IA

## Testes Recomendados

1. ✅ Testar com diferentes medicamentos comuns
2. ✅ Validar cálculos para faixas etárias variadas (pediatria, adulto, idoso)
3. ✅ Verificar ajustes para condições especiais
4. ✅ Testar todas as vias de administração
5. ✅ Validar combinações de múltiplas condições especiais
6. ✅ Testar comportamento com medicamentos desconhecidos

## Dependências

- React 18+
- Radix UI (Dialog, Select, Checkbox)
- Lucide Icons
- Tailwind CSS
- shadcn/ui components

## Conclusão

O Agent de Cálculo de Medicação foi implementado com sucesso, seguindo o padrão de design e funcionalidade dos demais agentes do sistema. A interface é intuitiva, responsiva e fornece feedback claro sobre os cálculos realizados.

