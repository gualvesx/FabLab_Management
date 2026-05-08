import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff, AlertCircle, CheckCircle2, ArrowLeft, Loader2, KeyRound } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuthStore } from '@/stores/authStore';
import { supabase } from '@/lib/supabase';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';

type View = 'login' | 'forgot' | 'forgot-sent';

export function LoginPage() {
  const [view, setView] = useState<View>('login');
  // Login state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState<string>('');
  const [loading, setLoading] = useState(false);
  // Forgot password state
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotError, setForgotError] = useState('');

  const { login } = useAuthStore();
  const navigate = useNavigate();
  const { t } = useTranslation();

  /* ── Login submit ─────────────────────────────────────── */
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) { setError(t('auth.fillFields')); return; }
    setError(''); setLoading(true);
    const result = await login(email, password);
    setLoading(false);
    if (result.ok) navigate('/');
    else setError(result.error || t('auth.invalidCredentials'));
  };

  /* ── Forgot password submit ───────────────────────────── */
  const handleForgot = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotEmail) return;
    setForgotError(''); setForgotLoading(true);
    const { error: err } = await supabase.auth.resetPasswordForEmail(forgotEmail, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setForgotLoading(false);
    if (err) setForgotError(t('auth.forgotPasswordError'));
    else setView('forgot-sent');
  };

  /* ── Shared styles ────────────────────────────────────── */
  const BG = (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {/* main gradient */}
      <div className="absolute inset-0" style={{
        background: 'linear-gradient(135deg, #0a0a0a 0%, #1a0000 45%, #0f0505 100%)'
      }} />
      {/* glowing orbs */}
      <div className="absolute rounded-full" style={{
        width: 700, height: 700, top: -200, right: -200,
        background: 'radial-gradient(circle, rgba(212,32,32,0.18) 0%, transparent 65%)',
        animation: 'float 7s ease-in-out infinite',
      }} />
      <div className="absolute rounded-full" style={{
        width: 500, height: 500, bottom: -150, left: -150,
        background: 'radial-gradient(circle, rgba(37,99,235,0.12) 0%, transparent 65%)',
        animation: 'float 10s ease-in-out infinite reverse',
      }} />
      {/* grid */}
      <div className="absolute inset-0 opacity-[0.035]" style={{
        backgroundImage: 'linear-gradient(rgba(255,255,255,.5) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.5) 1px,transparent 1px)',
        backgroundSize: '56px 56px'
      }} />
      {/* noise */}
      <div className="absolute inset-0 opacity-[0.025]" style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.75' numOctaves='4'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
      }} />
    </div>
  );

  const slideVariants = {
    enter: (dir: number) => ({ x: dir * 60, opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (dir: number) => ({ x: dir * -60, opacity: 0 }),
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden">
      {BG}

      <div className="relative z-10 w-full max-w-[420px] mx-4">
        <AnimatePresence mode="wait" custom={1}>

          {/* ═══════════════ LOGIN FORM ═══════════════ */}
          {view === 'login' && (
            <motion.div key="login" custom={-1} variants={slideVariants}
              initial="enter" animate="center" exit="exit"
              transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
              className="rounded-3xl p-8 md:p-10 shadow-2xl"
              style={{ background: 'rgba(255,255,255,0.97)', backdropFilter: 'blur(20px)' }}
            >
              {/* Logo */}
              <div className="flex items-center justify-center gap-3 mb-8">
                <img src="https://www.sesisp.org.br/images/Sesi-SP.jpg" alt="SESI SP"
                  className="h-10 w-auto object-contain"
                  onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                <span className="text-sm font-extrabold tracking-wider" style={{ color: '#D42020' }}>FabLab</span>
              </div>

              <h1 className="text-2xl font-black text-center text-gray-900 mb-1">{t('auth.welcome')}</h1>
              <p className="text-sm text-gray-500 text-center mb-7">{t('auth.subtitle')}</p>

              <AnimatePresence>
                {error && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                    className="flex items-center gap-2 p-3 rounded-xl bg-red-50 text-red-600 text-sm mb-5 border border-red-100">
                    <AlertCircle size={15} className="flex-shrink-0" />{error}
                  </motion.div>
                )}
              </AnimatePresence>

              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-1.5">
                  <Label className="text-[11px] font-bold uppercase tracking-widest text-gray-400">
                    {t('auth.emailLabel')}
                  </Label>
                  <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                    placeholder={t('auth.emailPlaceholder')}
                    className="h-11 bg-gray-50 border-gray-200 focus:border-red-400 rounded-xl text-gray-900"
                    autoComplete="email" />
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <Label className="text-[11px] font-bold uppercase tracking-widest text-gray-400">
                      {t('auth.passwordLabel')}
                    </Label>
                    <button type="button" onClick={() => { setForgotEmail(email); setView('forgot'); }}
                      className="text-[11px] font-semibold text-red-500 hover:text-red-700 transition-colors">
                      {t('auth.forgotPassword')}
                    </button>
                  </div>
                  <div className="relative">
                    <Input id="password" type={showPw ? 'text' : 'password'} value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder={t('auth.passwordPlaceholder')}
                      className="h-11 bg-gray-50 border-gray-200 focus:border-red-400 rounded-xl pr-11 text-gray-900"
                      autoComplete="current-password" />
                    <button type="button" onClick={() => setShowPw(!showPw)} tabIndex={-1}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors">
                      {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                <Button type="submit" disabled={loading}
                  className="w-full h-12 rounded-2xl font-bold text-white text-sm mt-2 transition-all hover:scale-[1.02] hover:shadow-lg active:scale-[0.98]"
                  style={{ background: loading ? '#999' : 'linear-gradient(135deg, #D42020, #ff3333)', boxShadow: '0 4px 24px rgba(212,32,32,0.35)' }}>
                  {loading
                    ? <span className="flex items-center gap-2"><Loader2 size={16} className="animate-spin" />{t('auth.loggingIn')}</span>
                    : t('auth.loginButton')}
                </Button>
              </form>

              <div className="mt-5 text-center space-y-2">
                <p className="text-sm text-gray-500">
                  {t('auth.noAccess')}{' '}
                  <button onClick={() => navigate('/register')} className="font-semibold text-red-500 hover:text-red-700 transition-colors">
                    {t('auth.register')}
                  </button>
                </p>
                <p className="text-sm text-gray-400">
                  <button onClick={() => navigate('/landing')} className="hover:text-gray-600 transition-colors underline underline-offset-2">
                    Conhecer o FabLab
                  </button>
                </p>
              </div>
            </motion.div>
          )}

          {/* ═══════════════ FORGOT PASSWORD ═══════════════ */}
          {view === 'forgot' && (
            <motion.div key="forgot" custom={1} variants={slideVariants}
              initial="enter" animate="center" exit="exit"
              transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
              className="rounded-3xl p-8 md:p-10 shadow-2xl"
              style={{ background: 'rgba(255,255,255,0.97)', backdropFilter: 'blur(20px)' }}
            >
              <button onClick={() => { setView('login'); setForgotError(''); }}
                className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-700 transition-colors mb-6 group">
                <ArrowLeft size={15} className="group-hover:-translate-x-0.5 transition-transform" />
                {t('auth.backToLoginLink')}
              </button>

              <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-5 mx-auto"
                style={{ background: 'rgba(212,32,32,0.1)' }}>
                <KeyRound size={22} style={{ color: '#D42020' }} />
              </div>

              <h1 className="text-xl font-black text-center text-gray-900 mb-1">{t('auth.forgotPasswordTitle')}</h1>
              <p className="text-sm text-gray-500 text-center mb-7">{t('auth.forgotPasswordSubtitle')}</p>

              <AnimatePresence>
                {forgotError && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                    className="flex items-center gap-2 p-3 rounded-xl bg-red-50 text-red-600 text-sm mb-5 border border-red-100">
                    <AlertCircle size={15} className="flex-shrink-0" />{forgotError}
                  </motion.div>
                )}
              </AnimatePresence>

              <form onSubmit={handleForgot} className="space-y-4">
                <div className="space-y-1.5">
                  <Label className="text-[11px] font-bold uppercase tracking-widest text-gray-400">
                    {t('auth.emailLabel')}
                  </Label>
                  <Input type="email" value={forgotEmail} onChange={(e) => setForgotEmail(e.target.value)}
                    placeholder={t('auth.emailPlaceholder')}
                    className="h-11 bg-gray-50 border-gray-200 focus:border-red-400 rounded-xl text-gray-900"
                    autoComplete="email" autoFocus />
                </div>

                <Button type="submit" disabled={forgotLoading || !forgotEmail}
                  className="w-full h-12 rounded-2xl font-bold text-white text-sm transition-all hover:scale-[1.02] hover:shadow-lg"
                  style={{ background: 'linear-gradient(135deg, #D42020, #ff3333)', boxShadow: '0 4px 24px rgba(212,32,32,0.35)' }}>
                  {forgotLoading
                    ? <span className="flex items-center gap-2"><Loader2 size={16} className="animate-spin" />{t('auth.forgotPasswordSending')}</span>
                    : t('auth.forgotPasswordBtn')}
                </Button>
              </form>
            </motion.div>
          )}

          {/* ═══════════════ FORGOT SENT ═══════════════ */}
          {view === 'forgot-sent' && (
            <motion.div key="sent" custom={1} variants={slideVariants}
              initial="enter" animate="center" exit="exit"
              transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
              className="rounded-3xl p-8 md:p-10 shadow-2xl text-center"
              style={{ background: 'rgba(255,255,255,0.97)', backdropFilter: 'blur(20px)' }}
            >
              <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 400, damping: 15, delay: 0.1 }}
                className="w-16 h-16 rounded-3xl flex items-center justify-center mx-auto mb-5"
                style={{ background: 'linear-gradient(135deg, #10b981, #059669)' }}>
                <CheckCircle2 size={32} className="text-white" />
              </motion.div>

              <h1 className="text-xl font-black text-gray-900 mb-2">{t('auth.forgotPasswordSuccess').split('!')[0]}!</h1>
              <p className="text-sm text-gray-500 mb-7">
                Enviamos um link para <strong className="text-gray-700">{forgotEmail}</strong>. Verifique sua caixa de entrada.
              </p>

              <Button onClick={() => setView('login')}
                className="w-full h-12 rounded-2xl font-bold text-white text-sm"
                style={{ background: 'linear-gradient(135deg, #D42020, #ff3333)' }}>
                {t('auth.backToLoginLink')}
              </Button>
            </motion.div>
          )}

        </AnimatePresence>
      </div>
    </div>
  );
}
