import React from 'react';
import { motion } from 'framer-motion';
import { ArrowRightIcon, SparklesIcon } from './common/IconComponents';

interface IntroPageProps {
    onLoginClick: () => void;
}

const IntroPage: React.FC<IntroPageProps> = ({ onLoginClick }) => {
    return (
        <div className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden bg-gray-900 text-white font-sans">
            {/* Background Effects */}
            <div className="absolute inset-0 z-0">
                <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-gray-900 via-gray-800 to-black opacity-90"></div>
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-green-500/20 rounded-full blur-[120px] animate-pulse"></div>
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-500/20 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '2s' }}></div>
            </div>

            {/* Content */}
            <div className="relative z-10 container mx-auto px-4 text-center">
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                >
                    <div className="mb-6 flex justify-center">
                        <div className="p-4 bg-white/5 rounded-2xl backdrop-blur-xl border border-white/10 shadow-2xl">
                            <SparklesIcon className="w-12 h-12 text-green-400" />
                        </div>
                    </div>

                    <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-6 bg-clip-text text-transparent bg-gradient-to-r from-green-400 via-teal-300 to-blue-500">
                        AGRIVERSE AI
                    </h1>

                    <p className="text-xl md:text-2xl text-gray-300 mb-12 max-w-2xl mx-auto leading-relaxed">
                        Empowering agriculture with advanced AI analysis, real-time market insights, and sustainable farming solutions.
                    </p>

                    <motion.button
                        onClick={onLoginClick}
                        className="group relative inline-flex items-center gap-3 px-8 py-4 bg-green-600 hover:bg-green-500 text-white text-lg font-semibold rounded-full transition-all duration-300 shadow-lg shadow-green-600/30 hover:shadow-green-500/50 hover:-translate-y-1"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                    >
                        <span>Get Started</span>
                        <ArrowRightIcon className="w-5 h-5 transition-transform group-hover:translate-x-1" />
                        <div className="absolute inset-0 rounded-full ring-2 ring-white/20 group-hover:ring-white/40 transition-all"></div>
                    </motion.button>
                </motion.div>
            </div>

            {/* Footer / Credits */}
            <motion.div
                className="absolute bottom-8 left-0 right-0 text-center text-gray-500 text-sm"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1, duration: 1 }}
            >
                <p>&copy; {new Date().getFullYear()} AgriVerseAI. All Rights Reserved.</p>
            </motion.div>
        </div>
    );
};

export default IntroPage;
