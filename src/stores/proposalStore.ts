import { create } from 'zustand';
import type { WorkProposal } from '@/types';
import { supabase } from '@/lib/supabase';

interface ProposalState {
  proposals: WorkProposal[];
  loading: boolean;
  fetchProposals: () => Promise<void>;
  addProposal: (p: Omit<WorkProposal, 'id' | 'created_at' | 'updated_at'>) => Promise<void>;
  updateProposal: (id: string, data: Partial<WorkProposal>) => Promise<void>;
  deleteProposal: (id: string) => Promise<void>;
  getStudentProposals: (studentId: string) => WorkProposal[];
}

export const useProposalStore = create<ProposalState>((set, get) => ({
  proposals: [],
  loading: false,

  fetchProposals: async () => {
    set({ loading: true });
    const { data } = await supabase
      .from('work_proposals')
      .select('*')
      .order('created_at', { ascending: false });
    set({ proposals: (data as WorkProposal[]) ?? [], loading: false });
  },

  addProposal: async (p) => {
    const now = new Date().toISOString();
    const payload = {
      student_id:       p.student_id,
      title:            p.title,
      description:      p.description,
      objectives:       p.objectives,
      methodology:      p.methodology,
      expected_results: p.expected_results,
      timeline:         p.timeline,
      status:           p.status ?? 'submitted',
      feedback:         p.feedback ?? '',
      created_at:       now,
      updated_at:       now,
    };
    const { data } = await supabase.from('work_proposals').insert(payload).select().single();
    if (data) set({ proposals: [data as WorkProposal, ...get().proposals] });
  },

  updateProposal: async (id, data) => {
    const payload = { ...data, updated_at: new Date().toISOString() };
    delete (payload as any).id;
    delete (payload as any).created_at;
    const { data: updated } = await supabase.from('work_proposals').update(payload).eq('id', id).select().single();
    if (updated) {
      set({ proposals: get().proposals.map(p => p.id === id ? (updated as WorkProposal) : p) });
    }
  },

  deleteProposal: async (id) => {
    await supabase.from('work_proposals').delete().eq('id', id);
    set({ proposals: get().proposals.filter(p => p.id !== id) });
  },

  getStudentProposals: (studentId) =>
    get().proposals.filter(p => p.student_id === studentId),
}));
