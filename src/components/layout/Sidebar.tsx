import { useLocation, useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '@/stores/authStore';
import { useClassStore } from '@/stores/classStore';
import { useEffect } from 'react';
import type { UserRole } from '@/types';
import {
  Home, LayoutDashboard, Package, Calendar, Lightbulb, Wrench,
  BarChart3, Users, GraduationCap, FileText, HelpCircle, BookOpen
} from 'lucide-react';

interface SidebarProps {
  module: 'fablab' | 'gifted' | 'student';
  role: UserRole;
  collapsed: boolean;
}

interface NavItem {
  label: string;
  path: string;
  icon: React.ReactNode;
  divider?: boolean;
  adminOnly?: boolean;
}

export function Sidebar({ module, role, collapsed }: SidebarProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { user } = useAuthStore();
  const { classes, fetchClasses } = useClassStore();

  useEffect(() => { if (classes.length === 0) fetchClasses(); }, []);

  const isActive = (path: string) => {
    if (path === '/') return location.pathname === path;
    return location.pathname.startsWith(path);
  };

  // Get allowed routes for current user via their class
  const getAllowedRoutes = (): Set<string> => {
    if (role === 'admin') return new Set(['*']); // admin sees everything
    if (!user?.class_id) {
      // No class assigned — fall back to base role defaults
      const defaults: Record<string, string[]> = {
        professor: ['/fablab/home','/fablab/inventory','/fablab/schedule','/fablab/suggestions','/fablab/projects','/fablab/blog','/fablab/reports','/gifted/home','/gifted/dashboard','/gifted/students','/gifted/quiz-creator'],
        funcionario: ['/fablab/home','/fablab/inventory','/fablab/schedule','/fablab/blog'],
        student: ['/student/quiz','/student/grades','/student/proposal','/fablab/blog'],
      };
      return new Set(defaults[role as string] || []);
    }
    const cls = classes.find(c => c.id === user.class_id);
    if (!cls) return new Set();
    return new Set(cls.permissions.filter(p => p.allowed).map(p => p.route));
  };

  const allowed = getAllowedRoutes();
  const canSee = (path: string) => allowed.has('*') || allowed.has(path);

  const fabNav: NavItem[] = [
    { label: t('fablab.home'),        path: '/fablab/home',        icon: <Home size={18} /> },
    { label: t('fablab.dashboard'),   path: '/fablab/dashboard',   icon: <LayoutDashboard size={18} />, adminOnly: true },
    { divider: true, label: '', path: '', icon: null },
    { label: t('fablab.inventory'),   path: '/fablab/inventory',   icon: <Package size={18} /> },
    { label: t('fablab.schedule'),    path: '/fablab/schedule',    icon: <Calendar size={18} /> },
    { label: 'Sugestões de Projetos', path: '/fablab/suggestions', icon: <Lightbulb size={18} /> },
    { label: t('fablab.projects'),    path: '/fablab/projects',    icon: <Wrench size={18} /> },
    { label: 'Blog',                  path: '/fablab/blog',        icon: <BookOpen size={18} /> },
    { divider: true, label: '', path: '', icon: null },
    { label: t('fablab.reports'),     path: '/fablab/reports',     icon: <BarChart3 size={18} /> },
    { label: t('fablab.users'),       path: '/fablab/users',       icon: <Users size={18} />, adminOnly: true },
  ];

  const giftedNav: NavItem[] = [
    { label: t('gifted.home'),        path: '/gifted/home',         icon: <Home size={18} /> },
    { label: t('gifted.dashboard'),   path: '/gifted/dashboard',    icon: <LayoutDashboard size={18} /> },
    { divider: true, label: '', path: '', icon: null },
    { label: t('gifted.students'),    path: '/gifted/students',     icon: <Users size={18} /> },
    { label: t('gifted.quizCreator'), path: '/gifted/quiz-creator', icon: <HelpCircle size={18} /> },
  ];

  const studentNav: NavItem[] = [
    { label: t('student.myQuiz'),     path: '/student/quiz',      icon: <HelpCircle size={18} /> },
    { label: t('student.myGrades'),   path: '/student/grades',    icon: <GraduationCap size={18} /> },
    { label: t('student.myProposal'), path: '/student/proposal',  icon: <FileText size={18} /> },
  ];

  let navItems = module === 'fablab' ? fabNav : module === 'gifted' ? giftedNav : studentNav;

  // Filter by adminOnly flag AND class permissions
  const filteredNav = navItems.filter(item => {
    if (!item.path) return true; // dividers
    if (item.adminOnly && role !== 'admin') return false;
    return canSee(item.path);
  });

  const isFab = module === 'fablab';
  const accentColor = isFab ? 'var(--fab-primary)' : 'var(--gift-primary)';

  return (
    <nav className={cn(
      'bg-card border-r border-border flex flex-col py-3 h-[calc(100vh-64px)] sticky top-16 overflow-y-auto transition-all duration-200',
      collapsed ? 'w-16' : 'w-64'
    )}>
      {filteredNav.map((item, idx) => {
        if (item.divider) return <div key={idx} className="my-1.5 mx-3 h-px bg-border" />;
        const active = isActive(item.path);
        return (
          <button
            key={item.path}
            onClick={() => navigate(item.path)}
            title={collapsed ? item.label : undefined}
            className={cn(
              'flex items-center mx-2 rounded-lg transition-all duration-150 text-sm font-medium',
              collapsed ? 'justify-center h-10 w-10 mx-auto' : 'gap-3 px-3 h-9',
              active
                ? 'text-white'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted'
            )}
            style={active ? { background: accentColor } : {}}
          >
            <span className="flex-shrink-0">{item.icon}</span>
            {!collapsed && <span className="truncate">{item.label}</span>}
          </button>
        );
      })}
    </nav>
  );
}
