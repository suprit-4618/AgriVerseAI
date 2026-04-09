
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const loadingTexts = [
    "Cultivating Your Dashboard...",
    "Syncing with Satellites...",
    "Analyzing Weather Patterns...",
    "Harvesting Fresh Data...",
    "Preparing Your Digital Farm...",
];

const LoadingScreen: React.FC = () => {
  const [textIndex, setTextIndex] = React.useState(0);

  React.useEffect(() => {
    const interval = setInterval(() => {
      setTextIndex((prev) => (prev + 1) % loadingTexts.length);
    }, 1800);
    return () => clearInterval(interval);
  }, []);

  const gridStyle = {
      backgroundImage: `
          repeating-linear-gradient(90deg, transparent, transparent 19px, rgba(52, 211, 153, 0.2) 20px),
          repeating-linear-gradient(180deg, transparent, transparent 19px, rgba(52, 211, 153, 0.2) 20px)
      `,
      backgroundSize: '20px 20px',
  };

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center bg-gray-900 text-white bhoomi-home-bg overflow-hidden">
      <motion.div
        className="w-64 h-64 md:w-80 md:h-80 rounded-full relative flex items-center justify-center"
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
      >
        <div className="absolute inset-0 rounded-full bg-emerald-500/10 animate-pulse" style={{ animationDuration: '3s' }}></div>
        <div className="w-full h-full rounded-full bg-gradient-to-br from-gray-900 via-gray-800 to-black border-2 border-emerald-500/20 shadow-2xl shadow-emerald-500/10 overflow-hidden">
          <motion.div
            className="absolute inset-0 opacity-50"
            style={gridStyle}
            animate={{ backgroundPosition: ['0px 0px', '20px 20px'] }}
            transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
          />
          <div className="absolute inset-0 rounded-full shadow-[inset_0_0_50px_rgba(52,211,153,0.3)]"></div>
        </div>

        {Array.from({ length: 3 }).map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-full h-full rounded-full border-2 border-emerald-400"
            initial={{ scale: 0.2, opacity: 0.8 }}
            animate={{ scale: 1.5, opacity: 0 }}
            transition={{
              duration: 3,
              repeat: Infinity,
              ease: 'easeOut',
              delay: i * 1,
            }}
          />
        ))}
         <motion.div
            className="absolute w-full h-full rounded-full border border-emerald-400/50"
            animate={{ rotate: 360 }}
            transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
         />
         <motion.div
            className="absolute w-2/3 h-2/3 rounded-full border-t-2 border-t-white border-l-2 border-l-white border-b-2 border-b-white/10 border-r-2 border-r-white/10"
            animate={{ rotate: -360 }}
            transition={{ duration: 15, repeat: Infinity, ease: 'linear' }}
         />
      </motion.div>

      <div className="relative mt-12 text-center h-8 w-80 overflow-hidden">
        <AnimatePresence mode="wait">
          <motion.p
            key={textIndex}
            className="text-lg text-gray-300 absolute inset-0"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -20, opacity: 0 }}
            transition={{ duration: 0.5, ease: 'easeInOut' }}
          >
            {loadingTexts[textIndex]}
          </motion.p>
        </AnimatePresence>
      </div>
    </div>
  );
};

export default LoadingScreen;
