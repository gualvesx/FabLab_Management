import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle, ArrowLeft, AlertCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useTranslation } from 'react-i18next';
import { supabase } from '@/lib/supabase';
import { motion, AnimatePresence } from 'framer-motion';

const BG = (
  <div className="absolute inset-0 overflow-hidden pointer-events-none">
    <div className="absolute inset-0" style={{ background:'linear-gradient(135deg,#0a0a0a 0%,#1a0000 45%,#0f0505 100%)' }} />
    <div className="absolute rounded-full" style={{ width:700,height:700,top:-200,right:-200,background:'radial-gradient(circle,rgba(212,32,32,0.18) 0%,transparent 65%)',animation:'float 7s ease-in-out infinite' }} />
    <div className="absolute rounded-full" style={{ width:500,height:500,bottom:-150,left:-150,background:'radial-gradient(circle,rgba(37,99,235,0.12) 0%,transparent 65%)',animation:'float 10s ease-in-out infinite reverse' }} />
    <div className="absolute inset-0 opacity-[0.035]" style={{ backgroundImage:'linear-gradient(rgba(255,255,255,.5) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.5) 1px,transparent 1px)',backgroundSize:'56px 56px' }} />
  </div>
);

export function RegisterPage() {
  const [sent,   setSent]   = useState(false);
  const [saving, setSaving] = useState(false);
  const [error,  setError]  = useState('');
  const [form,   setForm]   = useState({ name:'', email:'', role:'professor', unit:'FabLab SP' });
  const navigate = useNavigate();
  const { t } = useTranslation();
  const setF = (k: string, v: string) => setForm(p => ({ ...p, [k]: v }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.email.trim()) return;
    setError('');
    setSaving(true);

    // Store access request in a dedicated table that doesn't require auth.users FK
    const { error: err } = await supabase
      .from('access_requests')
      .insert({
        name:       form.name.trim(),
        email:      form.email.trim(),
        role:       form.role,
        unit:       form.unit.trim(),
        status:     'pending',
        created_at: new Date().toISOString(),
      });

    setSaving(false);
    if (err) {
      // Fallback: try upsert in case table doesn't exist yet
      setError('Erro ao enviar solicitação. Por favor, entre em contato com o administrador.');
      console.error('Register error:', err);
    } else {
      setSent(true);
    }
  };

  if (sent) {
    return (
      <div className="min-h-screen flex items-center justify-center relative overflow-hidden">
        {BG}
        <div className="relative z-10 w-full max-w-[420px] mx-4">
          <motion.div
            className="rounded-3xl p-8 md:p-10 shadow-2xl bg-white text-center"
            initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }}
          >
            <motion.div initial={{ scale:0 }} animate={{ scale:1 }}
              transition={{ type:'spring', stiffness:400, damping:15, delay:0.1 }}
              className="w-16 h-16 rounded-3xl flex items-center justify-center mx-auto mb-5"
              style={{ background:'linear-gradient(135deg,#10b981,#059669)' }}>
              <CheckCircle size={32} className="text-white" />
            </motion.div>
            <h1 className="text-xl font-black text-gray-900 mb-2">Solicitação enviada!</h1>
            <p className="text-sm text-gray-500 mb-6">
              Sua solicitação foi registrada. Um administrador irá revisar e liberar o acesso em breve.
            </p>
            <Button
              onClick={() => navigate('/login')}
              className="w-full h-11 rounded-2xl font-bold text-white"
              style={{ background:'linear-gradient(135deg,#D42020,#ff3333)' }}
            >
              Voltar ao login
            </Button>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden">
      {BG}
      <div className="relative z-10 w-full max-w-[420px] mx-4">
        <motion.div
          className="rounded-3xl p-8 md:p-10 shadow-2xl bg-white"
          initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }}
          transition={{ duration:0.35 }}
        >
          {/* Back button */}
          <button
            onClick={() => navigate('/login')}
            className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-700 transition-colors mb-6 group"
          >
            <ArrowLeft size={15} className="group-hover:-translate-x-0.5 transition-transform" />
            Voltar ao login
          </button>

          <h1 className="text-xl font-black text-gray-900 mb-1">{t('auth.registerTitle')}</h1>
          <p className="text-sm text-gray-500 mb-6">{t('auth.registerSubtitle')}</p>

          <AnimatePresence>
            {error && (
              <motion.div initial={{ opacity:0, height:0 }} animate={{ opacity:1, height:'auto' }} exit={{ opacity:0, height:0 }}
                className="flex items-center gap-2 p-3 rounded-xl bg-red-50 text-red-600 text-sm mb-5 border border-red-100">
                <AlertCircle size={15} className="flex-shrink-0" />{error}
              </motion.div>
            )}
          </AnimatePresence>

          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="space-y-1.5">
              <Label className="text-[11px] font-bold uppercase tracking-widest text-gray-400">{t('auth.nameLabel')}</Label>
              <Input value={form.name} onChange={e => setF('name', e.target.value)}
                placeholder={t('auth.namePlaceholder')}
                className="h-11 bg-gray-50 border-gray-200 focus:border-red-400 rounded-xl text-gray-900" />
            </div>

            <div className="space-y-1.5">
              <Label className="text-[11px] font-bold uppercase tracking-widest text-gray-400">{t('auth.emailLabel')}</Label>
              <Input type="email" value={form.email} onChange={e => setF('email', e.target.value)}
                placeholder={t('auth.emailPlaceholder')}
                className="h-11 bg-gray-50 border-gray-200 focus:border-red-400 rounded-xl text-gray-900" />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-[11px] font-bold uppercase tracking-widest text-gray-400">{t('auth.roleLabel')}</Label>
                <select value={form.role} onChange={e => setF('role', e.target.value)}
                  className="w-full h-11 px-3 rounded-xl border border-gray-200 bg-gray-50 text-sm text-gray-900">
                  <option value="professor">{t('roles.professor')}</option>
                  <option value="funcionario">{t('roles.funcionario')}</option>
                </select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-[11px] font-bold uppercase tracking-widest text-gray-400">{t('auth.unitLabel')}</Label>
                <Input value={form.unit} onChange={e => setF('unit', e.target.value)}
                  placeholder="FabLab SP"
                  className="h-11 bg-gray-50 border-gray-200 focus:border-red-400 rounded-xl text-gray-900" />
              </div>
            </div>

            <Button type="submit" disabled={saving || !form.name || !form.email}
              className="w-full h-12 rounded-2xl font-bold text-white text-sm mt-2 transition-all hover:scale-[1.02] hover:shadow-lg"
              style={{ background:'linear-gradient(135deg,#D42020,#ff3333)', boxShadow:'0 4px 24px rgba(212,32,32,0.35)' }}>
              {saving
                ? <span className="flex items-center gap-2"><Loader2 size={16} className="animate-spin" />Enviando...</span>
                : t('auth.registerButton')}
            </Button>
          </form>
        </motion.div>
      </div>
    </div>
  );
}
