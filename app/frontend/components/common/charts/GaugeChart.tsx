import React from 'react';
import { motion } from 'framer-motion';

interface GaugeChartProps {
  value: number; // 0-100
}

const GaugeChart: React.FC<GaugeChartProps> = ({ value }) => {
  const clampedValue = Math.max(0, Math.min(100, value));
  const angle = (clampedValue / 100) * 180 - 90; // Map 0-100 to -90 to 90 degrees

  const circumference = Math.PI * 80; // 2 * PI * r (r=40)
  const arcLength = (clampedValue / 100) * circumference;

  const getColor = (val: number) => {
    if (val < 40) return '#ef4444'; // red-500
    if (val < 75) return '#f59e0b'; // amber-500
    return '#22c55e'; // green-500
  };
  
  const color = getColor(clampedValue);

  return (
    <div className="relative w-48 h-24 overflow-hidden">
      <svg className="w-full h-full" viewBox="0 0 160 80">
        {/* Background Arc */}
        <path
          d="M 10 70 A 70 70 0 0 1 150 70"
          stroke="currentColor"
          className="text-gray-200 dark:text-gray-700"
          strokeWidth="12"
          strokeLinecap="round"
          fill="none"
        />
        {/* Value Arc */}
        <motion.path
          d="M 10 70 A 70 70 0 0 1 150 70"
          stroke={color}
          strokeWidth="12"
          strokeLinecap="round"
          fill="none"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: circumference - arcLength / 2 }}
          transition={{ duration: 1.5, ease: 'easeOut' }}
        />
      </svg>
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 text-center">
        <motion.span
          className="text-4xl font-bold"
          style={{ color }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.5 }}
        >
          {Math.round(clampedValue)}
        </motion.span>
        <p className="text-xs font-medium text-gray-500 dark:text-gray-400">/ 100</p>
      </div>
    </div>
  );
};

export default GaugeChart;
