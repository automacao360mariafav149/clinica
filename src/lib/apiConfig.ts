/**
 * Configuração dinâmica da API usando system_settings do banco de dados
 * IMPORTANTE: Sistema depende 100% do banco de dados - sem valores hardcoded
 */

import { getSystemSetting } from '@/hooks/useSystemSettings';

/**
 * Cache local das configurações para evitar múltiplas consultas
 */
let cachedConfig: {
  apiBaseUrl: string;
  timeout: number;
  lastFetch: number;
} | null = null;

const CACHE_DURATION = 5 * 60 * 1000; // 5 minutos

/**
 * Obtém a URL base da API do banco de dados
 * @returns URL base da API
 * @throws Error se a configuração não for encontrada no banco
 */
export async function getApiBaseUrl(): Promise<string> {
  if (cachedConfig && Date.now() - cachedConfig.lastFetch < CACHE_DURATION) {
    return cachedConfig.apiBaseUrl;
  }

  const url = await getSystemSetting('api_base_url');
  
  if (!url) {
    throw new Error('Configuração "api_base_url" não encontrada no banco de dados. Verifique a tabela system_settings.');
  }

  // Atualizar cache
  if (!cachedConfig) {
    // Buscar timeout também para inicializar o cache completo
    const timeoutStr = await getSystemSetting('api_timeout');
    const timeout = timeoutStr ? parseInt(timeoutStr, 10) : 30000;
    
    cachedConfig = {
      apiBaseUrl: url,
      timeout: !isNaN(timeout) ? timeout : 30000,
      lastFetch: Date.now(),
    };
  } else {
    cachedConfig.apiBaseUrl = url;
    cachedConfig.lastFetch = Date.now();
  }
  
  return url;
}

/**
 * Obtém o timeout da API do banco de dados
 * @returns Timeout em milissegundos
 * @throws Error se a configuração não for encontrada no banco
 */
export async function getApiTimeout(): Promise<number> {
  if (cachedConfig && Date.now() - cachedConfig.lastFetch < CACHE_DURATION) {
    return cachedConfig.timeout;
  }

  const timeout = await getSystemSetting('api_timeout');
  
  if (!timeout) {
    throw new Error('Configuração "api_timeout" não encontrada no banco de dados. Verifique a tabela system_settings.');
  }

  const timeoutNum = parseInt(timeout, 10);
  
  if (isNaN(timeoutNum)) {
    throw new Error(`Configuração "api_timeout" possui valor inválido: ${timeout}. Deve ser um número.`);
  }

  // Atualizar cache
  if (!cachedConfig) {
    // Buscar URL também para inicializar o cache completo
    const url = await getSystemSetting('api_base_url');
    
    cachedConfig = {
      apiBaseUrl: url || '',
      timeout: timeoutNum,
      lastFetch: Date.now(),
    };
  } else {
    cachedConfig.timeout = timeoutNum;
    cachedConfig.lastFetch = Date.now();
  }
  
  return timeoutNum;
}

/**
 * Limpa o cache de configurações
 * Use quando precisar forçar uma nova busca no banco
 */
export function clearApiConfigCache(): void {
  cachedConfig = null;
}

/**
 * Exemplo de uso: Fazer requisição HTTP usando configurações do banco
 */
export async function apiRequest<T>(
  endpoint: string,
  options?: RequestInit
): Promise<T> {
  const baseUrl = await getApiBaseUrl();
  const timeout = await getApiTimeout();

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(`${baseUrl}${endpoint}`, {
      ...options,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`HTTP Error: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
}

/**
 * Exemplo de uso em componente:
 * 
 * import { apiRequest } from '@/lib/apiConfig';
 * 
 * const data = await apiRequest<MyDataType>('/endpoint');
 */

