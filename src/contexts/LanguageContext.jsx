/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { defaultLanguage, translations, availableLanguages } from "../utils/translations";

const LanguageContext = createContext();

export const useLanguage = () => {
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
    (key) => {
      if (!key || typeof key !== 'string') return key || '';
      const keys = key.split(".");
      let value = translations[language];
      
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

export const LanguageProvider = ({ children, user, onLanguageChange }) => {
  const [language, setLanguage] = useState(defaultLanguage);

  // Cargar idioma guardado cuando el usuario está disponible
  useEffect(() => {
    if (user && onLanguageChange) {
      onLanguageChange(language);
    }
  }, [user, language, onLanguageChange]);

  const changeLanguage = useCallback((newLanguage) => {
    if (availableLanguages.find((lang) => lang.code === newLanguage)) {
      setLanguage(newLanguage);
      if (user && onLanguageChange) {
        onLanguageChange(newLanguage);
      }
    }
  }, [user, onLanguageChange]);

  const initializeLanguage = useCallback((savedLanguage) => {
    if (savedLanguage && availableLanguages.find((lang) => lang.code === savedLanguage)) {
      setLanguage(savedLanguage);
    }
  }, []);

  const value = {
    language,
    changeLanguage,
    initializeLanguage,
    availableLanguages,
  };

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
};

