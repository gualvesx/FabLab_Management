import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff, CheckCircle2, AlertCircle, Loader2, KeyRound } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/lib/supabase';
import { motion } from 'framer-motion';

export function ResetPasswordPage() {
  const navigate = useNavigate();
  const [password, setPassword]     = useState('');
  const [confirm,  setConfirm]      = useState('');
  const [showPw,   setShowPw]       = useState(false);
  const [showCf,   setShowCf]       = useState(false);
  const [loading,  setLoading]      = useState(false);
  const [done,     setDone]         = useState(false);
  const [error,    setError]        = useState('');
  const [ready,    setReady]        = useState(false); // session recovered from URL

  // Supabase sends the token via URL hash — onAuthStateChange picks it up
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {
        setReady(true);
      }
    });

    // Also handle the case where the user arrives with a valid session already
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) setReady(true);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password.length < 8) {
      setError('A senha deve ter ao menos 8 caracteres.');
      return;
    }
    if (password !== confirm) {
      setError('As senhas não coincidem.');
      return;
    }

    setLoading(true);
    const { error: err } = await supabase.auth.updateUser({ password });
    setLoading(false);

    if (err) {
      setError(err.message || 'Erro ao redefinir senha. O link pode ter expirado.');
    } else {
      setDone(true);
      // Auto-redirect after 3 s
      setTimeout(() => navigate('/login'), 3000);
    }
  };

  const BG = (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      <div className="absolute inset-0" style={{ background: 'linear-gradient(135deg,#0a0a0a 0%,#1a0000 45%,#0f0505 100%)' }} />
      <div className="absolute rounded-full" style={{ width:700,height:700,top:-200,right:-200, background:'radial-gradient(circle,rgba(212,32,32,0.18) 0%,transparent 65%)',animation:'float 7s ease-in-out infinite' }} />
      <div className="absolute rounded-full" style={{ width:500,height:500,bottom:-150,left:-150, background:'radial-gradient(circle,rgba(37,99,235,0.12) 0%,transparent 65%)',animation:'float 10s ease-in-out infinite reverse' }} />
      <div className="absolute inset-0 opacity-[0.035]" style={{ backgroundImage:'linear-gradient(rgba(255,255,255,.5) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.5) 1px,transparent 1px)',backgroundSize:'56px 56px' }} />
    </div>
  );

  const card = "relative z-10 w-full max-w-[420px] mx-4";
  const cardInner = "rounded-3xl p-8 md:p-10 shadow-2xl bg-white";

  // ── Link inválido / sem token ────────────────────────────────────────────
  if (!ready) {
    return (
      <div className="min-h-screen flex items-center justify-center relative overflow-hidden">
        {BG}
        <div className={card}>
          <div className={cardInner}>
            <div className="text-center mb-6">
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4" style={{ background:'rgba(212,32,32,0.1)' }}>
                <AlertCircle size={28} style={{ color:'#D42020' }} />
              </div>
              <h1 className="text-xl font-black text-gray-900 mb-2">Link inválido ou expirado</h1>
              <p className="text-sm text-gray-500">
                Este link de redefinição não é mais válido. Solicite um novo e-mail de recuperação.
              </p>
            </div>
            <Button
              onClick={() => navigate('/login')}
              className="w-full h-11 rounded-2xl font-bold text-white"
              style={{ background:'linear-gradient(135deg,#D42020,#ff3333)' }}
            >
              Voltar ao login
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // ── Senha redefinida com sucesso ─────────────────────────────────────────
  if (done) {
    return (
      <div className="min-h-screen flex items-center justify-center relative overflow-hidden">
        {BG}
        <div className={card}>
          <motion.div
            className={cardInner + ' text-center'}
            initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }}
            transition={{ duration:0.4 }}
          >
            <motion.div
              initial={{ scale:0 }} animate={{ scale:1 }}
              transition={{ type:'spring', stiffness:400, damping:15, delay:0.1 }}
              className="w-16 h-16 rounded-3xl flex items-center justify-center mx-auto mb-5"
              style={{ background:'linear-gradient(135deg,#10b981,#059669)' }}
            >
              <CheckCircle2 size={32} className="text-white" />
            </motion.div>
            <h1 className="text-xl font-black text-gray-900 mb-2">Senha redefinida!</h1>
            <p className="text-sm text-gray-500 mb-6">
              Sua senha foi alterada com sucesso. Você será redirecionado ao login em instantes.
            </p>
            <Button
              onClick={() => navigate('/login')}
              className="w-full h-11 rounded-2xl font-bold text-white"
              style={{ background:'linear-gradient(135deg,#D42020,#ff3333)' }}
            >
              Ir para o login agora
            </Button>
          </motion.div>
        </div>
      </div>
    );
  }

  // ── Formulário de nova senha ─────────────────────────────────────────────
  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden">
      {BG}
      <div className={card}>
        <motion.div
          className={cardInner}
          initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }}
          transition={{ duration:0.4 }}
        >
          {/* Icon */}
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-5"
            style={{ background:'rgba(212,32,32,0.1)' }}>
            <KeyRound size={22} style={{ color:'#D42020' }} />
          </div>

          <h1 className="text-xl font-black text-center text-gray-900 mb-1">Redefinir senha</h1>
          <p className="text-sm text-gray-500 text-center mb-7">
            Escolha uma senha nova com ao menos 8 caracteres.
          </p>

          {error && (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-red-50 text-red-600 text-sm mb-5 border border-red-100">
              <AlertCircle size={15} className="flex-shrink-0" />{error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Nova senha */}
            <div className="space-y-1.5">
              <Label className="text-[11px] font-bold uppercase tracking-widest text-gray-400">
                Nova senha
              </Label>
              <div className="relative">
                <Input
                  type={showPw ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Mínimo 8 caracteres"
                  className="h-11 bg-gray-50 border-gray-200 focus:border-red-400 rounded-xl pr-11 text-gray-900"
                  autoComplete="new-password"
                  autoFocus
                />
                <button type="button" tabIndex={-1} onClick={() => setShowPw(!showPw)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors">
                  {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {/* Strength bar */}
              {password.length > 0 && (
                <div className="h-1 rounded-full bg-gray-200 overflow-hidden mt-1.5">
                  <div
                    className="h-full rounded-full transition-all duration-300"
                    style={{
                      width: `${Math.min((password.length / 12) * 100, 100)}%`,
                      background: password.length < 8 ? '#D42020' : password.length < 12 ? '#d97706' : '#059669',
                    }}
                  />
                </div>
              )}
            </div>

            {/* Confirmar senha */}
            <div className="space-y-1.5">
              <Label className="text-[11px] font-bold uppercase tracking-widest text-gray-400">
                Confirmar senha
              </Label>
              <div className="relative">
                <Input
                  type={showCf ? 'text' : 'password'}
                  value={confirm}
                  onChange={e => setConfirm(e.target.value)}
                  placeholder="Repita a senha"
                  className="h-11 bg-gray-50 border-gray-200 focus:border-red-400 rounded-xl pr-11 text-gray-900"
                  autoComplete="new-password"
                />
                <button type="button" tabIndex={-1} onClick={() => setShowCf(!showCf)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors">
                  {showCf ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {confirm.length > 0 && password !== confirm && (
                <p className="text-[11px] text-red-500 mt-1">As senhas não coincidem.</p>
              )}
            </div>

            <Button
              type="submit"
              disabled={loading || password.length < 8 || password !== confirm}
              className="w-full h-12 rounded-2xl font-bold text-white text-sm mt-2 transition-all hover:scale-[1.02] hover:shadow-lg"
              style={{ background:'linear-gradient(135deg,#D42020,#ff3333)', boxShadow:'0 4px 24px rgba(212,32,32,0.35)' }}
            >
              {loading
                ? <span className="flex items-center gap-2"><Loader2 size={16} className="animate-spin" />Salvando...</span>
                : 'Redefinir senha'}
            </Button>
          </form>

          <p className="text-center text-sm text-gray-400 mt-5">
            <button onClick={() => navigate('/login')}
              className="hover:text-gray-600 transition-colors underline underline-offset-2">
              Voltar ao login
            </button>
          </p>
        </motion.div>
      </div>
    </div>
  );
}
