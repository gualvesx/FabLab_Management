import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, Link2, Wrench, MoreVertical, Edit2, Trash2 } from 'lucide-react';
// @ts-ignore unused import
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Label } from '@/components/ui/label';
import { useAuthStore } from '@/stores/authStore';
import { PageTransition } from '@/components/layout/PageTransition';
import { cn } from '@/lib/utils';
import { supabase } from '@/lib/supabase';
import type { Project } from '@/types';

const TYPES = ['Tinkercad', 'Fusion 360', 'Arduino', 'Scratch', 'GitHub', 'Outro'];
const COLORS: Record<string, string> = { 'Tinkercad': '#FF6B6B', 'Fusion 360': '#A78BFA', 'Arduino': '#4ECDC4', 'Scratch': '#FFB347', 'GitHub': '#888', 'Outro': '#AAA' };

export function FabProjects() {
  const { t } = useTranslation();
  const { user } = useAuthStore();
  const [projects, setProjects] = useState<Project[]>([]);

  useEffect(() => {
    supabase.from('projects').select('*').order('id', { ascending: false }).then(({ data }) => {
      if (data) setProjects(data as Project[]);
    });
  }, []);
  const [filter, setFilter] = useState('all');
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState({ title: '', desc: '', type: 'Tinkercad', link: '', author: user?.name || '', class: '', tags: '' });
  const [editProjectId, setEditProjectId] = useState<string | null>(null);
  const [deleteProjectId, setDeleteProjectId] = useState<string | null>(null);
  const isAdmin = user?.role === 'admin';

  const filtered = filter === 'all' ? projects : projects.filter((p) => p.type === filter);

  const EMPTY_FORM = { title: '', desc: '', type: 'Tinkercad', link: '', author: user?.name || '', class: '', tags: '' };
  const add = async () => {
    const tags = form.tags.split(',').map((t) => t.trim()).filter(Boolean);
    if (editProjectId) {
      await supabase.from('projects').update({ title: form.title, description: form.desc, type: form.type, link: form.link, author: form.author, class_name: form.class, tags }).eq('id', editProjectId);
      setProjects(p => p.map(proj => proj.id === editProjectId ? { ...proj, title: form.title, description: form.desc, type: form.type, link: form.link, author: form.author, class_name: form.class, tags } : proj));
      setEditProjectId(null);
    } else {
      const { data } = await supabase.from('projects').insert({ title: form.title, description: form.desc, type: form.type, link: form.link, author: form.author, class_name: form.class, tags }).select().single();
      if (data) setProjects((p) => [data as Project, ...p]);
    }
    setModal(false);
    setForm(EMPTY_FORM);
  };

  const del = async (id: string) => {
    await supabase.from('projects').delete().eq('id', id);
    setProjects((p) => p.filter((x) => x.id !== id));
  };

  return (
    <PageTransition>
      <div className="flex items-start justify-between gap-4 mb-6">
        <div>
          <h1 className="text-xl font-extrabold">{t('fablab.projectsTitle')}</h1>
          <p className="text-sm text-muted-foreground">{t('fablab.projectsSubtitle')}</p>
        </div>
        <Button size="sm" onClick={() => setModal(true)}><Plus size={14} className="mr-1" />{t('fablab.newProject')}</Button>
      </div>

      <div className="flex gap-2 flex-wrap mb-5">
        <button onClick={() => setFilter('all')} className={cn('px-3 py-1.5 rounded-full text-xs font-semibold border transition-all', filter === 'all' ? 'fab-bg fab-primary border-[#D42020]' : 'bg-muted text-muted-foreground border-transparent hover:border-muted-foreground/30')}>{t('app.all')}</button>
        {TYPES.map((t) => (
          <button key={t} onClick={() => setFilter(t)} className={cn('px-3 py-1.5 rounded-full text-xs font-semibold border transition-all', filter === t ? 'fab-bg fab-primary border-[#D42020]' : 'bg-muted text-muted-foreground border-transparent hover:border-muted-foreground/30')}>{t}</button>
        ))}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((p) => (
          <div key={p.id} className="bg-card border border-border rounded-xl overflow-hidden transition-all hover:shadow-md hover:-translate-y-0.5">
            <div className="h-[72px] flex items-center justify-center" style={{ background: COLORS[p.type] || '#888' }}>
              <Wrench size={28} className="text-white/70" />
            </div>
            <div className="p-4">
              <div className="flex items-start justify-between mb-1">
                <div className="font-bold text-sm">{p.title}</div>
                <span className="text-xs bg-muted px-2 py-0.5 rounded">{p.type}</span>
              </div>
              <div className="text-xs text-muted-foreground mb-3 leading-relaxed">{p.description}</div>
              <div className="flex flex-wrap gap-1 mb-3">
                {(p.tags || []).map((t) => <span key={t} className="text-[10px] bg-muted px-1.5 py-0.5 rounded">{t}</span>)}
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[11px] text-muted-foreground">{p.author}{p.class_name ? ' · ' + p.class_name : ''}</span>
                <div className="flex gap-1">
                  {p.link && <a href={p.link} target="_blank" rel="noreferrer" className="text-xs text-blue-600 hover:underline flex items-center gap-1"><Link2 size={12} />{t('app.open')}</a>}
                  {isAdmin && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-6 w-6 p-0"><MoreVertical size={12} /></Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => { setEditProjectId(p.id); setForm({ title: p.title, desc: p.description, type: p.type, link: p.link || '', author: p.author, class: p.class_name || '', tags: p.tags.join(', ') }); setModal(true); }}>
                          <Edit2 size={12} className="mr-2" /> Editar
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => setDeleteProjectId(p.id)}>
                          <Trash2 size={12} className="mr-2" /> Excluir
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <Dialog open={modal} onOpenChange={setModal}>
        <DialogContent>
          <DialogHeader><DialogTitle>{t('fablab.newProjectTitle')}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="space-y-2"><Label>{t('app.title')}</Label><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Ex: Suporte para notebook" /></div>
            <div className="space-y-2"><Label>{t('app.description')}</Label><textarea className="w-full min-h-[60px] px-3 py-2 rounded-md border border-input bg-background text-sm resize-y" value={form.desc} onChange={(e) => setForm({ ...form, desc: e.target.value })} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2"><Label>{t('fablab.projectType')}</Label>
                <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm">
                  {TYPES.map((t) => <option key={t}>{t}</option>)}
                </select>
              </div>
              <div className="space-y-2"><Label>{t('fablab.classAuthor')}</Label><Input value={form.class} onChange={(e) => setForm({ ...form, class: e.target.value })} /></div>
            </div>
            <div className="space-y-2"><Label>{t('fablab.projectLink')}</Label><Input type="url" value={form.link} onChange={(e) => setForm({ ...form, link: e.target.value })} placeholder="https://..." /></div>
            <div className="space-y-2"><Label>Tags</Label><Input value={form.tags} onChange={(e) => setForm({ ...form, tags: e.target.value })} placeholder="3D, Impressão, Design" /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setModal(false)}>{t('app.cancel')}</Button>
            <Button onClick={add} style={{ background: 'var(--fab-primary)' }}>{t('fablab.saveProject')}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <Dialog open={!!deleteProjectId} onOpenChange={o => { if (!o) setDeleteProjectId(null); }}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Excluir projeto?</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground py-2">Este projeto será removido permanentemente.</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteProjectId(null)}>Cancelar</Button>
            <Button variant="destructive" onClick={async () => { if (deleteProjectId) { await del(deleteProjectId); setDeleteProjectId(null); } }}>Excluir</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageTransition>
  );
}
