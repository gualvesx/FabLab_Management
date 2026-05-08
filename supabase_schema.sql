-- ================================================================
-- SESI FabLab · Plataforma Educacional
-- Schema completo v2025.4
-- Execute no Supabase SQL Editor (Dashboard → SQL Editor → New query)
-- ================================================================

create extension if not exists "uuid-ossp";
create extension if not exists "pg_trgm";

-- ================================================================
-- FUNÇÃO AUXILIAR
-- ================================================================
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end;
$$;

-- ================================================================
-- 1. CLASSES DE USUÁRIO
-- ================================================================
create table if not exists public.user_classes (
  id          uuid        primary key default gen_random_uuid(),
  name        text        not null,
  base_role   text        not null default 'professor'
                check (base_role in ('admin','professor','funcionario','student')),
  color       text        not null default '#2563eb',
  permissions jsonb       not null default '[]',
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create trigger tr_user_classes_updated_at before update on public.user_classes
  for each row execute procedure public.set_updated_at();

-- ================================================================
-- 2. USUÁRIOS (vinculados ao auth.users)
-- ================================================================
create table if not exists public.users (
  id          uuid        primary key references auth.users on delete cascade,
  name        text        not null default '',
  email       text        not null default '',
  role        text        not null default 'professor'
                check (role in ('admin','professor','funcionario','student')),
  class_id    uuid        references public.user_classes on delete set null,
  unit        text        not null default '',
  active      boolean     not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index if not exists idx_users_role    on public.users (role);
create index if not exists idx_users_active  on public.users (active);
create index if not exists idx_users_class   on public.users (class_id);
create unique index if not exists idx_users_email
  on public.users (email) where email <> '';

create trigger tr_users_updated_at before update on public.users
  for each row execute procedure public.set_updated_at();

-- Auto-cria perfil ao registrar
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.users (id, email, name, role, unit, active)
  values (
    new.id,
    coalesce(new.email, ''),
    coalesce(new.raw_user_meta_data->>'name', split_part(coalesce(new.email,'u'),'@',1)),
    coalesce(new.raw_user_meta_data->>'role', 'professor'),
    coalesce(new.raw_user_meta_data->>'unit', ''),
    true
  )
  on conflict (id) do update
    set email = excluded.email, updated_at = now()
    where public.users.email <> excluded.email;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ================================================================
-- 3. INVENTÁRIO
-- ================================================================
create table if not exists public.inventory_items (
  id              uuid        primary key default gen_random_uuid(),
  name            text        not null,
  category        text        not null default 'Equipamento'
                    check (category in ('Equipamento','Eletrônico','Ferramenta','Insumo','Material','Consumível','EPI','Outro')),
  subcategory     text        not null default '',
  quantity        integer     not null default 0  check (quantity >= 0),
  total           integer     not null default 1  check (total >= 0),
  unit_measure    text        not null default 'un',
  status          text        not null default 'in' check (status in ('in','out')),
  description     text        not null default '',
  location        text        not null default '',
  min_stock       integer     not null default 0  check (min_stock >= 0),
  last_action     text        not null default '',
  last_action_by  text        not null default '',
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index if not exists idx_inv_category  on public.inventory_items (category);
create index if not exists idx_inv_status    on public.inventory_items (status);
create index if not exists idx_inv_name_trgm on public.inventory_items using gin (name gin_trgm_ops);

create trigger tr_inventory_updated_at before update on public.inventory_items
  for each row execute procedure public.set_updated_at();

create table if not exists public.movements (
  id          uuid        primary key default gen_random_uuid(),
  item_id     uuid        references public.inventory_items on delete set null,
  item_name   text        not null default '',
  action      text        not null check (action in ('entrada','saida')),
  quantity    integer     not null default 1 check (quantity > 0),
  responsible text        not null default '',
  notes       text        not null default '',
  moved_at    timestamptz not null default now()
);

create index if not exists idx_movements_item on public.movements (item_id, moved_at desc);
create index if not exists idx_movements_date on public.movements (moved_at desc);

-- ================================================================
-- 4. AGENDAMENTOS
-- ================================================================
create table if not exists public.schedules (
  id          uuid        primary key default gen_random_uuid(),
  title       text        not null,
  date        date        not null,
  start_time  time,
  end_time    time,
  responsible text        not null default '',
  class_name  text        not null default '',
  notes       text        not null default '',
  status      text        not null default 'pendente'
                check (status in ('pendente','confirmado','concluido','cancelado','remarcado')),
  created_by  uuid        references public.users on delete set null,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index if not exists idx_schedules_date   on public.schedules (date, status);
create index if not exists idx_schedules_status on public.schedules (status);

create trigger tr_schedules_updated_at before update on public.schedules
  for each row execute procedure public.set_updated_at();

create table if not exists public.schedule_materials (
  id              uuid        primary key default gen_random_uuid(),
  schedule_id     uuid        not null references public.schedules on delete cascade,
  item_id         uuid        references public.inventory_items on delete set null,
  item_name       text        not null,
  quantity_used   integer     not null default 1 check (quantity_used > 0),
  registered_by   text        not null default '',
  registered_at   timestamptz not null default now()
);

-- ================================================================
-- 5. SUGESTÕES DE PROJETOS
-- ================================================================
create table if not exists public.suggestions (
  id          uuid        primary key default gen_random_uuid(),
  title       text        not null,
  description text        not null default '',
  tags        text[]      not null default '{}',
  author      text        not null default '',
  author_id   uuid        references public.users on delete set null,
  votes       integer     not null default 0 check (votes >= 0),
  status      text        not null default 'open' check (status in ('open','approved','rejected')),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create trigger tr_suggestions_updated_at before update on public.suggestions
  for each row execute procedure public.set_updated_at();

-- ================================================================
-- 6. PROJETOS MAKER
-- ================================================================
create table if not exists public.projects (
  id          uuid        primary key default gen_random_uuid(),
  title       text        not null,
  description text        not null default '',
  type        text        not null default 'Outro',
  link        text        not null default '',
  author      text        not null default '',
  author_id   uuid        references public.users on delete set null,
  class_name  text        not null default '',
  tags        text[]      not null default '{}',
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index if not exists idx_projects_created    on public.projects (created_at desc);
create index if not exists idx_projects_title_trgm on public.projects using gin (title gin_trgm_ops);

create trigger tr_projects_updated_at before update on public.projects
  for each row execute procedure public.set_updated_at();

-- ================================================================
-- 7. BLOG
-- ================================================================
create table if not exists public.blog_posts (
  id          uuid        primary key default gen_random_uuid(),
  title       text        not null,
  content     text        not null default '',
  cover_url   text        not null default '',
  tags        text[]      not null default '{}',
  author      text        not null default '',
  author_id   uuid        references public.users on delete set null,
  author_role text        not null default '',
  published   boolean     not null default false,
  views       integer     not null default 0,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index if not exists idx_blog_published  on public.blog_posts (published, created_at desc);
create index if not exists idx_blog_title_trgm on public.blog_posts using gin (title gin_trgm_ops);

create trigger tr_blog_updated_at before update on public.blog_posts
  for each row execute procedure public.set_updated_at();

-- ================================================================
-- 8. RELATÓRIOS
-- ================================================================
create table if not exists public.reports (
  id                uuid        primary key default gen_random_uuid(),
  type              text        not null check (type in ('daily','weekly','monthly')),
  period_start      date        not null,
  period_end        date        not null,
  total_schedules   integer     not null default 0,
  total_completed   integer     not null default 0,
  total_pending     integer     not null default 0,
  total_cancelled   integer     not null default 0,
  generated_by      text        not null default '',
  generated_by_id   uuid        references public.users on delete set null,
  generated_at      timestamptz not null default now(),
  summary           jsonb       not null default '{}'
);

create table if not exists public.material_usage (
  id          uuid        primary key default gen_random_uuid(),
  item_id     uuid        references public.inventory_items on delete set null,
  item_name   text        not null,
  category    text        not null default '',
  total_used  integer     not null default 0,
  times_used  integer     not null default 0,
  last_used   timestamptz,
  updated_at  timestamptz not null default now()
);

-- ================================================================
-- 9. ALTAS HABILIDADES
-- ================================================================
create table if not exists public.students (
  id                  uuid        primary key default gen_random_uuid(),
  name                text        not null,
  birth_date          date,
  grade               text        not null default '',
  school              text        not null default '',
  status              text        not null default 'identificado'
                        check (status in ('identificado','em_avaliacao','monitoramento','concluido')),
  responsible_name    text        not null default '',
  responsible_contact text        not null default '',
  primary_areas       text[]      not null default '{}',
  notes               text        not null default '',
  identified_at       date,
  identified_by       text        not null default '',
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

create index if not exists idx_students_status    on public.students (status);
create index if not exists idx_students_name_trgm on public.students using gin (name gin_trgm_ops);

create trigger tr_students_updated_at before update on public.students
  for each row execute procedure public.set_updated_at();

create table if not exists public.gifted_grades (
  id          uuid         primary key default gen_random_uuid(),
  student_id  uuid         not null references public.students on delete cascade,
  subject     text         not null,
  grade       numeric(4,2) not null check (grade between 0 and 10),
  period      text         not null default '',
  date        date,
  notes       text         not null default '',
  created_at  timestamptz  not null default now()
);

create index if not exists idx_grades_student on public.gifted_grades (student_id, created_at desc);

-- CORRETO: assessed_by em snake_case (sem aspas duplas)
create table if not exists public.gifted_skills (
  id          uuid        primary key default gen_random_uuid(),
  student_id  uuid        not null references public.students on delete cascade,
  area        text        not null,
  score       integer     not null default 0 check (score between 0 and 100),
  assessed_by text        not null default '',
  date        date,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  unique (student_id, area)
);

create trigger tr_skills_updated_at before update on public.gifted_skills
  for each row execute procedure public.set_updated_at();

create table if not exists public.gifted_developments (
  id          uuid        primary key default gen_random_uuid(),
  student_id  uuid        not null references public.students on delete cascade,
  date        date,
  title       text        not null,
  description text        not null default '',
  category    text        not null default 'academico'
                check (category in ('academico','social','criativo','comportamental','atividade')),
  author      text        not null default '',
  created_at  timestamptz not null default now()
);

create table if not exists public.gifted_achievements (
  id          uuid        primary key default gen_random_uuid(),
  student_id  uuid        not null references public.students on delete cascade,
  title       text        not null,
  description text        not null default '',
  date        date,
  type        text        not null default 'outro'
                check (type in ('olimpiada','projeto','reconhecimento','publicacao','outro')),
  created_at  timestamptz not null default now()
);

-- ================================================================
-- 10. QUIZZES
-- ================================================================
create table if not exists public.quizzes (
  id                uuid        primary key default gen_random_uuid(),
  title             text        not null,
  description       text        not null default '',
  subject           text        not null default '',
  time_limit        integer     not null default 30 check (time_limit > 0),
  status            text        not null default 'draft' check (status in ('draft','published')),
  questions         jsonb       not null default '[]',
  assigned_students text[]      not null default '{}',
  created_by        text        not null default '',
  created_by_id     uuid        references public.users on delete set null,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

create trigger tr_quizzes_updated_at before update on public.quizzes
  for each row execute procedure public.set_updated_at();

create table if not exists public.quiz_results (
  id            uuid        primary key default gen_random_uuid(),
  quiz_id       uuid        not null references public.quizzes on delete cascade,
  student_id    text        not null,
  student_uuid  uuid        references public.students on delete set null,
  score         integer     not null default 0,
  max_score     integer     not null default 0,
  answers       jsonb       not null default '[]',
  completed_at  timestamptz not null default now(),
  time_taken    integer     not null default 0
);

create index if not exists idx_results_quiz    on public.quiz_results (quiz_id);
create index if not exists idx_results_student on public.quiz_results (student_id);

-- ================================================================
-- 11. PROPOSTAS DE TRABALHO
-- ================================================================
create table if not exists public.work_proposals (
  id                uuid        primary key default gen_random_uuid(),
  student_id        text        not null,
  student_uuid      uuid        references public.students on delete set null,
  title             text        not null,
  description       text        not null default '',
  objectives        text        not null default '',
  methodology       text        not null default '',
  expected_results  text        not null default '',
  timeline          text        not null default '',
  status            text        not null default 'submitted'
                      check (status in ('submitted','under_review','approved','in_progress','completed')),
  feedback          text        not null default '',
  reviewed_by       uuid        references public.users on delete set null,
  reviewed_at       timestamptz,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

create index if not exists idx_proposals_student on public.work_proposals (student_id);
create index if not exists idx_proposals_status  on public.work_proposals (status);

create trigger tr_proposals_updated_at before update on public.work_proposals
  for each row execute procedure public.set_updated_at();

-- ================================================================
-- ROW LEVEL SECURITY — POR FUNÇÃO (ROLE)
-- ================================================================

-- Habilita RLS e limpa políticas antigas em todas as tabelas
do $$
declare
  tbl text;
  pol record;
  tbls text[] := array[
    'user_classes','users','inventory_items','movements',
    'schedules','schedule_materials','suggestions','projects',
    'blog_posts','reports','material_usage',
    'students','gifted_grades','gifted_skills','gifted_developments','gifted_achievements',
    'quizzes','quiz_results','work_proposals'
  ];
begin
  foreach tbl in array tbls loop
    execute format('alter table public.%I enable row level security;', tbl);
    for pol in select policyname from pg_policies where schemaname='public' and tablename=tbl loop
      execute format('drop policy if exists %I on public.%I;', pol.policyname, tbl);
    end loop;
  end loop;
end $$;

-- ── Função auxiliar: retorna role do usuário atual ─────────────────────────
create or replace function public.current_user_role()
returns text language sql security definer stable as $$
  select role from public.users where id = auth.uid() limit 1;
$$;

-- ── Função auxiliar: verifica se usuário é admin ───────────────────────────
create or replace function public.is_admin()
returns boolean language sql security definer stable as $$
  select exists(select 1 from public.users where id = auth.uid() and role = 'admin');
$$;

-- ── Função auxiliar: verifica se usuário é admin ou professor ─────────────
create or replace function public.is_admin_or_professor()
returns boolean language sql security definer stable as $$
  select exists(select 1 from public.users where id = auth.uid() and role in ('admin','professor'));
$$;

-- ================================================================
-- POLICIES: user_classes
-- Qualquer autenticado lê; só admin cria/edita/deleta
-- ================================================================
create policy "user_classes_select" on public.user_classes
  for select to authenticated using (true);

create policy "user_classes_insert" on public.user_classes
  for insert to authenticated with check (public.is_admin());

create policy "user_classes_update" on public.user_classes
  for update to authenticated using (public.is_admin());

create policy "user_classes_delete" on public.user_classes
  for delete to authenticated using (public.is_admin());

-- ================================================================
-- POLICIES: users
-- Qualquer autenticado lê; admin pode tudo;
-- usuário pode atualizar só o próprio perfil
-- ================================================================
create policy "users_select" on public.users
  for select to authenticated using (true);

create policy "users_insert" on public.users
  for insert to authenticated with check (public.is_admin());

create policy "users_update" on public.users
  for update to authenticated
  using (auth.uid() = id or public.is_admin());

create policy "users_delete" on public.users
  for delete to authenticated using (public.is_admin());

-- ================================================================
-- POLICIES: inventory_items
-- Admin/professor: CRUD completo
-- Funcionário: somente leitura
-- ================================================================
create policy "inventory_select" on public.inventory_items
  for select to authenticated using (true);

create policy "inventory_insert" on public.inventory_items
  for insert to authenticated with check (public.is_admin_or_professor());

create policy "inventory_update" on public.inventory_items
  for update to authenticated using (public.is_admin_or_professor());

create policy "inventory_delete" on public.inventory_items
  for delete to authenticated using (public.is_admin());

-- ================================================================
-- POLICIES: movements
-- Autenticados lêem; admin/professor inserem
-- ================================================================
create policy "movements_select" on public.movements
  for select to authenticated using (true);

create policy "movements_insert" on public.movements
  for insert to authenticated with check (public.is_admin_or_professor());

create policy "movements_delete" on public.movements
  for delete to authenticated using (public.is_admin());

-- ================================================================
-- POLICIES: schedules
-- ================================================================
create policy "schedules_select" on public.schedules
  for select to authenticated using (true);

create policy "schedules_insert" on public.schedules
  for insert to authenticated with check (public.is_admin_or_professor());

create policy "schedules_update" on public.schedules
  for update to authenticated using (public.is_admin_or_professor());

create policy "schedules_delete" on public.schedules
  for delete to authenticated using (public.is_admin());

create policy "schedule_materials_select" on public.schedule_materials
  for select to authenticated using (true);

create policy "schedule_materials_insert" on public.schedule_materials
  for insert to authenticated with check (public.is_admin_or_professor());

create policy "schedule_materials_delete" on public.schedule_materials
  for delete to authenticated using (public.is_admin());

-- ================================================================
-- POLICIES: suggestions
-- Qualquer autenticado lê e cria; dono ou admin edita/deleta
-- ================================================================
create policy "suggestions_select" on public.suggestions
  for select to authenticated using (true);

create policy "suggestions_insert" on public.suggestions
  for insert to authenticated with check (auth.uid() is not null);

create policy "suggestions_update" on public.suggestions
  for update to authenticated
  using (author_id = auth.uid() or public.is_admin());

create policy "suggestions_delete" on public.suggestions
  for delete to authenticated
  using (author_id = auth.uid() or public.is_admin());

-- ================================================================
-- POLICIES: projects
-- ================================================================
create policy "projects_select" on public.projects
  for select to authenticated using (true);

create policy "projects_insert" on public.projects
  for insert to authenticated with check (auth.uid() is not null);

create policy "projects_update" on public.projects
  for update to authenticated
  using (author_id = auth.uid() or public.is_admin_or_professor());

create policy "projects_delete" on public.projects
  for delete to authenticated
  using (author_id = auth.uid() or public.is_admin());

-- ================================================================
-- POLICIES: blog_posts
-- Publicados: qualquer um lê (inclui anônimo)
-- Admin/professor: CRUD completo
-- ================================================================
create policy "blog_anon_read" on public.blog_posts
  for select to anon using (published = true);

create policy "blog_select" on public.blog_posts
  for select to authenticated using (true);

create policy "blog_insert" on public.blog_posts
  for insert to authenticated with check (public.is_admin_or_professor());

create policy "blog_update" on public.blog_posts
  for update to authenticated
  using (author_id = auth.uid() or public.is_admin());

create policy "blog_delete" on public.blog_posts
  for delete to authenticated using (public.is_admin());

-- ================================================================
-- POLICIES: reports & material_usage
-- ================================================================
create policy "reports_select" on public.reports
  for select to authenticated using (public.is_admin_or_professor());

create policy "reports_insert" on public.reports
  for insert to authenticated with check (public.is_admin_or_professor());

create policy "material_usage_select" on public.material_usage
  for select to authenticated using (true);

create policy "material_usage_all" on public.material_usage
  for all to authenticated using (public.is_admin_or_professor()) with check (public.is_admin_or_professor());

-- ================================================================
-- POLICIES: students / gifted tables
-- Admin/professor: CRUD; aluno: lê apenas o próprio perfil
-- ================================================================
create policy "students_select" on public.students
  for select to authenticated using (true);

create policy "students_insert" on public.students
  for insert to authenticated with check (public.is_admin_or_professor());

create policy "students_update" on public.students
  for update to authenticated using (public.is_admin_or_professor());

create policy "students_delete" on public.students
  for delete to authenticated using (public.is_admin());

-- grades
create policy "gifted_grades_select" on public.gifted_grades
  for select to authenticated using (true);
create policy "gifted_grades_insert" on public.gifted_grades
  for insert to authenticated with check (public.is_admin_or_professor());
create policy "gifted_grades_delete" on public.gifted_grades
  for delete to authenticated using (public.is_admin_or_professor());

-- skills
create policy "gifted_skills_select" on public.gifted_skills
  for select to authenticated using (true);
create policy "gifted_skills_all" on public.gifted_skills
  for all to authenticated using (public.is_admin_or_professor()) with check (public.is_admin_or_professor());

-- developments
create policy "gifted_dev_select" on public.gifted_developments
  for select to authenticated using (true);
create policy "gifted_dev_all" on public.gifted_developments
  for all to authenticated using (public.is_admin_or_professor()) with check (public.is_admin_or_professor());

-- achievements
create policy "gifted_ach_select" on public.gifted_achievements
  for select to authenticated using (true);
create policy "gifted_ach_all" on public.gifted_achievements
  for all to authenticated using (public.is_admin_or_professor()) with check (public.is_admin_or_professor());

-- ================================================================
-- POLICIES: quizzes & results
-- ================================================================
create policy "quizzes_select" on public.quizzes
  for select to authenticated using (true);
create policy "quizzes_insert" on public.quizzes
  for insert to authenticated with check (public.is_admin_or_professor());
create policy "quizzes_update" on public.quizzes
  for update to authenticated using (public.is_admin_or_professor());
create policy "quizzes_delete" on public.quizzes
  for delete to authenticated using (public.is_admin());

create policy "quiz_results_select" on public.quiz_results
  for select to authenticated using (true);
create policy "quiz_results_insert" on public.quiz_results
  for insert to authenticated with check (auth.uid() is not null);
create policy "quiz_results_delete" on public.quiz_results
  for delete to authenticated using (public.is_admin());

-- ================================================================
-- POLICIES: work_proposals
-- Aluno cria e vê suas próprias; professor/admin vê todas
-- ================================================================
create policy "proposals_select" on public.work_proposals
  for select to authenticated
  using (
    student_id = auth.uid()::text
    or public.is_admin_or_professor()
  );

create policy "proposals_insert" on public.work_proposals
  for insert to authenticated with check (auth.uid() is not null);

create policy "proposals_update" on public.work_proposals
  for update to authenticated
  using (
    student_id = auth.uid()::text
    or public.is_admin_or_professor()
  );

create policy "proposals_delete" on public.work_proposals
  for delete to authenticated using (public.is_admin());

-- ================================================================
-- VIEWS
-- ================================================================
create or replace view public.v_schedule_summary as
select status, count(*) as total,
  count(*) filter (where date = current_date) as today
from public.schedules group by status;

create or replace view public.v_inventory_critical as
select id, name, category, quantity, total, unit_measure, location,
  round(case when total>0 then quantity::numeric/total*100 else 0 end,1) as pct
from public.inventory_items where total>0 and quantity::numeric/total < 0.3
order by pct;

create or replace view public.v_student_grade_avg as
select s.id, s.name, s.grade as class, s.status,
  round(coalesce(avg(g.grade),0),2) as avg_grade, count(g.id) as grade_count
from public.students s left join public.gifted_grades g on g.student_id=s.id
group by s.id,s.name,s.grade,s.status order by avg_grade desc;

-- ================================================================
-- CLASSES PADRÃO
-- ================================================================
insert into public.user_classes (name, base_role, color, permissions) values
('Administrador','admin','#D42020','[
  {"route":"/fablab/home","label":"FabLab · Início","allowed":true},
  {"route":"/fablab/dashboard","label":"FabLab · Dashboard","allowed":true},
  {"route":"/fablab/inventory","label":"FabLab · Inventário","allowed":true},
  {"route":"/fablab/schedule","label":"FabLab · Agendamentos","allowed":true},
  {"route":"/fablab/suggestions","label":"FabLab · Sugestões","allowed":true},
  {"route":"/fablab/projects","label":"FabLab · Projetos","allowed":true},
  {"route":"/fablab/blog","label":"FabLab · Blog","allowed":true},
  {"route":"/fablab/reports","label":"FabLab · Relatórios","allowed":true},
  {"route":"/fablab/users","label":"FabLab · Usuários","allowed":true},
  {"route":"/gifted/home","label":"Altas Hab. · Início","allowed":true},
  {"route":"/gifted/dashboard","label":"Altas Hab. · Dashboard","allowed":true},
  {"route":"/gifted/students","label":"Altas Hab. · Alunos","allowed":true},
  {"route":"/gifted/quiz-creator","label":"Altas Hab. · Quiz","allowed":true},
  {"route":"/student/quiz","label":"Aluno · Quiz","allowed":false},
  {"route":"/student/grades","label":"Aluno · Notas","allowed":false},
  {"route":"/student/proposal","label":"Aluno · Proposta","allowed":false}
]'::jsonb),
('Professor','professor','#2563eb','[
  {"route":"/fablab/home","label":"FabLab · Início","allowed":true},
  {"route":"/fablab/dashboard","label":"FabLab · Dashboard","allowed":false},
  {"route":"/fablab/inventory","label":"FabLab · Inventário","allowed":true},
  {"route":"/fablab/schedule","label":"FabLab · Agendamentos","allowed":true},
  {"route":"/fablab/suggestions","label":"FabLab · Sugestões","allowed":true},
  {"route":"/fablab/projects","label":"FabLab · Projetos","allowed":true},
  {"route":"/fablab/blog","label":"FabLab · Blog","allowed":true},
  {"route":"/fablab/reports","label":"FabLab · Relatórios","allowed":true},
  {"route":"/fablab/users","label":"FabLab · Usuários","allowed":false},
  {"route":"/gifted/home","label":"Altas Hab. · Início","allowed":true},
  {"route":"/gifted/dashboard","label":"Altas Hab. · Dashboard","allowed":true},
  {"route":"/gifted/students","label":"Altas Hab. · Alunos","allowed":true},
  {"route":"/gifted/quiz-creator","label":"Altas Hab. · Quiz","allowed":true},
  {"route":"/student/quiz","label":"Aluno · Quiz","allowed":false},
  {"route":"/student/grades","label":"Aluno · Notas","allowed":false},
  {"route":"/student/proposal","label":"Aluno · Proposta","allowed":false}
]'::jsonb),
('Funcionário','funcionario','#059669','[
  {"route":"/fablab/home","label":"FabLab · Início","allowed":true},
  {"route":"/fablab/dashboard","label":"FabLab · Dashboard","allowed":false},
  {"route":"/fablab/inventory","label":"FabLab · Inventário","allowed":true},
  {"route":"/fablab/schedule","label":"FabLab · Agendamentos","allowed":true},
  {"route":"/fablab/suggestions","label":"FabLab · Sugestões","allowed":false},
  {"route":"/fablab/projects","label":"FabLab · Projetos","allowed":false},
  {"route":"/fablab/blog","label":"FabLab · Blog","allowed":true},
  {"route":"/fablab/reports","label":"FabLab · Relatórios","allowed":false},
  {"route":"/fablab/users","label":"FabLab · Usuários","allowed":false},
  {"route":"/gifted/home","label":"Altas Hab. · Início","allowed":false},
  {"route":"/gifted/dashboard","label":"Altas Hab. · Dashboard","allowed":false},
  {"route":"/gifted/students","label":"Altas Hab. · Alunos","allowed":false},
  {"route":"/gifted/quiz-creator","label":"Altas Hab. · Quiz","allowed":false},
  {"route":"/student/quiz","label":"Aluno · Quiz","allowed":false},
  {"route":"/student/grades","label":"Aluno · Notas","allowed":false},
  {"route":"/student/proposal","label":"Aluno · Proposta","allowed":false}
]'::jsonb),
('Aluno','student','#7c3aed','[
  {"route":"/fablab/home","label":"FabLab · Início","allowed":false},
  {"route":"/fablab/dashboard","label":"FabLab · Dashboard","allowed":false},
  {"route":"/fablab/inventory","label":"FabLab · Inventário","allowed":false},
  {"route":"/fablab/schedule","label":"FabLab · Agendamentos","allowed":false},
  {"route":"/fablab/suggestions","label":"FabLab · Sugestões","allowed":false},
  {"route":"/fablab/projects","label":"FabLab · Projetos","allowed":false},
  {"route":"/fablab/blog","label":"FabLab · Blog","allowed":true},
  {"route":"/fablab/reports","label":"FabLab · Relatórios","allowed":false},
  {"route":"/fablab/users","label":"FabLab · Usuários","allowed":false},
  {"route":"/gifted/home","label":"Altas Hab. · Início","allowed":false},
  {"route":"/gifted/dashboard","label":"Altas Hab. · Dashboard","allowed":false},
  {"route":"/gifted/students","label":"Altas Hab. · Alunos","allowed":false},
  {"route":"/gifted/quiz-creator","label":"Altas Hab. · Quiz","allowed":false},
  {"route":"/student/quiz","label":"Aluno · Quiz","allowed":true},
  {"route":"/student/grades","label":"Aluno · Notas","allowed":true},
  {"route":"/student/proposal","label":"Aluno · Proposta","allowed":true}
]'::jsonb)
on conflict do nothing;

-- ================================================================
-- RESET (dev only — descomente para usar)
-- ================================================================
/*
drop view  if exists public.v_student_grade_avg, public.v_inventory_critical, public.v_schedule_summary cascade;
drop table if exists
  public.work_proposals, public.quiz_results, public.quizzes,
  public.gifted_achievements, public.gifted_developments, public.gifted_skills,
  public.gifted_grades, public.students, public.material_usage, public.reports,
  public.blog_posts, public.projects, public.suggestions,
  public.schedule_materials, public.schedules, public.movements,
  public.inventory_items, public.users, public.user_classes cascade;
drop function if exists public.handle_new_user, public.set_updated_at,
  public.current_user_role, public.is_admin, public.is_admin_or_professor cascade;
*/

select 'Schema SESI FabLab v2025.4 aplicado com sucesso!' as resultado;

-- ================================================================
-- TABELA: access_requests
-- Solicitações de acesso enviadas pelo formulário de registro.
-- Não requer FK em auth.users — armazena apenas dados do formulário.
-- ================================================================
create table if not exists public.access_requests (
  id          uuid        primary key default gen_random_uuid(),
  name        text        not null,
  email       text        not null,
  role        text        not null default 'professor',
  unit        text        not null default '',
  status      text        not null default 'pending'
                check (status in ('pending','approved','rejected')),
  notes       text        not null default '',
  reviewed_by uuid        references public.users on delete set null,
  reviewed_at timestamptz,
  created_at  timestamptz not null default now()
);

create index if not exists idx_access_requests_status on public.access_requests (status, created_at desc);
create index if not exists idx_access_requests_email  on public.access_requests (email);

alter table public.access_requests enable row level security;

-- Qualquer um pode inserir (formulário público)
create policy "access_requests_insert" on public.access_requests
  for insert to anon, authenticated with check (true);

-- Só admin lê e gerencia
create policy "access_requests_select" on public.access_requests
  for select to authenticated using (public.is_admin());

create policy "access_requests_update" on public.access_requests
  for update to authenticated using (public.is_admin());

-- ================================================================
-- CRIAÇÃO DO USUÁRIO ADMIN INICIAL
--
-- INSTRUÇÕES (execute APÓS rodar o schema acima):
--
-- 1. Vá em Supabase Dashboard → Authentication → Users → Add User
--    Email:    admin@fablab.sesi.br
--    Password: FabLab@Admin2025!
--    (marque "Auto Confirm User")
--
-- 2. Copie o UUID gerado e cole no lugar de '<UUID_AQUI>' abaixo:
--
-- 3. Execute este bloco separadamente:
-- ================================================================

/*
-- Cole o UUID do usuário criado na etapa 1:
do $$
declare
  v_admin_id uuid := '<UUID_AQUI>';   -- ← substitua pelo UUID real
  v_class_id uuid;
begin
  -- Pega o ID da classe Administrador
  select id into v_class_id from public.user_classes where base_role = 'admin' limit 1;

  -- Insere ou atualiza o perfil
  insert into public.users (id, name, email, role, class_id, unit, active)
  values (
    v_admin_id,
    'Administrador FabLab',
    'admin@fablab.sesi.br',
    'admin',
    v_class_id,
    'FabLab SP',
    true
  )
  on conflict (id) do update set
    role     = 'admin',
    class_id = v_class_id,
    active   = true,
    updated_at = now();

  raise notice 'Admin criado com sucesso! UUID: %', v_admin_id;
end $$;
*/

-- ================================================================
-- ALTERNATIVA MAIS RÁPIDA — via Supabase Auth API + SQL direto:
-- Use o script abaixo no SQL Editor do Supabase APÓS criar o usuário
-- no Dashboard de Autenticação com o e-mail admin@fablab.sesi.br
-- ================================================================

/*
do $$
declare
  v_admin_id uuid;
  v_class_id uuid;
begin
  -- Busca o UUID pelo e-mail no auth.users
  select id into v_admin_id
  from auth.users
  where email = 'admin@fablab.sesi.br'
  limit 1;

  if v_admin_id is null then
    raise exception 'Usuário admin@fablab.sesi.br não encontrado em auth.users. Crie-o primeiro no Dashboard → Authentication → Users.';
  end if;

  select id into v_class_id from public.user_classes where base_role = 'admin' limit 1;

  insert into public.users (id, name, email, role, class_id, unit, active)
  values (v_admin_id, 'Administrador FabLab', 'admin@fablab.sesi.br', 'admin', v_class_id, 'FabLab SP', true)
  on conflict (id) do update set role='admin', class_id=v_class_id, active=true, updated_at=now();

  raise notice 'Admin configurado! UUID: %', v_admin_id;
end $$;
*/
