import { useNavigate } from 'react-router-dom';
import { Sun, Moon, Globe, LogOut, FlaskConical, Brain } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useAuthStore } from '@/stores/authStore';
import { useThemeStore } from '@/stores/themeStore';
import { useLanguageStore } from '@/stores/languageStore';
import { useTranslation } from 'react-i18next';
import type { AppModule } from '@/types';
import { cn } from '@/lib/utils';

interface TopBarProps {
  activeModule: AppModule;
  onModuleChange: (m: AppModule) => void;
}

export function TopBar({ activeModule, onModuleChange }: TopBarProps) {
  const { user, logout } = useAuthStore();
  const { isDark, toggle: toggleTheme } = useThemeStore();
  const { lang, toggle: toggleLang } = useLanguageStore();
  const { t } = useTranslation();
  const navigate = useNavigate();

  const isFab = activeModule === 'fablab';
  const isStudent = user?.role === 'student';

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <header className="h-16 bg-card border-b border-border flex items-center px-4 gap-4 sticky top-0 z-50 shadow-sm">
      <button
        onClick={() => navigate('/landing')}
        className="flex items-center gap-3 hover:opacity-75 transition-opacity"
        title="Ver página inicial"
      >
        <img
          src="https://www.sesisp.org.br/images/Sesi-SP.jpg"
          alt="SESI"
          className="h-8 w-auto object-contain"
          onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
        />
        <span className="text-sm font-bold tracking-wider" style={{ color: isFab ? 'var(--fab-primary)' : 'var(--gift-primary)' }}>
          FabLab
        </span>
      </button>

      <div className="w-px h-7 bg-border" />

      <div className="flex gap-1 flex-1">
        {!isStudent && (
          <>
            <button
              onClick={() => onModuleChange('fablab')}
              className={cn(
                'flex items-center gap-2 px-4 py-1.5 rounded-lg text-sm font-semibold transition-all',
                isFab
                  ? 'fab-bg fab-primary'
                  : 'text-muted-foreground hover:bg-muted'
              )}
            >
              <FlaskConical size={16} />
              {t('modules.fablab')}
            </button>
            <button
              onClick={() => onModuleChange('gifted')}
              className={cn(
                'flex items-center gap-2 px-4 py-1.5 rounded-lg text-sm font-semibold transition-all',
                activeModule === 'gifted'
                  ? 'gift-bg gift-primary'
                  : 'text-muted-foreground hover:bg-muted'
              )}
            >
              <Brain size={16} />
              {t('modules.gifted')}
            </button>
          </>
        )}
        {isStudent && (
          <span className="flex items-center gap-2 px-4 py-1.5 text-sm font-semibold gift-bg gift-primary rounded-lg">
            <Brain size={16} />
            {t('modules.student')}
          </span>
        )}
      </div>

      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleTheme}
          className="h-9 w-9"
          title={isDark ? t('theme.light') : t('theme.dark')}
        >
          {isDark ? <Sun size={18} /> : <Moon size={18} />}
        </Button>

        <Button
          variant="ghost"
          size="sm"
          onClick={toggleLang}
          className="h-9 px-2 text-xs font-bold gap-1"
        >
          <Globe size={14} />
          {lang === 'pt' ? 'EN' : 'PT'}
        </Button>

        <div className="w-px h-7 bg-border mx-1" />

        <div className="flex items-center gap-2 px-2">
          <Avatar className="h-8 w-8" style={{ background: isFab ? 'var(--fab-bg)' : 'var(--gift-bg)' }}>
            <AvatarFallback
              className="text-xs font-bold"
              style={{ color: isFab ? 'var(--fab-primary)' : 'var(--gift-primary)' }}
            >
              {user?.name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || 'U'}
            </AvatarFallback>
          </Avatar>
          <div className="hidden md:block">
            <div className="text-sm font-semibold leading-tight">{user?.name?.split(' ').slice(0, 2).join(' ')}</div>
            <div className="text-xs text-muted-foreground">{user?.role ? t(`roles.${user.role}`) : ''}</div>
          </div>
        </div>

        <Button
          variant="ghost"
          size="icon"
          onClick={handleLogout}
          className="h-9 w-9 text-muted-foreground hover:text-destructive"
          title={t('app.logout')}
        >
          <LogOut size={18} />
        </Button>
      </div>
    </header>
  );
}
