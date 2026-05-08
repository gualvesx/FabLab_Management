import { useNavigate } from 'react-router-dom';
import { HelpCircle, GraduationCap, FileText } from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import { PageTransition } from '@/components/layout/PageTransition';

export function StudentHome() {
  const { user } = useAuthStore();
  const navigate = useNavigate();

  return (
    <PageTransition>
      <div className="relative rounded-2xl p-8 md:p-10 mb-6 overflow-hidden text-white" style={{ background: 'linear-gradient(135deg, #1e40af 0%, #2563EB 60%, #60A5FA 100%)' }}>
        <h1 className="text-3xl md:text-4xl font-serif mb-2">Área do Aluno</h1>
        <p className="text-sm opacity-85 max-w-md leading-relaxed">
          Olá, {user?.name?.split(' ').slice(0, 2).join(' ')}. Acesse seus quiz, notas e propostas de trabalho.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {[
          { icon: <HelpCircle size={20} />, title: 'Meus Quiz', desc: 'Quiz disponíveis para você', path: '/student/quiz' },
          { icon: <GraduationCap size={20} />, title: 'Minhas Notas', desc: 'Acompanhe suas notas', path: '/student/grades' },
          { icon: <FileText size={20} />, title: 'Proposta de Trabalho', desc: 'Envie propostas de pesquisa', path: '/student/proposal' },
        ].map((f) => (
          <button key={f.path} onClick={() => navigate(f.path)}
            className="bg-card border border-border rounded-xl p-5 text-left transition-all hover:shadow-md hover:-translate-y-0.5 hover:border-muted-foreground/30 group">
            <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center mb-3 group-hover:gift-bg group-hover:gift-primary transition-colors">
              <span className="text-muted-foreground group-hover:gift-primary transition-colors">{f.icon}</span>
            </div>
            <div className="font-bold text-sm mb-0.5">{f.title}</div>
            <div className="text-xs text-muted-foreground">{f.desc}</div>
          </button>
        ))}
      </div>
    </PageTransition>
  );
}
