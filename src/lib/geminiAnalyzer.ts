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

