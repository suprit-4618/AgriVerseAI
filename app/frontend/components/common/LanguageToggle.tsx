import React from 'react';
import { motion } from 'framer-motion';
import { Language } from '../../types';

interface LanguageToggleProps {
  currentLanguage: Language;
  setCurrentLanguage: (lang: Language) => void;
  size?: 'sm' | 'md';
}

const LanguageToggle: React.FC<LanguageToggleProps> = ({ currentLanguage, setCurrentLanguage, size = 'md' }) => {
    const isEnglish = currentLanguage === Language.EN;
    
    const sizeClasses = {
        sm: { container: 'p-0.5 text-xs', button: 'px-2 py-0.5', layoutId: 'lang-toggle-sm' },
        md: { container: 'p-1 text-sm', button: 'px-3 py-1', layoutId: 'lang-toggle-md' }
    };

    const styles = sizeClasses[size];

    return (
        <div className={`relative flex items-center bg-gray-200/20 dark:bg-gray-900/50 rounded-full ${styles.container}`}>
            {isEnglish && (
                <motion.div
                    className="absolute left-0 top-0 bottom-0 w-1/2 bg-white dark:bg-gray-700 rounded-full shadow-sm"
                    layoutId={styles.layoutId}
                    transition={{ type: 'spring', stiffness: 350, damping: 30 }}
                />
            )}
            {!isEnglish && (
                 <motion.div
                    className="absolute right-0 top-0 bottom-0 w-1/2 bg-white dark:bg-gray-700 rounded-full shadow-sm"
                    layoutId={styles.layoutId}
                    transition={{ type: 'spring', stiffness: 350, damping: 30 }}
                />
            )}
            <button
                onClick={() => setCurrentLanguage(Language.EN)}
                className={`relative w-1/2 rounded-full font-semibold transition-colors ${styles.button} ${isEnglish ? 'text-green-600 dark:text-green-400' : 'text-gray-500 dark:text-gray-300'}`}
            >
                EN
            </button>
            <button
                onClick={() => setCurrentLanguage(Language.KN)}
                className={`relative w-1/2 rounded-full font-semibold transition-colors ${styles.button} ${!isEnglish ? 'text-green-600 dark:text-green-400 font-kannada' : 'text-gray-500 dark:text-gray-300 font-kannada'}`}
            >
                ಕ
            </button>
        </div>
    );
};

export default LanguageToggle;
