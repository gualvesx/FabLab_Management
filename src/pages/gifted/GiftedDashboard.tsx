import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
// lucide imports used inline
import { Badge } from '@/components/ui/badge';
import { useStudentStore } from '@/stores/studentStore';
import { SKILL_AREAS } from '@/lib/constants';
import { PageTransition } from '@/components/layout/PageTransition';

export function GiftedDashboard() {
  const { t } = useTranslation();
  const { students, fetchStudents } = useStudentStore();

  useEffect(() => { fetchStudents(); }, []);

  const navigate = useNavigate();

  const total = students.length;
  const identified = students.filter((s) => s.status === 'identificado').length;
  const evaluating = students.filter((s) => s.status === 'em_avaliacao').length;
  const monitoring = students.filter((s) => s.status === 'monitoramento').length;

  const areaCounts = SKILL_AREAS.map((area) => ({
    area,
    count: students.filter((s) => s.primary_areas.includes(area)).length,
  })).sort((a, b) => b.count - a.count);

  return (
    <PageTransition>
      <div className="mb-6">
        <h1 className="text-xl font-extrabold">Visão Geral</h1>
        <p className="text-sm text-muted-foreground">{t('gifted.dashboardSubtitle')}</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <div className="bg-card border border-border rounded-xl p-4 border-l-[3px] border-l-[#2563EB]">
          <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">{t('gifted.totalStudents')}</div>
          <div className="text-3xl font-extrabold">{total}</div>
        </div>
        <div className="bg-card border border-border rounded-xl p-4 border-l-[3px] border-l-[#D97706]">
          <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">{t('gifted.identifiedStudents')}</div>
          <div className="text-3xl font-extrabold">{identified}</div>
        </div>
        <div className="bg-card border border-border rounded-xl p-4 border-l-[3px] border-l-[#D97706]">
          <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">{t('gifted.inEvaluationStudents')}</div>
          <div className="text-3xl font-extrabold">{evaluating}</div>
        </div>
        <div className="bg-card border border-border rounded-xl p-4 border-l-[3px] border-l-[#16A34A]">
          <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">{t('gifted.monitoringStudents')}</div>
          <div className="text-3xl font-extrabold">{monitoring}</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-card border border-border rounded-xl p-5">
          <h3 className="font-bold text-sm mb-4">{t('gifted.topAreas')}</h3>
          {areaCounts.map((a) => (
            <div key={a.area} className="flex items-center gap-3 mb-3">
              <span className="text-xs w-28 truncate">{a.area}</span>
              <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                <div className="h-full rounded-full transition-all" style={{ width: total > 0 ? (a.count / total * 100) + '%' : '0%', background: 'var(--gift-primary)' }} />
              </div>
              <span className="text-xs font-bold w-6 text-right">{a.count}</span>
            </div>
          ))}
        </div>

        <div className="bg-card border border-border rounded-xl p-5">
          <h3 className="font-bold text-sm mb-4">{t('gifted.recentStudents')}</h3>
          <div className="space-y-2">
            {students.slice(0, 5).map((s) => (
              <button key={s.id} onClick={() => navigate(`/gifted/student/${s.id}`)}
                className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors text-left">
                <div className="w-9 h-9 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs font-bold flex-shrink-0">
                  {s.name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-sm">{s.name}</div>
                  <div className="text-xs text-muted-foreground">{s.grade} · {s.school}</div>
                </div>
                <Badge variant={s.status === 'identificado' ? 'secondary' : s.status === 'em_avaliacao' ? 'default' : 'default'}>
                  {s.status === 'identificado' ? 'Identificado' : s.status === 'em_avaliacao' ? 'Em avaliação' : 'Monitoramento'}
                </Badge>
              </button>
            ))}
          </div>
        </div>
      </div>
    </PageTransition>
  );
}
