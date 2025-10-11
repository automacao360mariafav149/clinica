import { useEffect, useMemo, useState, useRef } from 'react';
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
import { User, Play, Pause, FileText, Bell, Stethoscope, Send, Loader2, Paperclip, Mic, Image } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from '@/components/ui/tooltip';
import { SummaryModal } from '@/components/whatsapp/SummaryModal';
import { AssignDoctorModal } from '@/components/whatsapp/AssignDoctorModal';
import { useAuth } from '@/contexts/AuthContext';
import { getApiBaseUrl } from '@/lib/apiConfig';
import { toast } from 'sonner';

dayjs.extend(utc);
dayjs.extend(timezone);
const APP_TZ = 'America/Sao_Paulo';

function getMediaKind(url: string): 'image' | 'audio' | 'video' | 'pdf' | 'doc' | 'other' {
  const u = (url || '').toLowerCase();
  if (u.match(/\.(png|jpg|jpeg|gif|webp|svg)(\?.*)?$/)) return 'image';
  if (u.match(/\.(mp3|wav|ogg|m4a)(\?.*)?$/)) return 'audio';
  if (u.match(/\.(mp4|webm|ogg)(\?.*)?$/)) return 'video';
  if (u.endsWith('.pdf')) return 'pdf';
  if (u.match(/\.(doc|docx|xls|xlsx|ppt|pptx)(\?.*)?$/)) return 'doc';
  return 'other';
}

function cleanTranscriptText(text?: string): string | undefined {
  if (!text) return text;
  const trimmed = text.trim();
  // Remove prefixo "Audio recebido:" no início da string (case-insensitive), com espaços opcionais
  return trimmed.replace(/^audio\s+recebido\s*:\s*/i, '');
}

function MediaPreview({ url, transcriptText }: { url: string; transcriptText?: string }) {
  const kind = getMediaKind(url);
  if (kind === 'image') {
    return (
      <a href={url} target="_blank" rel="noreferrer">
        <img src={url} alt="imagem" className="max-w-full rounded-md border mb-1" />
      </a>
    );
  }
  if (kind === 'audio') {
    return <AudioBubble url={url} transcriptText={cleanTranscriptText(transcriptText)} />;
  }
  if (kind === 'video') {
    return (
      <video controls className="w-full rounded-md border">
        <source src={url} />
        Seu navegador não suporta vídeo.
      </video>
    );
  }
  if (kind === 'pdf') {
    return (
      <div className="space-y-1">
        <iframe
          src={url}
          className="w-full h-64 rounded-md border"
          title="Pré-visualização PDF"
        />
        <a href={url} target="_blank" rel="noreferrer" className="underline">
          Abrir PDF em nova guia
        </a>
      </div>
    );
  }
  // doc e outros: mostrar link simples
  return (
    <a href={url} target="_blank" rel="noreferrer" className="underline">
      Abrir arquivo
    </a>
  );
}

function formatTime(totalSeconds: number): string {
  if (!isFinite(totalSeconds) || totalSeconds < 0) return '00:00';
  const m = Math.floor(totalSeconds / 60)
    .toString()
    .padStart(2, '0');
  const s = Math.floor(totalSeconds % 60)
    .toString()
    .padStart(2, '0');
  return `${m}:${s}`;
}

function AudioBubble({ url, transcriptText }: { url: string; transcriptText?: string }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [current, setCurrent] = useState(0);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [showTranscript, setShowTranscript] = useState(false);
  const audioRef = useMemo(() => new Audio(url), [url]);

  useEffect(() => {
    const audio = audioRef;
    audio.preload = 'metadata';
    audio.playbackRate = playbackRate;
    const onLoaded = () => setDuration(audio.duration || 0);
    const onTime = () => setCurrent(audio.currentTime || 0);
    const onEnded = () => {
      setIsPlaying(false);
      setCurrent(audio.duration || 0);
    };
    audio.addEventListener('loadedmetadata', onLoaded);
    audio.addEventListener('timeupdate', onTime);
    audio.addEventListener('ended', onEnded);
    return () => {
      audio.pause();
      audio.removeEventListener('loadedmetadata', onLoaded);
      audio.removeEventListener('timeupdate', onTime);
      audio.removeEventListener('ended', onEnded);
    };
  }, [audioRef, playbackRate]);

  const toggle = async () => {
    try {
      if (isPlaying) {
        audioRef.pause();
        setIsPlaying(false);
      } else {
        await audioRef.play();
        setIsPlaying(true);
      }
    } catch {}
  };

  const pct = duration > 0 ? Math.min(100, Math.max(0, (current / duration) * 100)) : 0;

  const onScrub = (value: number) => {
    if (!isFinite(value)) return;
    const clamped = Math.max(0, Math.min(duration || 0, value));
    setCurrent(clamped);
    audioRef.currentTime = clamped;
  };

  const cycleRate = () => {
    const rates = [1, 1.5, 2];
    const idx = rates.indexOf(playbackRate);
    const next = rates[(idx + 1) % rates.length];
    setPlaybackRate(next);
  };

  return (
    <div className="flex items-center gap-3">
      <button
        type="button"
        onClick={toggle}
        className="w-10 h-10 rounded-full bg-white text-black flex items-center justify-center shadow"
        aria-label={isPlaying ? 'Pausar áudio' : 'Reproduzir áudio'}
      >
        {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
      </button>
      <div className="flex-1 min-w-[160px] max-w-[260px]">
        <input
          type="range"
          min={0}
          max={duration || 0}
          step="0.01"
          value={current}
          onChange={(e) => onScrub(parseFloat(e.target.value))}
          className="w-full accent-current"
        />
        <div className="mt-1 text-[10px] opacity-80 flex items-center justify-between">
          <span>{formatTime(current)}</span>
          <span>{formatTime(duration)}</span>
        </div>
        {transcriptText && (
          <button
            type="button"
            onClick={() => setShowTranscript((v) => !v)}
            className="mt-2 text-[11px] underline"
          >
            {showTranscript ? 'Ocultar transcrição' : 'Exibir transcrição'}
          </button>
        )}
        {showTranscript && transcriptText && (
          <div className="mt-2 text-xs whitespace-pre-wrap break-words break-all opacity-90">
            {transcriptText}
          </div>
        )}
      </div>
      <button
        type="button"
        onClick={cycleRate}
        className="text-[10px] px-2 py-1 rounded bg-white text-black shadow"
        aria-label={`Velocidade ${playbackRate}x`}
      >
        {playbackRate}x
      </button>
    </div>
  );
}

export default function WhatsApp() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
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
      .on('postgres_changes', { event: '*', schema: 'public', table: 'patient_doctors' }, (payload) => {
        // Atualizar médico atribuído quando houver alteração
        const patientId = (payload.new as any)?.patient_id || (payload.old as any)?.patient_id;
        if (patientId === selectedSessionId) {
          queryClient.invalidateQueries({ queryKey: ['assigned_doctor', selectedSessionId] });
        }
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

  // Buscar telefone do paciente/pre-paciente da sessão (se tivermos nas tabelas)
  const [patientPhone, setPatientPhone] = useState<string | null>(null);
  useEffect(() => {
    const fetchPhone = async () => {
      if (!selectedSessionId) { 
        console.log('[WhatsApp] Nenhuma sessão selecionada');
        setPatientPhone(null); 
        return; 
      }
      
      console.log('[WhatsApp] 🔍 Buscando telefone para sessão:', selectedSessionId);
      
      try {
        // Tenta em patients
        console.log('[WhatsApp] Tentando buscar em patients...');
        const p = await supabase.from('patients').select('phone').eq('id', selectedSessionId).maybeSingle();
        
        console.log('[WhatsApp] Resultado patients:', {
          error: p.error,
          data: p.data,
          phone: (p.data as any)?.phone,
        });
        
        if (!p.error && p.data && (p.data as any)?.phone) {
          const phone = (p.data as any).phone as string;
          // Limpar formato do WhatsApp: remover @s.whatsapp.net
          const cleanPhone = phone.trim().replace(/@s\.whatsapp\.net$/i, '');
          
          console.log('[WhatsApp] ✅ Telefone encontrado em patients:', {
            original: phone,
            cleaned: cleanPhone,
          });
          setPatientPhone(cleanPhone);
          return;
        }
        
        // Tenta em pre_patients
        console.log('[WhatsApp] Tentando buscar em pre_patients...');
        const pp = await supabase.from('pre_patients').select('phone').eq('id', selectedSessionId).maybeSingle();
        
        console.log('[WhatsApp] Resultado pre_patients:', {
          error: pp.error,
          data: pp.data,
          phone: (pp.data as any)?.phone,
        });
        
        if (!pp.error && pp.data && (pp.data as any)?.phone) {
          const phone = (pp.data as any).phone as string;
          // Limpar formato do WhatsApp: remover @s.whatsapp.net
          const cleanPhone = phone.trim().replace(/@s\.whatsapp\.net$/i, '');
          
          console.log('[WhatsApp] ✅ Telefone encontrado em pre_patients:', {
            original: phone,
            cleaned: cleanPhone,
          });
          setPatientPhone(cleanPhone || null);
          return;
        }
        
        console.log('[WhatsApp] ⚠️ Nenhum telefone encontrado em ambas as tabelas');
        setPatientPhone(null);
      } catch (error) {
        console.error('[WhatsApp] ❌ Erro ao buscar telefone:', error);
        setPatientPhone(null);
      }
    };
    fetchPhone();
  }, [selectedSessionId]);

  const [summaryOpen, setSummaryOpen] = useState(false);
  const [assignDoctorOpen, setAssignDoctorOpen] = useState(false);
  const [messageText, setMessageText] = useState('');
  const [sending, setSending] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Estados para gravação de áudio
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [audioChunks, setAudioChunks] = useState<Blob[]>([]);
  const recordingTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Buscar médico atribuído ao paciente/pré-paciente da sessão selecionada
  const { data: assignedDoctor, refetch: refetchAssignedDoctor } = useQuery({
    queryKey: ['assigned_doctor', selectedSessionId],
    queryFn: async () => {
      if (!selectedSessionId) return null;
      
      // Buscar na tabela patient_doctors
      const { data, error } = await supabase
        .from('patient_doctors')
        .select(`
          doctor_id,
          is_primary,
          profiles!inner(id, name, specialization)
        `)
        .eq('patient_id', selectedSessionId)
        .eq('is_primary', true)
        .single();

      if (error) {
        console.log('Nenhum médico atribuído ainda');
        return null;
      }
      
      return data?.profiles ? {
        id: (data.profiles as any).id,
        name: (data.profiles as any).name,
        specialization: (data.profiles as any).specialization,
      } : null;
    },
    enabled: !!selectedSessionId,
  });

  // Converter arquivo para base64
  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          // Remover o prefixo "data:tipo/mime;base64,"
          const base64 = reader.result.split(',')[1];
          resolve(base64);
        } else {
          reject(new Error('Erro ao converter arquivo'));
        }
      };
      reader.onerror = (error) => reject(error);
    });
  };

  const handleSendMessage = async (funcao: 'text' | 'audio' | 'arquivo' = 'text', fileBase64?: string, fileName?: string) => {
    // 1. Validações básicas
    if (funcao === 'text' && !messageText.trim()) {
      toast.error('Digite uma mensagem antes de enviar');
      return;
    }

    if ((funcao === 'arquivo' || funcao === 'audio') && !fileBase64) {
      toast.error('Nenhum arquivo selecionado');
      return;
    }

    if (!selectedSessionId) {
      toast.error('Selecione uma conversa primeiro');
      return;
    }

    console.log('[WhatsApp] 📞 Verificando telefone:', {
      patientPhone,
      type: typeof patientPhone,
      trimmed: patientPhone?.trim(),
      length: patientPhone?.length,
    });

    if (!patientPhone || patientPhone.trim() === '') {
      console.error('[WhatsApp] ❌ Telefone inválido ou vazio');
      toast.error('Paciente não possui número de telefone cadastrado');
      return;
    }

    if (!user?.name) {
      toast.error('Usuário não identificado. Faça login novamente.');
      return;
    }

    // 2. Preparar dados
    const messageToSend = funcao === 'text' ? messageText.trim() : fileBase64 || '';
    // Garantir que o telefone está limpo (sem @s.whatsapp.net)
    const cleanPhone = patientPhone.replace(/@s\.whatsapp\.net$/i, '');
    
    console.log('📤 Enviando mensagem via WhatsApp:', {
      session_id: selectedSessionId,
      numero_paciente: cleanPhone,
      numero_original: patientPhone,
      funcao: funcao,
      texto: funcao === 'text' ? messageToSend : `[${funcao}] ${fileName || 'arquivo'}`,
      nome_login: user.name,
      ...(funcao !== 'text' && { arquivo_nome: fileName }),
    });

    // 3. Ativar loading
    setSending(true);

    try {
      // 4. Buscar URL base da API
      const apiBaseUrl = await getApiBaseUrl();
      
      // 5. Fazer requisição para o endpoint
      const payload: any = {
        session_id: selectedSessionId,
        numero_paciente: cleanPhone,
        nome_login: user.name,
        funcao: funcao,
      };

      // Estruturar payload de acordo com o tipo
      if (funcao === 'text') {
        // Para texto: enviar no campo "texto"
        payload.texto = messageToSend;
      } else {
        // Para arquivo/audio: texto vazio + base64 separado
        payload.texto = '';
        payload.base64 = messageToSend; // messageToSend contém o base64
        payload.arquivo_nome = fileName;

        // Se for arquivo, identificar se é imagem ou documento
        if (funcao === 'arquivo' && fileName) {
          const ext = fileName.split('.').pop()?.toLowerCase();
          const imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp', 'svg', 'ico'];
          payload.tipo_documento = imageExtensions.includes(ext || '') ? 'imagem' : 'arquivo';
        }
      }

      console.log('📦 Payload completo:', {
        ...payload,
        base64: payload.base64 ? `${payload.base64.substring(0, 50)}... (${payload.base64.length} chars)` : undefined
      });

      const response = await fetch(`${apiBaseUrl}/enviar-mensagem`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      // 6. Verificar resposta
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.error || `Erro ao enviar mensagem: ${response.status}`
        );
      }

      const result = await response.json();
      console.log('✅ Resposta do servidor:', result);

      // 7. Sucesso - limpar campo e mostrar feedback
      toast.success('Mensagem enviada com sucesso!');
      setMessageText('');

      // 8. Atualizar interface
      queryClient.invalidateQueries({ queryKey: ['medx_messages', selectedSessionId] });
      queryClient.invalidateQueries({ queryKey: ['medx_sessions'] });

    } catch (error) {
      console.error('❌ Erro ao enviar mensagem:', error);
      
      const errorMessage = error instanceof Error 
        ? error.message 
        : 'Erro ao enviar mensagem. Tente novamente.';
      
      toast.error(errorMessage);
    } finally {
      setSending(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Handler para anexar arquivo/imagem
  const handleAttachFile = () => {
    if (!selectedSessionId) {
      toast.error('Selecione uma conversa primeiro');
      return;
    }
    console.log('[WhatsApp] 📎 Botão de anexar arquivo clicado');
    fileInputRef.current?.click();
  };

  // Handler quando arquivo é selecionado
  const handleFileSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    console.log('[WhatsApp] 📎 Arquivo selecionado:', {
      name: file.name,
      type: file.type,
      size: `${(file.size / 1024).toFixed(2)} KB`,
    });

    // Validar tamanho (máximo 10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      toast.error('Arquivo muito grande. Tamanho máximo: 10MB');
      return;
    }

    try {
      setSending(true);
      toast.info('Convertendo arquivo...');

      // Converter para base64
      const base64 = await fileToBase64(file);
      
      console.log('[WhatsApp] ✅ Arquivo convertido para base64:', {
        tamanho_original: file.size,
        tamanho_base64: base64.length,
        nome: file.name,
      });

      // Enviar como arquivo
      await handleSendMessage('arquivo', base64, file.name);

    } catch (error) {
      console.error('[WhatsApp] ❌ Erro ao processar arquivo:', error);
      toast.error('Erro ao processar arquivo. Tente novamente.');
      setSending(false);
    } finally {
      // Limpar input para permitir selecionar o mesmo arquivo novamente
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // Converter Blob de áudio para base64
  const audioToBase64 = (blob: Blob): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(blob);
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          const base64 = reader.result.split(',')[1];
          resolve(base64);
        } else {
          reject(new Error('Erro ao converter áudio'));
        }
      };
      reader.onerror = (error) => reject(error);
    });
  };

  // Limpar timer ao desmontar componente
  useEffect(() => {
    return () => {
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
      }
    };
  }, []);

  // Handler para gravar áudio
  const handleRecordAudio = async () => {
    if (isRecording) {
      // Parar gravação
      console.log('[WhatsApp] 🛑 Parando gravação de áudio...');
      
      if (mediaRecorder && mediaRecorder.state !== 'inactive') {
        mediaRecorder.stop();
        
        // O evento 'ondataavailable' já coletou os chunks
        // O evento 'onstop' vai processar e enviar
      }
      
      // Parar timer
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
        recordingTimerRef.current = null;
      }
      
      setIsRecording(false);
      
    } else {
      // Iniciar gravação
      console.log('[WhatsApp] 🎤 Iniciando gravação de áudio...');
      
      try {
        // Solicitar permissão ao microfone
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        
        // Criar MediaRecorder
        const recorder = new MediaRecorder(stream, {
          mimeType: 'audio/webm',
        });
        
        const chunks: Blob[] = [];
        
        // Coletar chunks de áudio
        recorder.ondataavailable = (e) => {
          if (e.data.size > 0) {
            chunks.push(e.data);
          }
        };
        
        // Quando parar a gravação
        recorder.onstop = async () => {
          console.log('[WhatsApp] ✅ Gravação finalizada, processando...');
          
          // Parar o stream do microfone
          stream.getTracks().forEach((track) => track.stop());
          
          // Criar blob do áudio completo
          const audioBlob = new Blob(chunks, { type: 'audio/webm' });
          
          // Validar tamanho (máx 5MB)
          const maxSize = 5 * 1024 * 1024; // 5MB
          if (audioBlob.size > maxSize) {
            toast.error('Áudio muito grande! Máximo: 5MB');
            setRecordingTime(0);
            return;
          }
          
          try {
            setSending(true);
            toast.info('Convertendo áudio...');
            
            // Converter para base64
            const base64 = await audioToBase64(audioBlob);
            
            // Gerar nome do arquivo com timestamp
            const timestamp = Date.now();
            const fileName = `audio_${timestamp}.webm`;
            
            // Enviar
            await handleSendMessage('audio', base64, fileName);
            
            // Resetar estados
            setRecordingTime(0);
            
          } catch (error) {
            console.error('[WhatsApp] ❌ Erro ao processar áudio:', error);
            toast.error('Erro ao processar áudio');
          }
        };
        
        // Iniciar gravação
        recorder.start();
        setMediaRecorder(recorder);
        setIsRecording(true);
        setRecordingTime(0);
        
        // Iniciar timer
        recordingTimerRef.current = setInterval(() => {
          setRecordingTime((prev) => prev + 1);
        }, 1000);
        
        toast.success('🎤 Gravando áudio...');
        
      } catch (error) {
        console.error('[WhatsApp] ❌ Erro ao acessar microfone:', error);
        toast.error('Não foi possível acessar o microfone. Verifique as permissões.');
      }
    }
  };

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
      <div className="h-full overflow-hidden p-4">

        <Card className="h-full overflow-hidden">
          <div className="h-full min-h-0 grid grid-cols-[340px_1fr]">
            {/* Sidebar de conversas */}
            <div className="border-r flex flex-col min-h-0">
              <div className="px-3 pt-4 pb-3">
                <div className="flex gap-2 mb-3">
                  <button
                    className={`text-xs px-3 py-1.5 rounded-full ${tab === 'all' ? 'bg-accent' : 'hover:bg-accent/50'}`}
                    onClick={() => setTab('all')}
                  >
                    Todos
                  </button>
                  <button
                    className={`text-xs px-3 py-1.5 rounded-full ${tab === 'pre' ? 'bg-accent' : 'hover:bg-accent/50'}`}
                    onClick={() => setTab('pre')}
                  >
                    Pré Pacientes
                  </button>
                  <button
                    className={`text-xs px-3 py-1.5 rounded-full ${tab === 'crm' ? 'bg-accent' : 'hover:bg-accent/50'}`}
                    onClick={() => setTab('crm')}
                  >
                    Pacientes CRM
                  </button>
                </div>
                <Input
                  placeholder="Buscar por sessão ou mensagem…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              <ScrollArea className="flex-1 min-h-0">
                <div className="space-y-1 px-3 pb-4">
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
                        className={`block w-[98%] max-w-[325px] text-left px-2 py-2 rounded-xl transition-colors border-l-4 ${
                          s.kind === 'pre_patient' ? 'border-amber-400' : s.kind === 'patient' ? 'border-emerald-400' : 'border-muted'
                        } ${active ? 'bg-accent' : 'hover:bg-accent/50'}`}
                        style={{ boxSizing: 'border-box' }}
                      >
                        <div className="flex items-center gap-2">
                          <Avatar className={`h-8 w-8 shrink-0 ${s.kind === 'pre_patient' ? 'bg-amber-100' : 'bg-primary/10'}`}>
                            <AvatarFallback className={`${s.kind === 'pre_patient' ? 'text-amber-700' : 'text-primary'}`}>
                              {s.kind === 'pre_patient' ? (
                                <User className="w-3.5 h-3.5" />
                              ) : (
                                (s.displayName?.[0] ?? s.sessionId?.[0] ?? '').toUpperCase()
                              )}
                            </AvatarFallback>
                          </Avatar>
                          <div className="min-w-0 flex-1 overflow-hidden">
                            <div className="text-sm font-medium truncate">{s.kind === 'pre_patient' ? 'Pré Paciente' : (s.displayName ?? s.sessionId)}</div>
                            <div className={`text-[10px] font-medium ${s.kind === 'pre_patient' ? 'text-amber-700' : s.kind === 'patient' ? 'text-emerald-700' : 'text-slate-500'}`}>{s.kind === 'pre_patient' ? 'Pré Paciente' : s.kind === 'patient' ? 'Paciente' : 'Desconhecido'}</div>
                            <div className="text-xs text-white truncate">{s.lastMessagePreview}</div>
                          </div>
                          <div className="text-[11px] text-white shrink-0 ml-1">{s.totalMessages}</div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </ScrollArea>
            </div>

            {/* Painel de mensagens */}
            <div className="flex flex-col h-full min-h-0 p-4">
              <div className="px-4 py-3 -mx-4 border-b flex items-center gap-3">
                <Avatar className="h-9 w-9">
                  <AvatarFallback>{selectedSession ? (selectedSession.kind === 'pre_patient' ? 'PP' : ((selectedSession.displayName ?? selectedSession.sessionId)?.slice(0, 2).toUpperCase())) : (selectedSessionId?.slice(0, 2).toUpperCase() ?? '')}</AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <div className="text-sm font-semibold truncate">
                      {selectedSession ? (selectedSession.kind === 'pre_patient' ? 'Pré Paciente' : (selectedSession.displayName ?? selectedSession.sessionId)) : (selectedSessionId ?? 'Selecione uma conversa')}
                    </div>
                    {assignedDoctor && (
                      <div className="flex items-center gap-1 text-xs text-muted-foreground bg-accent/50 px-2 py-0.5 rounded-full whitespace-nowrap">
                        <Stethoscope className="h-3 w-3" />
                        <span className="truncate max-w-[120px]">{assignedDoctor.name}</span>
                      </div>
                    )}
                  </div>
                  <div className="text-xs text-muted-foreground flex items-center gap-2">
                    <span>{messages.length} mensagens</span>
                    {patientPhone && (
                      <span className="text-green-600 flex items-center gap-1">
                        • Tel: {patientPhone}
                      </span>
                    )}
                    {!patientPhone && selectedSessionId && (
                      <span className="text-amber-600 flex items-center gap-1">
                        • Sem telefone
                      </span>
                    )}
                  </div>
                </div>
                <TooltipProvider delayDuration={80} skipDelayDuration={200}>
                  <div className="ml-auto flex items-center gap-2">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setSummaryOpen(true)}
                          aria-label="Gerar resumo"
                          className="transition-transform duration-200 hover:scale-110 hover:text-primary"
                        >
                          <FileText className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent side="bottom">Gerar resumo</TooltipContent>
                    </Tooltip>
                    <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {}}
                        aria-label="Fazer follow up"
                        className="transition-transform duration-200 hover:scale-110 hover:text-primary"
                      >
                        <Bell className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent side="bottom">Fazer follow up</TooltipContent>
                  </Tooltip>
                    <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setAssignDoctorOpen(true)}
                        aria-label="Atribuir a médico"
                        className="transition-transform duration-200 hover:scale-110 hover:text-primary"
                      >
                        <Stethoscope className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent side="bottom">
                      {assignedDoctor ? 'Alterar médico' : 'Atribuir a médico'}
                    </TooltipContent>
                    </Tooltip>
                  </div>
                </TooltipProvider>
              </div>

              <ScrollArea className="flex-1 min-h-0 px-4 py-4 -mx-4">
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
                            {m.media ? (
                              <MediaPreview url={m.media} transcriptText={text} />
                            ) : (
                              <div>{text}</div>
                            )}
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

              <div className="px-4 py-3 -mx-4 border-t bg-background/50">
                {/* Input file oculto */}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.txt"
                  onChange={handleFileSelected}
                  style={{ display: 'none' }}
                />

                <div className="flex items-center gap-2">
                  {/* Botão de Anexar Arquivo/Imagem */}
                  <TooltipProvider delayDuration={200}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={handleAttachFile}
                          disabled={!selectedSessionId || sending}
                          className="shrink-0 hover:bg-accent"
                        >
                          <Paperclip className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent side="top">
                        <p>Anexar arquivo ou imagem</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>

                  {/* Input de Texto */}
                  <Input
                    placeholder="Digite sua mensagem..."
                    value={messageText}
                    onChange={(e) => setMessageText(e.target.value)}
                    onKeyPress={handleKeyPress}
                    disabled={!selectedSessionId || sending}
                    className="flex-1"
                  />

                  {/* Botão de Gravar Áudio */}
                  {isRecording ? (
                    <TooltipProvider delayDuration={200}>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="destructive"
                            onClick={handleRecordAudio}
                            disabled={sending}
                            className="shrink-0 gap-2 animate-pulse"
                          >
                            <Mic className="h-4 w-4" />
                            <span className="text-xs font-mono">{formatTime(recordingTime)}</span>
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent side="top">
                          <p>🔴 Clique para parar a gravação</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  ) : (
                    <TooltipProvider delayDuration={200}>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={handleRecordAudio}
                            disabled={!selectedSessionId || sending}
                            className="shrink-0 hover:bg-accent"
                          >
                            <Mic className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent side="top">
                          <p>Gravar mensagem de áudio</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  )}

                  {/* Botão de Enviar */}
                  <Button
                    onClick={() => handleSendMessage('text')}
                    disabled={!messageText.trim() || !selectedSessionId || sending}
                    size="icon"
                    className="shrink-0"
                  >
                    {sending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Send className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </Card>
      </div>
      <SummaryModal open={summaryOpen} onOpenChange={setSummaryOpen} sessionId={selectedSessionId} patientPhone={patientPhone} />
      {selectedSessionId && (
        <AssignDoctorModal
          open={assignDoctorOpen}
          onOpenChange={setAssignDoctorOpen}
          sessionId={selectedSessionId}
          patientId={selectedSessionId}
          isPrePatient={selectedSession?.kind === 'pre_patient'}
          currentPatientName={selectedSession?.displayName}
          onSuccess={() => {
            // Invalidar queries para atualizar a interface
            queryClient.invalidateQueries({ queryKey: ['assigned_doctor', selectedSessionId] });
            queryClient.invalidateQueries({ queryKey: ['patients_min'] });
            queryClient.invalidateQueries({ queryKey: ['pre_patients_min'] });
            queryClient.invalidateQueries({ queryKey: ['medx_sessions'] });
            refetchAssignedDoctor();
          }}
        />
      )}
    </DashboardLayout>
  );
}
