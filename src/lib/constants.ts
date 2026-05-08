// ── Skill areas ──────────────────────────────────────────────────
export const SKILL_AREAS = [
  'Lógico-Matemática', 'Linguística', 'Espacial',
  'Musical', 'Naturalista', 'Interpessoal', 'Intrapessoal', 'Criatividade',
];

// ── Inventory categories & measures ─────────────────────────────
export const INV_CATS = [
  'Equipamento', 'Eletrônico', 'Ferramenta',
  'Insumo', 'Material', 'Consumível', 'EPI', 'Outro',
] as const;

export const UNIT_MEASURES = ['un', 'kg', 'g', 'L', 'mL', 'm', 'cm', 'rolo', 'caixa', 'par', 'kit'] as const;

// ── Role labels ──────────────────────────────────────────────────
export const ROLE_LABELS: Record<string, string> = {
  admin: 'Administrador',
  professor: 'Professor',
  funcionario: 'Funcionário',
  student: 'Aluno',
};

// ── Route permissions map ────────────────────────────────────────
export const ALL_ROUTES = [
  // FabLab
  { route: '/fablab/home',        label: 'FabLab · Início',         module: 'fablab' },
  { route: '/fablab/dashboard',   label: 'FabLab · Dashboard',      module: 'fablab' },
  { route: '/fablab/inventory',   label: 'FabLab · Inventário',     module: 'fablab' },
  { route: '/fablab/schedule',    label: 'FabLab · Agendamentos',   module: 'fablab' },
  { route: '/fablab/suggestions', label: 'FabLab · Sugestões',      module: 'fablab' },
  { route: '/fablab/projects',    label: 'FabLab · Projetos',       module: 'fablab' },
  { route: '/fablab/blog',        label: 'FabLab · Blog',           module: 'fablab' },
  { route: '/fablab/reports',     label: 'FabLab · Relatórios',     module: 'fablab' },
  { route: '/fablab/users',       label: 'FabLab · Usuários',       module: 'fablab' },
  // Gifted
  { route: '/gifted/home',        label: 'Altas Hab. · Início',     module: 'gifted' },
  { route: '/gifted/dashboard',   label: 'Altas Hab. · Dashboard',  module: 'gifted' },
  { route: '/gifted/students',    label: 'Altas Hab. · Alunos',     module: 'gifted' },
  { route: '/gifted/quiz-creator',label: 'Altas Hab. · Quiz',       module: 'gifted' },
  // Student
  { route: '/student/quiz',       label: 'Aluno · Quiz',            module: 'student' },
  { route: '/student/grades',     label: 'Aluno · Notas',           module: 'student' },
  { route: '/student/proposal',   label: 'Aluno · Proposta',        module: 'student' },
] as const;

export const CLASS_COLORS = [
  '#D42020', '#2563eb', '#059669', '#7c3aed',
  '#ea580c', '#0891b2', '#be185d', '#65a30d',
];
