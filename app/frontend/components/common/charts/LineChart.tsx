
import React from 'react';
import { motion } from 'framer-motion';
import { HistoricalDataPoint } from '../../../types';

interface LineChartProps {
  data: HistoricalDataPoint[];
}

const LineChart: React.FC<LineChartProps> = ({ data }) => {
  const width = 500;
  const height = 200;
  const padding = { top: 20, right: 20, bottom: 30, left: 30 };
  
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;

  const maxValue = Math.max(...data.map(d => d.detections), 0) * 1.2;

  const getPath = () => {
    let path = `M ${0},${chartHeight - (data[0].detections / maxValue) * chartHeight}`;
    data.forEach((d, i) => {
      if (i === 0) return;
      const x = (i / (data.length - 1)) * chartWidth;
      const y = chartHeight - (d.detections / maxValue) * chartHeight;
      path += ` L ${x},${y}`;
    });
    return path;
  };

  const linePath = getPath();

  return (
    <div className="w-full h-full">
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full">
        <g transform={`translate(${padding.left}, ${padding.top})`}>
          {/* Y-Axis Grid Lines */}
          {Array.from({ length: 4 }).map((_, i) => (
            <line
              key={i}
              x1={0}
              y1={(i * chartHeight) / 3}
              x2={chartWidth}
              y2={(i * chartHeight) / 3}
              className="stroke-gray-200 dark:stroke-gray-700"
              strokeWidth="0.5"
              strokeDasharray="2 2"
            />
          ))}

          {/* Line */}
          <motion.path
            d={linePath}
            fill="none"
            className="stroke-current text-blue-500"
            strokeWidth="2"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 1.5, ease: 'easeInOut' }}
          />
          
          {/* Points */}
          {data.map((d, i) => {
            const x = (i / (data.length - 1)) * chartWidth;
            const y = chartHeight - (d.detections / maxValue) * chartHeight;
            return (
              <motion.circle
                key={i}
                cx={x}
                cy={y}
                r={3}
                className="fill-current text-blue-500"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ duration: 0.3, delay: 1.5 + i * 0.1 }}
              />
            );
          })}
          
          {/* X-Axis Labels */}
          {data.map((d, i) => (
            <text
              key={i}
              x={(i / (data.length - 1)) * chartWidth}
              y={chartHeight + 20}
              textAnchor="middle"
              className="text-xs fill-current text-gray-500 dark:text-gray-400"
            >
              {d.month}
            </text>
          ))}
        </g>
      </svg>
    </div>
  );
};

export default LineChart;
