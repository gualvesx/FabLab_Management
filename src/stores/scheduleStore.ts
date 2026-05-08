import { create } from 'zustand';
import type { Schedule } from '@/types';
import { supabase } from '@/lib/supabase';

interface ScheduleState {
  schedules: Schedule[];
  loading: boolean;
  fetchSchedules: () => Promise<void>;
  addSchedule: (s: Omit<Schedule, 'id'>) => Promise<void>;
  updateSchedule: (id: string, data: Partial<Schedule>) => Promise<void>;
  deleteSchedule: (id: string) => Promise<void>;
}

function toSupabase(s: Partial<Schedule>): any {
  const out: any = { ...s };
  // Remove nested join data not in schema
  delete out.schedule_materials;
  // Ensure empty strings become null for time fields
  if (out.start_time === '') out.start_time = null;
  if (out.end_time   === '') out.end_time   = null;
  if (out.date       === '') out.date       = null;
  return out;
}

export const useScheduleStore = create<ScheduleState>((set, get) => ({
  schedules: [],
  loading: false,

  fetchSchedules: async () => {
    set({ loading: true });
    const { data } = await supabase
      .from('schedules')
      .select('*, schedule_materials(*)')
      .order('date', { ascending: true });
    set({ schedules: (data as Schedule[]) ?? [], loading: false });
  },

  addSchedule: async (s) => {
    const { data } = await supabase
      .from('schedules')
      .insert(toSupabase(s))
      .select()
      .single();
    if (data) {
      set({ schedules: [{ ...(data as Schedule), schedule_materials: [] }, ...get().schedules] });
    }
  },

  updateSchedule: async (id, data) => {
    const { data: updated } = await supabase
      .from('schedules')
      .update(toSupabase(data))
      .eq('id', id)
      .select()
      .single();
    if (updated) {
      set({ schedules: get().schedules.map(s => s.id === id ? { ...s, ...(updated as Schedule) } : s) });
    }
  },

  deleteSchedule: async (id) => {
    await supabase.from('schedules').delete().eq('id', id);
    set({ schedules: get().schedules.filter(s => s.id !== id) });
  },
}));
