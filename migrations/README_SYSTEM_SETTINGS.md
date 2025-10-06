# System Settings - Configurações Dinâmicas do Sistema

## 📋 Visão Geral

A tabela `system_settings` permite armazenar configurações do sistema no banco de dados, possibilitando alterações sem modificar o código-fonte.

⚠️ **ATENÇÃO:** O sistema depende **100% do banco de dados**. Não existem valores hardcoded como fallback. Se você alterar ou remover configurações críticas da tabela, o sistema pode parar de funcionar e lançará erros claros indicando qual configuração está faltando.

## 🗄️ Estrutura da Tabela

```sql
system_settings
├── id (UUID) - Identificador único
├── key (VARCHAR) - Chave única da configuração
├── value (TEXT) - Valor da configuração
├── description (TEXT) - Descrição da configuração
├── is_active (BOOLEAN) - Se a configuração está ativa
├── created_at (TIMESTAMPTZ) - Data de criação
└── updated_at (TIMESTAMPTZ) - Data de atualização
```

## 🔑 Configurações Disponíveis

| Key | Descrição | Valor Padrão |
|-----|-----------|--------------|
| `api_base_url` | URL base para requisições da API | `https://api.exemplo.com` |
| `api_timeout` | Timeout da API em ms | `30000` |
| `maintenance_mode` | Modo de manutenção | `false` |
| `max_file_size` | Tamanho máximo de arquivo (bytes) | `10485760` |

## 💻 Como Usar no Código

### 1. Hook Customizado (useSystemSettings)

```typescript
// src/hooks/useSystemSettings.ts
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';

export const useSystemSettings = (key?: string) => {
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        setLoading(true);
        let query = supabase
          .from('system_settings')
          .select('key, value')
          .eq('is_active', true);

        if (key) {
          query = query.eq('key', key).single();
        }

        const { data, error } = await query;

        if (error) throw error;

        if (key && data) {
          setSettings({ [data.key]: data.value });
        } else if (Array.isArray(data)) {
          const settingsObj = data.reduce((acc, item) => {
            acc[item.key] = item.value;
            return acc;
          }, {} as Record<string, string>);
          setSettings(settingsObj);
        }
      } catch (err) {
        setError(err as Error);
      } finally {
        setLoading(false);
      }
    };

    fetchSettings();

    // Subscrever mudanças em tempo real
    const subscription = supabase
      .channel('system_settings_changes')
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'system_settings' 
        }, 
        () => {
          fetchSettings();
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [key]);

  return { settings, loading, error };
};
```

### 2. Uso em Componentes

```typescript
import { useSystemSettings } from '@/hooks/useSystemSettings';

function MeuComponente() {
  const { settings, loading } = useSystemSettings();

  if (loading) return <div>Carregando...</div>;

  const apiUrl = settings.api_base_url;
  const timeout = parseInt(settings.api_timeout);

  // Usar as configurações
  return <div>API URL: {apiUrl}</div>;
}
```

### 3. Buscar Configuração Específica

```typescript
const { settings } = useSystemSettings('api_base_url');
const apiUrl = settings.api_base_url;
```

### 4. Utility Function com API Config (src/lib/apiConfig.ts)

```typescript
import { getApiBaseUrl, apiRequest } from '@/lib/apiConfig';

// Buscar URL do banco de dados
const apiUrl = await getApiBaseUrl();

// Fazer requisição usando configurações do banco
const data = await apiRequest<MyType>('/endpoint');
```

**IMPORTANTE:** O sistema depende 100% do banco de dados. Não há valores hardcoded como fallback. Se as configurações não estiverem no banco, o sistema lançará erros claros indicando qual configuração está faltando.

## 🔄 Como Alterar Configurações

### Via SQL (Supabase Dashboard)

```sql
-- Atualizar URL base da API
UPDATE public.system_settings 
SET value = 'https://nova-api.exemplo.com' 
WHERE key = 'api_base_url';

-- Adicionar nova configuração
INSERT INTO public.system_settings (key, value, description, is_active)
VALUES ('nova_config', 'valor', 'Descrição da nova config', true);
```

### Via Interface (Criar página de admin)

Você pode criar uma página de administração para gerenciar essas configurações visualmente.

## 🔒 Segurança

- **RLS (Row Level Security)** está habilitado
- Leitura: Qualquer um pode ler configurações ativas
- Escrita: Apenas usuários autenticados podem modificar

## 📊 Realtime

A tabela possui suporte a Realtime habilitado. Qualquer alteração será refletida automaticamente nos clientes conectados.

## 🎯 Benefícios

- ✅ Alterar configurações sem deploy
- ✅ Configurações diferentes por ambiente
- ✅ Histórico de alterações (via updated_at)
- ✅ Possibilidade de desativar configurações
- ✅ Sincronização em tempo real

## 📝 Exemplos de Uso

### Exemplo 1: Configurar URL da API

```typescript
// Antes (hardcoded)
const API_URL = 'https://api.exemplo.com';

// Depois (dinâmico)
const { settings } = useSystemSettings('api_base_url');
const API_URL = settings.api_base_url || 'https://api.exemplo.com'; // fallback
```

### Exemplo 2: Modo de Manutenção

```typescript
const { settings } = useSystemSettings('maintenance_mode');
const isMaintenanceMode = settings.maintenance_mode === 'true';

if (isMaintenanceMode) {
  return <MaintenancePage />;
}
```

## 🚀 Próximos Passos

1. Implemente o hook `useSystemSettings.ts`
2. Atualize seu código para usar as configurações dinâmicas
3. (Opcional) Crie uma página de admin para gerenciar configurações
4. Configure os valores corretos das configurações no banco

---

**Data de Criação:** 2025-10-06  
**Migration:** 13º_Migration_create_system_settings.sql  
**Seed:** 5º_Seed_initial_system_settings.sql

