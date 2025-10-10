import { supabase } from '@/lib/supabaseClient';

export type MedxHistoryRow = {
  id: number;
  session_id: string;
  message: any;
  data_e_hora?: string; // timestamptz
  media?: string | null; // URL
};

export type MedxSession = {
  sessionId: string;
  totalMessages: number;
  lastMessageId: number;
  lastMessagePreview: string;
  kind?: 'patient' | 'pre_patient' | 'unknown';
  displayName?: string;
};

export function extractMessageText(message: any): string {
  if (!message) return '';
  if (typeof message === 'string') return message;
  if (typeof message?.content === 'string') return message.content;
  if (Array.isArray(message?.content)) {
    const first = message.content.find((c: any) => typeof c?.text === 'string' || typeof c === 'string');
    if (!first) return '';
    return typeof first === 'string' ? first : (first.text ?? '');
  }
  return JSON.stringify(message);
}

export async function listMedxSessions(limitRows: number = 500): Promise<MedxSession[]> {
  const { data, error } = await supabase
    .from('medx_history')
    .select('id, session_id, message')
    .order('id', { ascending: false })
    .limit(limitRows);

  if (error) throw error;

  const bySession = new Map<string, MedxSession>();

  (data as MedxHistoryRow[]).forEach((row) => {
    const existing = bySession.get(row.session_id);
    const preview = extractMessageText(row.message).slice(0, 120);
    if (!existing) {
      bySession.set(row.session_id, {
        sessionId: row.session_id,
        totalMessages: 1,
        lastMessageId: row.id,
        lastMessagePreview: preview,
      });
    } else {
      existing.totalMessages += 1;
      if (row.id > existing.lastMessageId) {
        existing.lastMessageId = row.id;
        existing.lastMessagePreview = preview;
      }
    }
  });

  const sessions = Array.from(bySession.values());
  sessions.sort((a, b) => b.lastMessageId - a.lastMessageId);
  try {
    const [patientsResp, prePatientsResp] = await Promise.all([
      supabase.from('patients').select('id, name'),
      supabase.from('pre_patients').select('id, name'),
    ]);

    const patients = new Map<string, string>();
    const prePatients = new Map<string, string>();
    if (!patientsResp.error) {
      (patientsResp.data as { id: string; name: string }[] | null)?.forEach((p) => patients.set(p.id, p.name));
    }
    if (!prePatientsResp.error) {
      (prePatientsResp.data as { id: string; name: string }[] | null)?.forEach((p) => prePatients.set(p.id, p.name));
    }

    sessions.forEach((s) => {
      if (patients.has(s.sessionId)) {
        s.kind = 'patient';
        s.displayName = patients.get(s.sessionId);
      } else if (prePatients.has(s.sessionId)) {
        s.kind = 'pre_patient';
        s.displayName = prePatients.get(s.sessionId);
      } else {
        s.kind = 'unknown';
      }
    });
  } catch {
    // Ignora classificação se não possuir permissão/erro de rede
    sessions.forEach((s) => (s.kind = s.kind ?? 'unknown'));
  }

  return sessions;
}

export async function listMessagesBySession(sessionId: string): Promise<MedxHistoryRow[]> {
  const { data, error } = await supabase
    .from('medx_history')
    .select('id, session_id, message, data_e_hora, media')
    .eq('session_id', sessionId)
    .order('id', { ascending: true });

  if (error) throw error;
  return (data as MedxHistoryRow[]) ?? [];
}


