import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User } from '@/types';
import { supabase } from '@/lib/supabase';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<{ ok: boolean; error?: string }>;
  logout: () => Promise<void>;
  loadSession: () => Promise<void>;
}

async function fetchUserProfile(userId: string): Promise<User | null> {
  const { data, error } = await supabase
    .from('users')
    .select('id, name, email, role, class_id, unit, active')
    .eq('id', userId)
    .single();

  if (error || !data) return null;
  if (data.active === false) return null;
  return data as User;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,

      loadSession: async () => {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          set({ user: null, isAuthenticated: false });
          return;
        }
        const profile = await fetchUserProfile(session.user.id);
        if (profile) {
          set({ user: profile, isAuthenticated: true });
        } else {
          // Profile not in public.users yet — sign out cleanly
          await supabase.auth.signOut();
          set({ user: null, isAuthenticated: false });
        }
      },

      login: async (email, password) => {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });

        if (error) {
          return { ok: false, error: 'E-mail ou senha incorretos.' };
        }
        if (!data.session) {
          return { ok: false, error: 'Erro ao iniciar sessão. Tente novamente.' };
        }

        const profile = await fetchUserProfile(data.session.user.id);
        if (!profile) {
          await supabase.auth.signOut();
          return { ok: false, error: 'Conta inativa ou não cadastrada. Fale com o administrador.' };
        }

        set({ user: profile, isAuthenticated: true });
        return { ok: true };
      },

      logout: async () => {
        await supabase.auth.signOut();
        set({ user: null, isAuthenticated: false });
      },
    }),
    {
      name: 'sesi-auth',
      partialize: (s) => ({ user: s.user, isAuthenticated: s.isAuthenticated }),
    }
  )
);
