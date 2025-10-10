import { useEffect, useMemo, useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabaseClient';
import { listMedxSessions, listMessagesBySession, extractMessageText, MedxHistoryRow } from '@/lib/medxHistory';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import { User } from 'lucide-react';

dayjs.extend(utc);
dayjs.extend(timezone);
const APP_TZ = 'America/Sao_Paulo';

export default function WhatsApp() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const { data: sessions = [], isLoading: loadingSessions } = useQuery({
    queryKey: ['medx_sessions'],
    queryFn: () => listMedxSessions(1000),
  });

  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
  const [tab, setTab] = useState<'pre' | 'crm' | 'all'>('all');

  // Listas mínimas de pacientes e pré-pacientes para classificar as sessões dinamicamente
  const { data: patientsMin = [] } = useQuery({
    queryKey: ['patients_min'],
    queryFn: async () => {
      const { data } = await supabase.from('patients').select('id, name');
      return (data as { id: string; name: string }[]) ?? [];
    },
  });

  const { data: prePatientsMin = [] } = useQuery({
    queryKey: ['pre_patients_min'],
    queryFn: async () => {
      const { data } = await supabase.from('pre_patients').select('id, name');
      return (data as { id: string; name: string | null }[]) ?? [];
    },
  });

  useEffect(() => {
    if (!selectedSessionId && sessions.length > 0) {
      setSelectedSessionId(sessions[0].sessionId);
    }
  }, [sessions, selectedSessionId]);

  const { data: messages = [], isLoading: loadingMessages } = useQuery({
    queryKey: ['medx_messages', selectedSessionId],
    queryFn: () => selectedSessionId ? listMessagesBySession(selectedSessionId) : Promise.resolve([]),
    enabled: !!selectedSessionId,
  });

  useEffect(() => {
    const channel = supabase
      .channel('realtime:medx_history-ui')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'medx_history' }, (payload) => {
        queryClient.invalidateQueries({ queryKey: ['medx_sessions'] });
        const sid = (payload.new as any)?.session_id as string | undefined;
        if (sid && sid === selectedSessionId) {
          queryClient.invalidateQueries({ queryKey: ['medx_messages', selectedSessionId] });
        }
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'patients' }, () => {
        queryClient.invalidateQueries({ queryKey: ['patients_min'] });
        queryClient.invalidateQueries({ queryKey: ['medx_sessions'] });
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'pre_patients' }, () => {
        queryClient.invalidateQueries({ queryKey: ['pre_patients_min'] });
        queryClient.invalidateQueries({ queryKey: ['medx_sessions'] });
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient, selectedSessionId]);

  // Construir mapas para classificação
  const patientsMap = useMemo(() => {
    const m = new Map<string, string>();
    (patientsMin as any[]).forEach((p: any) => m.set(p.id, p.name));
    return m;
  }, [patientsMin]);

  const prePatientsMap = useMemo(() => {
    const m = new Map<string, string | null>();
    (prePatientsMin as any[]).forEach((p: any) => m.set(p.id, p.name ?? null));
    return m;
  }, [prePatientsMin]);

  // Sessões classificadas dinamicamente por tabelas atuais
  const classifiedSessions = useMemo(() => {
    return sessions.map((s: any) => {
      if (patientsMap.has(s.sessionId)) {
        return { ...s, kind: 'patient', displayName: patientsMap.get(s.sessionId) };
      }
      if (prePatientsMap.has(s.sessionId)) {
        const name = prePatientsMap.get(s.sessionId);
        return { ...s, kind: 'pre_patient', displayName: name ?? undefined };
      }
      return { ...s, kind: 'unknown' };
    });
  }, [sessions, patientsMap, prePatientsMap]);

  const selectedSession = useMemo(() => {
    return classifiedSessions.find((s: any) => s.sessionId === selectedSessionId) ?? null;
  }, [classifiedSessions, selectedSessionId]);

  const filteredSessions = useMemo(() => {
    const term = search.trim().toLowerCase();
    let list = classifiedSessions;
    if (tab === 'pre') list = list.filter((s: any) => s.kind === 'pre_patient');
    if (tab === 'crm') list = list.filter((s: any) => s.kind === 'patient');
    if (!term) return list;
    return list.filter((s: any) => {
      const name = (s.displayName ?? '').toLowerCase();
      return (
        s.sessionId.toLowerCase().includes(term) ||
        name.includes(term) ||
        s.lastMessagePreview.toLowerCase().includes(term)
      );
    });
  }, [classifiedSessions, search, tab]);

  return (
    <DashboardLayout requiredRoles={['owner', 'secretary']}>
      <div className="h-[calc(100vh-80px)] p-6">
        <div className="mb-4">
          <h1 className="text-3xl font-bold text-foreground">WhatsApp</h1>
          <p className="text-muted-foreground mt-1">Conversas por sessão (medx_history)</p>
        </div>

        <Card className="h-full overflow-hidden">
          <div className="h-full min-h-0 grid grid-cols-[320px_1fr]">
            {/* Sidebar de conversas */}
            <div className="border-r p-3 flex flex-col min-h-0">
              <div className="flex gap-2 mb-3">
                <button
                  className={`text-xs px-3 py-1 rounded-full ${tab === 'all' ? 'bg-accent' : 'hover:bg-accent/50'}`}
                  onClick={() => setTab('all')}
                >
                  Todos
                </button>
                <button
                  className={`text-xs px-3 py-1 rounded-full ${tab === 'pre' ? 'bg-accent' : 'hover:bg-accent/50'}`}
                  onClick={() => setTab('pre')}
                >
                  Pré Pacientes
                </button>
                <button
                  className={`text-xs px-3 py-1 rounded-full ${tab === 'crm' ? 'bg-accent' : 'hover:bg-accent/50'}`}
                  onClick={() => setTab('crm')}
                >
                  Pacientes CRM
                </button>
              </div>
              <Input
                placeholder="Buscar por sessão ou mensagem…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="mb-3"
              />
              <ScrollArea className="flex-1 min-h-0">
                <div className="space-y-1">
                  {loadingSessions && (
                    <div className="text-sm text-muted-foreground px-2 py-1">Carregando…</div>
                  )}
                  {!loadingSessions && filteredSessions.length === 0 && (
                    <div className="text-sm text-muted-foreground px-2 py-1">Nenhuma conversa</div>
                  )}
                  {filteredSessions.map((s) => {
                    const active = s.sessionId === selectedSessionId;
                    return (
                      <button
                        key={s.sessionId}
                        onClick={() => setSelectedSessionId(s.sessionId)}
                        className={`w-full text-left px-3 py-2 rounded-md transition-colors border-l-2 ${
                          s.kind === 'pre_patient' ? 'border-amber-400' : s.kind === 'patient' ? 'border-emerald-400' : 'border-muted'
                        } ${active ? 'bg-accent' : 'hover:bg-accent/50'}`}
                      >
                        <div className="flex items-center gap-3">
                          <Avatar className={`h-8 w-8 ${s.kind === 'pre_patient' ? 'bg-amber-100' : 'bg-primary/10'}`}>
                            <AvatarFallback className={`${s.kind === 'pre_patient' ? 'text-amber-700' : 'text-primary'}`}>
                              {s.kind === 'pre_patient' ? (
                                <User className="w-4 h-4" />
                              ) : (
                                (s.displayName?.[0] ?? s.sessionId?.[0] ?? '').toUpperCase()
                              )}
                            </AvatarFallback>
                          </Avatar>
                          <div className="min-w-0">
                            <div className="text-sm font-medium truncate">{s.kind === 'pre_patient' ? 'Pré Paciente' : (s.displayName ?? s.sessionId)}</div>
                            <div className={`text-[10px] font-medium ${s.kind === 'pre_patient' ? 'text-amber-700' : s.kind === 'patient' ? 'text-emerald-700' : 'text-slate-500'}`}>{s.kind === 'pre_patient' ? 'Pré Paciente' : s.kind === 'patient' ? 'Paciente' : 'Desconhecido'}</div>
                            <div className="text-xs text-white truncate">{s.lastMessagePreview}</div>
                          </div>
                          <div className="ml-auto text-xs text-muted-foreground">{s.totalMessages}</div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </ScrollArea>
            </div>

            {/* Painel de mensagens */}
            <div className="flex flex-col h-full min-h-0">
              <div className="px-4 py-3 border-b flex items-center gap-3">
                <Avatar className="h-9 w-9">
                  <AvatarFallback>{selectedSession ? (selectedSession.kind === 'pre_patient' ? 'PP' : ((selectedSession.displayName ?? selectedSession.sessionId)?.slice(0, 2).toUpperCase())) : (selectedSessionId?.slice(0, 2).toUpperCase() ?? '')}</AvatarFallback>
                </Avatar>
                <div className="min-w-0">
                  <div className="text-sm font-semibold truncate">{selectedSession ? (selectedSession.kind === 'pre_patient' ? 'Pré Paciente' : (selectedSession.displayName ?? selectedSession.sessionId)) : (selectedSessionId ?? 'Selecione uma conversa')}</div>
                  <div className="text-xs text-muted-foreground">{messages.length} mensagens</div>
                </div>
              </div>

              <ScrollArea className="flex-1 min-h-0 px-4 py-4">
                <div className="space-y-3">
                  {loadingMessages && (
                    <div className="text-sm text-muted-foreground">Carregando mensagens…</div>
                  )}
                  {!loadingMessages && messages.length === 0 && (
                    <div className="text-sm text-muted-foreground">Nenhuma mensagem</div>
                  )}
                  {messages.map((m: MedxHistoryRow, idx: number) => {
                    const type = (m.message?.type ?? '').toLowerCase();
                    const isAi = type === 'ai';
                    const isHuman = type === 'human';
                    const text = extractMessageText(m.message);
                    const current = m.data_e_hora ? dayjs(m.data_e_hora).tz(APP_TZ) : null;
                    const prev = idx > 0 && messages[idx - 1].data_e_hora ? dayjs(messages[idx - 1].data_e_hora!).tz(APP_TZ) : null;
                    const showDateHeader = !!current && (!prev || !current.isSame(prev, 'day'));
                    return (
                      <div key={m.id}>
                        {showDateHeader && (
                          <div className="sticky top-0 z-10 flex items-center justify-center mb-2">
                            <span className="text-[11px] px-2 py-1 rounded-full bg-muted text-muted-foreground">
                              {current?.format('DD/MM/YYYY')}
                            </span>
                          </div>
                        )}
                        <div className={`flex ${isAi ? 'justify-end' : 'justify-start'}`}>
                          <div className={`max-w-[70%] rounded-2xl px-3 py-2 text-sm whitespace-pre-wrap break-words break-all ${
                            isAi ? 'bg-primary text-primary-foreground rounded-br-sm' : 'bg-muted rounded-bl-sm'
                          }`}>
                            <div>{text}</div>
                            {current && (
                              <div className={`mt-1 text-[10px] opacity-70 ${isAi ? 'text-primary-foreground' : 'text-foreground/70'}`}>
                                {current.format('HH:mm')}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </ScrollArea>

              <div className="px-4 py-3 border-t bg-background/50">
                <div className="text-xs text-muted-foreground">Somente leitura a partir de medx_history</div>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </DashboardLayout>
  );
}
