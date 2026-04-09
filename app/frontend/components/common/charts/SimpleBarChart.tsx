
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface DataPoint {
  name: string;
  value: number;
}

interface SimpleBarChartProps {
  data: DataPoint[];
}

const COLORS = ['#34d399', '#60a5fa', '#f87171', '#fbbf24', '#a78bfa', '#f472b6', '#c084fc'];

const SimpleBarChart: React.FC<SimpleBarChartProps> = ({ data }) => {
  const [activeBar, setActiveBar] = useState<DataPoint | null>(null);
  const [tooltipPosition, setTooltipPosition] = useState<{ x: number; y: number } | null>(null);

  const width = 400;
  const height = 200;
  const padding = { top: 20, right: 20, bottom: 30, left: 40 };
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;

  const maxValue = Math.max(...data.map(d => d.value)) * 1.1; // 10% padding
  const xScale = chartWidth / data.length;
  const barWidth = xScale * 0.6;
  
  const handleMouseEnter = (d: DataPoint, event: React.MouseEvent) => {
    setActiveBar(d);
    // Get position relative to the chart container div
    const rect = (event.currentTarget as SVGGElement).closest('div')!.getBoundingClientRect();
    setTooltipPosition({ x: event.clientX - rect.left, y: event.clientY - rect.top });
  };
  
  const handleMouseLeave = () => {
    setActiveBar(null);
  };

  return (
    <div className="w-full h-full relative" onMouseLeave={handleMouseLeave}>
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full">
        <g transform={`translate(${padding.left}, ${padding.top})`}>
          {/* Y-Axis Grid Lines & Labels */}
          {Array.from({ length: 5 }).map((_, i) => {
            const y = chartHeight - (i * chartHeight / 4);
            const value = (maxValue / 4) * i;
            return (
              <g key={i}>
                <line
                  x1={0} y1={y}
                  x2={chartWidth} y2={y}
                  className="stroke-gray-200 dark:stroke-gray-700"
                  strokeWidth="0.5"
                />
                <text x={-5} y={y + 3} textAnchor="end" className="text-[10px] fill-current text-gray-500 dark:text-gray-400">
                    {Math.round(value)}
                </text>
              </g>
            );
          })}

          {/* Bars */}
          {data.map((d, i) => {
            const barHeight = maxValue > 0 ? (d.value / maxValue) * chartHeight : 0;
            const x = i * xScale + (xScale - barWidth) / 2;
            const y = chartHeight - barHeight;
            return (
                <g key={d.name} onMouseEnter={(e) => handleMouseEnter(d, e)} className="cursor-pointer">
                    <motion.rect
                        x={x}
                        y={y}
                        width={barWidth}
                        height={barHeight}
                        rx="3"
                        fill={COLORS[i % COLORS.length]}
                        initial={{ height: 0, y: chartHeight }}
                        animate={{ height: barHeight, y: y }}
                        whileHover={{ filter: 'brightness(1.2)' }}
                        transition={{ duration: 0.5, delay: i * 0.05, ease: 'easeOut' }}
                    />
                    <text x={x + barWidth / 2} y={chartHeight + 15} textAnchor="middle" className="text-[10px] fill-current text-gray-500 dark:text-gray-400 font-medium pointer-events-none">
                        {d.name}
                    </text>
                </g>
            );
          })}
        </g>
      </svg>
      <AnimatePresence>
        {activeBar && tooltipPosition && (
          <motion.div
            className="absolute z-10 p-2 text-xs text-white bg-gray-800/80 backdrop-blur-sm rounded-md shadow-lg pointer-events-none"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            style={{
              top: tooltipPosition.y,
              left: tooltipPosition.x,
              transform: 'translate(10px, -110%)',
            }}
          >
            <strong>{activeBar.name}</strong>: {activeBar.value.toLocaleString()}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default SimpleBarChart;
