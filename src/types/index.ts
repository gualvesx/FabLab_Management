// ── Core user types ──────────────────────────────────────────────
export type UserRole = 'admin' | 'professor' | 'funcionario' | 'student' | string;

export interface UserClass {
  id: string;
  name: string;           // e.g. "Técnico de Lab"
  base_role: UserRole;    // base permission level
  permissions: RoutePermission[];
  color: string;          // hex for UI badge
  created_at: string;
}

export interface RoutePermission {
  route: string;          // e.g. "/fablab/inventory"
  label: string;          // e.g. "Inventário"
  allowed: boolean;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  class_id?: string;      // FK to user_classes
  class_name?: string;    // joined from user_classes
  unit: string;
  active: boolean;
}

// ── Student / Gifted ─────────────────────────────────────────────
export type StudentStatus = 'identificado' | 'em_avaliacao' | 'monitoramento' | 'concluido';

export interface Grade {
  id: string;
  subject: string;
  grade: number;
  period: string;
  date: string;           // ISO date string kept for compat
  notes?: string;
}

export interface Skill {
  area: string;
  score: number;
  assessed_by: string;    // FIXED: was assessedBy
  date: string;
}

export interface Development {
  id: string;
  date: string;
  title: string;
  description: string;
  category: string;
  author: string;
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  date: string;
  type: 'olimpiada' | 'projeto' | 'reconhecimento' | 'publicacao' | 'outro';
}

export interface Student {
  id: string;
  name: string;
  birth_date: string;
  grade: string;
  school: string;
  status: StudentStatus;
  responsible_name: string;
  responsible_contact: string;
  primary_areas: string[];
  notes: string;
  identified_at: string;
  identified_by: string;
  gifted_grades: Grade[];
  gifted_skills: Skill[];
  gifted_developments: Development[];
  gifted_achievements: Achievement[];
}

// ── Inventory ────────────────────────────────────────────────────
export type InventoryCategory =
  | 'Equipamento'
  | 'Eletrônico'
  | 'Ferramenta'
  | 'Insumo'
  | 'Material'
  | 'Consumível'
  | 'EPI'
  | 'Outro';

export interface InventoryItem {
  id: string;
  name: string;
  category: InventoryCategory;
  subcategory?: string;
  quantity: number;
  total: number;
  unit_measure: string;   // "un", "kg", "m", "L", etc.
  status: 'in' | 'out';
  description: string;
  location?: string;      // physical location in lab
  min_stock?: number;     // alert threshold
  last_action: string;
  last_action_by: string;
}

export interface Movement {
  id: string;
  item_id: string;
  item_name: string;
  action: 'entrada' | 'saida';
  quantity: number;
  responsible: string;
  notes: string;
  moved_at: string;
}

// ── Schedule ─────────────────────────────────────────────────────
export interface Schedule {
  id: string;
  title: string;
  date: string;
  start_time: string;
  end_time: string;
  responsible: string;
  class_name: string;
  notes: string;
  status: 'pendente' | 'confirmado' | 'concluido' | 'cancelado' | 'remarcado';
  schedule_materials: ScheduleMaterial[];
}

export interface ScheduleMaterial {
  id: string;
  item_name: string;
  quantity_used: number;
  registered_by: string;
}

// ── Suggestions ──────────────────────────────────────────────────
export interface Suggestion {
  id: string;
  title: string;
  description: string;
  tags: string[];
  author: string;
  votes: number;
  status: 'open' | 'approved';
}

// ── Projects ─────────────────────────────────────────────────────
export interface Project {
  id: string;
  title: string;
  description: string;
  type: string;
  link: string;
  author: string;
  class_name: string;
  tags: string[];
}

// ── Quiz ─────────────────────────────────────────────────────────
export interface Quiz {
  id: string;
  title: string;
  description: string;
  subject: string;
  time_limit: number;
  status: 'draft' | 'published';
  questions: Question[];
  assigned_students: string[];
  created_by: string;
  created_at: string;
}

export interface Question {
  id: string;
  text: string;
  options: { id: string; text: string; correct: boolean }[];
  points: number;
  multiple_correct: boolean;
}

export interface QuizResult {
  id: string;
  quiz_id: string;
  student_id: string;
  score: number;
  max_score: number;
  answers: { question_id: string; selected: string[]; correct: boolean }[];
  completed_at: string;
  time_taken: number;
}

// ── Proposal ─────────────────────────────────────────────────────
export interface WorkProposal {
  id: string;
  student_id: string;
  title: string;
  description: string;
  objectives: string;
  methodology: string;
  expected_results: string;
  timeline: string;
  status: 'submitted' | 'under_review' | 'approved' | 'in_progress' | 'completed';
  feedback: string;
  created_at: string;
  updated_at: string;
}

// ── Reports ──────────────────────────────────────────────────────
export interface Report {
  id: string;
  type: 'daily' | 'weekly' | 'monthly';
  period_start: string;
  period_end: string;
  total_schedules: number;
  total_completed: number;
  total_pending: number;
  total_cancelled: number;
  generated_by: string;
  generated_at: string;
  summary: {
    stats: { total: number; completed: number; pending: number; cancelled: number };
    top_materials: { item_name: string; total: number }[];
    schedules: { title: string; start_time: string; responsible: string; status: string }[];
  };
}

export interface MaterialUsage {
  item_name: string;
  category: string;
  total_used: number;
  times_used: number;
  last_used: string;
}

// ── Navigation types ─────────────────────────────────────────────
export type AppModule = 'fablab' | 'gifted' | 'student';
