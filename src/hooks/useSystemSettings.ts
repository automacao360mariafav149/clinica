import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';

interface SystemSetting {
  key: string;
  value: string;
}

interface UseSystemSettingsReturn {
  settings: Record<string, string>;
  loading: boolean;
  error: Error | null;
  refreshSettings: () => Promise<void>;
}

/**
 * Hook para acessar configurações do sistema armazenadas no banco de dados
 * @param key - (Opcional) Chave específica da configuração. Se omitido, retorna todas.
 * @returns Objeto com settings, loading, error e função para atualizar
 * 
 * @example
 * // Buscar todas as configurações
 * const { settings, loading } = useSystemSettings();
 * const apiUrl = settings.api_base_url;
 * 
 * @example
 * // Buscar configuração específica
 * const { settings } = useSystemSettings('api_base_url');
 * const apiUrl = settings.api_base_url;
 */
export const useSystemSettings = (key?: string): UseSystemSettingsReturn => {
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      setError(null);

      let query = supabase
        .from('system_settings')
        .select('key, value')
        .eq('is_active', true);

      if (key) {
        query = query.eq('key', key).single();
      }

      const { data, error: fetchError } = await query;

      if (fetchError) throw fetchError;

      if (key && data && !Array.isArray(data)) {
        // Retorno de configuração única
        setSettings({ [data.key]: data.value });
      } else if (Array.isArray(data)) {
        // Retorno de múltiplas configurações
        const settingsObj = data.reduce((acc, item: SystemSetting) => {
          acc[item.key] = item.value;
          return acc;
        }, {} as Record<string, string>);
        setSettings(settingsObj);
      } else {
        setSettings({});
      }
    } catch (err) {
      console.error('Erro ao buscar configurações do sistema:', err);
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();

    // Subscrever mudanças em tempo real
    const subscription = supabase
      .channel('system_settings_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'system_settings',
        },
        (payload) => {
          console.log('Configuração do sistema alterada:', payload);
          fetchSettings();
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [key]);

  return {
    settings,
    loading,
    error,
    refreshSettings: fetchSettings,
  };
};

/**
 * Função auxiliar para buscar uma configuração específica diretamente
 * @param key - Chave da configuração
 * @returns Valor da configuração ou null se não encontrada
 * 
 * @example
 * const apiUrl = await getSystemSetting('api_base_url');
 */
export async function getSystemSetting(key: string): Promise<string | null> {
  try {
    console.log(`🔍 [getSystemSetting] Buscando configuração: ${key}`);
    
    const { data, error } = await supabase
      .from('system_settings')
      .select('value')
      .eq('key', key)
      .eq('is_active', true)
      .single();

    console.log(`📊 [getSystemSetting] Resultado para '${key}':`, { data, error });

    if (error || !data) {
      console.error(`❌ [getSystemSetting] Configuração '${key}' não encontrada:`, error);
      return null;
    }

    console.log(`✅ [getSystemSetting] Valor encontrado para '${key}':`, data.value?.substring(0, 20) + '...');
    return data.value;
  } catch (err) {
    console.error(`❌ [getSystemSetting] Erro ao buscar configuração '${key}':`, err);
    return null;
  }
}

/**
 * Função auxiliar para buscar todas as configurações ativas
 * @returns Objeto com todas as configurações
 * 
 * @example
 * const settings = await getAllSystemSettings();
 * console.log(settings.api_base_url);
 */
export async function getAllSystemSettings(): Promise<Record<string, string>> {
  try {
    const { data, error } = await supabase
      .from('system_settings')
      .select('key, value')
      .eq('is_active', true);

    if (error || !data) {
      console.error('Erro ao buscar configurações do sistema:', error);
      return {};
    }

    return data.reduce((acc, item: SystemSetting) => {
      acc[item.key] = item.value;
      return acc;
    }, {} as Record<string, string>);
  } catch (err) {
    console.error('Erro ao buscar configurações do sistema:', err);
    return {};
  }
}

