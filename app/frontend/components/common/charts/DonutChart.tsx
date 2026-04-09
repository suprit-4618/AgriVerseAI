
import React from 'react';
import { motion } from 'framer-motion';

interface DataPoint {
  name: string;
  value: number;
}

interface DonutChartProps {
  data: DataPoint[];
}

const COLORS = ['#ef4444', '#22c55e']; // Red for affected, Green for healthy

const DonutChart: React.FC<DonutChartProps> = ({ data }) => {
  const total = data.reduce((acc, item) => acc + item.value, 0);
  if (total === 0) return null;

  const radius = 40;
  const circumference = 2 * Math.PI * radius;
  let accumulatedPercentage = 0;

  return (
    <div className="flex flex-col items-center justify-center gap-4 w-full h-full">
      <div className="relative w-24 h-24">
        <svg className="w-full h-full" viewBox="0 0 100 100">
          <g transform="rotate(-90, 50, 50)">
            {data.map((item, index) => {
              const percentage = (item.value / total) * 100;
              const strokeDashoffset = circumference - (accumulatedPercentage / 100) * circumference;
              const strokeDasharray = `${(percentage / 100) * circumference} ${circumference}`;

              const segment = (
                <motion.circle
                  key={index}
                  cx="50"
                  cy="50"
                  r={radius}
                  fill="transparent"
                  stroke={COLORS[index % COLORS.length]}
                  strokeWidth="12"
                  strokeDasharray={strokeDasharray}
                  strokeDashoffset={strokeDashoffset}
                  initial={{ pathLength: 0, opacity: 0 }}
                  animate={{ pathLength: 1, opacity: 1 }}
                  transition={{ duration: 0.8, delay: index * 0.2, ease: 'easeOut' }}
                />
              );
              accumulatedPercentage += percentage;
              return segment;
            })}
          </g>
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
            <span className="text-xl font-bold text-gray-800 dark:text-white">{data[0].value.toFixed(0)}%</span>
            <span className="text-xs text-gray-500 dark:text-gray-400">{data[0].name}</span>
        </div>
      </div>
    </div>
  );
};

export default DonutChart;
