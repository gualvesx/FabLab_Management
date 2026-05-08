import { create } from 'zustand';
import type { Quiz, QuizResult } from '@/types';
import { supabase } from '@/lib/supabase';

interface QuizState {
  quizzes: Quiz[];
  results: QuizResult[];
  loading: boolean;
  fetchQuizzes: () => Promise<void>;
  fetchResults: () => Promise<void>;
  addQuiz: (q: Omit<Quiz, 'id' | 'created_at'>) => Promise<void>;
  updateQuiz: (id: string, data: Partial<Quiz>) => Promise<void>;
  deleteQuiz: (id: string) => Promise<void>;
  addResult: (r: Omit<QuizResult, 'id'>) => Promise<void>;
  getStudentQuizzes: (studentId: string) => Quiz[];
  getStudentResults: (studentId: string) => QuizResult[];
  getQuizResults: (quizId: string) => QuizResult[];
  hasCompletedQuiz: (studentId: string, quizId: string) => boolean;
}

export const useQuizStore = create<QuizState>((set, get) => ({
  quizzes: [],
  results: [],
  loading: false,

  fetchQuizzes: async () => {
    set({ loading: true });
    const { data } = await supabase
      .from('quizzes')
      .select('*')
      .order('created_at', { ascending: false });
    set({ quizzes: (data as Quiz[]) ?? [], loading: false });
  },

  fetchResults: async () => {
    const { data } = await supabase
      .from('quiz_results')
      .select('*')
      .order('completed_at', { ascending: false });
    set({ results: (data as QuizResult[]) ?? [] });
  },

  addQuiz: async (q) => {
    const payload = {
      title:             q.title,
      description:       q.description,
      subject:           q.subject,
      time_limit:        Number(q.time_limit),
      status:            q.status,
      questions:         q.questions,
      assigned_students: q.assigned_students ?? [],
      created_by:        q.created_by,
      created_at:        new Date().toISOString(),
    };
    const { data } = await supabase.from('quizzes').insert(payload).select().single();
    if (data) set({ quizzes: [data as Quiz, ...get().quizzes] });
  },

  updateQuiz: async (id, data) => {
    const { questions, created_at, ...rest } = data as any;
    const payload: any = { ...rest };
    if (questions !== undefined) payload.questions = questions;
    if (payload.time_limit !== undefined) payload.time_limit = Number(payload.time_limit);
    const { data: updated } = await supabase.from('quizzes').update(payload).eq('id', id).select().single();
    if (updated) {
      set({ quizzes: get().quizzes.map(q => q.id === id ? (updated as Quiz) : q) });
    }
  },

  deleteQuiz: async (id) => {
    await supabase.from('quizzes').delete().eq('id', id);
    set({ quizzes: get().quizzes.filter(q => q.id !== id) });
  },

  addResult: async (r) => {
    const payload = {
      quiz_id:      r.quiz_id,
      student_id:   r.student_id,
      score:        Number(r.score),
      max_score:    Number(r.max_score),
      answers:      r.answers,
      completed_at: new Date().toISOString(),
      time_taken:   Number(r.time_taken) || 0,
    };
    const { data } = await supabase.from('quiz_results').insert(payload).select().single();
    if (data) set({ results: [data as QuizResult, ...get().results] });
  },

  getStudentQuizzes: (studentId) =>
    get().quizzes.filter(q => q.status === 'published' && q.assigned_students?.includes(studentId)),

  getStudentResults: (studentId) =>
    get().results.filter(r => r.student_id === studentId),

  getQuizResults: (quizId) =>
    get().results.filter(r => r.quiz_id === quizId),

  hasCompletedQuiz: (studentId, quizId) =>
    get().results.some(r => r.student_id === studentId && r.quiz_id === quizId),
}));
