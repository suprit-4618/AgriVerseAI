import React from 'react';
import { motion } from 'framer-motion';
import { SparklesIcon } from './IconComponents';

const GeneratingAnimation: React.FC = () => {
    return (
        <motion.div
            className="flex flex-col"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
        >
            <div className="flex items-center gap-3 mb-2">
                <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 bg-green-500 text-white">
                    <SparklesIcon className="w-5 h-5" />
                </div>
                <p className="font-bold text-gray-200">Bhoomi AI</p>
            </div>
            <div className="pl-11">
                 <div className="glassmorphism bg-white/10 p-4 rounded-xl inline-flex items-center justify-center w-20 h-14">
                     <motion.div
                        className="w-10 h-10 relative"
                        animate={{ rotate: 360 }}
                        transition={{ duration: 4, repeat: Infinity, ease: 'linear' }}
                    >
                        <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <defs>
                                <linearGradient id="star-gradient" x1="0%" y1="0%" x2="100%" y2="100%" gradientTransform="rotate(45)">
                                     <stop offset="0%" stopColor="#8E2DE2" />
                                     <stop offset="50%" stopColor="#4A00E0" />
                                     <stop offset="100%" stopColor="#56CCF2" />
                                </linearGradient>
                            </defs>
                            <motion.path 
                                d="M24 4L27.3139 20.6861L44 24L27.3139 27.3139L24 44L20.6861 27.3139L4 24L20.6861 20.6861L24 4Z" 
                                fill="url(#star-gradient)"
                                animate={{ scale: [1, 0.8, 1] }}
                                transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                            />
                            <motion.circle cx="4" cy="24" r="2.5" fill="white"
                                animate={{ scale: [1, 0.5, 1], opacity: [0.7, 0.3, 0.7] }}
                                transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut', delay: 0.5 }}
                            />
                             <motion.circle cx="44" cy="24" r="2.5" fill="white"
                                animate={{ scale: [0.5, 1, 0.5], opacity: [0.3, 0.7, 0.3] }}
                                transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut', delay: 0.5 }}
                            />
                        </svg>
                    </motion.div>
                </div>
            </div>
        </motion.div>
    );
};

export default GeneratingAnimation;