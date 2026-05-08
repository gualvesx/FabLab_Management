import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, FileText, CheckCircle, Clock, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { useAuthStore } from '@/stores/authStore';
import { useProposalStore } from '@/stores/proposalStore';
import { PageTransition } from '@/components/layout/PageTransition';
import { cn } from '@/lib/utils';

export function StudentProposal() {
  const { t } = useTranslation();
  const { user } = useAuthStore();
  const { getStudentProposals, addProposal, fetchProposals } = useProposalStore();

  useEffect(() => { fetchProposals(); }, []);
  const studentId = user?.id || 's1'; // fallback to s1 for demo
  const proposals = getStudentProposals(studentId);
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState({ title: '', desc: '', objectives: '', methodology: '', expected: '', timeline: '' });

  const handleSubmit = () => {
    if (!form.title || !form.desc) return;
    addProposal({
      student_id: studentId, title: form.title, description: form.desc,
      objectives: form.objectives, methodology: form.methodology,
      expected_results: form.expected, timeline: form.timeline, status: 'submitted', feedback: '',
    });
    setModal(false);
    setForm({ title: '', desc: '', objectives: '', methodology: '', expected: '', timeline: '' });
  };

  const statusConfig: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
    submitted: { label: 'Enviada', color: 'bg-blue-50 text-blue-700', icon: <FileText size={14} /> },
    under_review: { label: 'Em análise', color: 'bg-amber-50 text-amber-700', icon: <Clock size={14} /> },
    approved: { label: 'Aprovada', color: 'bg-emerald-50 text-emerald-700', icon: <CheckCircle size={14} /> },
    in_progress: { label: 'Em andamento', color: 'bg-purple-50 text-purple-700', icon: <ArrowRight size={14} /> },
    completed: { label: 'Concluída', color: 'bg-gray-100 text-gray-600', icon: <CheckCircle size={14} /> },
  };

  const progressSteps = ['submitted', 'under_review', 'approved', 'in_progress', 'completed'];

  return (
    <PageTransition>
      <div className="flex items-start justify-between gap-4 mb-6">
        <div>
          <h1 className="text-xl font-extrabold">{t('proposal.title')}</h1>
          <p className="text-sm text-muted-foreground">Envie propostas de trabalho de pesquisa e acompanhe o progresso</p>
        </div>
        <Button size="sm" onClick={() => setModal(true)}><Plus size={14} className="mr-1" />{t('proposal.newProposal')}</Button>
      </div>

      {proposals.length === 0 ? (
        <div className="bg-card border border-border rounded-xl p-8 text-center">
          <FileText size={40} className="mx-auto text-muted-foreground mb-3" />
          <div className="text-sm font-bold text-muted-foreground mb-1">{t('proposal.noProposals')}</div>
          <div className="text-xs text-muted-foreground">Envie sua primeira proposta de trabalho de pesquisa.</div>
        </div>
      ) : (
        <div className="space-y-4">
          {proposals.map((p) => {
            const status = statusConfig[p.status];
            const currentStep = progressSteps.indexOf(p.status);
            return (
              <div key={p.id} className="bg-card border border-border rounded-xl p-5">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-bold text-sm">{p.title}</h3>
                      <span className={cn('px-2.5 py-0.5 rounded-full text-xs font-bold flex items-center gap-1', status.color)}>
                        {status.icon} {status.label}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground">{p.description}</p>
                  </div>
                </div>

                {/* Progress Timeline */}
                <div className="mb-4">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-2">Progresso</div>
                  <div className="flex items-center gap-1">
                    {progressSteps.map((step, i) => {
                      const isActive = i <= currentStep;
                      
                      return (
                        <div key={step} className="flex-1 flex items-center gap-1">
                          <div className={cn('flex-1 h-2 rounded-full transition-all', isActive ? 'bg-blue-500' : 'bg-muted')} />
                          {i < progressSteps.length - 1 && <div className="w-1" />}
                        </div>
                      );
                    })}
                  </div>
                  <div className="flex justify-between mt-1">
                    {progressSteps.map((step, i) => {
                      const labels: Record<string, string> = { submitted: 'Enviada', under_review: 'Análise', approved: 'Aprovada', in_progress: 'Andamento', completed: 'Concluída' };
                      return <span key={step} className={cn('text-[9px] font-bold uppercase', i <= currentStep ? 'text-blue-600' : 'text-muted-foreground')}>{labels[step]}</span>;
                    })}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs text-muted-foreground mb-3">
                  <div><strong>Objetivos:</strong> {p.objectives}</div>
                  <div><strong>Metodologia:</strong> {p.methodology}</div>
                  <div><strong>Resultados esperados:</strong> {p.expected_results}</div>
                  <div><strong>Cronograma:</strong> {p.timeline}</div>
                </div>

                {p.feedback && (
                  <div className="p-3 rounded-lg bg-blue-50 text-blue-700 text-xs mb-3"><strong>Feedback:</strong> {p.feedback}</div>
                )}

                <div className="text-xs text-muted-foreground">Criada em: {new Date(p.created_at).toLocaleDateString('pt-BR')}</div>
              </div>
            );
          })}
        </div>
      )}

      <Dialog open={modal} onOpenChange={setModal}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{t('proposal.newProposalTitle')}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="space-y-2"><Label>Título *</Label><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Título da proposta" /></div>
            <div className="space-y-2"><Label>Descrição *</Label><textarea className="w-full min-h-[60px] px-3 py-2 rounded-md border border-input bg-background text-sm resize-y" value={form.desc} onChange={(e) => setForm({ ...form, desc: e.target.value })} placeholder="Descreva sua proposta" /></div>
            <div className="space-y-2"><Label>{t('proposal.objectives')}</Label><textarea className="w-full min-h-[50px] px-3 py-2 rounded-md border border-input bg-background text-sm resize-y" value={form.objectives} onChange={(e) => setForm({ ...form, objectives: e.target.value })} /></div>
            <div className="space-y-2"><Label>{t('proposal.methodology')}</Label><textarea className="w-full min-h-[50px] px-3 py-2 rounded-md border border-input bg-background text-sm resize-y" value={form.methodology} onChange={(e) => setForm({ ...form, methodology: e.target.value })} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2"><Label>{t('proposal.expectedResults')}</Label><Input value={form.expected} onChange={(e) => setForm({ ...form, expected: e.target.value })} /></div>
              <div className="space-y-2"><Label>{t('proposal.timeline')}</Label><Input value={form.timeline} onChange={(e) => setForm({ ...form, timeline: e.target.value })} placeholder="Ex: 3 meses" /></div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setModal(false)}>{t('app.cancel')}</Button>
            <Button onClick={handleSubmit} style={{ background: 'var(--gift-primary)' }}>{t('proposal.submit')}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageTransition>
  );
}
