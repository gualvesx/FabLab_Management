import { useNavigate } from 'react-router-dom';
import { LayoutDashboard, Package, Calendar, Lightbulb, Wrench, BarChart3, Users } from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import { useTranslation } from 'react-i18next';
import { PageTransition } from '@/components/layout/PageTransition';

interface Feature {
  icon: React.ReactNode;
  title: string;
  desc: string;
  path: string;
}

export function FabHome() {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const { t } = useTranslation();

  let features: Feature[] = [];

  if (user?.role === 'admin') {
    features = [
      { icon: <LayoutDashboard size={20} />, title: t('fablab.dashboard'), desc: 'Visão geral e métricas', path: '/fablab/dashboard' },
      { icon: <Package size={20} />, title: t('fablab.inventory'), desc: 'Controle de entradas e saídas', path: '/fablab/inventory' },
      { icon: <Calendar size={20} />, title: t('fablab.schedule'), desc: 'Reservas do laboratório', path: '/fablab/schedule' },
      { icon: <Lightbulb size={20} />, title: t('fablab.suggestions'), desc: 'Banco de ideias pedagógicas', path: '/fablab/suggestions' },
      { icon: <Wrench size={20} />, title: t('fablab.projects'), desc: 'Repositório de projetos', path: '/fablab/projects' },
      { icon: <BarChart3 size={20} />, title: t('fablab.reports'), desc: 'Diário, semanal e mensal', path: '/fablab/reports' },
      { icon: <Users size={20} />, title: t('fablab.users'), desc: 'Gerenciar acessos', path: '/fablab/users' },
    ];
  } else if (user?.role === 'professor') {
    features = [
      { icon: <Calendar size={20} />, title: t('fablab.schedule'), desc: 'Agende o FabLab', path: '/fablab/schedule' },
      { icon: <Lightbulb size={20} />, title: t('fablab.suggestions'), desc: 'Proponha e vote', path: '/fablab/suggestions' },
      { icon: <Wrench size={20} />, title: t('fablab.projects'), desc: 'Salve projetos', path: '/fablab/projects' },
      { icon: <BarChart3 size={20} />, title: t('fablab.reports'), desc: 'Consulte relatórios', path: '/fablab/reports' },
    ];
  } else {
    features = [
      { icon: <Calendar size={20} />, title: t('fablab.schedule'), desc: 'Consulte a agenda', path: '/fablab/schedule' },
      { icon: <Wrench size={20} />, title: t('fablab.projects'), desc: 'Veja projetos', path: '/fablab/projects' },
    ];
  }

  return (
    <PageTransition>
      {/* Hero */}
      <div
        className="relative rounded-2xl p-8 md:p-10 mb-6 overflow-hidden text-white"
        style={{ background: 'linear-gradient(135deg, #991b1b 0%, #D42020 60%, #FF6B6B 100%)' }}
      >
        <span className="absolute right-[-20px] bottom-[-40px] text-[160px] font-serif italic opacity-[0.07] leading-none select-none pointer-events-none">
          SESI
        </span>
        <div className="text-xs italic opacity-70 mb-1 font-serif">Módulo</div>
        <h1 className="text-3xl md:text-4xl font-serif mb-2">FabLab SESI</h1>
        <p className="text-sm opacity-85 max-w-md leading-relaxed">
          {t('auth.welcome')}, {user?.name?.split(' ').slice(0, 2).join(' ')}. Bem-vindo ao sistema de gerenciamento do laboratório de fabricação digital.
        </p>
      </div>

      {/* Features Grid */}
      <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-4">
        Módulos disponíveis
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
        {features.map((f) => (
          <button
            key={f.path}
            onClick={() => navigate(f.path)}
            className="bg-card border border-border rounded-xl p-5 text-left transition-all hover:shadow-md hover:-translate-y-0.5 hover:border-muted-foreground/30 group"
          >
            <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center mb-3 transition-colors group-hover:fab-bg group-hover:fab-primary">
              <span className="text-muted-foreground group-hover:fab-primary transition-colors">{f.icon}</span>
            </div>
            <div className="font-bold text-sm mb-0.5">{f.title}</div>
            <div className="text-xs text-muted-foreground">{f.desc}</div>
          </button>
        ))}
      </div>
    </PageTransition>
  );
}
