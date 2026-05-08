import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, Edit2, Trash2, MoreVertical, Shield, AlertCircle, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { PageTransition } from '@/components/layout/PageTransition';
import { ROLE_LABELS, ALL_ROUTES, CLASS_COLORS } from '@/lib/constants';
import { supabase } from '@/lib/supabase';
import { useClassStore } from '@/stores/classStore';
import type { User, UserClass, RoutePermission } from '@/types';

const EMPTY_USER = { name: '', email: '', role: 'professor', unit: 'FabLab SP', class_id: '' };

// ─── Permission Editor ──────────────────────────────────────────
function PermissionEditor({ perms, onChange }: {
  perms: RoutePermission[];
  onChange: (p: RoutePermission[]) => void;
}) {
  const modules = ['fablab', 'gifted', 'student'] as const;
  const moduleLabels = { fablab: 'FabLab', gifted: 'Altas Habilidades', student: 'Área do Aluno' };

  const toggle = (route: any) => { // Mudamos de string para any
    onChange(perms.map(p => p.route === route ? { ...p, allowed: !p.allowed } : p));
  };

  const toggleAll = (mod: string, val: boolean) => {
    const routes = ALL_ROUTES.filter(r => r.module === mod).map(r => r.route);
  onChange(perms.map(p => (routes as any).includes(p.route) ? { ...p, allowed: val } : p));
  };

  return (
    <div className="space-y-4">
      {modules.map(mod => {
        const modRoutes = ALL_ROUTES.filter(r => r.module === mod);
        const modPerms = perms.filter(p => modRoutes.some(r => r.route === p.route));
        const allOn = modPerms.every(p => p.allowed);
        const allOff = modPerms.every(p => !p.allowed);
        return (
          <div key={mod} className="border border-border rounded-xl overflow-hidden">
            <div className="flex items-center justify-between px-4 py-2.5 bg-muted/40">
              <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">{moduleLabels[mod]}</span>
              <div className="flex gap-2">
                <button onClick={() => toggleAll(mod, true)} className={`text-[10px] font-semibold px-2 py-1 rounded transition-colors ${allOn ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80 text-muted-foreground'}`}>Todas</button>
                <button onClick={() => toggleAll(mod, false)} className={`text-[10px] font-semibold px-2 py-1 rounded transition-colors ${allOff ? 'bg-destructive text-destructive-foreground' : 'bg-muted hover:bg-muted/80 text-muted-foreground'}`}>Nenhuma</button>
              </div>
            </div>
            <div className="divide-y divide-border/50">
              {modPerms.map(p => (
                <label key={p.route} className="flex items-center justify-between px-4 py-2.5 cursor-pointer hover:bg-muted/20 transition-colors">
                  <span className="text-sm">{p.label.split(' · ')[1] || p.label}</span>
                  <div
                    onClick={() => toggle(p.route)}
                    className={`relative w-9 h-5 rounded-full transition-colors flex-shrink-0 ${p.allowed ? 'bg-primary' : 'bg-muted-foreground/30'}`}
                  >
                    <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${p.allowed ? 'translate-x-4' : 'translate-x-0.5'}`} />
                  </div>
                </label>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── Class Card ─────────────────────────────────────────────────
function ClassCard({ cls, onEdit, onDelete }: {
  cls: UserClass;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const allowed = cls.permissions.filter(p => p.allowed).length;
  const total = cls.permissions.length;
  return (
    <div className="bg-card border border-border rounded-xl p-4 flex flex-col gap-3 hover:border-primary/30 transition-colors">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: cls.color + '20' }}>
            <Shield size={15} style={{ color: cls.color }} />
          </div>
          <div>
            <div className="font-semibold text-sm">{cls.name}</div>
            <div className="text-xs text-muted-foreground">{ROLE_LABELS[cls.base_role] || cls.base_role}</div>
          </div>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="h-7 w-7 p-0"><MoreVertical size={13} /></Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={onEdit}><Edit2 size={12} className="mr-2" />Editar</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={onDelete}>
              <Trash2 size={12} className="mr-2" />Excluir
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <div className="flex items-center gap-2">
        <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
          <div className="h-full rounded-full transition-all" style={{ width: `${(allowed / total) * 100}%`, background: cls.color }} />
        </div>
        <span className="text-[10px] text-muted-foreground font-medium flex-shrink-0">{allowed}/{total} abas</span>
      </div>
      <div className="flex flex-wrap gap-1">
        {cls.permissions.filter(p => p.allowed).slice(0, 5).map(p => (
          <span key={p.route} className="text-[9px] font-medium px-1.5 py-0.5 rounded" style={{ background: cls.color + '15', color: cls.color }}>
            {p.label.split(' · ')[1] || p.label}
          </span>
        ))}
        {allowed > 5 && <span className="text-[9px] text-muted-foreground px-1 py-0.5">+{allowed - 5}</span>}
      </div>
    </div>
  );
}

// ─── Main ───────────────────────────────────────────────────────
export function FabUsers() {
  const { t } = useTranslation();
  const { classes, fetchClasses, addClass, updateClass, deleteClass } = useClassStore();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'users' | 'classes'>('users');

  // User modal state
  const [userModal, setUserModal] = useState(false);
  const [editUser, setEditUser] = useState<User | null>(null);
  const [deleteUser, setDeleteUser] = useState<User | null>(null);
  const [userForm, setUserForm] = useState(EMPTY_USER);
  const [saving, setSaving] = useState(false);

  // Class modal state
  const [classModal, setClassModal] = useState(false);
  const [editClass, setEditClass] = useState<UserClass | null>(null);
  const [deleteClassId, setDeleteClassId] = useState<string | null>(null);
  const [classForm, setClassForm] = useState<{ name: string; base_role: string; color: string; permissions: RoutePermission[] }>({
    name: '', base_role: 'professor', color: CLASS_COLORS[0],
    permissions: ALL_ROUTES.map(r => ({ route: r.route, label: r.label, allowed: false })),
  });

  useEffect(() => { fetchUsers(); fetchClasses(); }, []);

  const fetchUsers = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('users')
      .select('*, user_classes(name, color)')
      .neq('role', 'student')
      .order('name');
    if (data) {
      setUsers(data.map((u: any) => ({
        ...u,
        class_name: u.user_classes?.name,
        class_color: u.user_classes?.color,
      })));
    }
    setLoading(false);
  };

  // ── User CRUD ──
  const openAddUser = () => { setEditUser(null); setUserForm(EMPTY_USER); setUserModal(true); };
  const openEditUser = (u: User) => {
    setEditUser(u);
    setUserForm({ name: u.name, email: u.email, role: u.role, unit: u.unit, class_id: u.class_id || '' });
    setUserModal(true);
  };
  const closeUserModal = () => { setUserModal(false); setEditUser(null); setUserForm(EMPTY_USER); };

  const handleSaveUser = async () => {
    if (!userForm.name || !userForm.email) return;
    setSaving(true);
    const payload = { name: userForm.name, email: userForm.email, role: userForm.role, unit: userForm.unit, class_id: userForm.class_id || null };
    if (editUser) {
      await supabase.from('users').update(payload).eq('id', editUser.id);
    } else {
      await supabase.from('users').insert({ ...payload, active: true });
    }
    setSaving(false);
    closeUserModal();
    fetchUsers();
  };

  const toggleActive = async (u: User) => {
    await supabase.from('users').update({ active: !u.active }).eq('id', u.id);
    setUsers(p => p.map(x => x.id === u.id ? { ...x, active: !x.active } : x));
  };

  const handleDeleteUser = async () => {
    if (!deleteUser) return;
    setSaving(true);
    await supabase.from('users').delete().eq('id', deleteUser.id);
    setUsers(p => p.filter(u => u.id !== deleteUser.id));
    setSaving(false);
    setDeleteUser(null);
  };

  // ── Class CRUD ──
  const openAddClass = () => {
    setEditClass(null);
    setClassForm({ name: '', base_role: 'professor', color: CLASS_COLORS[Math.floor(Math.random() * CLASS_COLORS.length)], permissions: ALL_ROUTES.map(r => ({ route: r.route, label: r.label, allowed: false })) });
    setClassModal(true);
  };
  const openEditClass = (cls: UserClass) => {
    setEditClass(cls);
    setClassForm({ name: cls.name, base_role: cls.base_role, color: cls.color, permissions: [...cls.permissions] });
    setClassModal(true);
  };
  const closeClassModal = () => { setClassModal(false); setEditClass(null); };

  const handleSaveClass = async () => {
    if (!classForm.name) return;
    setSaving(true);
    const payload = { name: classForm.name, base_role: classForm.base_role, color: classForm.color, permissions: classForm.permissions };
    if (editClass) {
      await updateClass(editClass.id, payload);
    } else {
      await addClass(payload);
    }
    setSaving(false);
    closeClassModal();
  };

  const handleDeleteClass = async () => {
    if (!deleteClassId) return;
    await deleteClass(deleteClassId);
    setDeleteClassId(null);
  };

  const getClassBadge = (u: User) => {
    const cls = classes.find(c => c.id === u.class_id);
    if (!cls) {
      const role = u.role;
      return <Badge variant="secondary" className="text-[10px]">{ROLE_LABELS[role] || role}</Badge>;
    }
    return (
      <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full" style={{ background: cls.color + '18', color: cls.color }}>
        <Shield size={9} /> {cls.name}
      </span>
    );
  };

  return (
    <PageTransition>
      {/* Header */}
      <div className="flex items-start justify-between gap-4 mb-6 flex-wrap">
        <div>
          <h1 className="text-xl font-extrabold">{activeTab === 'users' ? t('fablab.usersTitle') : 'Classes & Permissões'}</h1>
          <p className="text-sm text-muted-foreground">
            {activeTab === 'users' ? t('fablab.usersSubtitle') : 'Gerencie perfis de acesso e permissões por aba'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm" variant={activeTab === 'users' ? 'default' : 'outline'} onClick={() => setActiveTab('users')}>
            Usuários
          </Button>
          <Button size="sm" variant={activeTab === 'classes' ? 'default' : 'outline'} onClick={() => setActiveTab('classes')}>
            <Shield size={13} className="mr-1.5" /> Classes
          </Button>
          <Button size="sm" onClick={activeTab === 'users' ? openAddUser : openAddClass} style={{ background: 'var(--fab-primary)' }}>
            <Plus size={14} className="mr-1" /> {activeTab === 'users' ? 'Adicionar' : 'Nova classe'}
          </Button>
        </div>
      </div>

      {/* Password hint */}
      {activeTab === 'users' && (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-400 text-sm mb-5 border border-blue-100 dark:border-blue-900">
          <AlertCircle size={15} className="flex-shrink-0" />
          {t('fablab.defaultPassword')} <strong className="ml-1">sesi@2025</strong>
        </div>
      )}

      {/* ── USERS TAB ── */}
      {activeTab === 'users' && (
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            {loading ? (
              <div className="flex items-center justify-center py-16 text-muted-foreground gap-2">
                <div className="w-5 h-5 border-2 border-border border-t-[#D42020] rounded-full animate-spin" />
                <span className="text-sm">{t('app.loading')}</span>
              </div>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-muted/50 text-left">
                    {['Usuário', 'E-mail', 'Classe', 'Unidade', 'Status', ''].map((h, i) => (
                      <th key={i} className="px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-muted-foreground whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {users.map(u => (
                    <tr key={u.id} className="hover:bg-muted/20 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-8 w-8">
                            <AvatarFallback className="text-xs font-bold" style={{ background: 'rgba(212,32,32,0.1)', color: '#D42020' }}>
                              {u.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <span className="font-medium">{u.name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground text-xs">{u.email}</td>
                      <td className="px-4 py-3">{getClassBadge(u)}</td>
                      <td className="px-4 py-3 text-muted-foreground text-xs">{u.unit}</td>
                      <td className="px-4 py-3">
                        <Badge variant={u.active ? 'default' : 'secondary'}>
                          {u.active ? t('app.active') : t('app.inactive')}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-7 w-7 p-0"><MoreVertical size={14} /></Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => openEditUser(u)}><Edit2 size={13} className="mr-2" />{t('app.edit')}</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => toggleActive(u)}>
                              {u.active ? t('app.deactivate') : t('app.activate')}
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => setDeleteUser(u)}>
                              <Trash2 size={13} className="mr-2" />{t('app.delete')}
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  ))}
                  {users.length === 0 && (
                    <tr><td colSpan={6} className="text-center py-12 text-muted-foreground">{t('app.noData')}</td></tr>
                  )}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* ── CLASSES TAB ── */}
      {activeTab === 'classes' && (
        <div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
            {classes.map(cls => (
              <ClassCard key={cls.id} cls={cls} onEdit={() => openEditClass(cls)} onDelete={() => setDeleteClassId(cls.id)} />
            ))}
            {classes.length === 0 && (
              <div className="col-span-full text-center py-16 text-muted-foreground">
                <Shield size={36} className="mx-auto mb-3 opacity-20" />
                <p>Nenhuma classe criada ainda.</p>
              </div>
            )}
          </div>
          <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900 text-sm text-amber-800 dark:text-amber-400 flex gap-2">
            <Settings size={15} className="flex-shrink-0 mt-0.5" />
            <p>Classes definem quais abas cada grupo de usuários pode visualizar. Atribua uma classe a cada usuário na aba <strong>Usuários</strong>.</p>
          </div>
        </div>
      )}

      {/* ══ USER Modal ══ */}
      <Dialog open={userModal} onOpenChange={o => { if (!o) closeUserModal(); }}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>{editUser ? 'Editar usuário' : t('fablab.addUserTitle')}</DialogTitle></DialogHeader>
          <div className="space-y-3 py-2">
            {[
              { label: 'Nome completo', key: 'name', type: 'text', ph: 'Nome completo' },
              { label: 'E-mail institucional', key: 'email', type: 'email', ph: 'email@sesi.br' },
              { label: 'Unidade', key: 'unit', type: 'text', ph: 'FabLab SP' },
            ].map(f => (
              <div key={f.key} className="space-y-1">
                <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{f.label}</Label>
                <Input type={f.type} value={(userForm as any)[f.key]} placeholder={f.ph}
                  onChange={e => setUserForm(p => ({ ...p, [f.key]: e.target.value }))} className="h-10" />
              </div>
            ))}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Função base</Label>
                <select value={userForm.role} onChange={e => setUserForm(p => ({ ...p, role: e.target.value }))}
                  className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm">
                  {Object.entries(ROLE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
              </div>
              <div className="space-y-1">
                <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Classe</Label>
                <select value={userForm.class_id} onChange={e => setUserForm(p => ({ ...p, class_id: e.target.value }))}
                  className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm">
                  <option value="">— Sem classe —</option>
                  {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={closeUserModal}>{t('app.cancel')}</Button>
            <Button onClick={handleSaveUser} disabled={saving} style={{ background: 'var(--fab-primary)' }}>
              {saving ? '...' : t('app.save')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ══ CLASS Modal ══ */}
      <Dialog open={classModal} onOpenChange={o => { if (!o) closeClassModal(); }}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editClass ? 'Editar classe' : 'Nova classe de usuário'}</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Nome da classe *</Label>
                <Input value={classForm.name} onChange={e => setClassForm(p => ({ ...p, name: e.target.value }))} placeholder="Ex: Técnico de Lab" className="h-10" />
              </div>
              <div className="space-y-1">
                <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Função base</Label>
                <select value={classForm.base_role} onChange={e => setClassForm(p => ({ ...p, base_role: e.target.value }))}
                  className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm">
                  {Object.entries(ROLE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
              </div>
            </div>
            <div className="space-y-1">
              <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Cor</Label>
              <div className="flex gap-2 flex-wrap">
                {CLASS_COLORS.map(color => (
                  <button key={color} onClick={() => setClassForm(p => ({ ...p, color }))}
                    className="w-7 h-7 rounded-full border-2 transition-transform hover:scale-110"
                    style={{ background: color, borderColor: classForm.color === color ? '#111' : 'transparent' }}
                  />
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Permissões de visualização</Label>
              <PermissionEditor perms={classForm.permissions} onChange={p => setClassForm(f => ({ ...f, permissions: p }))} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={closeClassModal}>{t('app.cancel')}</Button>
            <Button onClick={handleSaveClass} disabled={saving} style={{ background: 'var(--fab-primary)' }}>
              {saving ? '...' : t('app.save')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ══ Delete User Confirm ══ */}
      <Dialog open={!!deleteUser} onOpenChange={o => { if (!o) setDeleteUser(null); }}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Excluir usuário?</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground py-2">
            <strong>{deleteUser?.name}</strong> será removido permanentemente. Esta ação não pode ser desfeita.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteUser(null)}>{t('app.cancel')}</Button>
            <Button variant="destructive" onClick={handleDeleteUser} disabled={saving}>{saving ? '...' : t('app.delete')}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ══ Delete Class Confirm ══ */}
      <Dialog open={!!deleteClassId} onOpenChange={o => { if (!o) setDeleteClassId(null); }}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Excluir classe?</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground py-2">Usuários com esta classe perderão as permissões vinculadas.</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteClassId(null)}>{t('app.cancel')}</Button>
            <Button variant="destructive" onClick={handleDeleteClass}>{t('app.delete')}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageTransition>
  );
}
