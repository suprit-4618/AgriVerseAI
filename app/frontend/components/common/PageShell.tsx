

import React from 'react';
import { motion } from 'framer-motion';
import { ArrowLeftIcon } from './IconComponents';
import Button from './Button';
import StaticLogo from './StaticLogo';

interface PageShellProps {
  title: string;
  children: React.ReactNode;
  onBack: () => void;
}

const PageShell: React.FC<PageShellProps> = ({ title, children, onBack }) => {
  return (
    <motion.div
      className="min-h-screen bg-gray-900 text-gray-200 font-poppins"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4 }}
    >
      <header className="fixed top-0 left-0 right-0 z-50 bg-gray-900/50 backdrop-blur-lg border-b border-gray-700/50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-3 flex justify-between items-center">
          <StaticLogo />
          <Button onClick={onBack} variant="ghost" className="!border-gray-600 !text-gray-300 hover:!bg-gray-700 hover:!text-white" leftIcon={<ArrowLeftIcon className="w-4 h-4" />}>
            Back to Home
          </Button>
        </div>
      </header>

      <main className="pt-24 pb-12">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <motion.h1 
            className="text-4xl md:text-5xl font-extrabold text-center mb-12 text-gradient-green-blue"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            {title}
          </motion.h1>
          <motion.div
             initial={{ opacity: 0, y: 20 }}
             animate={{ opacity: 1, y: 0 }}
             transition={{ duration: 0.5, delay: 0.4 }}
          >
            {children}
          </motion.div>
        </div>
      </main>
       <footer className="bg-black border-t border-gray-800">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 text-center text-sm text-gray-500">
          <p>&copy; {new Date().getFullYear()} AgriVerseAI. All Rights Reserved.</p>
        </div>
      </footer>
    </motion.div>
  );
};

export default PageShell;
