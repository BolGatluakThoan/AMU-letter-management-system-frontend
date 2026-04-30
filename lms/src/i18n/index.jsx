import { createContext, useContext, useState, useEffect } from 'react';
import en from './en.js';
import am from './am.js';
import om from './om.js';
import so from './so.js';
import ar from './ar.js';
import fr from './fr.js';
import sw from './sw.js';

const LANGS = { en, am, om, so, ar, fr, sw };
const RTL_LANGS = ['ar'];

export const LANG_OPTIONS = [
  { code: 'en', label: 'English',              flag: '🇬🇧', adminOnly: false },
  { code: 'am', label: 'አማርኛ (Amharic)',       flag: '🇪🇹', adminOnly: false },
  { code: 'om', label: 'Afaan Oromoo',          flag: '🇪🇹', adminOnly: false },
  { code: 'so', label: 'Soomaali (Somali)',     flag: '🇸🇴', adminOnly: false },
  { code: 'ar', label: 'العربية (Arabic)',      flag: '🇸🇦', adminOnly: true  },
  { code: 'fr', label: 'Français (French)',     flag: '🇫🇷', adminOnly: true  },
  { code: 'sw', label: 'Kiswahili (Swahili)',   flag: '🇰🇪', adminOnly: true  },
];

const I18nContext = createContext(null);

export function I18nProvider({ children }) {
  const [lang, setLangState] = useState(() => localStorage.getItem('lms-lang') || 'en');

  const setLang = (code) => {
    setLangState(code);
    localStorage.setItem('lms-lang', code);
  };

  useEffect(() => {
    document.documentElement.setAttribute('lang', lang);
    // RTL layout for Arabic
    const isRTL = RTL_LANGS.includes(lang);
    document.documentElement.setAttribute('dir', isRTL ? 'rtl' : 'ltr');
    document.body.style.direction = isRTL ? 'rtl' : 'ltr';
  }, [lang]);

  // t() — translate key, fall back to English, then the key itself
  const t = (key) => LANGS[lang]?.[key] ?? LANGS['en']?.[key] ?? key;

  return (
    <I18nContext.Provider value={{ lang, setLang, t, LANG_OPTIONS }}>
      {children}
    </I18nContext.Provider>
  );
}

export const useI18n = () => useContext(I18nContext);
