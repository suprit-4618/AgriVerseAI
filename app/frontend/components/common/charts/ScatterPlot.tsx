
import React from 'react';
import { motion } from 'framer-motion';
import { ScatterDataPoint } from '../../../types';

interface ScatterPlotProps {
  data: ScatterDataPoint[];
  xLabel?: string;
  yLabel?: string;
}

const ScatterPlot: React.FC<ScatterPlotProps> = ({ data, xLabel = 'Temperature (°C)', yLabel = 'Humidity (%)' }) => {
  const width = 500;
  const height = 300;
  const padding = { top: 20, right: 20, bottom: 40, left: 40 };

  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;

  const xDomain = [Math.min(...data.map(d => d.temperature)) - 2, Math.max(...data.map(d => d.temperature)) + 2];
  const yDomain = [Math.min(...data.map(d => d.humidity)) - 5, Math.max(...data.map(d => d.humidity)) + 5];
  const sizeDomain = [1, Math.max(...data.map(d => d.detections))];

  const xScale = (value: number) => (value - xDomain[0]) / (xDomain[1] - xDomain[0]) * chartWidth;
  const yScale = (value: number) => chartHeight - (value - yDomain[0]) / (yDomain[1] - yDomain[0]) * chartHeight;
  const sizeScale = (value: number) => 3 + (value - sizeDomain[0]) / (sizeDomain[1] - sizeDomain[0]) * 9;

  return (
    <div className="w-full h-full relative">
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full">
        <g transform={`translate(${padding.left}, ${padding.top})`}>
          {/* Grid Lines */}
          {Array.from({ length: 5 }).map((_, i) => (
            <line key={`y-grid-${i}`} x1={0} y1={(i * chartHeight) / 4} x2={chartWidth} y2={(i * chartHeight) / 4} className="stroke-gray-200 dark:stroke-gray-700/50" strokeWidth="0.5" />
          ))}
          {Array.from({ length: 5 }).map((_, i) => (
            <line key={`x-grid-${i}`} x1={(i * chartWidth) / 4} y1={0} x2={(i * chartWidth) / 4} y2={chartHeight} className="stroke-gray-200 dark:stroke-gray-700/50" strokeWidth="0.5" />
          ))}

          {/* Points */}
          {data.map((d, i) => (
            <motion.circle
              key={i}
              cx={xScale(d.temperature)}
              cy={yScale(d.humidity)}
              r={sizeScale(d.detections)}
              className="fill-current text-blue-500/60"
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: i * 0.02 }}
            />
          ))}

          {/* Axes */}
          <line x1={0} y1={chartHeight} x2={chartWidth} y2={chartHeight} className="stroke-gray-400 dark:stroke-gray-500" strokeWidth="1" />
          <line x1={0} y1={0} x2={0} y2={chartHeight} className="stroke-gray-400 dark:stroke-gray-500" strokeWidth="1" />

          {/* Axis Labels */}
          <text x={chartWidth / 2} y={chartHeight + 30} textAnchor="middle" className="text-xs fill-current text-gray-500 dark:text-gray-400">{xLabel}</text>
          <text transform="rotate(-90)" x={-chartHeight / 2} y={-30} textAnchor="middle" className="text-xs fill-current text-gray-500 dark:text-gray-400">{yLabel}</text>
        </g>
      </svg>
    </div>
  );
};

export default ScatterPlot;