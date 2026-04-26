import { create } from "zustand";
import { bundles, type Lang, type Bundle } from "./strings";

const STORAGE_KEY = "appLang";

function detectInitial(): Lang {
  try {
    const stored = localStorage.getItem(STORAGE_KEY) as Lang | null;
    if (stored === "en" || stored === "fr") return stored;
  } catch {
    // ignore (private mode etc.)
  }
  // Default to French — that's the existing UX
  return "fr";
}

interface LangState {
  lang: Lang;
  setLang: (lang: Lang) => void;
}

export const useLangStore = create<LangState>((set) => ({
  lang: detectInitial(),
  setLang: (lang) => {
    try {
      localStorage.setItem(STORAGE_KEY, lang);
    } catch {
      // ignore
    }
    document.documentElement.lang = lang;
    set({ lang });
  },
}));

// Set initial <html lang> on module load so screen readers pick it up
if (typeof document !== "undefined") {
  document.documentElement.lang = useLangStore.getState().lang;
}

/**
 * Translation hook. `t` returns a string by dot-path key (e.g. "nav.explorer").
 * Falls back to the key itself if not found, so missing translations are visible.
 */
export function useTranslation() {
  const lang = useLangStore((s) => s.lang);
  const setLang = useLangStore((s) => s.setLang);
  const bundle: Bundle = bundles[lang];

  function t(key: string): string {
    const parts = key.split(".");
    let cur: unknown = bundle;
    for (const part of parts) {
      if (cur && typeof cur === "object" && part in (cur as Record<string, unknown>)) {
        cur = (cur as Record<string, unknown>)[part];
      } else {
        return key;
      }
    }
    return typeof cur === "string" ? cur : key;
  }

  return { lang, setLang, t };
}
