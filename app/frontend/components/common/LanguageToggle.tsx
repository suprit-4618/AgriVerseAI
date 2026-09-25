import React from 'react';
import { motion } from 'framer-motion';
import { Language } from '../../types';
import { useLanguage } from '../../context/LanguageContext';

interface LanguageToggleProps {
  currentLanguage?: Language;
  setCurrentLanguage?: (lang: Language) => void;
  size?: 'sm' | 'md';
}

const LanguageToggle: React.FC<LanguageToggleProps> = ({ currentLanguage: propLang, setCurrentLanguage: propSetLang, size = 'sm' }) => {
    const langContext = useLanguage();
    
    const activeLanguage = propLang || langContext.language;
    const handleSetLanguage = (lang: Language) => {
        langContext.setLanguage(lang);
        if (propSetLang) {
            propSetLang(lang);
        }
    };

    const isEnglish = activeLanguage === Language.EN;
    
    return (
        <div className="relative flex items-center bg-neutral-900 border border-neutral-800 rounded-lg p-0.5 text-xs font-mono">
            {isEnglish ? (
                <motion.div
                    className="absolute left-0.5 top-0.5 bottom-0.5 w-[calc(50%-1px)] bg-white rounded-md shadow-sm"
                    layoutId="lang-toggle-indicator"
                    transition={{ type: 'spring', stiffness: 400, damping: 35 }}
                />
            ) : (
                <motion.div
                    className="absolute right-0.5 top-0.5 bottom-0.5 w-[calc(50%-1px)] bg-white rounded-md shadow-sm"
                    layoutId="lang-toggle-indicator"
                    transition={{ type: 'spring', stiffness: 400, damping: 35 }}
                />
            )}
            
            <button
                type="button"
                onClick={() => handleSetLanguage(Language.EN)}
                className={`relative z-10 px-2.5 py-1 rounded-md font-bold transition-colors ${
                    isEnglish ? 'text-black' : 'text-neutral-400 hover:text-white'
                }`}
                aria-label="Switch to English"
            >
                EN
            </button>
            
            <button
                type="button"
                onClick={() => handleSetLanguage(Language.KN)}
                className={`relative z-10 px-2.5 py-1 rounded-md font-bold transition-colors ${
                    !isEnglish ? 'text-black font-kannada' : 'text-neutral-400 hover:text-white font-kannada'
                }`}
                aria-label="Switch to Kannada"
            >
                ಕ
            </button>
        </div>
    );
};

export default LanguageToggle;

