
import { ReactNode } from 'react';

export interface TranslationFunction {
    (key: string): string;
}

export interface LanguageContextType {
    language: string;
    changeLanguage: (lang: string) => void;
    initializeLanguage: (lang: string) => void;
    availableLanguages: Array<{ code: string; name: string; flag: string }>;
}

export interface UseTranslationReturn {
    t: TranslationFunction;
    language: string;
}

export function useLanguage(): LanguageContextType;
export function useTranslation(): UseTranslationReturn;

export interface LanguageProviderProps {
    children: ReactNode;
    user: any;
    onLanguageChange: (lang: string) => void;
}

export const LanguageProvider: React.FC<LanguageProviderProps>;