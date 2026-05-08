import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '@/stores/authStore';
import { useStudentStore } from '@/stores/studentStore';
import { PageTransition } from '@/components/layout/PageTransition';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar
} from 'recharts';
import { cn } from '@/lib/utils';

export function StudentGrades() {
  const { t } = useTranslation();
  const { user } = useAuthStore();
  const { students, fetchStudents } = useStudentStore();

  useEffect(() => { fetchStudents(); }, []);

  const student = students.find((s) => s.id === user?.id);

  if (!student) {
    return (
      <PageTransition>
        <div className="text-center py-20 text-muted-foreground">{t('student.studentNotFound')}</div>
      </PageTransition>
    );
  }

  const avgGrade = student.gifted_grades.length > 0
    ? student.gifted_grades.reduce((a, g) => a + g.grade, 0) / student.gifted_grades.length
    : 0;

  const gradeByPeriod = [...new Set(student.gifted_grades.map((g) => g.period))].map((p) => {
    const grades = student.gifted_grades.filter((g) => g.period === p);
    return { period: p, avg: grades.reduce((a, g) => a + g.grade, 0) / grades.length };
  });

  const gradeBySubject = [...new Set(student.gifted_grades.map((g) => g.subject))].map((s) => {
    const grades = student.gifted_grades.filter((g) => g.subject === s);
    return { subject: s, avg: grades.reduce((a, g) => a + g.grade, 0) / grades.length };
  }).sort((a, b) => b.avg - a.avg);

  const radarData = student.gifted_skills.map((s) => ({ area: s.area.split('-')[0].slice(0, 12), score: s.score }));

  return (
    <PageTransition>
      <div className="mb-6">
        <h1 className="text-xl font-extrabold">{t('student.gradesTitle')}</h1>
        <p className="text-sm text-muted-foreground">{t('student.gradesSubtitle')}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        <div className="bg-card border border-border rounded-xl p-5 text-center border-l-[3px] border-l-[#2563EB]">
          <div className="text-3xl font-extrabold">{avgGrade.toFixed(1)}</div>
          <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mt-1">Média geral</div>
        </div>
        <div className="bg-card border border-border rounded-xl p-5 text-center border-l-[3px] border-l-[#2563EB]">
          <div className="text-3xl font-extrabold">{student.gifted_grades.length}</div>
          <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mt-1">Registros de nota</div>
        </div>
        <div className="bg-card border border-border rounded-xl p-5 text-center border-l-[3px] border-l-[#2563EB]">
          <div className="text-lg font-extrabold truncate">{student.gifted_skills.length > 0 ? student.gifted_skills.sort((a, b) => b.score - a.score)[0].area : '-'}</div>
          <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mt-1">Top habilidade</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
        {gradeByPeriod.length >= 2 && (
          <div className="bg-card border border-border rounded-xl p-5">
            <h3 className="font-bold text-sm mb-3">Evolução por período</h3>
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={gradeByPeriod}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                <XAxis dataKey="period" tick={{ fontSize: 10 }} />
                <YAxis domain={[0, 10]} tick={{ fontSize: 10 }} />
                <Tooltip />
                <Line type="monotone" dataKey="avg" stroke="#2563EB" strokeWidth={2} dot={{ r: 4, fill: '#2563EB', stroke: '#fff', strokeWidth: 2 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
        {radarData.length >= 3 && (
          <div className="bg-card border border-border rounded-xl p-5">
            <h3 className="font-bold text-sm mb-3">Mapa de Habilidades</h3>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={radarData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 10 }} />
                <YAxis dataKey="area" type="category" tick={{ fontSize: 10 }} width={80} />
                <Tooltip />
                <Bar dataKey="score" fill="#2563EB" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {gradeBySubject.length > 0 && (
        <div className="bg-card border border-border rounded-xl p-5 mb-6">
          <h3 className="font-bold text-sm mb-3">{t('gifted.avgBySubject')}</h3>
          <div className="space-y-2">
            {gradeBySubject.map((s) => (
              <div key={s.subject} className="flex items-center gap-3">
                <span className="text-xs w-24 truncate">{s.subject}</span>
                <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                  <div className="h-full rounded-full" style={{ width: `${s.avg * 10}%`, background: 'var(--gift-primary)' }} />
                </div>
                <span className="text-xs font-bold w-6 text-right">{s.avg.toFixed(1)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-border font-bold text-sm">Notas detalhadas ({student.gifted_grades.length})</div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="bg-muted/50 text-left">
              <th className="px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Disciplina</th>
              <th className="px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Nota</th>
              <th className="px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">{t('app.period')}</th>
              <th className="px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">{t('app.date')}</th>
            </tr></thead>
            <tbody className="divide-y divide-border">
              {[...student.gifted_grades].sort((a, b) => b.date.localeCompare(a.date)).map((g) => (
                <tr key={g.id}>
                  <td className="px-4 py-3 font-semibold">{g.subject}</td>
                  <td className="px-4 py-3">
                    <span className={cn('font-bold', g.grade >= 9 ? 'text-emerald-600' : g.grade >= 7 ? 'text-amber-600' : 'text-red-600')}>{g.grade.toFixed(1)}</span>
                  </td>
                  <td className="px-4 py-3 text-xs">{g.period}</td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">{g.date}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </PageTransition>
  );
}
