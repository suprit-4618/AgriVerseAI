

import React, { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { UIStringContent } from '../../../types';

interface DataPoint {
  name: string;
  [key: string]: number | string;
}

interface AreaChartProps {
  data: DataPoint[];
  xKey: string;
  yKey: string;
  yKey2?: string;
  yKey3?: string;
  gradientColor: string;
  line2Color?: string;
  line3Color?: string;
  texts: UIStringContent;
}

const AreaChart: React.FC<AreaChartProps> = ({ data, xKey, yKey, yKey2, yKey3, gradientColor, line2Color, line3Color, texts }) => {
  const [hoveredData, setHoveredData] = useState<{ point: DataPoint; x: number } | null>(null);
  const [tooltipPosition, setTooltipPosition] = useState<{ x: number; y: number } | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const width = 500;
  const height = 200;
  const padding = { top: 20, right: 20, bottom: 30, left: 30 };
  
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;

  const allYValues = data.flatMap(d => {
    const values = [d[yKey] as number];
    if (yKey2 && d[yKey2]) values.push(d[yKey2] as number);
    if (yKey3 && d[yKey3]) values.push(d[yKey3] as number);
    return values;
  });
  const maxY = Math.max(...allYValues) * 1.1;

  const getPath = (key: string, isArea: boolean = false) => {
    const points = data.map((d, i) => {
        const x = (i / (data.length - 1)) * chartWidth;
        const y = chartHeight - ((d[key] as number) / maxY) * chartHeight;
        return { x, y };
    });

    let path = `M ${points[0].x},${points[0].y}`;
    points.forEach((p, i) => {
      if (i === 0) return;
      const prev = points[i - 1];
      const midX = (prev.x + p.x) / 2;
      path += ` C ${midX},${prev.y} ${midX},${p.y} ${p.x},${p.y}`;
    });

    if (isArea) {
      path += ` L ${chartWidth},${chartHeight} L 0,${chartHeight} Z`;
    }
    return path;
  };

  const areaPath = getPath(yKey, true);
  const linePath = getPath(yKey, false);
  const line2Path = yKey2 ? getPath(yKey2, false) : '';
  const line3Path = yKey3 ? getPath(yKey3, false) : '';

  const handleMouseMove = useCallback((event: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current || data.length < 2) return;

    const rect = containerRef.current.getBoundingClientRect();
    const x = event.clientX - rect.left;

    const svgX = (x / rect.width) * width;
    const chartX = svgX - padding.left;
    
    const index = Math.max(0, Math.min(data.length - 1, Math.round(chartX / (chartWidth / (data.length - 1)))));
    
    const point = data[index];
    if (point) {
        const xPos = (index / (data.length - 1)) * chartWidth;
        setHoveredData({ point, x: xPos });
        
        const y = event.clientY - rect.top;
        setTooltipPosition({ x: x + 15, y: y + 15 });
    }
  }, [data, width, chartWidth, padding.left]);

  const handleMouseLeave = useCallback(() => {
    setHoveredData(null);
    setTooltipPosition(null);
  }, []);
  
  let hoveredCircleY = 0;
  if (hoveredData) {
      hoveredCircleY = chartHeight - ((hoveredData.point[yKey] as number) / maxY) * chartHeight;
  }

  return (
    <div className="w-full h-full relative" ref={containerRef} onMouseMove={handleMouseMove} onMouseLeave={handleMouseLeave}>
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full cursor-crosshair">
        <defs>
          <linearGradient id={`gradient-${yKey}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" className={`stop-color ${gradientColor}`} stopOpacity="0.4" />
            <stop offset="100%" className={`stop-color ${gradientColor}`} stopOpacity="0" />
          </linearGradient>
        </defs>
        
        <g transform={`translate(${padding.left}, ${padding.top})`}>
            {/* Y-Axis Grid Lines */}
            {Array.from({ length: 5 }).map((_, i) => (
                <line
                    key={i}
                    x1={0} y1={(i * chartHeight) / 4}
                    x2={chartWidth} y2={(i * chartHeight) / 4}
                    className="stroke-gray-200 dark:stroke-gray-700"
                    strokeWidth="0.5" strokeDasharray="2 2"
                />
            ))}

            {/* Area */}
            <motion.path
              d={areaPath}
              fill={`url(#gradient-${yKey})`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 1 }}
            />
            {/* Line */}
            <motion.path
              d={linePath}
              fill="none"
              className={`stroke-current ${gradientColor}`}
              strokeWidth="2"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 1.5, ease: 'easeInOut' }}
            />
            {/* Line 2 */}
            {line2Path && (
                 <motion.path
                    d={line2Path}
                    fill="none"
                    className={`stroke-current ${line2Color}`}
                    strokeWidth="1.5"
                    strokeDasharray="4 2"
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ duration: 1.5, ease: 'easeInOut', delay: 0.2 }}
                />
            )}
             {/* Line 3 */}
             {line3Path && (
                 <motion.path
                    d={line3Path}
                    fill="none"
                    className={`stroke-current ${line3Color}`}
                    strokeWidth="1.5"
                    strokeDasharray="4 2"
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ duration: 1.5, ease: 'easeInOut', delay: 0.4 }}
                />
            )}
             {/* X-Axis Labels */}
            {data.map((d, i) => {
                 if (i % (Math.floor(data.length / 6) || 1) !== 0) return null;
                 const x = (i / (data.length - 1)) * chartWidth;
                 return (
                     <text key={i} x={x} y={chartHeight + 15} textAnchor="middle" className="text-xs fill-current text-gray-500 dark:text-gray-400">
                        {d[xKey]}
                     </text>
                 )
            })}
            
            <AnimatePresence>
                {hoveredData && (
                    <g className="pointer-events-none">
                        <motion.line
                            x1={hoveredData.x} y1={0}
                            x2={hoveredData.x} y2={chartHeight}
                            className="stroke-gray-400 dark:stroke-gray-500"
                            strokeWidth="1"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                        />
                        <motion.circle
                            cx={hoveredData.x}
                            cy={hoveredCircleY}
                            r="4"
                            className={`fill-white dark:fill-gray-800 stroke-2 stroke-current ${gradientColor}`}
                            initial={{ opacity: 0, scale: 0 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0 }}
                        />
                    </g>
                )}
            </AnimatePresence>
        </g>
      </svg>
      <AnimatePresence>
        {hoveredData && tooltipPosition && (
          <motion.div
            className="absolute z-10 p-2 text-xs text-white bg-gray-800/80 backdrop-blur-sm rounded-md shadow-lg pointer-events-none"
            initial={{ opacity: 0, scale: 0.9, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 10 }}
            style={{
              top: tooltipPosition.y,
              left: tooltipPosition.x,
            }}
          >
            <div className="font-bold mb-1">{hoveredData.point[xKey]}</div>
            <div className={`flex items-center gap-2 ${gradientColor}`}>
                <div className={`w-2 h-2 rounded-full bg-current`} />
                <span>{texts.detections}: {hoveredData.point[yKey]}</span>
            </div>
            {yKey2 && hoveredData.point[yKey2] && (
                <div className={`flex items-center gap-2 text-orange-400`}>
                    <div className={`w-2 h-2 rounded-full bg-current`} />
                    <span>Temp: {hoveredData.point[yKey2]}°C</span>
                </div>
            )}
             {yKey3 && hoveredData.point[yKey3] && (
                <div className={`flex items-center gap-2 text-blue-400`}>
                    <div className={`w-2 h-2 rounded-full bg-current`} />
                    <span>Humidity: {hoveredData.point[yKey3]}%</span>
                </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AreaChart;
