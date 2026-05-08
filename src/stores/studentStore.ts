import { create } from 'zustand';
import type { Student, Grade, Skill, Development, Achievement } from '@/types';
import { supabase } from '@/lib/supabase';

interface StudentState {
  students: Student[];
  loading: boolean;
  fetchStudents: () => Promise<void>;
  addStudent: (s: Omit<Student, 'id' | 'gifted_grades' | 'gifted_skills' | 'gifted_developments' | 'gifted_achievements'>) => Promise<void>;
  updateStudent: (id: string, data: Partial<Student>) => Promise<void>;
  deleteStudent: (id: string) => Promise<void>;
  addGrade: (studentId: string, grade: Omit<Grade, 'id'>) => Promise<void>;
  addSkill: (studentId: string, skill: Skill) => Promise<void>;
  addDevelopment: (studentId: string, dev: Omit<Development, 'id'>) => Promise<void>;
  addAchievement: (studentId: string, ach: Omit<Achievement, 'id'>) => Promise<void>;
}

export const useStudentStore = create<StudentState>((set, get) => ({
  students: [],
  loading: false,

  fetchStudents: async () => {
    set({ loading: true });
    const { data } = await supabase
      .from('students')
      .select(`*, gifted_grades(*), gifted_skills(*), gifted_developments(*), gifted_achievements(*)`)
      .order('name');
    set({ students: (data as Student[]) ?? [], loading: false });
  },

  addStudent: async (s) => {
    const { data } = await supabase.from('students').insert({ ...s }).select().single();
    if (data) {
      set({ students: [{ ...(data as Student), gifted_grades: [], gifted_skills: [], gifted_developments: [], gifted_achievements: [] }, ...get().students] });
    }
  },

  updateStudent: async (id, data) => {
    const { data: updated } = await supabase.from('students').update(data).eq('id', id).select().single();
    if (updated) {
      set({ students: get().students.map(s => s.id === id ? { ...s, ...(updated as Student) } : s) });
    }
  },

  deleteStudent: async (id) => {
    await supabase.from('students').delete().eq('id', id);
    set({ students: get().students.filter(s => s.id !== id) });
  },

  addGrade: async (studentId, grade) => {
    const payload = {
      student_id: studentId,
      subject:    grade.subject,
      grade:      Number(grade.grade),
      period:     grade.period,
      date:       grade.date || null,
      notes:      grade.notes ?? '',
    };
    const { data } = await supabase.from('gifted_grades').insert(payload).select().single();
    if (data) {
      set({ students: get().students.map(s =>
        s.id === studentId ? { ...s, gifted_grades: [...s.gifted_grades, data as Grade] } : s
      )});
    }
  },

  addSkill: async (studentId, skill) => {
    const payload = {
      student_id:  studentId,
      area:        skill.area,
      score:       Number(skill.score),
      assessed_by: skill.assessed_by,   // ← correct snake_case
      date:        skill.date || null,
    };
    const existing = get().students
      .find(s => s.id === studentId)
      ?.gifted_skills.find(sk => sk.area === skill.area);

    if (existing) {
      await supabase.from('gifted_skills').update(payload).eq('student_id', studentId).eq('area', skill.area);
    } else {
      await supabase.from('gifted_skills').insert(payload);
    }

    set({ students: get().students.map(s => {
      if (s.id !== studentId) return s;
      const exists = s.gifted_skills.find(sk => sk.area === skill.area);
      if (exists) return { ...s, gifted_skills: s.gifted_skills.map(sk => sk.area === skill.area ? skill : sk) };
      return { ...s, gifted_skills: [...s.gifted_skills, skill] };
    })});
  },

  addDevelopment: async (studentId, dev) => {
    const { data } = await supabase.from('gifted_developments')
      .insert({ ...dev, student_id: studentId, date: dev.date || null })
      .select().single();
    if (data) {
      set({ students: get().students.map(s =>
        s.id === studentId ? { ...s, gifted_developments: [data as Development, ...s.gifted_developments] } : s
      )});
    }
  },

  addAchievement: async (studentId, ach) => {
    const { data } = await supabase.from('gifted_achievements')
      .insert({ ...ach, student_id: studentId, date: ach.date || null })
      .select().single();
    if (data) {
      set({ students: get().students.map(s =>
        s.id === studentId ? { ...s, gifted_achievements: [data as Achievement, ...s.gifted_achievements] } : s
      )});
    }
  },
}));
