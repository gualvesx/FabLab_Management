import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, ArrowUp, Check, Edit2, Trash2, MoreVertical } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useAuthStore } from '@/stores/authStore';
import { PageTransition } from '@/components/layout/PageTransition';
import { supabase } from '@/lib/supabase';
import type { Suggestion } from '@/types';

const EMPTY = { title: '', desc: '', tags: '' };

export function FabSuggestions() {
  const { t } = useTranslation();
  const { user } = useAuthStore();
  const [items, setItems] = useState<Suggestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [editItem, setEditItem] = useState<Suggestion | null>(null);
  const [deleteItem, setDeleteItem] = useState<Suggestion | null>(null);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const isAdmin = user?.role === 'admin';
  const canAdd = user?.role !== 'funcionario';

  useEffect(() => { fetchItems(); }, []);

  const fetchItems = async () => {
    setLoading(true);
    const { data } = await supabase.from('suggestions').select('*').order('votes', { ascending: false });
    if (data) setItems(data as Suggestion[]);
    setLoading(false);
  };

  const openAdd = () => { setEditItem(null); setForm(EMPTY); setModal(true); };
  const openEdit = (item: Suggestion) => {
    setEditItem(item);
    setForm({ title: item.title, desc: item.description, tags: item.tags.join(', ') });
    setModal(true);
  };
  const closeModal = () => { setModal(false); setEditItem(null); setForm(EMPTY); };

  const handleSave = async () => {
    if (!form.title) return;
    setSaving(true);
    const tags = form.tags.split(',').map(t => t.trim()).filter(Boolean);
    if (editItem) {
      await supabase.from('suggestions').update({ title: form.title, description: form.desc, tags }).eq('id', editItem.id);
      setItems(p => p.map(i => i.id === editItem.id ? { ...i, title: form.title, description: form.desc, tags } : i));
    } else {
      const payload = { title: form.title, description: form.desc, tags, author: user?.name || '', votes: 0, status: 'open' };
      const { data } = await supabase.from('suggestions').insert(payload).select().single();
      if (data) setItems(p => [data as Suggestion, ...p]);
    }
    setSaving(false);
    closeModal();
  };

  const vote = async (id: string) => {
    const item = items.find(i => i.id === id);
    if (!item) return;
    const newVotes = item.votes + 1;
    await supabase.from('suggestions').update({ votes: newVotes }).eq('id', id);
    setItems(p => p.map(i => i.id === id ? { ...i, votes: newVotes } : i));
  };

  const approve = async (id: string) => {
    await supabase.from('suggestions').update({ status: 'approved' }).eq('id', id);
    setItems(p => p.map(i => i.id === id ? { ...i, status: 'approved' as const } : i));
  };

  const handleDelete = async () => {
    if (!deleteItem) return;
    setSaving(true);
    await supabase.from('suggestions').delete().eq('id', deleteItem.id);
    setItems(p => p.filter(i => i.id !== deleteItem.id));
    setSaving(false);
    setDeleteItem(null);
  };

  return (
    <PageTransition>
      <div className="flex items-start justify-between gap-4 mb-6">
        <div>
          <h1 className="text-xl font-extrabold">Sugestões de Projetos</h1>
          <p className="text-sm text-muted-foreground">Proponha e vote nas melhores ideias para projetos no FabLab</p>
        </div>
        {canAdd && (
          <Button size="sm" onClick={openAdd} style={{ background: 'var(--fab-primary)' }}>
            <Plus size={14} className="mr-1" /> Nova sugestão
          </Button>
        )}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20 gap-2 text-muted-foreground">
          <div className="w-5 h-5 border-2 border-border border-t-[#D42020] rounded-full animate-spin" />
          <span className="text-sm">{t('app.loading')}</span>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {items.map(item => (
            <div key={item.id} className="bg-card border border-border rounded-xl p-4 flex flex-col gap-3 hover:border-primary/30 transition-colors">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    {item.status === 'approved' && (
                      <Badge variant="default" className="text-[10px]">Aprovada</Badge>
                    )}
                    {item.tags.slice(0, 2).map(tag => (
                      <Badge key={tag} variant="secondary" className="text-[10px]">{tag}</Badge>
                    ))}
                  </div>
                  <h3 className="font-semibold text-sm leading-snug">{item.title}</h3>
                  {item.description && (
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{item.description}</p>
                  )}
                </div>
                {(isAdmin || item.author === user?.name) && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-7 w-7 p-0 flex-shrink-0">
                        <MoreVertical size={13} />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => openEdit(item)}>
                        <Edit2 size={12} className="mr-2" /> {t('app.edit')}
                      </DropdownMenuItem>
                      {isAdmin && item.status !== 'approved' && (
                        <DropdownMenuItem onClick={() => approve(item.id)}>
                          <Check size={12} className="mr-2" /> Aprovar
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuSeparator />
                      <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => setDeleteItem(item)}>
                        <Trash2 size={12} className="mr-2" /> {t('app.delete')}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </div>

              <div className="flex items-center justify-between mt-auto pt-2 border-t border-border/50">
                <span className="text-xs text-muted-foreground">{item.author}</span>
                <button
                  onClick={() => vote(item.id)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border border-border hover:bg-muted transition-colors"
                >
                  <ArrowUp size={12} /> {item.votes}
                </button>
              </div>
            </div>
          ))}
          {items.length === 0 && (
            <div className="col-span-full text-center py-16 text-muted-foreground">
              Nenhuma sugestão ainda. Seja o primeiro a propor um projeto!
            </div>
          )}
        </div>
      )}

      {/* Add / Edit */}
      <Dialog open={modal} onOpenChange={o => { if (!o) closeModal(); }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editItem ? 'Editar sugestão' : 'Nova Sugestão de Projeto'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-1">
              <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{t('app.title')} *</Label>
              <Input value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
                placeholder="Ex: Braço robótico com Arduino" className="h-10" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{t('app.description')}</Label>
              <textarea value={form.desc} onChange={e => setForm(p => ({ ...p, desc: e.target.value }))}
                placeholder="Descreva a ideia do projeto..." rows={3}
                className="w-full px-3 py-2 rounded-md border border-input bg-background text-sm resize-none outline-none focus:ring-1 focus:ring-ring" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{t('app.tags')} (vírgula)</Label>
              <Input value={form.tags} onChange={e => setForm(p => ({ ...p, tags: e.target.value }))}
                placeholder="Arduino, Robótica, Impressão 3D" className="h-10" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={closeModal}>{t('app.cancel')}</Button>
            <Button onClick={handleSave} disabled={saving} style={{ background: 'var(--fab-primary)' }}>
              {saving ? '...' : t('app.save')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirm */}
      <Dialog open={!!deleteItem} onOpenChange={o => { if (!o) setDeleteItem(null); }}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Excluir sugestão?</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground py-2">
            "<strong>{deleteItem?.title}</strong>" será removida permanentemente.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteItem(null)}>{t('app.cancel')}</Button>
            <Button variant="destructive" onClick={handleDelete} disabled={saving}>
              {saving ? '...' : t('app.delete')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageTransition>
  );
}
