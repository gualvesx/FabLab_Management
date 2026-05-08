import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, Check, ExternalLink, Edit2, Trash2, MoreVertical } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Label } from '@/components/ui/label';
import { useScheduleStore } from '@/stores/scheduleStore';
import { useAuthStore } from '@/stores/authStore';
import { PageTransition } from '@/components/layout/PageTransition';
import { cn } from '@/lib/utils';

export function FabSchedule() {
  const { t } = useTranslation();
  const { schedules, addSchedule, updateSchedule, deleteSchedule, fetchSchedules } = useScheduleStore();

  useEffect(() => { fetchSchedules(); }, []);
  const { user } = useAuthStore();
  const [view, setView] = useState<'list' | 'cal' | 'bookings'>('list');
  const [modal, setModal] = useState(false);
  const [concludeId, setConcludeId] = useState<string | null>(null);
  const [notes, setNotes] = useState('');
  const [editSchedule, setEditSchedule] = useState<string | null>(null);
  const [deleteScheduleId, setDeleteScheduleId] = useState<string | null>(null);

  const [form, setForm] = useState({ title: '', date: '', start: '09:00', end: '11:00', resp: user?.name || '', class: '', notes: '' });
  const isAdmin = user?.role === 'admin';
  const isProf = user?.role === 'professor';
  const canEdit = isAdmin || isProf;

  const statusBadge = (s: string) => {
    const map: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
      confirmado: 'default', concluido: 'default', pendente: 'secondary', cancelado: 'destructive', remarcado: 'secondary'
    };
    return <Badge variant={map[s] || 'secondary'}>{s}</Badge>;
  };

  const EMPTY_FORM = { title: '', date: '', start: '09:00', end: '11:00', resp: user?.name || '', class: '', notes: '' };
  const handleAdd = () => {
    if (!form.title || !form.date) return;
    if (editSchedule) {
      updateSchedule(editSchedule, { title: form.title, date: form.date, start_time: form.start, end_time: form.end, responsible: form.resp, class_name: form.class, notes: form.notes });
      setEditSchedule(null);
    } else {
      addSchedule({ title: form.title, date: form.date, start_time: form.start, end_time: form.end, responsible: form.resp, class_name: form.class, notes: form.notes, status: 'pendente', schedule_materials: [] });
    }
    setModal(false);
    setForm(EMPTY_FORM);
  };

  const handleConclude = () => {
    if (!concludeId) return;
    updateSchedule(concludeId, { status: 'concluido' });
    setConcludeId(null);
    setNotes('');
  };

  // Calendar
  const now = new Date();
  const year = now.getFullYear(), month = now.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const DAYS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
  const monthName = now.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });

  return (
    <PageTransition>
      <div className="flex items-start justify-between gap-4 mb-6 flex-wrap">
        <div>
          <h1 className="text-xl font-extrabold">{t('fablab.scheduleTitle')}</h1>
          <p className="text-sm text-muted-foreground">Agenda do FabLab - {monthName}</p>
        </div>
        {canEdit && <Button size="sm" onClick={() => setModal(true)}><Plus size={14} className="mr-1" />{t('fablab.newSchedule')}</Button>}
      </div>

      <div className="flex gap-0 border-b border-border mb-4">
        {(['list', 'cal', 'bookings'] as const).map((v) => (
          <button key={v} onClick={() => setView(v)}
            className={cn('px-4 py-2.5 text-sm font-semibold border-b-2 -mb-[2px] transition-colors',
              view === v ? 'border-[#D42020] text-[#D42020]' : 'border-transparent text-muted-foreground hover:text-foreground')}>
            {v === 'list' ? 'Lista' : v === 'cal' ? 'Calendário' : 'Microsoft Bookings'}
          </button>
        ))}
      </div>

      {view === 'list' && (
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="bg-muted/50 text-left">
                <th className="px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">{t('fablab.activity')}</th>
                <th className="px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">{t('app.date')}</th>
                <th className="px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">{t('fablab.schedule_time')}</th>
                <th className="px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">{t('fablab.class_group')}</th>
                <th className="px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">{t('app.status')}</th>
                <th className="px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">{t('app.actions')}</th>
              </tr></thead>
              <tbody className="divide-y divide-border">
                {schedules.map((s) => (
                  <tr key={s.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3 font-semibold">{s.title}</td>
                    <td className="px-4 py-3">{s.date}</td>
                    <td className="px-4 py-3">{s.start_time} - {s.end_time}</td>
                    <td className="px-4 py-3">{s.class_name}</td>
                    <td className="px-4 py-3">{statusBadge(s.status)}</td>
                    <td className="px-4 py-3">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-7 w-7 p-0"><MoreVertical size={13} /></Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {canEdit && s.status !== 'concluido' && s.status !== 'cancelado' && (
                            <DropdownMenuItem onClick={() => {
                              setEditSchedule(s.id);
                              setForm({ title: s.title, date: s.date, start: s.start_time, end: s.end_time, resp: s.responsible, class: s.class_name, notes: s.notes || '' });
                              setModal(true);
                            }}>
                              <Edit2 size={12} className="mr-2" /> Editar
                            </DropdownMenuItem>
                          )}
                          {s.status !== 'concluido' && s.status !== 'cancelado' && canEdit && (
                            <DropdownMenuItem onClick={() => setConcludeId(s.id)}>
                              <Check size={12} className="mr-2" /> Concluir
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuSeparator />
                          {isAdmin && (
                            <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => setDeleteScheduleId(s.id)}>
                              <Trash2 size={12} className="mr-2" /> Excluir
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {view === 'cal' && (
        <div className="bg-card border border-border rounded-xl p-5">
          <div className="text-center font-extrabold text-base mb-4 capitalize">{monthName}</div>
          <div className="grid grid-cols-7 gap-1">
            {DAYS.map((d) => <div key={d} className="text-center text-[10px] font-bold uppercase tracking-wider text-muted-foreground py-2">{d}</div>)}
            {Array.from({ length: firstDay }, (_, i) => <div key={`e${i}`} className="min-h-[66px] rounded-lg border border-border/30 opacity-30" />)}
            {Array.from({ length: daysInMonth }, (_, i) => {
              const day = i + 1;
              const evs = schedules.filter((s) => { const d = new Date(s.date); return d.getDate() === day && d.getMonth() === month; });
              return (
                <div key={day} className={cn('min-h-[66px] rounded-lg border p-1.5 transition-all cursor-pointer hover:border-[#D42020] hover:fab-bg',
                  evs.length ? 'border-red-200 bg-red-50/50' : 'border-border bg-card',
                  day === now.getDate() && 'border-[#D42020] border-2')}>
                  <div className="text-xs font-semibold">{day}</div>
                  {evs.map((e) => <span key={e.id} className="block text-[10px] bg-[#D42020] text-white rounded px-1 py-0.5 mt-0.5 truncate">{e.title}</span>)}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {view === 'bookings' && (
        <div>
          <div className="p-3 rounded-lg bg-blue-50 text-blue-700 text-sm mb-4">
            <strong>{t('fablab.bookings')}</strong> - Agendamentos realizados aqui são gerenciados pelo Microsoft 365.
          </div>
          <a href="https://outlook.office.com/book/" target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#2563EB] text-white rounded-lg text-sm font-bold hover:bg-blue-700 transition-colors mb-4">
            <ExternalLink size={16} /> Abrir Bookings em nova aba
          </a>
        </div>
      )}

      {/* Add Modal */}
      <Dialog open={modal} onOpenChange={setModal}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{t('fablab.newScheduleTitle')}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="space-y-2"><Label>{t('app.title')}</Label><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Ex: Aula de Impressão 3D" /></div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2"><Label>{t('app.date')}</Label><Input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} /></div>
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-2"><Label>Início</Label><Input type="time" value={form.start} onChange={(e) => setForm({ ...form, start: e.target.value })} /></div>
                <div className="space-y-2"><Label>Fim</Label><Input type="time" value={form.end} onChange={(e) => setForm({ ...form, end: e.target.value })} /></div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2"><Label>{t('fablab.class_group')}</Label><Input value={form.class} onChange={(e) => setForm({ ...form, class: e.target.value })} placeholder="Ex: Turma A - EM1" /></div>
              <div className="space-y-2"><Label>{t('app.responsible')}</Label><Input value={form.resp} onChange={(e) => setForm({ ...form, resp: e.target.value })} /></div>
            </div>
            <div className="space-y-2"><Label>{t('app.notes')}</Label><textarea className="w-full min-h-[80px] px-3 py-2 rounded-md border border-input bg-background text-sm resize-y" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setModal(false)}>{t('app.cancel')}</Button>
            <Button onClick={handleAdd} style={{ background: 'var(--fab-primary)' }}>{t('fablab.newSchedule')}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Conclude Modal */}
      <Dialog open={!!concludeId} onOpenChange={() => setConcludeId(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Concluir Agendamento</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="space-y-2"><Label>{t('fablab.conclusionNotes')}</Label>
              <textarea className="w-full min-h-[80px] px-3 py-2 rounded-md border border-input bg-background text-sm resize-y" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Ex: Atividade realizada com 18 alunos..." />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConcludeId(null)}>{t('app.cancel')}</Button>
            <Button onClick={handleConclude} style={{ background: 'var(--fab-primary)' }}><Check size={14} className="mr-1" /> Confirmar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {/* Delete Confirm */}
      <Dialog open={!!deleteScheduleId} onOpenChange={o => { if (!o) setDeleteScheduleId(null); }}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Excluir agendamento?</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground py-2">Este agendamento será removido permanentemente.</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteScheduleId(null)}>Cancelar</Button>
            <Button variant="destructive" onClick={() => { if (deleteScheduleId) { deleteSchedule(deleteScheduleId); setDeleteScheduleId(null); } }}>Excluir</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageTransition>
  );
}
