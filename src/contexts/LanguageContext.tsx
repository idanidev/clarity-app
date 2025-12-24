/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState, useCallback, useMemo, useRef, ReactNode } from "react";
import { defaultLanguage, translations, availableLanguages, LanguageCode } from "../utils/translations";

// ============================================
// TYPES
// ============================================

interface LanguageContextValue {
  language: LanguageCode;
  changeLanguage: (newLanguage: LanguageCode) => void;
  initializeLanguage: (savedLanguage: LanguageCode) => void;
  availableLanguages: typeof availableLanguages;
}

interface LanguageProviderProps {
  children: ReactNode;
  user?: { uid: string; email: string | null } | null;
  onLanguageChange?: (language: LanguageCode) => void;
}

// ============================================
// CONTEXT
// ============================================

const LanguageContext = createContext<LanguageContextValue | undefined>(undefined);

// ============================================
// HOOKS
// ============================================

export const useLanguage = (): LanguageContextValue => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
};

// Hook para obtener traducciones
export const useTranslation = () => {
  const { language } = useLanguage();

  const t = useCallback(
    (key: string): string => {
      if (!key || typeof key !== 'string') return key || '';

      const keys = key.split(".");
      let value: any = translations[language];

      for (const k of keys) {
        if (value && typeof value === "object") {
          value = value[k];
        } else {
          return key; // Retorna la clave si no encuentra la traducción
        }
      }

      return value || key;
    },
    [language]
  );

  return { t, language };
};

// ============================================
// PROVIDER
// ============================================

export const LanguageProvider = ({ children, user, onLanguageChange }: LanguageProviderProps) => {
  const [language, setLanguage] = useState<LanguageCode>(defaultLanguage);
  
  // ✅ Estabilizar la referencia de onLanguageChange para evitar loops
  const onLanguageChangeRef = useRef(onLanguageChange);
  onLanguageChangeRef.current = onLanguageChange;

  // ✅ REMOVIDO: Este useEffect causaba un bucle infinito
  // Llamaba a onLanguageChange cada vez que 'user' cambiaba,
  // lo que disparaba re-renders innecesarios.
  // El idioma solo debe guardarse cuando el usuario lo cambia manualmente.

  const changeLanguage = useCallback((newLanguage: LanguageCode) => {
    if (availableLanguages.find((lang) => lang.code === newLanguage)) {
      setLanguage(newLanguage);
      // ✅ Solo guardar en Firebase cuando el usuario cambia el idioma manualmente
      if (user && onLanguageChangeRef.current) {
        onLanguageChangeRef.current(newLanguage);
      }
    }
  }, [user]);

  const initializeLanguage = useCallback((savedLanguage: LanguageCode) => {
    if (savedLanguage && availableLanguages.find((lang) => lang.code === savedLanguage)) {
      setLanguage(savedLanguage);
    }
  }, []); // ✅ Already optimized

  // ✅ Memoize context value to prevent unnecessary re-renders
  const value = useMemo(() => ({
    language,
    changeLanguage,
    initializeLanguage,
    availableLanguages,
  }), [language, changeLanguage, initializeLanguage]);

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
};
