import { create } from 'zustand';
import { supabase } from '@/lib/supabase';
import { ALL_ROUTES, CLASS_COLORS } from '@/lib/constants';
import type { UserClass } from '@/types';

interface ClassState {
  classes: UserClass[];
  loading: boolean;
  fetchClasses: () => Promise<void>;
  addClass: (c: Omit<UserClass, 'id' | 'created_at'>) => Promise<UserClass | null>;
  updateClass: (id: string, data: Partial<UserClass>) => Promise<void>;
  deleteClass: (id: string) => Promise<void>;
}

// Fallback used only when DB is completely unreachable
const DEFAULT_CLASSES: UserClass[] = [
  {
    id: 'default-admin', name: 'Administrador', base_role: 'admin',
    color: CLASS_COLORS[0], created_at: '',
    permissions: ALL_ROUTES.map(r => ({ route: r.route, label: r.label, allowed: true })),
  },
  {
    id: 'default-professor', name: 'Professor', base_role: 'professor',
    color: CLASS_COLORS[1], created_at: '',
    permissions: ALL_ROUTES.map(r => ({
      route: r.route, label: r.label,
      allowed: !['/fablab/users', '/fablab/dashboard'].includes(r.route as string),
    })),
  },
  {
    id: 'default-funcionario', name: 'Funcionário', base_role: 'funcionario',
    color: CLASS_COLORS[2], created_at: '',
    permissions: ALL_ROUTES.map(r => ({
      route: r.route, label: r.label,
      allowed: (['/fablab/home', '/fablab/inventory', '/fablab/schedule', '/fablab/blog'] as string[]).includes(r.route as string),
    })),
  },
  {
    id: 'default-student', name: 'Aluno', base_role: 'student',
    color: CLASS_COLORS[3], created_at: '',
    permissions: ALL_ROUTES.map(r => ({
      route: r.route, label: r.label,
      allowed: (['/student/quiz', '/student/grades', '/student/proposal', '/fablab/blog'] as string[]).includes(r.route as string),
    })),
  },
];

export const useClassStore = create<ClassState>((set, get) => ({
  classes: [],
  loading: false,

  fetchClasses: async () => {
    set({ loading: true });
    const { data, error } = await supabase
      .from('user_classes')
      .select('*')
      .order('name');

    if (!error && data && data.length > 0) {
      // Parse permissions JSON if stored as string
      const parsed = data.map((c: any) => ({
        ...c,
        permissions: typeof c.permissions === 'string'
          ? JSON.parse(c.permissions)
          : (c.permissions ?? []),
      }));
      set({ classes: parsed as UserClass[], loading: false });
    } else {
      // Fall back to hardcoded defaults
      set({ classes: DEFAULT_CLASSES, loading: false });
    }
  },

  addClass: async (c) => {
    const { data, error } = await supabase
      .from('user_classes')
      .insert({ name: c.name, base_role: c.base_role, color: c.color, permissions: c.permissions })
      .select()
      .single();
    if (!error && data) {
      const parsed = { ...data, permissions: typeof data.permissions === 'string' ? JSON.parse(data.permissions) : data.permissions };
      set({ classes: [...get().classes, parsed as UserClass] });
      return parsed as UserClass;
    }
    return null;
  },

  updateClass: async (id, data) => {
    if (!id.startsWith('default-')) {
      await supabase.from('user_classes').update(data).eq('id', id);
    }
    set({ classes: get().classes.map(c => c.id === id ? { ...c, ...data } : c) });
  },

  deleteClass: async (id) => {
    if (!id.startsWith('default-')) {
      await supabase.from('user_classes').delete().eq('id', id);
    }
    set({ classes: get().classes.filter(c => c.id !== id) });
  },
}));
