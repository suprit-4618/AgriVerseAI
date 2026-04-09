
import React from 'react';
import { motion } from 'framer-motion';

interface HorizontalBarData {
  name: string;
  value: number;
}

interface HorizontalBarChartProps {
  data: HorizontalBarData[];
  homeValue?: number;
  homeLabel?: string;
}

const COLORS = ['#34d399', '#60a5fa', '#f87171', '#fbbf24', '#a78bfa', '#f472b6'];

const HorizontalBarChart: React.FC<HorizontalBarChartProps> = ({ data, homeValue, homeLabel }) => {
  const allData = homeValue !== undefined && homeLabel ? [...data, { name: homeLabel, value: homeValue }] : data;
  const sortedData = [...allData].sort((a, b) => b.value - a.value);

  const maxValue = Math.max(...sortedData.map(d => d.value)) * 1.1;
  if (maxValue === 0) return null;

  return (
    <div className="w-full h-full flex flex-col gap-3 pr-4">
      {sortedData.map((item, index) => {
        const percentage = (item.value / maxValue) * 100;
        const isHomeMarket = item.name === homeLabel;
        const color = isHomeMarket ? 'bg-amber-500' : COLORS[index % COLORS.length];

        return (
          <div key={item.name} className="flex items-center gap-3 w-full text-sm">
            <span
              className={`font-medium w-32 truncate ${isHomeMarket ? 'text-amber-400' : 'text-gray-300'}`}
              title={item.name}
            >
              {item.name}
            </span>
            <div className="flex-1 bg-gray-700 rounded-full h-5 relative">
              <motion.div
                className={`h-full rounded-full ${color}`}
                initial={{ width: 0 }}
                animate={{ width: `${percentage}%` }}
                transition={{ duration: 0.8, ease: 'easeOut', delay: index * 0.1 }}
              />
               <span className="absolute left-2 top-1/2 -translate-y-1/2 text-white text-xs font-bold mix-blend-difference">
                 ₹{item.value.toLocaleString('en-IN')}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default HorizontalBarChart;