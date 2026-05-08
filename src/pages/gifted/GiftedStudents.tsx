import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, Edit2, Trash2, MoreVertical } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Label } from '@/components/ui/label';
import { useStudentStore } from '@/stores/studentStore';
import { useAuthStore } from '@/stores/authStore';
import { SKILL_AREAS } from '@/lib/constants';
import { PageTransition } from '@/components/layout/PageTransition';
import { cn } from '@/lib/utils';

export function GiftedStudents() {
  const { t } = useTranslation();
  const { students, addStudent, deleteStudent, fetchStudents } = useStudentStore();
  const [deleteStudentId, setDeleteStudentId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => { fetchStudents(); }, []);
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState({
    name: '', birth: '', grade: '', school: '', resp: '', respContact: '',
    areas: [] as string[], notes: '', identifiedBy: user?.name || '',
  });

  const filtered = students.filter((s) => {
    const matchSearch = s.name.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'all' || s.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const avgGrade = (s: typeof students[0]) => {
    if (s.gifted_grades.length === 0) return 0;
    return s.gifted_grades.reduce((a, g) => a + g.grade, 0) / s.gifted_grades.length;
  };

  const topSkill = (s: typeof students[0]) => {
    if (s.gifted_skills.length === 0) return '-';
    return s.gifted_skills.sort((a, b) => b.score - a.score)[0]?.area || '-';
  };

  const toggleArea = (area: string) => {
    setForm((p) => ({
      ...p,
      areas: p.areas.includes(area) ? p.areas.filter((a) => a !== area) : [...p.areas, area],
    }));
  };

  const handleAdd = () => {
    if (!form.name || !form.grade || !form.school) return;
    addStudent({
      name: form.name, birth_date: form.birth, grade: form.grade, school: form.school,
      status: 'identificado', responsible_name: form.resp, responsible_contact: form.respContact,
      primary_areas: form.areas, notes: form.notes, identified_at: new Date().toISOString().split('T')[0], identified_by: form.identifiedBy,
    });
    setModal(false);
    setForm({ name: '', birth: '', grade: '', school: '', resp: '', respContact: '', areas: [], notes: '', identifiedBy: user?.name || '' });
  };

  const statusBadge = (status: string) => {
    const map: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
      identificado: 'secondary', em_avaliacao: 'default', monitoramento: 'default', concluido: 'outline'
    };
    const labels: Record<string, string> = { identificado: 'Identificado', em_avaliacao: 'Em avaliação', monitoramento: 'Monitoramento', concluido: 'Concluído' };
    return <Badge variant={map[status] || 'secondary'}>{labels[status] || status}</Badge>;
  };

  return (
    <PageTransition>
      <div className="flex items-start justify-between gap-4 mb-6">
        <div>
          <h1 className="text-xl font-extrabold">{t('gifted.studentsTitle')}</h1>
          <p className="text-sm text-muted-foreground">{students.length} alunos no programa</p>
        </div>
        <Button size="sm" onClick={() => setModal(true)}><Plus size={14} className="mr-1" />{t('gifted.newStudent')}</Button>
      </div>

      <div className="flex flex-wrap gap-3 mb-5">
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Buscar aluno..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-8 h-9 w-64 text-sm" />
        </div>
        <div className="flex gap-1.5 flex-wrap">
          {(['all', 'identificado', 'em_avaliacao', 'monitoramento', 'concluido'] as const).map((f) => (
            <button key={f} onClick={() => setStatusFilter(f)}
              className={cn('px-3 py-1.5 rounded-full text-xs font-semibold border transition-all',
                statusFilter === f ? 'gift-bg gift-primary border-[#2563EB]' : 'bg-muted text-muted-foreground border-transparent hover:border-muted-foreground/30')}>
              {f === 'all' ? 'Todos' : f === 'identificado' ? 'Identificado' : f === 'em_avaliacao' ? 'Em avaliação' : f === 'monitoramento' ? 'Monitoramento' : 'Concluído'}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filtered.map((s) => (
          <div key={s.id} className="bg-card border border-border rounded-xl p-5 text-left transition-all hover:shadow-md hover:-translate-y-0.5 hover:border-blue-400/50 relative">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-11 h-11 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-sm font-bold flex-shrink-0 cursor-pointer" onClick={() => navigate(`/gifted/student/${s.id}`)}>
                {s.name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0 cursor-pointer" onClick={() => navigate(`/gifted/student/${s.id}`)}>
                <div className="font-bold text-sm truncate">{s.name}</div>
                <div className="text-xs text-muted-foreground">{s.grade} · {s.school}</div>
              </div>
              <div className="flex items-center gap-1">
                {statusBadge(s.status)}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-7 w-7 p-0 flex-shrink-0">
                      <MoreVertical size={13} />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => navigate(`/gifted/student/${s.id}`)}>
                      <Edit2 size={12} className="mr-2" /> Ver / Editar perfil
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => setDeleteStudentId(s.id)}>
                      <Trash2 size={12} className="mr-2" /> Excluir aluno
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
            <div className="flex flex-wrap gap-1 mb-3 cursor-pointer" onClick={() => navigate(`/gifted/student/${s.id}`)}>
              {s.primary_areas.map((a) => <span key={a} className="text-[10px] bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded font-semibold">{a}</span>)}
            </div>
            <div className="grid grid-cols-2 gap-2 text-center cursor-pointer" onClick={() => navigate(`/gifted/student/${s.id}`)}>
              <div className="bg-muted rounded-lg p-2">
                <span className="text-lg font-extrabold block">{avgGrade(s).toFixed(1)}</span>
                <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Média geral</span>
              </div>
              <div className="bg-muted rounded-lg p-2">
                <span className="text-sm font-bold block truncate">{topSkill(s)}</span>
                <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Top habilidade</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      <Dialog open={modal} onOpenChange={setModal}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{t('gifted.registerStudent')}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="space-y-2"><Label>{t('gifted.studentNameRequired')}</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2"><Label>Data de nascimento</Label><Input type="date" value={form.birth} onChange={(e) => setForm({ ...form, birth: e.target.value })} /></div>
              <div className="space-y-2"><Label>{t('gifted.gradeRequired')}</Label><Input value={form.grade} onChange={(e) => setForm({ ...form, grade: e.target.value })} placeholder="Ex: 8º Ano A" /></div>
            </div>
            <div className="space-y-2"><Label>{t('gifted.schoolRequired')}</Label><Input value={form.school} onChange={(e) => setForm({ ...form, school: e.target.value })} placeholder="Ex: SESI Ipiranga" /></div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2"><Label>{t('app.responsible')}</Label><Input value={form.resp} onChange={(e) => setForm({ ...form, resp: e.target.value })} /></div>
              <div className="space-y-2"><Label>Contato</Label><Input value={form.respContact} onChange={(e) => setForm({ ...form, respContact: e.target.value })} /></div>
            </div>
            <div className="space-y-2">
              <Label>Áreas de destaque</Label>
              <div className="flex flex-wrap gap-1.5">
                {SKILL_AREAS.map((a) => (
                  <button key={a} onClick={() => toggleArea(a)}
                    className={cn('px-2.5 py-1 rounded-full text-xs font-semibold border transition-all',
                      form.areas.includes(a) ? 'gift-bg gift-primary border-[#2563EB]' : 'bg-muted text-muted-foreground border-transparent hover:border-muted-foreground/30')}>
                    {a}
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-2"><Label>{t('app.notes')}</Label><textarea className="w-full min-h-[60px] px-3 py-2 rounded-md border border-input bg-background text-sm resize-y" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setModal(false)}>{t('app.cancel')}</Button>
            <Button onClick={handleAdd} style={{ background: 'var(--gift-primary)' }}>Cadastrar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {/* Delete Student Confirm */}
      <Dialog open={!!deleteStudentId} onOpenChange={o => { if (!o) setDeleteStudentId(null); }}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Excluir aluno?</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground py-2">
            {students.find(s => s.id === deleteStudentId)?.name} será removido permanentemente do programa.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteStudentId(null)}>Cancelar</Button>
            <Button variant="destructive" disabled={saving} onClick={async () => {
              if (!deleteStudentId) return;
              setSaving(true);
              await deleteStudent(deleteStudentId);
              setSaving(false);
              setDeleteStudentId(null);
            }}>
              {saving ? '...' : 'Excluir'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageTransition>
  );
}
