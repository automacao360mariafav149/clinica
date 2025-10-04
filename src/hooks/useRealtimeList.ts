import { useEffect, useMemo, useRef, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';

type OrderConfig = {
  column: string;
  ascending?: boolean;
  nullsFirst?: boolean;
};

type FilterConfig = {
  column: string;
  operator: 'eq' | 'neq' | 'gt' | 'gte' | 'lt' | 'lte' | 'like' | 'ilike' | 'is' | 'in';
  value: any;
};

export type UseRealtimeListOptions<T> = {
  table: string;
  schema?: string;
  select?: string;
  order?: OrderConfig;
  limit?: number;
  filters?: FilterConfig[];
  /** Default primary key. Override if your table uses a different key */
  primaryKey?: keyof T & string;
};

export function useRealtimeList<T = any>(options: UseRealtimeListOptions<T>) {
  const {
    table,
    schema = 'public',
    select = '*',
    order,
    limit,
    filters,
    primaryKey = 'id' as keyof T & string,
  } = options;

  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const hasLoadedRef = useRef<boolean>(false);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    setError(null);

    async function fetchInitial() {
      let query = supabase.from(table).select(select, { count: 'exact', head: false });

      // Aplica filtros se fornecidos
      if (filters && filters.length > 0) {
        filters.forEach((filter) => {
          query = query[filter.operator](filter.column, filter.value);
        });
      }

      if (order) {
        query = query.order(order.column, {
          ascending: order.ascending ?? true,
          nullsFirst: order.nullsFirst ?? false,
        });
      }

      if (limit) {
        query = query.limit(limit);
      }

      const { data: rows, error: fetchError } = await query;
      if (!isMounted) return;
      if (fetchError) {
        setError(fetchError.message);
        setData([]);
      } else {
        setData((rows as unknown as T[]) ?? []);
      }
      setLoading(false);
      hasLoadedRef.current = true;
    }

    fetchInitial();

    const channel = supabase
      .channel(`realtime:${schema}.${table}`)
      .on('postgres_changes', { event: '*', schema, table }, (payload) => {
        setData((current) => {
          const next = [...current];
          const pk = primaryKey as string;

          // Função auxiliar para verificar se um item passa pelos filtros
          const matchesFilters = (item: any) => {
            if (!filters || filters.length === 0) return true;
            return filters.every((filter) => {
              const value = item?.[filter.column];
              switch (filter.operator) {
                case 'eq':
                  return value === filter.value;
                case 'neq':
                  return value !== filter.value;
                case 'gt':
                  return value > filter.value;
                case 'gte':
                  return value >= filter.value;
                case 'lt':
                  return value < filter.value;
                case 'lte':
                  return value <= filter.value;
                case 'like':
                case 'ilike':
                  return String(value).includes(String(filter.value));
                case 'is':
                  return value === filter.value;
                case 'in':
                  return Array.isArray(filter.value) && filter.value.includes(value);
                default:
                  return true;
              }
            });
          };

          if (payload.eventType === 'INSERT') {
            // Só adiciona se passar pelos filtros
            if (matchesFilters(payload.new)) {
              next.unshift(payload.new as T);
            }
          } else if (payload.eventType === 'UPDATE') {
            const index = next.findIndex((row: any) => row?.[pk] === (payload.new as any)?.[pk]);
            if (matchesFilters(payload.new)) {
              // Se passar pelos filtros, atualiza ou adiciona
              if (index !== -1) {
                next[index] = payload.new as T;
              } else {
                next.unshift(payload.new as T);
              }
            } else {
              // Se não passar pelos filtros, remove se existir
              if (index !== -1) {
                next.splice(index, 1);
              }
            }
          } else if (payload.eventType === 'DELETE') {
            const index = next.findIndex((row: any) => row?.[pk] === (payload.old as any)?.[pk]);
            if (index !== -1) {
              next.splice(index, 1);
            }
          }

          if (order) {
            const { column, ascending = true } = order;
            next.sort((a: any, b: any) => {
              const av = a?.[column];
              const bv = b?.[column];
              if (av === bv) return 0;
              if (av === null || av === undefined) return order.nullsFirst ? -1 : 1;
              if (bv === null || bv === undefined) return order.nullsFirst ? 1 : -1;
              return ascending ? (av > bv ? 1 : -1) : (av < bv ? 1 : -1);
            });
          }

          return next;
        });
      })
      .subscribe();

    return () => {
      isMounted = false;
      supabase.removeChannel(channel);
    };
  }, [table, schema, select, order?.column, order?.ascending, order?.nullsFirst, limit, primaryKey, filters]);

  const count = useMemo(() => data.length, [data]);

  return { data, setData, loading, error, count, hasLoaded: hasLoadedRef.current } as const;
}


