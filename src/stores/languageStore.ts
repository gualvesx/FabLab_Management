import { create } from 'zustand';
import { persist } from 'zustand/middleware';

type Lang = 'pt' | 'en';

interface LangState {
  lang: Lang;
  setLang: (l: Lang) => void;
  toggle: () => void;
}

export const useLanguageStore = create<LangState>()(
  persist(
    (set, get) => ({
      lang: 'pt',
      setLang: (l) => set({ lang: l }),
      toggle: () => set({ lang: get().lang === 'pt' ? 'en' : 'pt' }),
    }),
    { name: 'sesi-lang' }
  )
);
