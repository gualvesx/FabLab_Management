import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, TrendingUp, Award, Lightbulb, BookOpen, CheckCircle,
  Brain, FileText, HelpCircle, Plus
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { useStudentStore } from '@/stores/studentStore';
import { useQuizStore } from '@/stores/quizStore';
import { useProposalStore } from '@/stores/proposalStore';
import { useAuthStore } from '@/stores/authStore';
import { SKILL_AREAS } from '@/lib/constants';
import { PageTransition } from '@/components/layout/PageTransition';
import { cn } from '@/lib/utils';
import type { Achievement } from '@/types';

import {
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar,
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';

export function StudentProfile() {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { students, addGrade, addSkill, addDevelopment, addAchievement, fetchStudents } = useStudentStore();

  useEffect(() => { fetchStudents(); }, []);
  const { quizzes, getStudentResults, hasCompletedQuiz } = useQuizStore();
  const { getStudentProposals, addProposal } = useProposalStore();
  const { user } = useAuthStore();

  const student = students.find((s) => s.id === id);
  const [tab, setTab] = useState('overview');

  // Modals
  const [gradeModal, setGradeModal] = useState(false);
  const [skillModal, setSkillModal] = useState(false);
  const [devModal, setDevModal] = useState(false);
  const [achModal, setAchModal] = useState(false);
  const [proposalModal, setProposalModal] = useState(false);
  const [quizActive, setQuizActive] = useState<string | null>(null);
  const [quizAnswers, setQuizAnswers] = useState<Record<string, string[]>>({});
  const [quizSubmitted, setQuizSubmitted] = useState(false);

  const [gradeForm, setGradeForm] = useState({ subject: '', grade: 8, period: '', notes: '' });
  const [skillForm, setSkillForm] = useState({ area: SKILL_AREAS[0], score: 75 });
  const [devForm, setDevForm] = useState({ title: '', desc: '', category: 'academico' });
  const [achForm, setAchForm] = useState({ title: '', desc: '', type: 'outro' as Achievement['type'] });
  const [propForm, setPropForm] = useState({ title: '', desc: '', objectives: '', methodology: '', expected: '', timeline: '' });

  if (!student) {
    return (
      <PageTransition>
        <div className="text-center py-20">
          <div className="text-muted-foreground text-lg mb-2">{t('gifted.studentNotFound')}</div>
          <Button onClick={() => navigate('/gifted/students')} variant="outline" size="sm"><ArrowLeft size={14} className="mr-1" /> Voltar</Button>
        </div>
      </PageTransition>
    );
  }

  const avgGrade = student.gifted_grades.length > 0
    ? student.gifted_grades.reduce((a, g) => a + g.grade, 0) / student.gifted_grades.length
    : 0;

  const topSkillVal = student.gifted_skills.length > 0
    ? student.gifted_skills.sort((a, b) => b.score - a.score)[0]
    : null;

  const statusLabel = {
    identificado: 'Identificado', em_avaliacao: 'Em avaliação', monitoramento: 'Monitoramento', concluido: 'Concluído'
  }[student.status];

  const statusColor = {
    identificado: 'bg-amber-50 text-amber-700', em_avaliacao: 'bg-blue-50 text-blue-700', monitoramento: 'bg-emerald-50 text-emerald-700', concluido: 'bg-gray-100 text-gray-600'
  }[student.status];

  // Quiz data
  const studentQuizzes = quizzes.filter((q) => q.status === 'published' && q.assigned_students.includes(student.id));
  const studentResults = getStudentResults(student.id);
  const studentProposals = getStudentProposals(student.id);

  // Charts data
  const radarData = student.gifted_skills.map((s) => ({ area: s.area.split('-')[0].slice(0, 12), score: s.score }));
  const gradeByPeriod = [...new Set(student.gifted_grades.map((g) => g.period))].map((p) => {
    const grades = student.gifted_grades.filter((g) => g.period === p);
    return { period: p, avg: grades.reduce((a, g) => a + g.grade, 0) / grades.length };
  });
  const gradeBySubject = [...new Set(student.gifted_grades.map((g) => g.subject))].map((s) => {
    const grades = student.gifted_grades.filter((g) => g.subject === s);
    return { subject: s, avg: grades.reduce((a, g) => a + g.grade, 0) / grades.length };
  }).sort((a, b) => b.avg - a.avg);

  const handleAddGrade = () => {
    addGrade(student.id, { subject: gradeForm.subject, grade: +gradeForm.grade, period: gradeForm.period, date: new Date().toISOString().split('T')[0], notes: gradeForm.notes });
    setGradeModal(false);
  };
  const handleAddSkill = () => {
    addSkill(student.id, { area: skillForm.area, score: +skillForm.score, assessed_by: user?.name || '', date: new Date().toISOString().split('T')[0] });
    setSkillModal(false);
  };
  const handleAddDev = () => {
    addDevelopment(student.id, { date: new Date().toISOString().split('T')[0], title: devForm.title, description: devForm.desc, category: devForm.category, author: user?.name || '' });
    setDevModal(false);
  };
  const handleAddAch = () => {
    addAchievement(student.id, { title: achForm.title, description: achForm.desc, date: new Date().toISOString().split('T')[0], type: achForm.type });
    setAchModal(false);
  };
  const handleAddProposal = () => {
    addProposal({ student_id: student.id, title: propForm.title, description: propForm.desc, objectives: propForm.objectives, methodology: propForm.methodology, expected_results: propForm.expected, timeline: propForm.timeline, status: 'submitted', feedback: '' });
    setProposalModal(false);
    setPropForm({ title: '', desc: '', objectives: '', methodology: '', expected: '', timeline: '' });
  };

  const startQuiz = (quizId: string) => {
    setQuizActive(quizId);
    setQuizAnswers({});
    setQuizSubmitted(false);
  };

  const submitQuiz = () => {
    if (!quizActive) return;
    const quiz = quizzes.find((q) => q.id === quizActive);
    if (!quiz) return;
    let score = 0;
    let maxScore = 0;
    const answers = quiz.questions.map((q) => {
      const selected = quizAnswers[q.id] || [];
      const correct = q.options.filter((o) => o.correct).map((o) => o.id);
      const isCorrect = q.multiple_correct
        ? correct.length === selected.length && correct.every((c) => selected.includes(c))
        : selected.length === 1 && correct.includes(selected[0]);
      if (isCorrect) score += q.points;
      maxScore += q.points;
      return { question_id: q.id, selected, correct: isCorrect };
    });
    useQuizStore.getState().addResult({
      quiz_id: quizActive, student_id: student.id, score, max_score: maxScore,
      answers, completed_at: new Date().toISOString(), time_taken: 0,
    });
    setQuizSubmitted(true);
  };

  const activeQuiz = quizActive ? quizzes.find((q) => q.id === quizActive) : null;
  const currentQIdx = activeQuiz ? Object.keys(quizAnswers).length : 0;
  const currentQuestion = activeQuiz?.questions[currentQIdx];

  const tabs = [
    { id: 'overview', label: 'Visão Geral', icon: <TrendingUp size={16} /> },
    { id: 'grades', label: 'Notas', icon: <BookOpen size={16} /> },
    { id: 'skills', label: 'Habilidades', icon: <Brain size={16} /> },
    { id: 'development', label: 'Desenvolvimento', icon: <Lightbulb size={16} /> },
    { id: 'achievements', label: 'Conquistas', icon: <Award size={16} /> },
    { id: 'quiz', label: 'Quiz', icon: <HelpCircle size={16} /> },
    { id: 'proposal', label: 'Proposta', icon: <FileText size={16} /> },
  ];

  return (
    <PageTransition>
      <button onClick={() => navigate('/gifted/students')} className="flex items-center gap-1.5 text-sm font-semibold text-blue-600 hover:underline mb-4">
        <ArrowLeft size={16} /> Voltar para lista
      </button>

      {/* Profile Header */}
      <div className="relative rounded-2xl p-6 md:p-8 mb-6 text-white flex flex-col sm:flex-row gap-5 items-start sm:items-center" style={{ background: 'linear-gradient(135deg, #1e40af, #2563EB)' }}>
        <div className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-white/20 flex items-center justify-center text-3xl font-bold flex-shrink-0">
          {student.name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()}
        </div>
        <div className="flex-1">
          <h1 className="text-2xl md:text-3xl font-serif font-bold mb-1">{student.name}</h1>
          <div className="text-sm opacity-80 space-y-0.5">
            <div>{student.grade} · {student.school}</div>
            <div>Nasc.: {student.birth_date || '-'} · Resp.: {student.responsible_name} · {student.responsible_contact}</div>
          </div>
          <div className="flex gap-3 mt-3 flex-wrap">
            <span className={cn('px-3 py-1 rounded-full text-xs font-bold', statusColor)}>{statusLabel}</span>
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-white/20 text-white">Média: {avgGrade.toFixed(1)}</span>
            {topSkillVal && <span className="px-3 py-1 rounded-full text-xs font-bold bg-white/20 text-white">Top: {topSkillVal.area}</span>}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-0 border-b border-border mb-6 overflow-x-auto">
        {tabs.map((t) => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={cn('px-4 py-2.5 text-sm font-semibold border-b-2 -mb-[2px] transition-colors whitespace-nowrap flex items-center gap-1.5',
              tab === t.id ? 'border-[#2563EB] text-[#2563EB]' : 'border-transparent text-muted-foreground hover:text-foreground')}>
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {/* Overview Tab */}
      {tab === 'overview' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {radarData.length >= 3 && (
              <div className="bg-card border border-border rounded-xl p-5">
                <h3 className="font-bold text-sm mb-3">Perfil de Habilidades</h3>
                <ResponsiveContainer width="100%" height={260}>
                  <RadarChart data={radarData}>
                    <PolarGrid stroke="#E5E7EB" />
                    <PolarAngleAxis dataKey="area" tick={{ fontSize: 10 }} />
                    <PolarRadiusAxis domain={[0, 100]} tick={false} />
                    <Radar dataKey="score" stroke="#2563EB" fill="#2563EB" fillOpacity={0.15} strokeWidth={1.5} />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            )}
            {gradeByPeriod.length >= 2 && (
              <div className="bg-card border border-border rounded-xl p-5">
                <h3 className="font-bold text-sm mb-3">{t('gifted.gradeEvolution')}</h3>
                <ResponsiveContainer width="100%" height={260}>
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
          </div>

          <div className="bg-card border border-border rounded-xl p-5">
            <h3 className="font-bold text-sm mb-2">{t('app.notes')}</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">{student.notes || 'Sem observações cadastradas.'}</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="bg-card border border-border rounded-xl p-5">
              <h3 className="font-bold text-sm mb-3">{t('gifted.recentDevelopments')}</h3>
              {student.gifted_developments.length === 0 ? <p className="text-sm text-muted-foreground">{t('app.noRecords')}</p> : (
                <div className="space-y-2 max-h-[200px] overflow-y-auto">
                  {student.gifted_developments.slice(0, 4).map((d) => (
                    <div key={d.id} className="flex gap-3">
                      <div className="w-2 h-2 rounded-full mt-2 flex-shrink-0" style={{ background: d.category === 'academico' ? '#2563EB' : d.category === 'social' ? '#16A34A' : d.category === 'criativo' ? '#D97706' : '#9CA3AF' }} />
                      <div>
                        <div className="text-sm font-semibold">{d.title}</div>
                        <div className="text-xs text-muted-foreground">{d.date}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="bg-card border border-border rounded-xl p-5">
              <h3 className="font-bold text-sm mb-3">{t('gifted.recentAchievements')}</h3>
              {student.gifted_achievements.length === 0 ? <p className="text-sm text-muted-foreground">{t('gifted.noAchievementsAlt')}</p> : (
                <div className="space-y-2 max-h-[200px] overflow-y-auto">
                  {student.gifted_achievements.slice(0, 4).map((a) => (
                    <div key={a.id} className="flex gap-3 items-start">
                      <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center flex-shrink-0"><Award size={16} /></div>
                      <div>
                        <div className="text-sm font-semibold">{a.title}</div>
                        <div className="text-xs text-muted-foreground">{a.date}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Grades Tab */}
      {tab === 'grades' && (
        <div className="space-y-6">
          {gradeByPeriod.length >= 2 && (
            <div className="bg-card border border-border rounded-xl p-5">
              <h3 className="font-bold text-sm mb-3">{t('gifted.gradeEvolutionPeriod')}</h3>
              <ResponsiveContainer width="100%" height={200}>
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
          {gradeBySubject.length > 0 && (
            <div className="bg-card border border-border rounded-xl p-5">
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
            <div className="px-5 py-4 border-b border-border flex items-center justify-between">
              <h3 className="font-bold text-sm">Notas detalhadas ({student.gifted_grades.length})</h3>
              <Button size="sm" onClick={() => setGradeModal(true)}><Plus size={14} className="mr-1" />{t('app.add')}</Button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className="bg-muted/50 text-left">
                  <th className="px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Disciplina</th>
                  <th className="px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Nota</th>
                  <th className="px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">{t('app.period')}</th>
                  <th className="px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">{t('app.date')}</th>
                  <th className="px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Obs.</th>
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
                      <td className="px-4 py-3 text-xs text-muted-foreground">{g.notes || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Skills Tab */}
      {tab === 'skills' && (
        <div className="space-y-6">
          {radarData.length >= 3 && (
            <div className="bg-card border border-border rounded-xl p-5">
              <h3 className="font-bold text-sm mb-3">{t('gifted.skillRadar')}</h3>
              <ResponsiveContainer width="100%" height={300}>
                <RadarChart data={radarData}>
                  <PolarGrid stroke="#E5E7EB" />
                  <PolarAngleAxis dataKey="area" tick={{ fontSize: 11 }} />
                  <PolarRadiusAxis domain={[0, 100]} tick={false} />
                  <Radar dataKey="score" stroke="#2563EB" fill="#2563EB" fillOpacity={0.15} strokeWidth={1.5} />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          )}
          <div className="bg-card border border-border rounded-xl overflow-hidden">
            <div className="px-5 py-4 border-b border-border flex items-center justify-between">
              <h3 className="font-bold text-sm">{t('gifted.skillScores')}</h3>
              <Button size="sm" onClick={() => setSkillModal(true)}><Plus size={14} className="mr-1" />{t('gifted.assessSkill')}</Button>
            </div>
            <div className="divide-y divide-border">
              {student.gifted_skills.sort((a, b) => b.score - a.score).map((s) => (
                <div key={s.area} className="px-5 py-3 flex items-center gap-3">
                  <span className="text-sm flex-1">{s.area}</span>
                  <div className="w-24 h-2 bg-muted rounded-full overflow-hidden">
                    <div className="h-full rounded-full" style={{ width: s.score + '%', background: 'var(--gift-primary)' }} />
                  </div>
                  <span className="text-sm font-bold w-10 text-right">{s.score}</span>
                  <span className="text-xs text-muted-foreground w-24 text-right">{s.assessed_by}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Development Tab */}
      {tab === 'development' && (
        <div className="space-y-6">
          <div className="flex justify-end">
            <Button size="sm" onClick={() => setDevModal(true)}><Plus size={14} className="mr-1" />{t('gifted.addDevelopment')}</Button>
          </div>
          {student.gifted_developments.length === 0 ? (
            <div className="bg-card border border-border rounded-xl p-8 text-center text-muted-foreground text-sm">{t('gifted.noRecords')}</div>
          ) : (
            <div className="relative pl-6 space-y-5">
              <div className="absolute left-[10px] top-2 bottom-0 w-0.5 bg-border" />
              {student.gifted_developments.map((d) => (
                <div key={d.id} className="relative">
                  <div className="absolute -left-6 top-1.5 w-3 h-3 rounded-full border-2 border-background" style={{ background: d.category === 'academico' ? '#2563EB' : d.category === 'social' ? '#16A34A' : d.category === 'criativo' ? '#D97706' : '#9CA3AF' }} />
                  <div className="bg-card border border-border rounded-xl p-4">
                    <div className="text-sm font-bold mb-1">{d.title}</div>
                    <div className="text-sm text-muted-foreground mb-2 leading-relaxed">{d.description}</div>
                    <div className="flex gap-3 text-xs text-muted-foreground">
                      <span>{d.date}</span>
                      <span className="bg-muted px-2 py-0.5 rounded capitalize">{d.category}</span>
                      <span>{d.author}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Achievements Tab */}
      {tab === 'achievements' && (
        <div className="space-y-6">
          <div className="flex justify-end">
            <Button size="sm" onClick={() => setAchModal(true)}><Plus size={14} className="mr-1" />{t('app.add')}</Button>
          </div>
          {student.gifted_achievements.length === 0 ? (
            <div className="bg-card border border-border rounded-xl p-8 text-center text-muted-foreground text-sm">{t('gifted.noAchievements')}</div>
          ) : (
            <div className="space-y-3">
              {student.gifted_achievements.map((a) => (
                <div key={a.id} className="bg-card border border-border rounded-xl p-4 flex gap-4">
                  <div className={cn('w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0',
                    a.type === 'olimpiada' ? 'bg-amber-50 text-amber-600' : a.type === 'projeto' ? 'bg-blue-50 text-blue-600' : a.type === 'reconhecimento' ? 'bg-emerald-50 text-emerald-600' : 'bg-purple-50 text-purple-600')}>
                    <Award size={18} />
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-bold">{a.title}</div>
                    <div className="text-sm text-muted-foreground leading-relaxed">{a.description}</div>
                    <div className="text-xs text-muted-foreground mt-1">{a.date} · <span className="capitalize">{a.type}</span></div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Quiz Tab */}
      {tab === 'quiz' && (
        <div className="space-y-6">
          {quizActive && activeQuiz ? (
            <div className="bg-card border border-border rounded-xl p-6">
              {!quizSubmitted ? (
                <>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-bold">{activeQuiz.title}</h3>
                    <span className="text-xs text-muted-foreground">Questão {currentQIdx + 1} de {activeQuiz.questions.length}</span>
                  </div>
                  {currentQuestion && (
                    <div className="space-y-4">
                      <div className="text-base font-medium">{currentQuestion.text}</div>
                      <div className="space-y-2">
                        {currentQuestion.options.map((opt) => {
                          const selected = (quizAnswers[currentQuestion.id] || []).includes(opt.id);
                          return (
                            <button key={opt.id}
                              onClick={() => {
                                if (currentQuestion.multiple_correct) {
                                  setQuizAnswers((prev) => ({
                                    ...prev,
                                    [currentQuestion.id]: selected
                                      ? (prev[currentQuestion.id] || []).filter((id) => id !== opt.id)
                                      : [...(prev[currentQuestion.id] || []), opt.id],
                                  }));
                                } else {
                                  setQuizAnswers((prev) => ({ ...prev, [currentQuestion.id]: [opt.id] }));
                                }
                              }}
                              className={cn('w-full text-left px-4 py-3 rounded-lg border transition-all',
                                selected ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-border hover:bg-muted/50')}>
                              {opt.text}
                            </button>
                          );
                        })}
                      </div>
                      <div className="flex justify-between mt-4">
                        <Button variant="outline" size="sm" onClick={() => setQuizActive(null)}>{t('app.cancel')}</Button>
                        <div className="flex gap-2">
                          {currentQIdx > 0 && <Button variant="outline" size="sm" onClick={() => {}}>{t('app.previous')}</Button>}
                          {currentQIdx < activeQuiz.questions.length - 1 ? (
                            <Button size="sm" style={{ background: 'var(--gift-primary)' }}
                              onClick={() => {}} disabled={!quizAnswers[currentQuestion.id]?.length}>{t('app.next')}</Button>
                          ) : (
                            <Button size="sm" style={{ background: 'var(--gift-primary)' }}
                              onClick={submitQuiz} disabled={!quizAnswers[currentQuestion.id]?.length}>{t('app.finish')}</Button>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div className="text-center py-8">
                  <CheckCircle size={48} className="mx-auto text-emerald-500 mb-4" />
                  <h3 className="text-xl font-bold mb-2">Quiz concluído!</h3>
                  <p className="text-muted-foreground mb-4">
                    Pontuação: {studentResults.find((r) => r.quiz_id === quizActive)?.score || 0} / {activeQuiz.questions.reduce((a, q) => a + q.points, 0)}
                  </p>
                  <Button onClick={() => setQuizActive(null)} size="sm">Voltar aos quizzes</Button>
                </div>
              )}
            </div>
          ) : (
            <>
              <div className="flex justify-between items-center">
                <h3 className="font-bold text-sm">Quiz disponíveis</h3>
              </div>
              {studentQuizzes.length === 0 ? (
                <div className="bg-card border border-border rounded-xl p-8 text-center text-muted-foreground text-sm">{t('gifted.noAssignedQuiz')}</div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {studentQuizzes.map((q) => {
                    const completed = hasCompletedQuiz(student.id, q.id);
                    const result = studentResults.find((r) => r.quiz_id === q.id);
                    return (
                      <div key={q.id} className="bg-card border border-border rounded-xl p-4">
                        <div className="flex items-start justify-between mb-2">
                          <h4 className="font-bold text-sm">{q.title}</h4>
                          {completed ? <Badge variant="default">{t('gifted.completed')}</Badge> : <Badge variant="secondary">Pendente</Badge>}
                        </div>
                        <p className="text-xs text-muted-foreground mb-3">{q.description}</p>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground mb-3">
                          <span>{q.questions.length} questões</span>
                          <span>{q.time_limit} min</span>
                          <span>{q.subject}</span>
                        </div>
                        {completed && result && (
                          <div className="text-sm mb-3">Pontuação: <strong>{result.score}/{result.max_score}</strong></div>
                        )}
                        <Button size="sm" variant={completed ? 'outline' : 'default'} onClick={() => startQuiz(q.id)}>
                          {completed ? 'Refazer' : 'Iniciar Quiz'}
                        </Button>
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* Proposal Tab */}
      {tab === 'proposal' && (
        <div className="space-y-6">
          <div className="flex justify-end">
            <Button size="sm" onClick={() => setProposalModal(true)}><Plus size={14} className="mr-1" />Nova Proposta</Button>
          </div>
          {studentProposals.length === 0 ? (
            <div className="bg-card border border-border rounded-xl p-8 text-center">
              <FileText size={40} className="mx-auto text-muted-foreground mb-3" />
              <div className="text-sm font-bold text-muted-foreground mb-1">Nenhuma proposta</div>
              <div className="text-xs text-muted-foreground">Envie a primeira proposta de trabalho de pesquisa.</div>
            </div>
          ) : (
            <div className="space-y-4">
              {studentProposals.map((p) => {
                const statusColors: Record<string, string> = {
                  submitted: 'bg-blue-50 text-blue-700', under_review: 'bg-amber-50 text-amber-700',
                  approved: 'bg-emerald-50 text-emerald-700', in_progress: 'bg-purple-50 text-purple-700', completed: 'bg-gray-100 text-gray-600'
                };
                const statusLabels: Record<string, string> = {
                  submitted: 'Enviada', under_review: 'Em análise', approved: 'Aprovada', in_progress: 'Em andamento', completed: 'Concluída'
                };
                return (
                  <div key={p.id} className="bg-card border border-border rounded-xl p-5">
                    <div className="flex items-start justify-between mb-3">
                      <h4 className="font-bold text-sm">{p.title}</h4>
                      <span className={cn('px-2.5 py-0.5 rounded-full text-xs font-bold', statusColors[p.status])}>{statusLabels[p.status]}</span>
                    </div>
                    <p className="text-sm text-muted-foreground mb-3 leading-relaxed">{p.description}</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs text-muted-foreground mb-3">
                      <div><strong>{t('gifted.objectivesLabel')}</strong> {p.objectives}</div>
                      <div><strong>{t('gifted.methodologyLabel')}</strong> {p.methodology}</div>
                      <div><strong>{t('gifted.expectedResultsLabel')}</strong> {p.expected_results}</div>
                      <div><strong>{t('gifted.timelineLabel')}</strong> {p.timeline}</div>
                    </div>
                    {p.feedback && (
                      <div className="p-3 rounded-lg bg-blue-50 text-blue-700 text-xs mb-3"><strong>{t('gifted.feedbackLabel')}</strong> {p.feedback}</div>
                    )}
                    <div className="text-xs text-muted-foreground">Criada em: {p.created_at}</div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Grade Modal */}
      <Dialog open={gradeModal} onOpenChange={setGradeModal}>
        <DialogContent>
          <DialogHeader><DialogTitle>{t('gifted.addGradeTitle')}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="space-y-2"><Label>Disciplina</Label><Input value={gradeForm.subject} onChange={(e) => setGradeForm({ ...gradeForm, subject: e.target.value })} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2"><Label>Nota (0-10)</Label><Input type="number" min={0} max={10} step={0.1} value={gradeForm.grade} onChange={(e) => setGradeForm({ ...gradeForm, grade: +e.target.value })} /></div>
              <div className="space-y-2"><Label>{t('app.period')}</Label><Input value={gradeForm.period} onChange={(e) => setGradeForm({ ...gradeForm, period: e.target.value })} placeholder="Ex: 1º Bim 2025" /></div>
            </div>
            <div className="space-y-2"><Label>{t('app.notes')}</Label><textarea className="w-full min-h-[60px] px-3 py-2 rounded-md border border-input bg-background text-sm resize-y" value={gradeForm.notes} onChange={(e) => setGradeForm({ ...gradeForm, notes: e.target.value })} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setGradeModal(false)}>{t('app.cancel')}</Button>
            <Button onClick={handleAddGrade} style={{ background: 'var(--gift-primary)' }}>{t('app.add')}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Skill Modal */}
      <Dialog open={skillModal} onOpenChange={setSkillModal}>
        <DialogContent>
          <DialogHeader><DialogTitle>{t('gifted.assessSkillTitle')}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="space-y-2"><Label>{t('app.category')}</Label>
              <select value={skillForm.area} onChange={(e) => setSkillForm({ ...skillForm, area: e.target.value })} className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm">
                {SKILL_AREAS.map((a) => <option key={a}>{a}</option>)}
              </select>
            </div>
            <div className="space-y-2"><Label>Pontuação (0-100)</Label>
              <Input type="number" min={0} max={100} value={skillForm.score} onChange={(e) => setSkillForm({ ...skillForm, score: +e.target.value })} />
              <input type="range" min={0} max={100} value={skillForm.score} onChange={(e) => setSkillForm({ ...skillForm, score: +e.target.value })} className="w-full" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSkillModal(false)}>{t('app.cancel')}</Button>
            <Button onClick={handleAddSkill} style={{ background: 'var(--gift-primary)' }}>{t('app.save')}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dev Modal */}
      <Dialog open={devModal} onOpenChange={setDevModal}>
        <DialogContent>
          <DialogHeader><DialogTitle>{t('gifted.addDevelopmentTitle')}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="space-y-2"><Label>{t('app.title')}</Label><Input value={devForm.title} onChange={(e) => setDevForm({ ...devForm, title: e.target.value })} /></div>
            <div className="space-y-2"><Label>{t('app.description')}</Label><textarea className="w-full min-h-[60px] px-3 py-2 rounded-md border border-input bg-background text-sm resize-y" value={devForm.desc} onChange={(e) => setDevForm({ ...devForm, desc: e.target.value })} /></div>
            <div className="space-y-2"><Label>{t('app.category')}</Label>
              <select value={devForm.category} onChange={(e) => setDevForm({ ...devForm, category: e.target.value })} className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm">
                <option value="academico">{t('gifted.academic')}</option>
                <option value="social">{t('gifted.social')}</option>
                <option value="criativo">{t('gifted.creative')}</option>
                <option value="comportamental">{t('gifted.behavioral')}</option>
                <option value="outro">Outro</option>
              </select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDevModal(false)}>{t('app.cancel')}</Button>
            <Button onClick={handleAddDev} style={{ background: 'var(--gift-primary)' }}>{t('app.add')}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Ach Modal */}
      <Dialog open={achModal} onOpenChange={setAchModal}>
        <DialogContent>
          <DialogHeader><DialogTitle>{t('gifted.addAchievementTitle')}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="space-y-2"><Label>{t('app.title')}</Label><Input value={achForm.title} onChange={(e) => setAchForm({ ...achForm, title: e.target.value })} /></div>
            <div className="space-y-2"><Label>{t('app.description')}</Label><textarea className="w-full min-h-[60px] px-3 py-2 rounded-md border border-input bg-background text-sm resize-y" value={achForm.desc} onChange={(e) => setAchForm({ ...achForm, desc: e.target.value })} /></div>
            <div className="space-y-2"><Label>{t('app.type')}</Label>
              <select value={achForm.type} onChange={(e) => setAchForm({ ...achForm, type: e.target.value as Achievement['type'] })} className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm">
                <option value="olimpiada">{t('gifted.olympiad')}</option>
                <option value="projeto">Projeto</option>
                <option value="reconhecimento">{t('gifted.recognition')}</option>
                <option value="publicacao">{t('gifted.publication')}</option>
                <option value="outro">Outro</option>
              </select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAchModal(false)}>{t('app.cancel')}</Button>
            <Button onClick={handleAddAch} style={{ background: 'var(--gift-primary)' }}>{t('app.add')}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Proposal Modal */}
      <Dialog open={proposalModal} onOpenChange={setProposalModal}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Nova Proposta de Trabalho</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="space-y-2"><Label>{t('app.title')}</Label><Input value={propForm.title} onChange={(e) => setPropForm({ ...propForm, title: e.target.value })} /></div>
            <div className="space-y-2"><Label>{t('app.description')}</Label><textarea className="w-full min-h-[60px] px-3 py-2 rounded-md border border-input bg-background text-sm resize-y" value={propForm.desc} onChange={(e) => setPropForm({ ...propForm, desc: e.target.value })} /></div>
            <div className="space-y-2"><Label>Objetivos</Label><textarea className="w-full min-h-[50px] px-3 py-2 rounded-md border border-input bg-background text-sm resize-y" value={propForm.objectives} onChange={(e) => setPropForm({ ...propForm, objectives: e.target.value })} /></div>
            <div className="space-y-2"><Label>Metodologia</Label><textarea className="w-full min-h-[50px] px-3 py-2 rounded-md border border-input bg-background text-sm resize-y" value={propForm.methodology} onChange={(e) => setPropForm({ ...propForm, methodology: e.target.value })} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2"><Label>Resultados esperados</Label><Input value={propForm.expected} onChange={(e) => setPropForm({ ...propForm, expected: e.target.value })} /></div>
              <div className="space-y-2"><Label>Cronograma</Label><Input value={propForm.timeline} onChange={(e) => setPropForm({ ...propForm, timeline: e.target.value })} placeholder="Ex: 3 meses" /></div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setProposalModal(false)}>{t('app.cancel')}</Button>
            <Button onClick={handleAddProposal} style={{ background: 'var(--gift-primary)' }}>Enviar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageTransition>
  );
}
