

import React from 'react';
import { motion, Variants } from 'framer-motion';

interface DashboardCardProps {
  icon: React.ReactNode;
  title: string;
  value: string | number;
  color: string; // e.g., 'from-blue-400 to-purple-500'
  index: number;
}

const cardVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: i * 0.1,
      duration: 0.5,
      ease: 'easeOut',
    },
  }),
};

const DashboardCard: React.FC<DashboardCardProps> = ({ icon, title, value, color, index }) => {
  return (
    <motion.div
      className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-md overflow-hidden relative flex items-center space-x-4"
      variants={cardVariants}
      initial="hidden"
      animate="visible"
      custom={index}
    >
      <div className={`absolute left-0 top-0 bottom-0 w-2 bg-gradient-to-b ${color}`}></div>
      <div className={`p-3 rounded-lg bg-gradient-to-br ${color} text-white ml-2`}>
        {icon}
      </div>
      <div>
        <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">{title}</p>
        <p className="text-2xl font-bold text-gray-900 dark:text-white">{value}</p>
      </div>
    </motion.div>
  );
};

export default DashboardCard;