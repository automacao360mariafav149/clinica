import { useEffect, useState, useRef } from 'react';
import { supabase } from '@/lib/supabaseClient';

interface Profile {
  id: string;
  auth_user_id: string;
  name: string;
  role: string;
  [key: string]: any;
}

interface UseRealtimeProfilesOptions {
  filter?: string;
  channelName: string; // Nome único para cada componente
  onlyUpdates?: boolean; // Se true, só escuta UPDATE, não INSERT/DELETE
}

/**
 * Hook personalizado para escutar mudanças na tabela profiles com canal isolado.
 * Cada componente que usar este hook terá seu próprio canal realtime separado.
 */
export function useRealtimeProfiles(
  initialData: Profile[] = [],
  options: UseRealtimeProfilesOptions
) {
  const [profiles, setProfiles] = useState<Profile[]>(initialData);
  const [isLoading, setIsLoading] = useState(false);
  const isMountedRef = useRef(true);
  const channelRef = useRef<any>(null);

  useEffect(() => {
    isMountedRef.current = true;
    
    console.log(`[${options.channelName}] 🔄 Iniciando hook`);
    
    // Carrega dados iniciais
    const loadProfiles = async () => {
      setIsLoading(true);
      try {
        console.log(`[${options.channelName}] 📡 Carregando profiles...`);
        
        let query = supabase.from('profiles').select('*');
        
        // Aplica filtro se fornecido
        if (options.filter) {
          console.log(`[${options.channelName}] Aplicando filtro: ${options.filter}`);
          const [column, operator, value] = options.filter.split('.');
          
          if (operator === 'eq') {
            query = query.eq(column, value);
          } else if (operator === 'neq') {
            query = query.neq(column, value);
          } else if (operator === 'in') {
            query = query.in(column, value.split(','));
          }
        }
        
        const { data, error } = await query.order('created_at', { ascending: false });
        
        if (error) {
          console.error(`[${options.channelName}] ❌ Erro ao carregar profiles:`, error);
          return;
        }
        
        if (isMountedRef.current) {
          console.log(`[${options.channelName}] ✅ ${data?.length || 0} profiles carregados`);
          setProfiles(data || []);
        }
      } catch (error) {
        console.error(`[${options.channelName}] ❌ Erro inesperado:`, error);
      } finally {
        if (isMountedRef.current) {
          setIsLoading(false);
        }
      }
    };
    
    loadProfiles();
    
    // Configura realtime com canal ÚNICO
    console.log(`[${options.channelName}] 📡 Criando canal realtime`);
    
    const channel = supabase
      .channel(options.channelName) // Canal com nome único
      .on(
        'postgres_changes',
        {
          event: options.onlyUpdates ? 'UPDATE' : '*',
          schema: 'public',
          table: 'profiles',
        },
        (payload) => {
          if (!isMountedRef.current) {
            console.log(`[${options.channelName}] ⚠️ Evento ignorado - componente desmontado`);
            return;
          }
          
          console.log(`[${options.channelName}] 🔔 Evento realtime:`, payload.eventType);
          
          // Verifica se o evento passa pelo filtro
          const passesFilter = () => {
            if (!options.filter) return true;
            
            const [column, operator, value] = options.filter.split('.');
            const newData = payload.new as any;
            const oldData = payload.old as any;
            const dataToCheck = newData || oldData;
            
            if (!dataToCheck) return true;
            
            if (operator === 'eq') {
              return dataToCheck[column] === value;
            } else if (operator === 'neq') {
              return dataToCheck[column] !== value;
            } else if (operator === 'in') {
              return value.split(',').includes(dataToCheck[column]);
            }
            
            return true;
          };
          
          if (!passesFilter()) {
            console.log(`[${options.channelName}] ⚠️ Evento ignorado - não passa pelo filtro`);
            return;
          }
          
          setProfiles(current => {
            const newProfiles = [...current];
            
            switch (payload.eventType) {
              case 'INSERT':
                if (!options.onlyUpdates) {
                  console.log(`[${options.channelName}] ➕ Adicionando novo profile`);
                  newProfiles.unshift(payload.new as Profile);
                }
                break;
                
              case 'UPDATE':
                const index = newProfiles.findIndex(p => p.id === (payload.new as any).id);
                if (index !== -1) {
                  console.log(`[${options.channelName}] ✏️ Atualizando profile na posição ${index}`);
                  newProfiles[index] = payload.new as Profile;
                } else {
                  console.log(`[${options.channelName}] ⚠️ Profile não encontrado para atualizar`);
                }
                break;
                
              case 'DELETE':
                if (!options.onlyUpdates) {
                  const deleteIndex = newProfiles.findIndex(p => p.id === (payload.old as any).id);
                  if (deleteIndex !== -1) {
                    console.log(`[${options.channelName}] 🗑️ Removendo profile da posição ${deleteIndex}`);
                    newProfiles.splice(deleteIndex, 1);
                  }
                }
                break;
            }
            
            return newProfiles;
          });
        }
      )
      .subscribe((status) => {
        console.log(`[${options.channelName}] 📡 Status do canal:`, status);
        
        if (status === 'SUBSCRIBED') {
          console.log(`[${options.channelName}] ✅ Canal ativo e escutando mudanças`);
        } else if (status === 'CHANNEL_ERROR') {
          console.error(`[${options.channelName}] ❌ Erro no canal`);
        } else if (status === 'TIMED_OUT') {
          console.error(`[${options.channelName}] ❌ Timeout na conexão`);
        }
      });
    
    channelRef.current = channel;
    
    return () => {
      console.log(`[${options.channelName}] 🧹 Limpando hook`);
      isMountedRef.current = false;
      
      if (channelRef.current) {
        console.log(`[${options.channelName}] 📡 Removendo canal`);
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [options.channelName, options.filter, options.onlyUpdates]); // Dependências mínimas
  
  // Função para recarregar manualmente os dados
  const refetch = async () => {
    console.log(`[${options.channelName}] 🔄 Refetch manual iniciado`);
    setIsLoading(true);
    
    try {
      let query = supabase.from('profiles').select('*');
      
      if (options.filter) {
        const [column, operator, value] = options.filter.split('.');
        
        if (operator === 'eq') {
          query = query.eq(column, value);
        } else if (operator === 'neq') {
          query = query.neq(column, value);
        } else if (operator === 'in') {
          query = query.in(column, value.split(','));
        }
      }
      
      const { data, error } = await query.order('created_at', { ascending: false });
      
      if (error) {
        console.error(`[${options.channelName}] ❌ Erro no refetch:`, error);
        return;
      }
      
      if (isMountedRef.current) {
        console.log(`[${options.channelName}] ✅ Refetch concluído: ${data?.length || 0} profiles`);
        setProfiles(data || []);
      }
    } catch (error) {
      console.error(`[${options.channelName}] ❌ Erro inesperado no refetch:`, error);
    } finally {
      if (isMountedRef.current) {
        setIsLoading(false);
      }
    }
  };
  
  return { 
    profiles, 
    isLoading, 
    refetch,
    count: profiles.length 
  } as const;
}

