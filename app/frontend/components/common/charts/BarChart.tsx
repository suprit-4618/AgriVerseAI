
import React from 'react';
import { motion } from 'framer-motion';

interface BarData {
  name: string;
  value: number;
}

interface BarChartProps {
  data: BarData[];
}

const BarChart: React.FC<BarChartProps> = ({ data }) => {
  const maxValue = 100; // Confidence is always 0-100

  return (
    <div className="w-full h-full flex flex-col gap-3">
      {data.map((item, index) => {
        const percentage = (item.value / maxValue) * 100;
        const color = percentage > 75 ? 'bg-green-500' : percentage > 40 ? 'bg-yellow-500' : 'bg-red-500';

        return (
          <div key={item.name} className="flex items-center gap-3 w-full">
            <span className="text-sm font-medium text-gray-600 dark:text-gray-300 w-24 truncate" title={item.name}>
              {item.name}
            </span>
            <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-4 overflow-hidden">
              <motion.div
                className={`h-full rounded-full ${color}`}
                initial={{ width: 0 }}
                animate={{ width: `${percentage}%` }}
                transition={{ duration: 0.8, ease: 'easeOut', delay: index * 0.1 }}
              />
            </div>
            <span className="text-sm font-bold text-gray-800 dark:text-white w-10 text-right">
              {item.value.toFixed(0)}%
            </span>
          </div>
        );
      })}
    </div>
  );
};

export default BarChart;
