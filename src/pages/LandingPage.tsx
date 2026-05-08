/**
 * LandingPage — Padrão Visual SESI SP
 * Institucional, sério, limpo. Branco + vermelho #D42020.
 * Desktop: animações com Framer Motion suaves
 * Mobile: versão leve sem animações pesadas
 */
import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, useInView, AnimatePresence } from 'framer-motion';
import {
  ChevronLeft, ChevronRight, ChevronDown,
  Menu, X, LogIn, ExternalLink,
  Cpu, Scissors, Zap, Users, BookOpen, Layers3,
  Printer, Terminal
} from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';

/* ─── constants ─────────────────────────────────────────── */
const RED = '#D42020';

const NAV_LINKS = [
  { label: 'Sobre', id: 'sobre' },
  { label: 'Recursos', id: 'recursos' },
  { label: 'Galeria', id: 'galeria' },
  { label: 'Blog', id: 'blog' },
];

const SLIDES = [
  {
    url: 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=1200&q=75&auto=format&fit=crop',
    category: 'Fabricação Digital',
    title: 'Impressão 3D e Prototipagem',
    desc: 'Transforme ideias em objetos físicos com precisão milimétrica.',
  },
  {
    url: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=1200&q=75&auto=format&fit=crop',
    category: 'Eletrônica',
    title: 'Robótica e Automação',
    desc: 'Arduino, ESP32, sensores e sistemas embarcados na prática.',
  },
  {
    url: 'https://images.unsplash.com/photo-1531482615713-2afd69097998?w=1200&q=75&auto=format&fit=crop',
    category: 'Projetos',
    title: 'Colaboração e Inovação',
    desc: 'Times multidisciplinares criando soluções para problemas reais.',
  },
  {
    url: 'https://images.unsplash.com/photo-1488590528505-98d2b5aba04b?w=1200&q=75&auto=format&fit=crop',
    category: 'Programação',
    title: 'Código que vira produto',
    desc: 'Desenvolvimento de software integrado ao hardware do laboratório.',
  },
];

const FEATURES = [
  { icon: <Cpu size={24} />, title: 'Impressão 3D', desc: 'Impressoras FDM e resina para prototipagem rápida e produção de peças.' },
  { icon: <Scissors size={24} />, title: 'Corte a Laser', desc: 'Alta precisão em madeira, acrílico, couro, tecido e outros materiais.' },
  { icon: <Zap size={24} />, title: 'Eletrônica', desc: 'Bancadas completas com Arduino, ESP32, osciloscópio e ferro de solda.' },
  { icon: <Layers3 size={24} />, title: 'Modelagem 3D', desc: 'Software CAD e CAM para design de peças e projetos de fabricação.' },
  { icon: <Users size={24} />, title: 'Capacitação', desc: 'Cursos, workshops e mentoria com profissionais da área maker.' },
  { icon: <BookOpen size={24} />, title: 'Blog e Tutoriais', desc: 'Conteúdos técnicos publicados pela equipe e comunidade do FabLab.' },
];

// Interactive tech panel items
const TECH_ITEMS = [
  { icon: 'Printer',   label: 'Impressão 3D', value: 'FDM + Resina',    color: '#D42020' },
  { icon: 'Cpu',       label: 'Eletrônica',   value: 'Arduino · ESP32', color: '#2563eb' },
  { icon: 'Scissors',  label: 'Fabricação',   value: 'CNC · Laser',     color: '#059669' },
  { icon: 'Terminal',  label: 'Programação',  value: 'Maker · IoT',     color: '#7c3aed' },
];

const ICON_MAP: Record<string, React.ReactNode> = {
  Printer:  <Printer  size={28} />,
  Cpu:      <Cpu      size={28} />,
  Scissors: <Scissors size={28} />,
  Terminal: <Terminal size={28} />,
};
const ICON_MAP_SM: Record<string, React.ReactNode> = {
  Printer:  <Printer  size={20} />,
  Cpu:      <Cpu      size={20} />,
  Scissors: <Scissors size={20} />,
  Terminal: <Terminal size={20} />,
};

/* ─── hooks ─────────────────────────────────────────────── */
function useIsMobile() {
  const [m, setM] = useState(() => window.innerWidth < 768);
  useEffect(() => {
    const fn = () => setM(window.innerWidth < 768);
    window.addEventListener('resize', fn);
    return () => window.removeEventListener('resize', fn);
  }, []);
  return m;
}

function useScrollY() {
  const [y, setY] = useState(0);
  useEffect(() => {
    const fn = () => setY(window.scrollY);
    window.addEventListener('scroll', fn, { passive: true });
    return () => window.removeEventListener('scroll', fn);
  }, []);
  return y;
}

/* ─── Animation wrapper — desktop only ──────────────────── */
function Reveal({
  children, delay = 0, className = '', from = 'bottom',
}: {
  children: React.ReactNode; delay?: number; className?: string; from?: 'bottom' | 'left' | 'right';
}) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-60px' });
  const isMobile = useIsMobile();

  const initial = isMobile
    ? { opacity: 0 }
    : { opacity: 0, y: from === 'bottom' ? 32 : 0, x: from === 'left' ? -32 : from === 'right' ? 32 : 0 };

  return (
    <motion.div
      ref={ref}
      initial={initial}
      animate={inView ? { opacity: 1, y: 0, x: 0 } : initial}
      transition={{ duration: isMobile ? 0.3 : 0.65, delay: isMobile ? 0 : delay, ease: [0.22, 1, 0.36, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/* ─── Carousel ───────────────────────────────────────────── */
function Carousel({ isMobile }: { isMobile: boolean }) {
  const [idx, setIdx] = useState(0);
  const [dir, setDir] = useState(0);
  const [paused, setPaused] = useState(false);
  const len = SLIDES.length;

  const go = (next: number) => {
    setDir(next > idx ? 1 : -1);
    setIdx((next + len) % len);
  };

  useEffect(() => {
    if (paused) return;
    const t = setInterval(() => { setDir(1); setIdx(p => (p + 1) % len); }, 5500);
    return () => clearInterval(t);
  }, [paused, len]);

  const slide = SLIDES[idx];

  return (
    <div
      id="galeria"
      className="relative w-full overflow-hidden bg-gray-900"
      style={{ height: isMobile ? 260 : 560 }}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <AnimatePresence custom={dir} initial={false}>
        <motion.div
          key={idx}
          custom={dir}
          variants={{
            enter: (d: number) => ({ x: d >= 0 ? '100%' : '-100%', opacity: 0.6 }),
            center: { x: 0, opacity: 1 },
            exit: (d: number) => ({ x: d >= 0 ? '-100%' : '100%', opacity: 0.6 }),
          }}
          initial="enter" animate="center" exit="exit"
          transition={{ duration: 0.6, ease: [0.32, 0, 0.67, 0] }}
          className="absolute inset-0"
        >
          <img
            src={slide.url}
            alt={slide.title}
            className="w-full h-full object-cover"
            loading="lazy"
          />
          {/* Overlay */}
          <div
            className="absolute inset-0"
            style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.72) 0%, rgba(0,0,0,0.15) 55%, rgba(0,0,0,0) 100%)' }}
          />
          {/* Caption */}
          <div className="absolute bottom-0 left-0 right-0 p-5 md:p-10">
            <motion.span
              initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25, duration: 0.4 }}
              className="inline-block text-xs font-bold tracking-widest uppercase text-white/70 mb-2"
              style={{ letterSpacing: '0.15em' }}
            >
              {slide.category}
            </motion.span>
            <motion.h3
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35, duration: 0.45 }}
              className="text-white font-bold text-lg md:text-3xl mb-1 leading-tight"
              style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}
            >
              {slide.title}
            </motion.h3>
            {!isMobile && (
              <motion.p
                initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                transition={{ delay: 0.5, duration: 0.4 }}
                className="text-white/75 text-sm md:text-base max-w-xl"
              >
                {slide.desc}
              </motion.p>
            )}
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Controls */}
      {!isMobile && (
        <>
          <button
            onClick={() => go(idx - 1)}
            className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 flex items-center justify-center bg-white/90 hover:bg-white transition-colors rounded shadow-md z-10"
            aria-label="Anterior"
          >
            <ChevronLeft size={20} className="text-gray-800" />
          </button>
          <button
            onClick={() => go(idx + 1)}
            className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 flex items-center justify-center bg-white/90 hover:bg-white transition-colors rounded shadow-md z-10"
            aria-label="Próximo"
          >
            <ChevronRight size={20} className="text-gray-800" />
          </button>
        </>
      )}

      {/* Dots */}
      <div className="absolute bottom-4 right-5 md:right-10 flex gap-1.5 z-10">
        {SLIDES.map((_, i) => (
          <button
            key={i}
            onClick={() => go(i)}
            className="rounded-sm transition-all duration-300"
            style={{
              width: i === idx ? 20 : 6,
              height: 6,
              background: i === idx ? '#D42020' : 'rgba(255,255,255,0.5)',
            }}
            aria-label={`Slide ${i + 1}`}
          />
        ))}
      </div>

      {/* Counter */}
      {!isMobile && (
        <div className="absolute top-5 right-5 text-xs font-bold text-white/60 tracking-widest z-10">
          {String(idx + 1).padStart(2, '0')} / {String(len).padStart(2, '0')}
        </div>
      )}
    </div>
  );
}


/* ─── Interactive Tech Panel ────────────────────────────── */
function TechPanel({ isMobile }: { isMobile: boolean }) {
  const [active, setActive] = useState(0);
  const [tick, setTick] = useState(0);

  // Auto-cycle
  useEffect(() => {
    const t = setInterval(() => {
      setActive(p => (p + 1) % TECH_ITEMS.length);
      setTick(p => p + 1);
    }, 2200);
    return () => clearInterval(t);
  }, []);

  if (isMobile) {
    return (
      <div className="grid grid-cols-2 gap-2">
        {TECH_ITEMS.map((item, i) => (
          <button key={item.label} onClick={() => setActive(i)}
            className="rounded-lg p-3 text-left border transition-all duration-300"
            style={{
              background: active === i ? item.color + '10' : '#f9fafb',
              borderColor: active === i ? item.color : '#e5e7eb',
            }}>
            <div className="mb-1" style={{ color: active === i ? item.color : '#6b7280' }}>{ICON_MAP_SM[item.icon]}</div>
            <div className="text-xs font-bold text-gray-900">{item.label}</div>
            <div className="text-[10px] mt-0.5" style={{ color: active === i ? item.color : '#9ca3af' }}>{item.value}</div>
          </button>
        ))}
      </div>
    );
  }

  const current = TECH_ITEMS[active];

  return (
    <div className="space-y-3">
      {/* Main display */}
      <motion.div
        key={tick}
        initial={{ opacity: 0, x: 12 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.35 }}
        className="rounded-xl p-6 border-2 relative overflow-hidden"
        style={{ borderColor: current.color, background: current.color + '06' }}
      >
        {/* Subtle animated ring */}
        <motion.div
          animate={{ scale: [1, 1.6, 1], opacity: [0.15, 0, 0.15] }}
          transition={{ duration: 2.2, repeat: Infinity }}
          className="absolute -top-6 -right-6 w-24 h-24 rounded-full"
          style={{ background: current.color }}
        />
        <div className="relative z-10 flex items-center gap-4">
          <div className="flex-shrink-0" style={{ color: current.color }}>{ICON_MAP[current.icon]}</div>
          <div>
            <div className="text-[11px] font-bold uppercase tracking-widest mb-0.5" style={{ color: current.color }}>
              Área ativa
            </div>
            <div className="text-xl font-bold text-gray-900">{current.label}</div>
            <div className="text-sm text-gray-500 mt-0.5">{current.value}</div>
          </div>
        </div>
        {/* Progress bar */}
        <div className="mt-4 h-0.5 bg-gray-200 rounded-full overflow-hidden">
          <motion.div
            key={tick}
            initial={{ width: '0%' }}
            animate={{ width: '100%' }}
            transition={{ duration: 2.2, ease: 'linear' }}
            className="h-full rounded-full"
            style={{ background: current.color }}
          />
        </div>
      </motion.div>

      {/* Selector tabs */}
      <div className="grid grid-cols-4 gap-2">
        {TECH_ITEMS.map((item, i) => (
          <button key={item.label} onClick={() => { setActive(i); setTick(t => t + 1); }}
            className="rounded-lg p-3 text-center border transition-all duration-300 hover:scale-105"
            style={{
              background: active === i ? item.color + '12' : '#f9fafb',
              borderColor: active === i ? item.color : '#e5e7eb',
            }}>
            <div className="mb-1" style={{ color: active === i ? item.color : '#6b7280' }}>{ICON_MAP_SM[item.icon]}</div>
            <div className="text-[10px] font-bold leading-tight" style={{ color: active === i ? item.color : '#374151' }}>
              {item.label}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

/* ─── Navbar ─────────────────────────────────────────────── */
function Navbar({
  scrollY, isMobile, navigate, isAuthenticated,
}: {
  scrollY: number; isMobile: boolean; navigate: (p: string) => void; isAuthenticated: boolean;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const solid = scrollY > 60;

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
    setMenuOpen(false);
  };

  return (
    <>
      <header
        className="fixed top-0 left-0 right-0 z-50 transition-all duration-300"
        style={{
          background: solid ? 'rgba(255,255,255,0.98)' : 'rgba(255,255,255,0)',
          borderBottom: solid ? '1px solid #e5e7eb' : '1px solid transparent',
          backdropFilter: solid ? 'blur(12px)' : 'none',
          boxShadow: solid ? '0 1px 8px rgba(0,0,0,0.07)' : 'none',
        }}
      >
        {/* Top utility bar — desktop only */}
        {!isMobile && (
          <div style={{ background: RED }} className="w-full">
            <div className="max-w-7xl mx-auto flex items-center justify-between px-6 h-8">
              <span className="text-white text-[11px] font-medium tracking-wide">
                Plataforma Educacional · SESI SP
              </span>
              <div className="flex items-center gap-4">
                <a href="https://www.sesisp.org.br" target="_blank" rel="noopener"
                  className="text-white/80 text-[11px] hover:text-white transition-colors flex items-center gap-1">
                  Portal SESI SP <ExternalLink size={10} />
                </a>
              </div>
            </div>
          </div>
        )}

        {/* Main nav */}
        <div className="max-w-7xl mx-auto px-4 md:px-6 flex items-center h-14 md:h-16 gap-6">
          {/* Logo */}
          <button onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} className="flex items-center gap-3 flex-shrink-0">
            <img
              src="https://www.sesisp.org.br/images/Sesi-SP.jpg"
              alt="SESI SP"
              className="h-7 md:h-9 w-auto object-contain"
              onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
            />
            <div className="hidden sm:flex flex-col leading-none">
              <span className="text-[10px] font-bold tracking-widest uppercase" style={{ color: RED }}>
                FabLab
              </span>
              <span className="text-[10px] text-gray-500 tracking-wide">Plataforma Educacional</span>
            </div>
          </button>

          {/* Desktop nav links */}
          {!isMobile && (
            <nav className="flex items-center gap-1 ml-4">
              {NAV_LINKS.map(link => (
                <button
                  key={link.id}
                  onClick={() => scrollTo(link.id)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors rounded relative group"
                >
                  {link.label}
                  <span className="absolute bottom-0 left-4 right-4 h-0.5 scale-x-0 group-hover:scale-x-100 transition-transform origin-left"
                    style={{ background: RED }} />
                </button>
              ))}
            </nav>
          )}

          <div className="flex-1" />

          {/* CTA */}
          {!isMobile && (
            <button
              onClick={() => navigate(isAuthenticated ? '/' : '/login')}
              className="flex items-center gap-2 px-5 py-2 text-sm font-bold text-white rounded transition-all hover:opacity-90 active:scale-95"
              style={{ background: RED }}
            >
              <LogIn size={15} />
              {isAuthenticated ? 'Ir para plataforma' : 'Entrar'}
            </button>
          )}

          {/* Mobile hamburger */}
          {isMobile && (
            <button onClick={() => setMenuOpen(!menuOpen)}
              className="p-2 rounded text-gray-700 hover:bg-gray-100 transition-colors">
              {menuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          )}
        </div>
      </header>

      {/* Mobile dropdown */}
      <AnimatePresence>
        {menuOpen && isMobile && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
            className="fixed top-14 left-0 right-0 z-40 bg-white border-b border-gray-200 shadow-lg"
          >
            {NAV_LINKS.map(link => (
              <button key={link.id} onClick={() => scrollTo(link.id)}
                className="w-full text-left px-5 py-3.5 text-sm font-medium text-gray-700 border-b border-gray-100 last:border-0 hover:bg-gray-50 transition-colors">
                {link.label}
              </button>
            ))}
            <div className="p-4">
              <button
                onClick={() => { navigate(isAuthenticated ? '/' : '/login'); setMenuOpen(false); }}
                className="w-full py-3 text-sm font-bold text-white rounded text-center transition-opacity hover:opacity-90"
                style={{ background: RED }}
              >
                {isAuthenticated ? 'Ir para plataforma' : 'Entrar na plataforma'}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

/* ─── Main ───────────────────────────────────────────────── */
export function LandingPage() {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const scrollY = useScrollY();
  const { isAuthenticated } = useAuthStore();

  const topPad = isMobile ? 'pt-14' : 'pt-22';

  return (
    <div className="bg-white text-gray-900 min-h-screen overflow-x-hidden">
      <Navbar scrollY={scrollY} isMobile={isMobile} navigate={navigate} isAuthenticated={isAuthenticated} />

      {/* ════════════════════════════════════════
          HERO — clean institutional
      ════════════════════════════════════════ */}
      <section
        className={`${topPad} relative overflow-hidden`}
        style={{ paddingTop: isMobile ? 56 : 88 }}
      >
        {/* Red accent bar top */}
        <div className="w-full h-1" style={{ background: RED }} />

        <div className="max-w-7xl mx-auto px-5 md:px-8 py-12 md:py-20 grid md:grid-cols-2 gap-10 md:gap-16 items-center">
          {/* Left — text */}
          <div>
            {isMobile ? (
              <>
                <div className="inline-flex items-center gap-2 mb-4 px-3 py-1 border-l-4 bg-red-50"
                  style={{ borderColor: RED }}>
                  <span className="text-xs font-bold tracking-widest uppercase" style={{ color: RED }}>
                    SESI SP · FabLab
                  </span>
                </div>
                <h1 className="text-3xl font-bold text-gray-900 mb-4 leading-tight"
                  style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}>
                  Laboratório de<br />Fabricação Digital
                </h1>
                <p className="text-gray-600 text-sm leading-relaxed mb-6">
                  Espaço de inovação do SESI SP para estudantes criarem projetos reais com impressão 3D, eletrônica, robótica e programação.
                </p>
                <button
                  onClick={() => navigate(isAuthenticated ? '/' : '/login')}
                  className="inline-flex items-center gap-2 px-6 py-3 text-sm font-bold text-white rounded transition-opacity hover:opacity-90"
                  style={{ background: RED }}
                >
                  <LogIn size={15} />
                  {isAuthenticated ? 'Acessar plataforma' : 'Entrar na plataforma'}
                </button>
              </>
            ) : (
              <>
                <Reveal>
                  <div className="inline-flex items-center gap-2 mb-5 px-3 py-1.5 border-l-4 bg-red-50"
                    style={{ borderColor: RED }}>
                    <span className="text-xs font-bold tracking-widest uppercase" style={{ color: RED }}>
                      SESI SP · FabLab · Plataforma Educacional
                    </span>
                  </div>
                </Reveal>
                <Reveal delay={0.08}>
                  <h1 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-5 leading-tight"
                    style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}>
                    Laboratório de<br />Fabricação Digital
                  </h1>
                </Reveal>
                <Reveal delay={0.15}>
                  <p className="text-gray-600 text-lg leading-relaxed mb-8 max-w-lg">
                    Espaço de inovação do SESI SP onde estudantes desenvolvem projetos reais utilizando impressão 3D, eletrônica, robótica e programação.
                  </p>
                </Reveal>
                <Reveal delay={0.22}>
                  <div className="flex items-center gap-4">
                    <button
                      onClick={() => navigate(isAuthenticated ? '/' : '/login')}
                      className="inline-flex items-center gap-2 px-7 py-3.5 text-sm font-bold text-white rounded transition-all hover:opacity-90 active:scale-95 shadow-sm"
                      style={{ background: RED }}
                    >
                      <LogIn size={15} />
                      {isAuthenticated ? 'Acessar plataforma' : 'Entrar na plataforma'}
                    </button>
                    <button
                      onClick={() => document.getElementById('sobre')?.scrollIntoView({ behavior: 'smooth' })}
                      className="inline-flex items-center gap-1.5 px-5 py-3.5 text-sm font-semibold text-gray-700 border border-gray-300 rounded hover:bg-gray-50 transition-colors"
                    >
                      Saiba mais <ChevronDown size={15} />
                    </button>
                  </div>
                </Reveal>
              </>
            )}
          </div>

          {/* Right — stats card */}
          {isMobile ? (
            <TechPanel isMobile={true} />
          ) : (
            <Reveal delay={0.1} from="right">
              <TechPanel isMobile={false} />
            </Reveal>
          )}
        </div>
      </section>

      {/* ════════════════════════════════════════
          CAROUSEL
      ════════════════════════════════════════ */}
      <Carousel isMobile={isMobile} />

      {/* ════════════════════════════════════════
          SOBRE
      ════════════════════════════════════════ */}
      <section id="sobre" className="py-16 md:py-24 bg-white">
        <div className="max-w-7xl mx-auto px-5 md:px-8">
          {/* Section header */}
          <div className="flex items-center gap-3 mb-10 md:mb-14">
            <div className="w-8 h-1 rounded" style={{ background: RED }} />
            <span className="text-xs font-bold tracking-widest uppercase text-gray-500">Sobre o FabLab</span>
          </div>

          <div className="grid md:grid-cols-2 gap-12 md:gap-20 items-center">
            {isMobile ? (
              <>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-4 leading-tight"
                    style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}>
                    Um espaço para aprender fazendo
                  </h2>
                  <p className="text-gray-600 text-sm leading-relaxed mb-4">
                    O FabLab SESI SP é um laboratório de fabricação digital integrado à proposta pedagógica do SESI. Aqui, estudantes da rede aprendem na prática — projetando, construindo e resolvendo desafios reais.
                  </p>
                  <p className="text-gray-600 text-sm leading-relaxed">
                    Com equipamentos de última geração e orientação especializada, o laboratório é um ambiente de experimentação que conecta o currículo escolar à inovação tecnológica.
                  </p>
                </div>
                <div className="aspect-video rounded overflow-hidden border border-gray-200">
                  <img
                    src="https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=700&q=75&auto=format&fit=crop"
                    alt="FabLab SESI"
                    className="w-full h-full object-cover"
                  />
                </div>
              </>
            ) : (
              <>
                <Reveal from="left">
                  <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-6 leading-tight"
                    style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}>
                    Um espaço para aprender fazendo
                  </h2>
                  <p className="text-gray-600 text-base leading-relaxed mb-5">
                    O FabLab SESI SP é um laboratório de fabricação digital integrado à proposta pedagógica do SESI. Aqui, estudantes da rede aprendem na prática — projetando, construindo e resolvendo desafios reais.
                  </p>
                  <p className="text-gray-600 text-base leading-relaxed mb-8">
                    Com equipamentos de última geração e orientação especializada, o laboratório é um ambiente de experimentação que conecta o currículo escolar à inovação tecnológica.
                  </p>
                  <div className="flex items-center gap-3 pt-4 border-t border-gray-100">
                    <img src="https://www.sesisp.org.br/images/Sesi-SP.jpg" alt="SESI" className="h-8 w-auto object-contain"
                      onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                    <span className="text-sm text-gray-500">Iniciativa SESI SP · Indústria do futuro</span>
                  </div>
                </Reveal>
                <Reveal from="right" delay={0.1}>
                  <div className="relative">
                    <div className="aspect-[4/3] rounded overflow-hidden border border-gray-200 shadow-sm">
                      <img
                        src="https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=700&q=75&auto=format&fit=crop&auto=format&fit=crop"
                        alt="FabLab SESI"
                        className="w-full h-full object-cover hover:scale-105 transition-transform duration-700"
                      />
                    </div>
                    {/* accent */}
                    <div className="absolute -bottom-3 -left-3 w-16 h-16 rounded"
                      style={{ background: RED, opacity: 0.12 }} />
                    <div className="absolute -top-3 -right-3 w-10 h-10 rounded border-2" style={{ borderColor: RED, opacity: 0.3 }} />
                  </div>
                </Reveal>
              </>
            )}
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════
          RECURSOS
      ════════════════════════════════════════ */}
      <section id="recursos" className="py-16 md:py-24" style={{ background: '#F8F9FA' }}>
        <div className="max-w-7xl mx-auto px-5 md:px-8">
          <div className="flex items-center gap-3 mb-10 md:mb-14">
            <div className="w-8 h-1 rounded" style={{ background: RED }} />
            <span className="text-xs font-bold tracking-widest uppercase text-gray-500">Infraestrutura</span>
          </div>

          {isMobile ? (
            <>
              <h2 className="text-2xl font-bold text-gray-900 mb-6"
                style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}>
                Equipamentos e recursos
              </h2>
              <div className="grid grid-cols-1 gap-3">
                {FEATURES.map((f) => (
                  <div key={f.title} className="flex gap-4 p-4 bg-white rounded border border-gray-200">
                    <div className="flex-shrink-0 w-10 h-10 flex items-center justify-center rounded" style={{ color: RED, background: 'rgba(212,32,32,0.07)' }}>
                      {f.icon}
                    </div>
                    <div>
                      <div className="font-semibold text-gray-900 text-sm mb-1">{f.title}</div>
                      <div className="text-xs text-gray-500 leading-relaxed">{f.desc}</div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <>
              <div className="flex items-end justify-between mb-12">
                <Reveal>
                  <h2 className="text-3xl font-bold text-gray-900 max-w-lg leading-tight"
                    style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}>
                    Equipamentos e recursos disponíveis
                  </h2>
                </Reveal>
              </div>
              <div className="grid grid-cols-3 gap-6">
                {FEATURES.map((f, i) => (
                  <Reveal key={f.title} delay={i * 0.07}>
                    <motion.div
                      whileHover={{ y: -3, boxShadow: '0 8px 24px rgba(0,0,0,0.08)' }}
                      transition={{ duration: 0.25 }}
                      className="bg-white p-6 rounded border border-gray-200 cursor-default h-full"
                    >
                      <div className="w-11 h-11 flex items-center justify-center rounded mb-4"
                        style={{ color: RED, background: 'rgba(212,32,32,0.07)' }}>
                        {f.icon}
                      </div>
                      <h3 className="font-bold text-gray-900 text-base mb-2">{f.title}</h3>
                      <p className="text-sm text-gray-500 leading-relaxed">{f.desc}</p>
                    </motion.div>
                  </Reveal>
                ))}
              </div>
            </>
          )}
        </div>
      </section>

      {/* ════════════════════════════════════════
          BLOG TEASER
      ════════════════════════════════════════ */}
      <section id="blog" className="py-16 md:py-24 bg-white">
        <div className="max-w-7xl mx-auto px-5 md:px-8">
          <div className="flex items-center gap-3 mb-10 md:mb-14">
            <div className="w-8 h-1 rounded" style={{ background: RED }} />
            <span className="text-xs font-bold tracking-widest uppercase text-gray-500">Blog & Publicações</span>
          </div>

          <div className={`flex ${isMobile ? 'flex-col gap-6' : 'items-end justify-between gap-8 mb-10'}`}>
            {isMobile ? (
              <h2 className="text-2xl font-bold text-gray-900"
                style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}>
                Últimas publicações do FabLab
              </h2>
            ) : (
              <>
                <Reveal>
                  <h2 className="text-3xl font-bold text-gray-900 max-w-xl leading-tight"
                    style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}>
                    Últimas publicações do FabLab
                  </h2>
                </Reveal>
                <Reveal delay={0.1}>
                  <button
                    onClick={() => navigate(isAuthenticated ? '/fablab/blog' : '/login')}
                    className="flex-shrink-0 flex items-center gap-2 text-sm font-semibold border-b-2 pb-0.5 transition-colors hover:opacity-70"
                    style={{ color: RED, borderColor: RED }}
                  >
                    Ver todas as publicações
                  </button>
                </Reveal>
              </>
            )}
          </div>

          {/* Static placeholder cards — real data after login */}
          <div className={`grid ${isMobile ? 'grid-cols-1 gap-4' : 'grid-cols-3 gap-6'}`}>
            {[
              { tag: 'Tutorial', title: 'Como configurar uma impressora 3D Ender 3 do zero', date: 'Abr 2025', img: 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=500&q=70&auto=format&fit=crop' },
              { tag: 'Projeto', title: 'Braço robótico controlado por Arduino feito pelos alunos', date: 'Mar 2025', img: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=500&q=70&auto=format&fit=crop' },
              { tag: 'Eletrônica', title: 'Introdução ao ESP32: Wi-Fi e Bluetooth para projetos IoT', date: 'Fev 2025', img: 'https://images.unsplash.com/photo-1488590528505-98d2b5aba04b?w=500&q=70&auto=format&fit=crop' },
            ].map((post, i) => (
              isMobile ? (
                <div key={i} className="flex gap-4 border-b border-gray-100 pb-4 last:border-0 last:pb-0">
                  <div className="w-20 h-20 rounded overflow-hidden flex-shrink-0 bg-gray-100">
                    <img src={post.img} alt={post.title} className="w-full h-full object-cover" />
                  </div>
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: RED }}>{post.tag}</span>
                    <h4 className="text-sm font-semibold text-gray-900 mt-0.5 leading-snug line-clamp-2">{post.title}</h4>
                    <span className="text-xs text-gray-400 mt-1 block">{post.date}</span>
                  </div>
                </div>
              ) : (
                <Reveal key={i} delay={i * 0.08}>
                  <motion.div
                    whileHover={{ y: -2 }}
                    transition={{ duration: 0.2 }}
                    className="group cursor-pointer"
                    onClick={() => navigate(isAuthenticated ? '/fablab/blog' : '/login')}
                  >
                    <div className="aspect-video rounded overflow-hidden bg-gray-100 mb-4">
                      <img src={post.img} alt={post.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    </div>
                    <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: RED }}>{post.tag}</span>
                    <h4 className="text-base font-semibold text-gray-900 mt-1 leading-snug group-hover:underline decoration-[1.5px] underline-offset-2">{post.title}</h4>
                    <span className="text-xs text-gray-400 mt-2 block">{post.date}</span>
                  </motion.div>
                </Reveal>
              )
            ))}
          </div>

          {isMobile && (
            <div className="mt-6">
              <button
                onClick={() => navigate(isAuthenticated ? '/fablab/blog' : '/login')}
                className="w-full py-3 text-sm font-bold text-white rounded transition-opacity hover:opacity-90"
                style={{ background: RED }}
              >
                Ver todas as publicações
              </button>
            </div>
          )}
        </div>
      </section>

      {/* ════════════════════════════════════════
          CTA BANNER — SESI style
      ════════════════════════════════════════ */}
      <section className="py-14 md:py-20" style={{ background: RED }}>
        <div className="max-w-7xl mx-auto px-5 md:px-8 flex flex-col md:flex-row items-center justify-between gap-8">
          {isMobile ? (
            <>
              <div>
                <h2 className="text-2xl font-bold text-white mb-2"
                  style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}>
                  Acesse a plataforma FabLab
                </h2>
                <p className="text-white/80 text-sm">
                  Gerencie inventário, agendamentos, projetos e muito mais.
                </p>
              </div>
              <button
                onClick={() => navigate(isAuthenticated ? '/' : '/login')}
                className="w-full py-3.5 text-sm font-bold bg-white rounded transition-opacity hover:opacity-90"
                style={{ color: RED }}
              >
                {isAuthenticated ? 'Ir para plataforma' : 'Entrar agora'}
              </button>
            </>
          ) : (
            <>
              <Reveal from="left">
                <div>
                  <h2 className="text-3xl font-bold text-white mb-3"
                    style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}>
                    Acesse a plataforma FabLab
                  </h2>
                  <p className="text-white/80 text-base max-w-xl">
                    Gerencie inventário, agendamentos, alunos com altas habilidades, projetos maker e muito mais em um único lugar.
                  </p>
                </div>
              </Reveal>
              <Reveal from="right" delay={0.1}>
                <button
                  onClick={() => navigate(isAuthenticated ? '/' : '/login')}
                  className="flex-shrink-0 px-8 py-4 text-sm font-bold bg-white rounded transition-all hover:bg-gray-50 active:scale-95 shadow-sm"
                  style={{ color: RED }}
                >
                  {isAuthenticated ? 'Ir para plataforma' : 'Entrar agora →'}
                </button>
              </Reveal>
            </>
          )}
        </div>
      </section>

      {/* ════════════════════════════════════════
          FOOTER
      ════════════════════════════════════════ */}
      <footer className="bg-gray-900 text-white">
        <div className="max-w-7xl mx-auto px-5 md:px-8 py-10 md:py-14">
          <div className={`grid ${isMobile ? 'grid-cols-1 gap-8' : 'grid-cols-3 gap-12'}`}>
            <div>
              <img src="https://www.sesisp.org.br/images/Sesi-SP.jpg" alt="SESI SP"
                className="h-10 w-auto object-contain mb-4 brightness-0 invert"
                onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
              <p className="text-gray-400 text-sm leading-relaxed">
                Plataforma Educacional FabLab SESI SP. Inovação e fabricação digital a serviço da educação.
              </p>
            </div>
            <div>
              <h4 className="text-xs font-bold tracking-widest uppercase text-gray-500 mb-4">Navegação</h4>
              <ul className="space-y-2">
                {NAV_LINKS.map(l => (
                  <li key={l.id}>
                    <button onClick={() => document.getElementById(l.id)?.scrollIntoView({ behavior: 'smooth' })}
                      className="text-sm text-gray-400 hover:text-white transition-colors">
                      {l.label}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="text-xs font-bold tracking-widest uppercase text-gray-500 mb-4">Links SESI SP</h4>
              <ul className="space-y-2">
                {[
                  ['Portal SESI SP', 'https://www.sesisp.org.br'],
                  ['Portal Educa', 'https://portaleduca.sesisp.org.br'],
                  ['FIESP', 'https://www.fiesp.com.br'],
                ].map(([label, url]) => (
                  <li key={label}>
                    <a href={url} target="_blank" rel="noopener"
                      className="text-sm text-gray-400 hover:text-white transition-colors flex items-center gap-1.5">
                      {label} <ExternalLink size={11} />
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="mt-10 pt-6 border-t border-gray-800 flex flex-col md:flex-row items-center justify-between gap-3">
            <p className="text-xs text-gray-600">
              © {new Date().getFullYear()} SESI SP · FabLab Plataforma Educacional. Todos os direitos reservados.
            </p>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full" style={{ background: RED }} />
              <span className="text-xs text-gray-600">Indústria do futuro</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
