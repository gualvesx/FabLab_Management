import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, CheckCircle, HelpCircle, Trash2, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { useQuizStore } from '@/stores/quizStore';
import { useStudentStore } from '@/stores/studentStore';
import { PageTransition } from '@/components/layout/PageTransition';
import { cn } from '@/lib/utils';
import type { Question } from '@/types';

export function QuizCreator() {
  const { t } = useTranslation();
  const { quizzes, addQuiz, deleteQuiz, getQuizResults, fetchQuizzes, fetchResults } = useQuizStore();
  const { students, fetchStudents } = useStudentStore();

  useEffect(() => { fetchQuizzes(); fetchResults(); fetchStudents(); }, []);
  const [modal, setModal] = useState(false);
  const [resultQuizId, setResultQuizId] = useState<string | null>(null);
  const [form, setForm] = useState({ title: '', description: '', subject: '', timeLimit: 30 });
  const [questions, setQuestions] = useState<Question[]>([]);
  const [assignedStudents, setAssignedStudents] = useState<string[]>([]);

  const addQuestion = () => {
    setQuestions((p) => [...p, { id: 'qu' + Date.now() + Math.random(), text: '', options: [{ id: 'o1', text: '', correct: false }, { id: 'o2', text: '', correct: false }], points: 10, multiple_correct: false }]);
  };

  const updateQuestionText = (idx: number, text: string) => {
    setQuestions((p) => p.map((q, i) => i === idx ? { ...q, text } : q));
  };

  const addOption = (qIdx: number) => {
    setQuestions((p) => p.map((q, i) => i === qIdx ? { ...q, options: [...q.options, { id: 'o' + Date.now() + Math.random(), text: '', correct: false }] } : q));
  };

  const updateOption = (qIdx: number, oIdx: number, text: string) => {
    setQuestions((p) => p.map((q, i) => i === qIdx ? { ...q, options: q.options.map((o, j) => j === oIdx ? { ...o, text } : o) } : q));
  };

  const toggleCorrect = (qIdx: number, oIdx: number) => {
    setQuestions((p) => p.map((q, i) => {
      if (i !== qIdx) return q;
      if (!q.multiple_correct) {
        return { ...q, options: q.options.map((o, j) => ({ ...o, correct: j === oIdx })) };
      }
      return { ...q, options: q.options.map((o, j) => j === oIdx ? { ...o, correct: !o.correct } : o) };
    }));
  };

  const toggleMultiple = (qIdx: number) => {
    setQuestions((p) => p.map((q, i) => i === qIdx ? { ...q, multiple_correct: !q.multiple_correct } : q));
  };

  const removeQuestion = (idx: number) => {
    setQuestions((p) => p.filter((_, i) => i !== idx));
  };

  const handlePublish = () => {
    if (!form.title || questions.length === 0) return;
    addQuiz({
      title: form.title, description: form.description, subject: form.subject,
      time_limit: form.timeLimit, status: 'published', questions,
      assigned_students: assignedStudents, created_by: 'Admin',
    });
    setModal(false);
    setForm({ title: '', description: '', subject: '', timeLimit: 30 });
    setQuestions([]);
    setAssignedStudents([]);
  };

  const handleSaveDraft = () => {
    if (!form.title) return;
    addQuiz({
      title: form.title, description: form.description, subject: form.subject,
      time_limit: form.timeLimit, status: 'draft', questions,
      assigned_students: [], created_by: 'Admin',
    });
    setModal(false);
    setForm({ title: '', description: '', subject: '', timeLimit: 30 });
    setQuestions([]);
    setAssignedStudents([]);
  };

  return (
    <PageTransition>
      <div className="flex items-start justify-between gap-4 mb-6">
        <div>
          <h1 className="text-xl font-extrabold">{t('gifted.quizCreator')}</h1>
          <p className="text-sm text-muted-foreground">Crie e gerencie quizzes para alunos com altas habilidades</p>
        </div>
        <Button size="sm" onClick={() => { setModal(true); }}><Plus size={14} className="mr-1" />{t('gifted.createQuiz')}</Button>
      </div>

      {quizzes.length === 0 ? (
        <div className="bg-card border border-border rounded-xl p-8 text-center">
          <HelpCircle size={40} className="mx-auto text-muted-foreground mb-3" />
          <div className="text-sm font-bold text-muted-foreground mb-1">{t('quiz.noCreated')}</div>
          <div className="text-xs text-muted-foreground">{t('quiz.noCreatedDesc')}</div>
        </div>
      ) : (
        <div className="space-y-3">
          {quizzes.map((q) => {
            const results = getQuizResults(q.id);
            return (
              <div key={q.id} className="bg-card border border-border rounded-xl p-5">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-sm">{q.title}</h3>
                      <Badge variant={q.status === 'published' ? 'default' : 'secondary'}>{q.status === 'published' ? 'Publicado' : 'Rascunho'}</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">{q.description}</p>
                  </div>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => setResultQuizId(q.id)}><Eye size={14} /></Button>
                    <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-destructive" onClick={() => deleteQuiz(q.id)}><Trash2 size={14} /></Button>
                  </div>
                </div>
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <span>{q.questions.length} questões</span>
                  <span>{q.subject}</span>
                  <span>{q.time_limit} min</span>
                  <span>{q.assigned_students.length} alunos atribuídos</span>
                  <span>{results.length} resultados</span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create Modal */}
      <Dialog open={modal} onOpenChange={setModal}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{t('gifted.createQuiz')}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2"><Label>Título *</Label><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></div>
              <div className="space-y-2"><Label>{t('quiz.quizSubject')}</Label><Input value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} /></div>
            </div>
            <div className="space-y-2"><Label>{t('app.description')}</Label><textarea className="w-full min-h-[50px] px-3 py-2 rounded-md border border-input bg-background text-sm resize-y" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
            <div className="space-y-2"><Label>{t('quiz.quizTimeLimit')}</Label><Input type="number" min={1} value={form.timeLimit} onChange={(e) => setForm({ ...form, timeLimit: +e.target.value })} /></div>

            <div className="border-t border-border pt-4">
              <div className="flex items-center justify-between mb-3">
                <Label>Questões ({questions.length})</Label>
                <Button type="button" size="sm" variant="outline" onClick={addQuestion}><Plus size={14} className="mr-1" />{t('quiz.addQuestion')}</Button>
              </div>
              <div className="space-y-4">
                {questions.map((q, qIdx) => (
                  <div key={q.id} className="p-4 border border-border rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xs font-bold">Q{qIdx + 1}</span>
                      <Input className="flex-1 h-8 text-sm" value={q.text} onChange={(e) => updateQuestionText(qIdx, e.target.value)} placeholder="Texto da questão" />
                      <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-destructive" onClick={() => removeQuestion(qIdx)}><Trash2 size={12} /></Button>
                    </div>
                    <div className="flex items-center gap-2 mb-2">
                      <input type="checkbox" id={`mc${qIdx}`} checked={q.multiple_correct} onChange={() => toggleMultiple(qIdx)} className="rounded" />
                      <label htmlFor={`mc${qIdx}`} className="text-xs">{t('quiz.multipleCorrect')}</label>
                    </div>
                    <div className="space-y-1.5">
                      {q.options.map((opt, oIdx) => (
                        <div key={opt.id} className="flex items-center gap-2">
                          <button onClick={() => toggleCorrect(qIdx, oIdx)} className={cn('w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0', opt.correct ? 'border-emerald-500 bg-emerald-500' : 'border-muted-foreground/30')}>
                            {opt.correct && <CheckCircle size={12} className="text-white" />}
                          </button>
                          <Input className="h-8 text-sm" value={opt.text} onChange={(e) => updateOption(qIdx, oIdx, e.target.value)} placeholder={`Opção ${oIdx + 1}`} />
                        </div>
                      ))}
                    </div>
                    <Button type="button" size="sm" variant="ghost" className="h-7 text-xs mt-2" onClick={() => addOption(qIdx)}><Plus size={12} className="mr-1" />{t('quiz.addOption')}</Button>
                  </div>
                ))}
              </div>
            </div>

            <div className="border-t border-border pt-4">
              <Label>{t('quiz.assignStudents')}</Label>
              <div className="mt-2 space-y-1 max-h-[120px] overflow-y-auto">
                {students.map((s) => (
                  <label key={s.id} className="flex items-center gap-2 text-sm cursor-pointer">
                    <input type="checkbox" checked={assignedStudents.includes(s.id)} onChange={() => setAssignedStudents((p) => p.includes(s.id) ? p.filter((id) => id !== s.id) : [...p, s.id])} className="rounded" />
                    {s.name} · {s.grade}
                  </label>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setModal(false)}>{t('app.cancel')}</Button>
            <Button variant="secondary" onClick={handleSaveDraft}>Salvar rascunho</Button>
            <Button onClick={handlePublish} style={{ background: 'var(--gift-primary)' }}>{t('quiz.publish')}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Results Modal */}
      <Dialog open={!!resultQuizId} onOpenChange={() => setResultQuizId(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>{t('app.results')}</DialogTitle></DialogHeader>
          {resultQuizId && (
            <div>
              {getQuizResults(resultQuizId).length === 0 ? (
                <p className="text-sm text-muted-foreground">{t('gifted.noResults')}</p>
              ) : (
                <div className="space-y-2">
                  {getQuizResults(resultQuizId).map((r) => {
                    const s = students.find((st) => st.id === r.student_id);
                    return (
                      <div key={r.id} className="flex items-center justify-between p-3 border border-border rounded-lg">
                        <span className="text-sm font-semibold">{s?.name || r.student_id}</span>
                        <span className="text-sm font-bold">{r.score}/{r.max_score}</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </PageTransition>
  );
}
