import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Language } from '../types';
import { uiStrings } from '../constants';
import { 
    farmerTranslations, 
    buyerTranslations, 
    authTranslations, 
    sellModalTranslations,
    landingTranslations 
} from '../utils/translations';

interface LanguageContextType {
    language: Language;
    setLanguage: (lang: Language) => void;
    toggleLanguage: () => void;
    isKannada: boolean;
    texts: typeof uiStrings[Language.EN];
    farmerTexts: typeof farmerTranslations[Language.EN];
    buyerTexts: typeof buyerTranslations[Language.EN];
    authTexts: typeof authTranslations[Language.EN];
    sellModalTexts: typeof sellModalTranslations[Language.EN];
    landingTexts: typeof landingTranslations[Language.EN];
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [language, setLanguageState] = useState<Language>(() => {
        try {
            const saved = localStorage.getItem('ava_language');
            if (saved === Language.KN || saved === Language.EN) {
                return saved;
            }
        } catch (e) {
            // ignore localStorage error
        }
        return Language.EN;
    });

    const setLanguage = (lang: Language) => {
        setLanguageState(lang);
        try {
            localStorage.setItem('ava_language', lang);
        } catch (e) {
            // ignore
        }
    };

    const toggleLanguage = () => {
        setLanguage(language === Language.EN ? Language.KN : Language.EN);
    };

    const isKannada = language === Language.KN;
    const texts = uiStrings[language] || uiStrings[Language.EN];
    const farmerTexts = farmerTranslations[language] || farmerTranslations[Language.EN];
    const buyerTexts = buyerTranslations[language] || buyerTranslations[Language.EN];
    const authTexts = authTranslations[language] || authTranslations[Language.EN];
    const sellModalTexts = sellModalTranslations[language] || sellModalTranslations[Language.EN];
    const landingTexts = landingTranslations[language] || landingTranslations[Language.EN];

    return (
        <LanguageContext.Provider
            value={{
                language,
                setLanguage,
                toggleLanguage,
                isKannada,
                texts,
                farmerTexts,
                buyerTexts,
                authTexts,
                sellModalTexts,
                landingTexts
            }}
        >
            {children}
        </LanguageContext.Provider>
    );
};

export const useLanguage = (): LanguageContextType => {
    const context = useContext(LanguageContext);
    if (!context) {
        throw new Error('useLanguage must be used within a LanguageProvider');
    }
    return context;
};

export default LanguageContext;
