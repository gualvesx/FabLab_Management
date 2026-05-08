import { useState, useEffect } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { TopBar } from './TopBar';
import { Sidebar } from './Sidebar';
import { useAuthStore } from '@/stores/authStore';
import { useThemeStore } from '@/stores/themeStore';
import { useLanguageStore } from '@/stores/languageStore';
import { useClassStore } from '@/stores/classStore';
import type { AppModule } from '@/types';
import i18n from '@/i18n';

export function AppLayout() {
  const { user, isAuthenticated } = useAuthStore();
  const { isDark } = useThemeStore();
  const { lang } = useLanguageStore();
  const { classes, fetchClasses } = useClassStore();
  const navigate = useNavigate();
  const location = useLocation();
  const [collapsed] = useState(false);

  // Load classes once on mount
  useEffect(() => { if (classes.length === 0) fetchClasses(); }, []);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/landing');
      return;
    }
    // Students always go to student area
    if (user?.role === 'student' && !location.pathname.startsWith('/student')) {
      navigate('/student/quiz');
      return;
    }
    // Check class-based route permissions
    if (user && user.role !== 'admin') {
      const cls = classes.find(c => c.id === user.class_id);
      if (cls) {
        const allowed = cls.permissions.filter(p => p.allowed).map(p => p.route as string);
        const currentPath = location.pathname;
        const isAllowed = allowed.some(r => currentPath.startsWith(r));
        if (!isAllowed && currentPath !== '/' && allowed.length > 0) {
          navigate(allowed[0]);
        }
      }
    }
  }, [isAuthenticated, user, navigate, location, classes]);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDark);
  }, [isDark]);

  useEffect(() => { i18n.changeLanguage(lang); }, [lang]);

  if (!isAuthenticated || !user) return null;

  const getActiveModule = (): AppModule => {
    if (location.pathname.startsWith('/fablab')) return 'fablab';
    if (location.pathname.startsWith('/gifted')) return 'gifted';
    return 'student';
  };

  const handleModuleChange = (mod: AppModule) => {
    if (mod === 'fablab') navigate('/fablab/home');
    else if (mod === 'gifted') navigate('/gifted/home');
  };

  const activeModule = getActiveModule();

  if (user.role === 'student') {
    return (
      <div className="min-h-screen bg-background">
        <TopBar activeModule="student" onModuleChange={() => {}} />
        <div className="flex">
          <Sidebar module="student" role={user.role} collapsed={collapsed} />
          <main className="flex-1 p-6 lg:p-8 overflow-y-auto max-h-[calc(100vh-64px)]">
            <Outlet />
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <TopBar activeModule={activeModule} onModuleChange={handleModuleChange} />
      <div className="flex">
        <Sidebar module={activeModule} role={user.role} collapsed={collapsed} />
        <main className="flex-1 p-6 lg:p-8 overflow-y-auto max-h-[calc(100vh-64px)]">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
