import React from 'react';
import { motion } from 'framer-motion';

interface RadarChartProps {
  data: {
    label: string;
    value: number;
    idealMin?: number;
    idealMax?: number;
  }[];
  size?: number;
}

const RadarChart: React.FC<RadarChartProps> = ({ data, size = 250 }) => {
  const center = size / 2;
  const radius = size * 0.4;
  const numLevels = 4;
  const numAxes = data.length;

  // Function to convert polar coordinates to Cartesian
  const toCartesian = (angle: number, r: number) => ({
    x: center + r * Math.cos(angle),
    y: center + r * Math.sin(angle),
  });

  const pointsToString = (points: { x: number; y: number }[]) =>
    points.map(p => `${p.x},${p.y}`).join(' ');

  // Calculate coordinates for grid and labels
  const gridLevels = Array.from({ length: numLevels }).map((_, i) => {
    const r = radius * ((i + 1) / numLevels);
    const points = Array.from({ length: numAxes }).map((__, j) =>
      toCartesian((Math.PI * 2 * j) / numAxes - Math.PI / 2, r)
    );
    return pointsToString(points);
  });

  const axisLines = data.map((_, i) => {
    const endPoint = toCartesian((Math.PI * 2 * i) / numAxes - Math.PI / 2, radius);
    return { x1: center, y1: center, x2: endPoint.x, y2: endPoint.y };
  });

  const labels = data.map((item, i) => {
    const point = toCartesian((Math.PI * 2 * i) / numAxes - Math.PI / 2, radius * 1.15);
    return { ...point, text: item.label };
  });

  // Calculate coordinates for data polygons
  const calculatePoints = (currentData: typeof data, type: 'value' | 'idealMin' | 'idealMax') => {
    return currentData.map((item, i) => {
      // For risk factors, values are 0-1, so overallMax will be around 1.2
      // For nutrients, the scale is based on the actual and ideal values.
      const overallMax = Math.max(item.value, item.idealMax ?? 0, item.idealMin ?? 0, 1) * 1.2;
      const overallMin = 0;
      const range = overallMax - overallMin;

      const valueToNormalize = item[type] ?? 0;
      const normalizedValue = range > 0 ? (valueToNormalize - overallMin) / range : 0;
      const pointRadius = Math.max(0, Math.min(1, normalizedValue)) * radius;
      return toCartesian((Math.PI * 2 * i) / numAxes - Math.PI / 2, pointRadius);
    });
  };
  
  const hasIdealRange = data.length > 0 && data.every(d => d.idealMin !== undefined && d.idealMax !== undefined);

  const valuePoints = calculatePoints(data, 'value');
  const idealMinPoints = hasIdealRange ? calculatePoints(data, 'idealMin') : [];
  const idealMaxPoints = hasIdealRange ? calculatePoints(data, 'idealMax') : [];

  const idealAreaPoints = hasIdealRange ? [...idealMinPoints, ...[...idealMaxPoints].reverse()] : [];

  return (
    <div className="w-full h-full flex items-center justify-center">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <g className="grid">
          {/* Grid Levels (concentric polygons) */}
          {gridLevels.map((points, i) => (
            <polygon
              key={i}
              points={points}
              className="fill-none stroke-current text-gray-200 dark:text-gray-700"
              strokeWidth="0.5"
            />
          ))}
          {/* Axis Lines */}
          {axisLines.map((line, i) => (
            <line key={i} {...line} className="stroke-current text-gray-200 dark:text-gray-700" strokeWidth="0.5" />
          ))}
        </g>
        <g className="data">
          {/* Ideal Range Area */}
          {hasIdealRange && (
            <polygon
              points={pointsToString(idealAreaPoints)}
              className="fill-current text-green-500/20 stroke-current text-green-500/40"
              strokeWidth="1"
            />
          )}
          {/* Value Polygon */}
          <motion.polygon
            points={pointsToString(valuePoints)}
            className="fill-current text-blue-500/40 stroke-current text-blue-500"
            strokeWidth="2"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 1.5, ease: 'easeInOut' }}
          />
        </g>
        <g className="labels">
          {labels.map((label, i) => (
            <text
              key={i}
              x={label.x}
              y={label.y}
              textAnchor="middle"
              dy="0.3em"
              className="fill-current text-gray-600 dark:text-gray-300 text-xs font-semibold"
            >
              {label.text}
            </text>
          ))}
        </g>
      </svg>
    </div>
  );
};

export default RadarChart;