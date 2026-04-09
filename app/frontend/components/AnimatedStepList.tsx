

import React from 'react';
import { motion } from 'framer-motion';
import { Language } from '../types';
import { CheckIcon } from './common/IconComponents';

interface AnimatedStepListProps {
  items: string[];
  language: Language;
  isNumbered?: boolean;
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.15,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 15 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.4,
    },
  },
};

const AnimatedStepList: React.FC<AnimatedStepListProps> = ({ items, language, isNumbered = false }) => {
  return (
    <motion.ul
      className="space-y-3"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {items.map((item, index) => (
        <motion.li key={index} className="flex items-start gap-3" variants={itemVariants}>
          {isNumbered ? (
            <span className="flex-shrink-0 mt-0.5 text-blue-500 font-bold">{index + 1}.</span>
          ) : (
            <CheckIcon className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
          )}
          <span className={`text-sm text-gray-600 dark:text-gray-300 ${language === 'kn' ? 'font-kannada' : ''}`}>
            {item}
          </span>
        </motion.li>
      ))}
    </motion.ul>
  );
};

export default AnimatedStepList;