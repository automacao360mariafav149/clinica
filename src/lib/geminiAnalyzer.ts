import { getSystemSetting } from '@/hooks/useSystemSettings';

/**
 * Interface para o resultado da análise do Gemini
 */
export interface GeminiExamAnalysis {
  output: string; // Conteúdo completo em Markdown
  analise?: string;
  valores_encontrados?: string[];
  valores_alterados?: string[];
  interpretacao?: string;
  recomendacoes?: string[];
  observacoes?: string;
}

/**
 * Tipos de arquivo suportados
 */
export type SupportedFileType = 'application/pdf' | 'image/png' | 'image/jpeg' | 'image/jpg' | 'image/webp';

/**
 * Mapeamento de tipos MIME para tipos do Gemini
 */
const MIME_TYPE_MAP: Record<string, string> = {
  'application/pdf': 'application/pdf',
  'image/png': 'image/png',
  'image/jpeg': 'image/jpeg',
  'image/jpg': 'image/jpeg',
  'image/webp': 'image/webp',
};

/**
 * Converte um arquivo para base64
 */
async function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const result = reader.result as string;
      // Remove o prefixo "data:mime/type;base64,"
      const base64 = result.split(',')[1];
      resolve(base64);
    };
    reader.onerror = (error) => reject(error);
  });
}

/**
 * Analisa um exame (PDF ou imagem) usando o Gemini Flash
 * 
 * @param file - Arquivo do exame (PDF ou imagem)
 * @returns Análise detalhada do exame
 * 
 * @example
 * const file = document.getElementById('input').files[0];
 * const analysis = await analyzeExamWithGemini(file);
 * console.log(analysis.output);
 */
export async function analyzeExamWithGemini(file: File): Promise<GeminiExamAnalysis> {
  try {
    console.log('🔍 Iniciando análise com Gemini Flash...');
    console.log('📄 Arquivo:', file.name, 'Tipo:', file.type, 'Tamanho:', file.size);

    // 1. Validar tipo de arquivo
    if (!MIME_TYPE_MAP[file.type]) {
      throw new Error(`Tipo de arquivo não suportado: ${file.type}. Suportados: PDF, PNG, JPEG, JPG, WEBP`);
    }

    // 2. Buscar configurações do Gemini do system_settings
    console.log('🔑 Buscando configurações do Gemini...');
    const geminiApiKey = await getSystemSetting('gemini_api_key');
    const preferredModel = await getSystemSetting('gemini_model');
    
    if (!geminiApiKey) {
      throw new Error('API key do Gemini não configurada. Configure em system_settings com a chave "gemini_api_key"');
    }
    
    if (preferredModel) {
      console.log(`🎯 Modelo preferido configurado: ${preferredModel}`);
    }

    // 3. Converter arquivo para base64
    console.log('📦 Convertendo arquivo para base64...');
    const base64Data = await fileToBase64(file);
    console.log('✅ Conversão concluída');

    // 4. Preparar o prompt para análise de exames
    const prompt = `Você é um assistente médico especializado em análise de exames laboratoriais e de imagem.

Analise o documento/imagem fornecido e retorne uma análise detalhada em formato Markdown seguindo a estrutura abaixo:

## 📋 Análise Geral
[Faça um resumo geral do que foi identificado no exame]

## 🔬 Valores Encontrados
[Liste todos os valores/parâmetros encontrados com seus resultados]
- **Parâmetro**: Valor - Status: [Normal/Alterado] - Significado: [breve explicação]

## ⚠️ Valores Alterados
[Se houver valores fora da normalidade, liste-os aqui com ênfase]
- **Parâmetro Alterado**: Valor encontrado (Referência: X-Y) - ⚠️ [Explicação do significado clínico]

## 💡 Interpretação Clínica
[Forneça uma interpretação clínica dos resultados, considerando o conjunto dos achados]

## ✅ Recomendações
[Sugira ações, exames complementares ou observações importantes]
- [Recomendação 1]
- [Recomendação 2]

## 📝 Observações
[Observações adicionais importantes, limitações da análise, ou avisos]

**IMPORTANTE:**
- Use emojis para facilitar a visualização
- Destaque valores alterados com ⚠️
- Use **negrito** para termos importantes
- Seja claro e objetivo
- Se não conseguir identificar algum valor, mencione isso
- Esta análise é um auxílio, não substitui a avaliação médica completa

Analise agora o documento/imagem fornecido:`;

    // 5. Fazer requisição para o Gemini API
    console.log('🚀 Enviando requisição para Gemini API...');
    
    const geminiMimeType = MIME_TYPE_MAP[file.type];
    
    // Lista de modelos para tentar (do mais recente ao mais antigo)
    let modelsToTry = [
      'gemini-2.0-flash',
      'gemini-2.0-flash-exp',
      'gemini-1.5-flash-latest',
      'gemini-1.5-flash-002',
      'gemini-1.5-flash',
      'gemini-1.5-pro-latest',
      'gemini-1.5-pro',
      'gemini-pro-vision',
      'gemini-pro',
    ];
    
    // Se houver modelo preferido configurado, tentar ele primeiro
    if (preferredModel && !modelsToTry.includes(preferredModel)) {
      console.log(`➕ Adicionando modelo preferido ao início da lista: ${preferredModel}`);
      modelsToTry = [preferredModel, ...modelsToTry];
    } else if (preferredModel) {
      // Se já está na lista, mover para o início
      modelsToTry = [preferredModel, ...modelsToTry.filter(m => m !== preferredModel)];
    }
    
    let response: Response | null = null;
    let lastError: Error | null = null;
    
    // Tentar cada modelo até encontrar um que funcione
    for (const modelName of modelsToTry) {
      try {
        console.log(`🔄 Tentando modelo: ${modelName}...`);
        
        response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${geminiApiKey}`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              contents: [
                {
                  parts: [
                    {
                      text: prompt,
                    },
                    {
                      inline_data: {
                        mime_type: geminiMimeType,
                        data: base64Data,
                      },
                    },
                  ],
                },
              ],
              generationConfig: {
                temperature: 0.4,
                topK: 32,
                topP: 1,
                maxOutputTokens: 8192,
              },
            }),
          }
        );
        
        // Se a resposta for 200, sucesso!
        if (response.ok) {
          console.log(`✅ Modelo ${modelName} funcionou!`);
          break;
        }
        
        // Se for 404, tentar próximo modelo
        if (response.status === 404) {
          console.log(`⚠️ Modelo ${modelName} não disponível (404), tentando próximo...`);
          continue;
        }
        
        // Outro erro, lançar exceção
        const errorData = await response.json().catch(() => null);
        throw new Error(`Erro ${response.status}: ${JSON.stringify(errorData)}`);
        
      } catch (error) {
        console.error(`❌ Erro ao tentar ${modelName}:`, error);
        lastError = error as Error;
        continue;
      }
    }

    // Verificar se conseguimos uma resposta válida
    if (!response || !response.ok) {
      const errorMsg = lastError 
        ? `Nenhum modelo disponível. Último erro: ${lastError.message}` 
        : 'Nenhum modelo do Gemini está disponível no momento';
      
      console.error('❌ Falha ao conectar com Gemini:', errorMsg);
      
      throw new Error(
        `${errorMsg}\n\nVerifique:\n` +
        `1. Sua API key está correta?\n` +
        `2. A API key tem permissões para usar o Gemini?\n` +
        `3. Você está em uma região suportada?\n` +
        `4. Tente gerar uma nova API key em: https://makersuite.google.com/app/apikey`
      );
    }

    const data = await response.json();
    console.log('📥 Resposta recebida do Gemini');

    // 6. Extrair o texto da resposta
    if (!data.candidates || !data.candidates[0] || !data.candidates[0].content) {
      console.error('❌ Resposta inválida do Gemini:', data);
      throw new Error('Resposta inválida da API do Gemini');
    }

    const generatedText = data.candidates[0].content.parts[0].text;
    
    if (!generatedText || generatedText.trim() === '') {
      throw new Error('O Gemini não conseguiu gerar uma análise para este arquivo');
    }

    console.log('✅ Análise gerada com sucesso!');
    console.log('📝 Tamanho da resposta:', generatedText.length, 'caracteres');

    // 7. Retornar análise no formato esperado
    const analysis: GeminiExamAnalysis = {
      output: generatedText,
    };

    return analysis;
  } catch (error) {
    console.error('❌ Erro ao analisar exame com Gemini:', error);
    
    if (error instanceof Error) {
      throw error;
    }
    
    throw new Error('Erro desconhecido ao analisar exame');
  }
}

/**
 * Valida se um tipo de arquivo é suportado
 */
export function isSupportedFileType(fileType: string): fileType is SupportedFileType {
  return fileType in MIME_TYPE_MAP;
}

/**
 * Obtém a lista de extensões suportadas para exibição ao usuário
 */
export function getSupportedFileExtensions(): string {
  return 'PDF, PNG, JPG, JPEG, WEBP';
}

/**
 * Obtém o accept para input de arquivo
 */
export function getFileInputAccept(): string {
  return 'application/pdf,image/png,image/jpeg,image/jpg,image/webp';
}

/**
 * Interface para o resultado da análise de conversa
 */
export interface ConversationSummary {
  resumo_conversa: string;
  nota_atendimento: number;
  status_atendimento: 'Aberto' | 'Fechado' | 'Pendente';
  metricas: {
    total_mensagens: number;
    mensagens_ia: number;
    mensagens_human: number;
    tempo_medio_resposta?: string;
    duracao_total?: string;
    taxa_resposta?: string;
  };
  qualidade: {
    clareza: number;
    empatia: number;
    eficiencia: number;
    completude: number;
    profissionalismo: number;
    cordialidade: number;
    objetividade: number;
    personalizacao: number;
  };
  sentimento: {
    paciente: 'Positivo' | 'Neutro' | 'Negativo';
    ia: 'Positivo' | 'Neutro' | 'Negativo';
    evolucao: string;
    score_satisfacao: number; // 0-10
  };
  topicos_identificados: string[];
  momentos_criticos: Array<{
    tipo: string;
    descricao: string;
    gravidade: 'Alta' | 'Média' | 'Baixa';
  }>;
  analise_detalhada: {
    pontos_fortes: string[];
    pontos_melhorar: string[];
    oportunidades: string[];
    riscos: string[];
  };
  comportamento_paciente: {
    engajamento: 'Alto' | 'Médio' | 'Baixo';
    clareza_demanda: 'Clara' | 'Moderada' | 'Confusa';
    urgencia_percebida: 'Alta' | 'Média' | 'Baixa';
    satisfacao_aparente: 'Satisfeito' | 'Neutro' | 'Insatisfeito';
  };
  compliance: {
    seguiu_protocolo: boolean;
    informacoes_coletadas: string[];
    informacoes_faltantes: string[];
    score_compliance: number; // 0-10
  };
  proximas_acoes: string[];
  pendencias: string[];
  recomendacoes_especificas: string[];
  flags: {
    urgente: boolean;
    insatisfacao: boolean;
    financeiro: boolean;
    agendamento: boolean;
    follow_up_necessario: boolean;
    escalacao_sugerida: boolean;
    documentacao_incompleta: boolean;
    risco_perda: boolean;
  };
  timeline: Array<{
    momento: string;
    evento: string;
    tipo: 'info' | 'warning' | 'success' | 'error';
  }>;
}

/**
 * Tipo de período para análise de conversa
 */
export type AnalysisPeriod = 'dia_atual' | 'ultimos_7_dias' | 'ultimos_15_dias' | 'ultimos_30_dias';

/**
 * Analisa uma conversa do WhatsApp usando o Gemini
 * 
 * @param sessionId - ID da sessão (patient/pre_patient ID)
 * @param period - Período de análise
 * @param messages - Array de mensagens da conversa
 * @returns Análise detalhada da conversa com métricas
 * 
 * @example
 * const summary = await analyzeConversationWithGemini(sessionId, 'dia_atual', messages);
 * console.log(summary.resumo_conversa);
 */
export async function analyzeConversationWithGemini(
  sessionId: string,
  period: AnalysisPeriod,
  messages: Array<{ message: any; data_e_hora?: string }>
): Promise<ConversationSummary> {
  try {
    console.log('🔍 [analyzeConversation] Iniciando análise de conversa com Gemini...');
    console.log('📊 [analyzeConversation] Session ID:', sessionId);
    console.log('📅 [analyzeConversation] Período:', period);
    console.log('💬 [analyzeConversation] Total de mensagens:', messages.length);
    console.log('📋 [analyzeConversation] Estrutura da primeira mensagem:', JSON.stringify(messages[0], null, 2));

    // 1. Filtrar mensagens por período
    console.log('🔄 [analyzeConversation] Filtrando mensagens por período...');
    const filteredMessages = filterMessagesByPeriod(messages, period);
    console.log(`📝 [analyzeConversation] Mensagens no período: ${filteredMessages.length}`);

    if (filteredMessages.length === 0) {
      throw new Error('Nenhuma mensagem encontrada no período selecionado.');
    }

    // 2. Buscar API Key do Gemini
    console.log('🔑 [analyzeConversation] Buscando API key do Gemini...');
    const geminiApiKey = await getSystemSetting('gemini_api_key');
    console.log('🔐 [analyzeConversation] API key recebida:', geminiApiKey ? 'Sim (length: ' + geminiApiKey.length + ')' : 'Não');
    
    if (!geminiApiKey) {
      throw new Error('API key do Gemini não configurada. Configure em system_settings com a chave "gemini_api_key"');
    }

    console.log('✅ [analyzeConversation] API key validada com sucesso!');

    // 3. Formatar mensagens para o prompt
    console.log('📝 [analyzeConversation] Formatando mensagens para análise...');
    const conversationText = formatMessagesForAnalysis(filteredMessages);
    console.log('✅ [analyzeConversation] Mensagens formatadas. Tamanho:', conversationText.length, 'caracteres');
    
    // 4. Calcular métricas básicas
    console.log('📊 [analyzeConversation] Calculando métricas básicas...');
    const metricas = calculateBasicMetrics(filteredMessages);
    console.log('✅ [analyzeConversation] Métricas calculadas:', metricas);

    // 5. Preparar o prompt para análise de conversa
    console.log('🎯 [analyzeConversation] Preparando prompt para Gemini...');
    const prompt = `Você é um assistente avançado de análise de conversas médicas via WhatsApp. Realize uma análise PROFUNDA e DETALHADA.

Analise a conversa abaixo e retorne um JSON estruturado seguindo EXATAMENTE este formato:

{
  "resumo_conversa": "Resumo executivo completo da conversa",
  "nota_atendimento": 4.5,
  "status_atendimento": "Fechado",
  "qualidade": {
    "clareza": 5,
    "empatia": 4,
    "eficiencia": 4,
    "completude": 5,
    "profissionalismo": 5,
    "cordialidade": 5,
    "objetividade": 4,
    "personalizacao": 4
  },
  "sentimento": {
    "paciente": "Positivo",
    "ia": "Positivo",
    "evolucao": "Paciente iniciou neutro e terminou satisfeito",
    "score_satisfacao": 8
  },
  "topicos_identificados": [
    "Agendamento de consulta",
    "Dúvidas sobre procedimento",
    "Questões financeiras"
  ],
  "momentos_criticos": [
    {
      "tipo": "Insatisfação",
      "descricao": "Paciente demonstrou frustração com tempo de espera",
      "gravidade": "Média"
    }
  ],
  "analise_detalhada": {
    "pontos_fortes": [
      "Resposta rápida e objetiva",
      "Linguagem empática e acolhedora"
    ],
    "pontos_melhorar": [
      "Poderia ter antecipado a dúvida sobre valores",
      "Faltou oferecer alternativas de horário"
    ],
    "oportunidades": [
      "Oferecer agendamento online para próximas vezes",
      "Enviar material educativo sobre o procedimento"
    ],
    "riscos": [
      "Paciente pode desistir se não receber confirmação em 24h",
      "Competidores podem oferecer condições melhores"
    ]
  },
  "comportamento_paciente": {
    "engajamento": "Alto",
    "clareza_demanda": "Clara",
    "urgencia_percebida": "Média",
    "satisfacao_aparente": "Satisfeito"
  },
  "compliance": {
    "seguiu_protocolo": true,
    "informacoes_coletadas": [
      "Nome completo",
      "Telefone",
      "Preferência de horário"
    ],
    "informacoes_faltantes": [
      "Email",
      "Data de nascimento",
      "Convênio médico"
    ],
    "score_compliance": 7
  },
  "proximas_acoes": [
    "Confirmar agendamento em até 2 horas",
    "Enviar lembrete 24h antes da consulta"
  ],
  "pendencias": [
    "Aguardando confirmação de disponibilidade do médico",
    "Enviar orçamento detalhado"
  ],
  "recomendacoes_especificas": [
    "Implementar resposta automática para horários de atendimento",
    "Criar FAQ sobre procedimentos mais perguntados"
  ],
  "flags": {
    "urgente": false,
    "insatisfacao": false,
    "financeiro": true,
    "agendamento": true,
    "follow_up_necessario": true,
    "escalacao_sugerida": false,
    "documentacao_incompleta": true,
    "risco_perda": false
  },
  "timeline": [
    {
      "momento": "Início",
      "evento": "Paciente iniciou contato solicitando agendamento",
      "tipo": "info"
    },
    {
      "momento": "10:30",
      "evento": "IA respondeu com opções de horário",
      "tipo": "success"
    },
    {
      "momento": "10:45",
      "evento": "Paciente questionou valores - momento crítico",
      "tipo": "warning"
    }
  ]
}

**INSTRUÇÕES DETALHADAS:**

1. **QUALIDADE (1-5 cada):**
   - Clareza: Comunicação clara e objetiva?
   - Empatia: Demonstrou compreensão e cuidado?
   - Eficiência: Resolveu rapidamente sem enrolação?
   - Completude: Cobriu todos os pontos necessários?
   - Profissionalismo: Manteve tom adequado?
   - Cordialidade: Foi gentil e acolhedor?
   - Objetividade: Foi direto ao ponto quando necessário?
   - Personalização: Tratamento personalizado ou genérico?

2. **SENTIMENTO:**
   - Analise o tom emocional do paciente e da IA
   - score_satisfacao: 0-10 baseado na satisfação geral

3. **MOMENTOS CRÍTICOS:**
   - Identifique pontos de tensão, dúvidas críticas, reclamações
   - gravidade: "Alta", "Média" ou "Baixa"

4. **ANÁLISE SWOT SIMPLIFICADA:**
   - Pontos fortes: O que foi bem feito
   - Pontos a melhorar: O que poderia ser melhor
   - Oportunidades: Chances de upsell, fidelização
   - Riscos: O que pode dar errado se não for tratado

5. **COMPORTAMENTO DO PACIENTE:**
   - Engajamento: Participação ativa na conversa
   - Clareza demanda: Soube explicar o que queria
   - Urgência percebida: Quão urgente é para o paciente
   - Satisfação aparente: Como parece estar se sentindo

6. **COMPLIANCE (0-10):**
   - Seguiu protocolo de atendimento?
   - Coletou informações necessárias?
   - O que faltou coletar?

7. **TIMELINE:**
   - Principais marcos da conversa
   - Tipo: "info" (normal), "warning" (atenção), "success" (positivo), "error" (problema)

**CONVERSA A ANALISAR:**
Total de mensagens: ${metricas.total_mensagens}
Mensagens da IA: ${metricas.mensagens_ia}
Mensagens do usuário: ${metricas.mensagens_human}

${conversationText}

**IMPORTANTE:**
- Seja DETALHADO e ESPECÍFICO nas análises
- Use exemplos concretos da conversa
- Identifique padrões de comportamento
- Sugira melhorias ACIONÁVEIS
- Retorne APENAS o JSON válido, sem markdown, sem explicações adicionais.`;

    console.log('✅ [analyzeConversation] Prompt preparado. Tamanho:', prompt.length, 'caracteres');

    // 6. Fazer requisição para o Gemini API
    console.log('🚀 [analyzeConversation] Iniciando requisições para Gemini API...');
    
    const modelsToTry = [
      'gemini-2.0-flash',
      'gemini-2.0-flash-exp',
      'gemini-1.5-flash-latest',
      'gemini-1.5-flash-002',
      'gemini-1.5-flash',
      'gemini-1.5-pro-latest',
      'gemini-1.5-pro',
    ];
    
    console.log('📋 [analyzeConversation] Modelos a tentar:', modelsToTry);
    
    let response: Response | null = null;
    let lastError: Error | null = null;
    
    for (const modelName of modelsToTry) {
      try {
        console.log(`🔄 [analyzeConversation] Tentando modelo: ${modelName}...`);
        
        response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${geminiApiKey}`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              contents: [
                {
                  parts: [
                    {
                      text: prompt,
                    },
                  ],
                },
              ],
              generationConfig: {
                temperature: 0.3,
                topK: 40,
                topP: 0.95,
                maxOutputTokens: 8192,
              },
            }),
          }
        );
        
        if (response.ok) {
          console.log(`✅ Modelo ${modelName} funcionou!`);
          break;
        }
        
        if (response.status === 404) {
          console.log(`⚠️ Modelo ${modelName} não disponível (404), tentando próximo...`);
          continue;
        }
        
        const errorData = await response.json().catch(() => null);
        throw new Error(`Erro ${response.status}: ${JSON.stringify(errorData)}`);
        
      } catch (error) {
        console.error(`❌ Erro ao tentar ${modelName}:`, error);
        lastError = error as Error;
        continue;
      }
    }

    if (!response || !response.ok) {
      const errorMsg = lastError 
        ? `Nenhum modelo disponível. Último erro: ${lastError.message}` 
        : 'Nenhum modelo do Gemini está disponível no momento';
      
      throw new Error(errorMsg);
    }

    const data = await response.json();
    console.log('📥 Resposta recebida do Gemini');

    // 7. Extrair o JSON da resposta
    if (!data.candidates || !data.candidates[0] || !data.candidates[0].content) {
      console.error('❌ Resposta inválida do Gemini:', data);
      throw new Error('Resposta inválida da API do Gemini');
    }

    let generatedText = data.candidates[0].content.parts[0].text;
    
    if (!generatedText || generatedText.trim() === '') {
      throw new Error('O Gemini não conseguiu gerar uma análise para esta conversa');
    }

    // Limpar possíveis markdown do JSON
    generatedText = generatedText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    
    console.log('📝 Resposta do Gemini:', generatedText.substring(0, 200) + '...');

    // 8. Parsear o JSON
    let parsedResult: any;
    try {
      parsedResult = JSON.parse(generatedText);
    } catch (parseError) {
      console.error('❌ Erro ao parsear JSON:', parseError);
      console.error('Texto recebido:', generatedText);
      throw new Error('Erro ao processar resposta da IA. JSON inválido.');
    }

    // 9. Montar resultado final com métricas reais
    const summary: ConversationSummary = {
      resumo_conversa: parsedResult.resumo_conversa || 'Resumo não disponível',
      nota_atendimento: Number(parsedResult.nota_atendimento) || 3,
      status_atendimento: parsedResult.status_atendimento || 'Aberto',
      metricas: {
        ...metricas,
        tempo_medio_resposta: calculateAverageResponseTime(filteredMessages),
        duracao_total: calculateTotalDuration(filteredMessages),
        taxa_resposta: calculateResponseRate(filteredMessages),
      },
      qualidade: parsedResult.qualidade || {
        clareza: 3,
        empatia: 3,
        eficiencia: 3,
        completude: 3,
        profissionalismo: 3,
        cordialidade: 3,
        objetividade: 3,
        personalizacao: 3,
      },
      sentimento: parsedResult.sentimento || {
        paciente: 'Neutro',
        ia: 'Positivo',
        evolucao: 'Não foi possível analisar',
        score_satisfacao: 5,
      },
      topicos_identificados: Array.isArray(parsedResult.topicos_identificados) ? parsedResult.topicos_identificados : [],
      momentos_criticos: Array.isArray(parsedResult.momentos_criticos) ? parsedResult.momentos_criticos : [],
      analise_detalhada: parsedResult.analise_detalhada || {
        pontos_fortes: [],
        pontos_melhorar: [],
        oportunidades: [],
        riscos: [],
      },
      comportamento_paciente: parsedResult.comportamento_paciente || {
        engajamento: 'Médio',
        clareza_demanda: 'Moderada',
        urgencia_percebida: 'Média',
        satisfacao_aparente: 'Neutro',
      },
      compliance: parsedResult.compliance || {
        seguiu_protocolo: true,
        informacoes_coletadas: [],
        informacoes_faltantes: [],
        score_compliance: 5,
      },
      proximas_acoes: Array.isArray(parsedResult.proximas_acoes) ? parsedResult.proximas_acoes : [],
      pendencias: Array.isArray(parsedResult.pendencias) ? parsedResult.pendencias : [],
      recomendacoes_especificas: Array.isArray(parsedResult.recomendacoes_especificas) ? parsedResult.recomendacoes_especificas : [],
      flags: parsedResult.flags || {
        urgente: false,
        insatisfacao: false,
        financeiro: false,
        agendamento: false,
        follow_up_necessario: false,
        escalacao_sugerida: false,
        documentacao_incompleta: false,
        risco_perda: false,
      },
      timeline: Array.isArray(parsedResult.timeline) ? parsedResult.timeline : [],
    };

    console.log('✅ [analyzeConversation] Análise de conversa concluída com sucesso!');
    console.log('📊 [analyzeConversation] Campos preenchidos:', Object.keys(summary));
    return summary;

  } catch (error) {
    console.error('❌ Erro ao analisar conversa com Gemini:', error);
    
    if (error instanceof Error) {
      throw error;
    }
    
    throw new Error('Erro desconhecido ao analisar conversa');
  }
}

/**
 * Filtra mensagens por período
 */
function filterMessagesByPeriod(
  messages: Array<{ message: any; data_e_hora?: string }>,
  period: AnalysisPeriod
): Array<{ message: any; data_e_hora?: string }> {
  const now = new Date();
  let cutoffDate: Date;

  switch (period) {
    case 'dia_atual':
      cutoffDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
      break;
    case 'ultimos_7_dias':
      cutoffDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      break;
    case 'ultimos_15_dias':
      cutoffDate = new Date(now.getTime() - 15 * 24 * 60 * 60 * 1000);
      break;
    case 'ultimos_30_dias':
      cutoffDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      break;
    default:
      cutoffDate = new Date(0); // Todas as mensagens
  }

  return messages.filter((msg) => {
    if (!msg.data_e_hora) return true; // Incluir mensagens sem data
    const msgDate = new Date(msg.data_e_hora);
    return msgDate >= cutoffDate;
  });
}

/**
 * Formata mensagens para análise
 */
function formatMessagesForAnalysis(messages: Array<{ message: any; data_e_hora?: string }>): string {
  return messages
    .map((msg, idx) => {
      const type = msg.message?.type || 'unknown';
      const isAI = type.toLowerCase() === 'ai';
      const isHuman = type.toLowerCase() === 'human';
      
      let content = '';
      if (typeof msg.message === 'string') {
        content = msg.message;
      } else if (typeof msg.message?.content === 'string') {
        content = msg.message.content;
      } else if (Array.isArray(msg.message?.content)) {
        const first = msg.message.content.find((c: any) => typeof c?.text === 'string' || typeof c === 'string');
        content = typeof first === 'string' ? first : (first?.text || '');
      } else {
        content = JSON.stringify(msg.message);
      }

      const timestamp = msg.data_e_hora ? new Date(msg.data_e_hora).toLocaleString('pt-BR') : 'Sem data';
      const sender = isAI ? '🤖 IA' : isHuman ? '👤 Paciente' : '❓ Sistema';
      
      return `[${idx + 1}] ${sender} (${timestamp}):\n${content}`;
    })
    .join('\n\n');
}

/**
 * Calcula métricas básicas
 */
function calculateBasicMetrics(messages: Array<{ message: any; data_e_hora?: string }>): {
  total_mensagens: number;
  mensagens_ia: number;
  mensagens_human: number;
} {
  let total = messages.length;
  let ia = 0;
  let human = 0;

  messages.forEach((msg) => {
    const type = (msg.message?.type || '').toLowerCase();
    if (type === 'ai') ia++;
    else if (type === 'human') human++;
  });

  return {
    total_mensagens: total,
    mensagens_ia: ia,
    mensagens_human: human,
  };
}

/**
 * Calcula tempo médio de resposta (simplificado)
 */
function calculateAverageResponseTime(messages: Array<{ message: any; data_e_hora?: string }>): string {
  const intervals: number[] = [];
  
  for (let i = 1; i < messages.length; i++) {
    const prev = messages[i - 1];
    const curr = messages[i];
    
    if (prev.data_e_hora && curr.data_e_hora) {
      const prevType = (prev.message?.type || '').toLowerCase();
      const currType = (curr.message?.type || '').toLowerCase();
      
      // Calcular tempo entre mensagem do usuário e resposta da IA
      if (prevType === 'human' && currType === 'ai') {
        const prevDate = new Date(prev.data_e_hora);
        const currDate = new Date(curr.data_e_hora);
        const diff = currDate.getTime() - prevDate.getTime();
        
        if (diff > 0 && diff < 24 * 60 * 60 * 1000) {
          intervals.push(diff);
        }
      }
    }
  }

  if (intervals.length === 0) return 'N/A';

  const avgMs = intervals.reduce((a, b) => a + b, 0) / intervals.length;
  const avgSeconds = Math.floor(avgMs / 1000);
  
  if (avgSeconds < 60) return `${avgSeconds}s`;
  if (avgSeconds < 3600) return `${Math.floor(avgSeconds / 60)}min`;
  return `${Math.floor(avgSeconds / 3600)}h`;
}

/**
 * Calcula duração total da conversa
 */
function calculateTotalDuration(messages: Array<{ message: any; data_e_hora?: string }>): string {
  if (messages.length < 2) return 'N/A';
  
  const sortedMessages = messages
    .filter(m => m.data_e_hora)
    .sort((a, b) => new Date(a.data_e_hora!).getTime() - new Date(b.data_e_hora!).getTime());
  
  if (sortedMessages.length < 2) return 'N/A';
  
  const first = new Date(sortedMessages[0].data_e_hora!);
  const last = new Date(sortedMessages[sortedMessages.length - 1].data_e_hora!);
  
  const diffMs = last.getTime() - first.getTime();
  const diffMinutes = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);
  
  if (diffDays > 0) return `${diffDays}d ${diffHours % 24}h`;
  if (diffHours > 0) return `${diffHours}h ${diffMinutes % 60}min`;
  if (diffMinutes > 0) return `${diffMinutes}min`;
  return `${Math.floor(diffMs / 1000)}s`;
}

/**
 * Calcula taxa de resposta da IA
 */
function calculateResponseRate(messages: Array<{ message: any; data_e_hora?: string }>): string {
  let humanMessages = 0;
  let iaResponses = 0;
  
  for (let i = 0; i < messages.length; i++) {
    const type = (messages[i].message?.type || '').toLowerCase();
    if (type === 'human') {
      humanMessages++;
      // Verificar se há resposta da IA na próxima mensagem
      if (i + 1 < messages.length) {
        const nextType = (messages[i + 1].message?.type || '').toLowerCase();
        if (nextType === 'ai') {
          iaResponses++;
        }
      }
    }
  }
  
  if (humanMessages === 0) return '0%';
  
  const rate = Math.floor((iaResponses / humanMessages) * 100);
  return `${rate}%`;
}

