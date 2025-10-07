import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { MagicBentoCard } from '@/components/bento/MagicBento';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useAvailableDoctorsNow } from '@/hooks/useAvailableDoctorsNow';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { usePatientData } from '@/hooks/usePatientData';
import { MedicalRecordsList } from '@/components/patients/MedicalRecordsList';

export default function Teleconsulta() {
  const { availableDoctors, loading: loadingDoctors, error: errorDoctors } = useAvailableDoctorsNow();
  const [upcoming, setUpcoming] = useState<any[]>([]);
  const [loadingUpcoming, setLoadingUpcoming] = useState<boolean>(false);
  const [errorUpcoming, setErrorUpcoming] = useState<string | null>(null);

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [embedUrl, setEmbedUrl] = useState<string | null>(null);
  const [activePatientId, setActivePatientId] = useState<string | null>(null);
  const [pendingInvite, setPendingInvite] = useState<null | {
    roomName: string;
    password: string;
    patientName: string;
    patientPhone?: string | null;
    patientId: string;
    doctorName: string;
    urlPatient: string;
    urlDoctor: string;
    teleconsultationId: string;
  }>(null);

  const { patient, medicalRecords, loading: loadingPatientData } = usePatientData(activePatientId);

  const normalizeName = (name: string) => {
    const cleaned = (name || '').toLowerCase().normalize('NFD').replace(/\p{Diacritic}/gu, '');
    const parts = cleaned.split(/\s+/).filter(Boolean);
    const first = parts[0] || '';
    const last = parts.length > 1 ? parts[parts.length - 1] : '';
    const joined = `${first}${last}`;
    return joined.replace(/[^a-z]/g, '');
  };

  const generateId = () => {
    // 5 dígitos numéricos
    let out = '';
    for (let i = 0; i < 5; i++) out += Math.floor(Math.random() * 10).toString();
    return out;
  };

  const generatePassword = () => {
    const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let out = '';
    for (let i = 0; i < 12; i++) out += alphabet[Math.floor(Math.random() * alphabet.length)];
    return out;
  };

  useEffect(() => {
    const fetchUpcoming = async () => {
      setLoadingUpcoming(true);
      setErrorUpcoming(null);
      try {
        const nowIso = new Date().toISOString();
        const { data, error } = await supabase
          .from('teleconsultations')
          .select(
            `id, appointment_id, start_time, end_time, status, meeting_url,
             appointments!inner(id, scheduled_at, patient_id, doctor_id,
               patients:patient_id(name, phone),
               doctor_profile:doctor_id(name)
             )`
          )
          .eq('status', 'scheduled')
          .gte('appointments.scheduled_at', nowIso)
          .order('scheduled_at', { ascending: true, foreignTable: 'appointments' })
          .limit(8);

        if (error) throw error;
        setUpcoming(data || []);
      } catch (e: any) {
        setErrorUpcoming(e?.message ?? 'Erro ao carregar próximas teleconsultas');
      } finally {
        setLoadingUpcoming(false);
      }
    };

    fetchUpcoming();
  }, []);

  return (
    <DashboardLayout requiredRoles={['owner', 'doctor']}>
      <div className="p-8 space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Teleconsulta</h1>
          <p className="text-muted-foreground mt-1">Atendimento remoto por vídeo</p>
        </div>

        {/* Médicos disponíveis agora */}
        <MagicBentoCard contentClassName="p-6">
          <div className="mb-4">
            <h2 className="text-xl font-semibold">Médicos disponíveis agora</h2>
            <p className="text-sm text-muted-foreground">Com base na tabela de horários</p>
          </div>
          {loadingDoctors ? (
            <p className="text-muted-foreground">Carregando médicos…</p>
          ) : errorDoctors ? (
            <p className="text-destructive">Erro: {errorDoctors}</p>
          ) : availableDoctors.length === 0 ? (
            <p className="text-muted-foreground">Nenhum médico disponível neste momento.</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {availableDoctors.map(({ doctorId, profile }) => {
                const displayName = profile.name || 'Médico(a)';
                const initials = displayName
                  .split(' ')
                  .filter(Boolean)
                  .map((s) => s[0])
                  .slice(0, 2)
                  .join('')
                  .toUpperCase();
                return (
                  <Card key={doctorId} className="hover:shadow-md transition-shadow">
                    <CardHeader className="flex-row items-center gap-4">
                      <Avatar>
                        <AvatarImage src={undefined} alt={displayName} />
                        <AvatarFallback>{initials}</AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <CardTitle className="truncate text-lg">{displayName}</CardTitle>
                        <CardDescription className="truncate">{profile.specialization || 'Clínico(a)'}</CardDescription>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <Button size="sm" className="w-full" variant="secondary">
                        Iniciar teleconsulta
                      </Button>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </MagicBentoCard>

        {/* Próximas TeleConsultas */}
        <MagicBentoCard contentClassName="p-6">
          <div className="mb-4">
            <h2 className="text-xl font-semibold">Próximas TeleConsultas</h2>
            <p className="text-sm text-muted-foreground">Baseadas em agendamentos futuros</p>
          </div>
          {loadingUpcoming ? (
            <p className="text-muted-foreground">Carregando…</p>
          ) : errorUpcoming ? (
            <p className="text-destructive">Erro: {errorUpcoming}</p>
          ) : upcoming.length === 0 ? (
            <p className="text-muted-foreground">Nenhuma teleconsulta futura.</p>
          ) : (
            <div className="space-y-3">
              {upcoming.map((t) => {
                const appt = (t as any).appointments;
                const when = appt?.scheduled_at ? new Date(appt.scheduled_at) : (t.start_time ? new Date(t.start_time) : null);
                const patientName = appt?.patients?.name || 'Paciente';
                const patientPhone = appt?.patients?.phone || null;
                const doctorName = appt?.doctor_profile?.name || 'Médico(a)';
                const handleStart = () => {
                  const id5 = generateId();
                  const pass = generatePassword();
                  const normalized = normalizeName(patientName);
                  const room = `${normalized}${id5}`;
                  const urlPatient = `https://vdo.ninja/?room=${room}&password=${pass}&webcam&autostart`;
                  const urlDoctor = `https://vdo.ninja/?room=${room}&password=${pass}&webcam&autostart&embed`;
                  setPendingInvite({ roomName: room, password: pass, patientName, patientPhone, patientId: appt?.patient_id, doctorName, urlPatient, urlDoctor, teleconsultationId: t.id });
                  setConfirmOpen(true);
                };
                return (
                  <div key={t.id} className="flex items-center justify-between rounded-md border p-3">
                    <div className="min-w-0">
                      <div className="font-medium truncate">{patientName}</div>
                      <div className="text-sm text-muted-foreground truncate">Com {doctorName}</div>
                    </div>
                    <div className="text-right ml-4">
                      <div className="text-sm font-medium">{when ? when.toLocaleDateString() : '-'}</div>
                      <div className="text-xs text-muted-foreground">{when ? when.toLocaleTimeString() : '-'}</div>
                      <div className="mt-2">
                        <Button size="sm" onClick={handleStart}>Iniciar teleconsulta</Button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </MagicBentoCard>

        <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
          <DialogContent className="max-w-sm">
            <DialogFooter>
              <Button variant="secondary" onClick={async () => {
                try {
                  if (pendingInvite) {
                    await supabase
                      .from('teleconsultations')
                      .update({ meeting_url: pendingInvite.urlPatient })
                      .eq('id', pendingInvite.teleconsultationId);
                    setEmbedUrl(pendingInvite.urlDoctor);
                    setActivePatientId(pendingInvite.patientId || null);
                  }
                } finally {
                  setConfirmOpen(false);
                }
              }}>Não enviar, apenas abrir</Button>
              <Button onClick={async () => {
                try {
                  if (pendingInvite) {
                    await supabase
                      .from('teleconsultations')
                      .update({ meeting_url: pendingInvite.urlPatient })
                      .eq('id', pendingInvite.teleconsultationId);
                    await fetch('https://webhook.n8nlabz.com.br/webhook/enviar-link', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({
                        paciente_nome: pendingInvite.patientName,
                        paciente_telefone: pendingInvite.patientPhone,
                        url_participacao: pendingInvite.urlPatient,
                        medico_nome: pendingInvite.doctorName,
                      }),
                    });
                    setEmbedUrl(pendingInvite.urlDoctor);
                    setActivePatientId(pendingInvite.patientId || null);
                  }
                } finally {
                  setConfirmOpen(false);
                }
              }}>Sim, enviar e abrir</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {embedUrl && (
          <MagicBentoCard contentClassName="p-3">
            <div className="flex items-center justify-between mb-3 px-2">
              <h2 className="text-xl font-semibold">Teleconsulta em andamento</h2>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => {
                  setEmbedUrl(null);
                  setActivePatientId(null);
                }}
              >Encerrar</Button>
            </div>
            <div className="grid grid-cols-12 gap-4">
              <div className="col-span-12 xl:col-span-8">
                <div className="w-full rounded-md overflow-hidden border">
                  <iframe
                    src={embedUrl}
                    title="Teleconsulta"
                    className="w-full h-[70vh] bg-black"
                    allow="camera; microphone; fullscreen; display-capture; autoplay"
                  />
                </div>
              </div>
              <div className="col-span-12 xl:col-span-4">
                <Card className="h-[70vh] overflow-hidden">
                  <CardHeader className="py-4">
                    <CardTitle className="text-lg truncate">{patient?.name || 'Paciente'}</CardTitle>
                    <CardDescription>Prontuário</CardDescription>
                  </CardHeader>
                  <CardContent className="h-[calc(70vh-80px)] overflow-y-auto">
                    {loadingPatientData ? (
                      <p className="text-muted-foreground">Carregando dados…</p>
                    ) : (
                      <MedicalRecordsList records={medicalRecords} />
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          </MagicBentoCard>
        )}
      </div>
    </DashboardLayout>
  );
}
