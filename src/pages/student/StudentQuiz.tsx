import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { HelpCircle, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuthStore } from '@/stores/authStore';
import { useQuizStore } from '@/stores/quizStore';
import { PageTransition } from '@/components/layout/PageTransition';
import { cn } from '@/lib/utils';

export function StudentQuiz() {
  const { t } = useTranslation();
  const { user } = useAuthStore();
  const { quizzes, getStudentQuizzes, getStudentResults, hasCompletedQuiz, addResult, fetchQuizzes, fetchResults } = useQuizStore();

  useEffect(() => { fetchQuizzes(); fetchResults(); }, []);
  const studentId = user?.id || '';
  const [activeQuiz, setActiveQuiz] = useState<string | null>(null);
  const [quizAnswers, setQuizAnswers] = useState<Record<string, string[]>>({});
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [currentQIdx, setCurrentQIdx] = useState(0);

  const studentQuizzes = getStudentQuizzes(studentId);
  const studentResults = getStudentResults(studentId);

  const activeQuizData = activeQuiz ? quizzes.find((q) => q.id === activeQuiz) : null;
  const currentQuestion = activeQuizData?.questions[currentQIdx];

  const startQuiz = (quizId: string) => {
    setActiveQuiz(quizId);
    setQuizAnswers({});
    setQuizSubmitted(false);
    setCurrentQIdx(0);
  };

  const submitQuiz = () => {
    if (!activeQuiz) return;
    const quiz = quizzes.find((q) => q.id === activeQuiz);
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
    addResult({ quiz_id: activeQuiz, student_id: studentId, score, max_score: maxScore, answers, completed_at: new Date().toISOString(), time_taken: 0 });
    setQuizSubmitted(true);
  };

  const goNext = () => {
    if (!currentQuestion) return;
    if (currentQIdx < (activeQuizData?.questions.length || 0) - 1) {
      setCurrentQIdx((p) => p + 1);
    }
  };

  const goPrev = () => {
    if (currentQIdx > 0) setCurrentQIdx((p) => p - 1);
  };

  if (activeQuiz && activeQuizData) {
    if (quizSubmitted) {
      const result = studentResults.find((r) => r.quiz_id === activeQuiz);
      return (
        <PageTransition>
          <div className="max-w-2xl mx-auto bg-card border border-border rounded-xl p-8 text-center">
            <CheckCircle size={56} className="mx-auto text-emerald-500 mb-4" />
            <h2 className="text-2xl font-bold mb-2">{t('quiz.completedQuiz')}</h2>
            <p className="text-muted-foreground mb-6">Você acertou {result?.score || 0} de {result?.max_score || 0} pontos</p>
            <div className="space-y-3 text-left mb-6">
              {activeQuizData.questions.map((q, i) => {
                const ans = result?.answers.find((a) => a.question_id === q.id);
                return (
                  <div key={q.id} className={cn('p-3 rounded-lg border', ans?.correct ? 'border-emerald-200 bg-emerald-50' : 'border-red-200 bg-red-50')}>
                    <div className="text-sm font-medium mb-1">{i + 1}. {q.text}</div>
                    <div className="text-xs">{ans?.correct ? 'Correta' : 'Incorreta'}</div>
                  </div>
                );
              })}
            </div>
            <Button onClick={() => setActiveQuiz(null)}>{t('quiz.backToQuizzes')}</Button>
          </div>
        </PageTransition>
      );
    }

    return (
      <PageTransition>
        <div className="max-w-2xl mx-auto bg-card border border-border rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold">{activeQuizData.title}</h3>
            <span className="text-xs text-muted-foreground">Questão {currentQIdx + 1} de {activeQuizData.questions.length}</span>
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
              <div className="flex justify-between mt-6">
                <Button variant="outline" size="sm" onClick={() => setActiveQuiz(null)}>{t('app.cancel')}</Button>
                <div className="flex gap-2">
                  {currentQIdx > 0 && <Button variant="outline" size="sm" onClick={goPrev}>{t('app.previous')}</Button>}
                  {currentQIdx < activeQuizData.questions.length - 1 ? (
                    <Button size="sm" style={{ background: 'var(--gift-primary)' }} onClick={goNext} disabled={!quizAnswers[currentQuestion.id]?.length}>{t('app.next')}</Button>
                  ) : (
                    <Button size="sm" style={{ background: 'var(--gift-primary)' }} onClick={submitQuiz} disabled={!quizAnswers[currentQuestion.id]?.length}>{t('app.finish')}</Button>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </PageTransition>
    );
  }

  return (
    <PageTransition>
      <div className="mb-6">
        <h1 className="text-xl font-extrabold">Meus Quiz</h1>
        <p className="text-sm text-muted-foreground">{t('quiz.availableForYou')}</p>
      </div>

      {studentQuizzes.length === 0 ? (
        <div className="bg-card border border-border rounded-xl p-8 text-center">
          <HelpCircle size={40} className="mx-auto text-muted-foreground mb-3" />
          <div className="text-sm font-bold text-muted-foreground mb-1">{t('quiz.noQuizzes')}</div>
          <div className="text-xs text-muted-foreground">{t('quiz.noQuizzesDesc')}</div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {studentQuizzes.map((q) => {
            const completed = hasCompletedQuiz(studentId, q.id);
            const result = studentResults.find((r) => r.quiz_id === q.id);
            return (
              <div key={q.id} className="bg-card border border-border rounded-xl p-5">
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-bold text-sm">{q.title}</h3>
                  {completed ? <Badge variant="default">{t('quiz.completed')}</Badge> : <Badge variant="secondary">{t('quiz.pending')}</Badge>}
                </div>
                <p className="text-xs text-muted-foreground mb-3">{q.description}</p>
                <div className="flex items-center gap-3 text-xs text-muted-foreground mb-4">
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
    </PageTransition>
  );
}
