import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { SavedSoilReport, UIStringContent, SoilData } from '../types';
import AreaChart from './common/charts/AreaChart';
import Button from './common/Button';
import { TrashIcon } from './common/IconComponents';

type PlottableKey = 'ph';

interface SoilAnalysisHistoryProps {
    reports: SavedSoilReport[];
    texts: UIStringContent;
    onClearHistory: () => void;
}

const SoilAnalysisHistory: React.FC<SoilAnalysisHistoryProps> = ({ reports, texts, onClearHistory }) => {
    const [selectedParam, setSelectedParam] = useState<PlottableKey>('ph');

    const chartData = useMemo(() => {
        // Sort reports by date to ensure the chart's x-axis is chronological
        const sortedReports = [...reports].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

        return sortedReports.map(report => ({
            name: new Date(report.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
            value: report.soilData ? report.soilData[selectedParam] : 0,
        }));
    }, [reports, selectedParam]);

    const paramConfig: Record<PlottableKey, { label: string; color: string }> = {
        ph: { label: texts.ph, color: 'text-purple-400' },
    };

    if (reports.length === 0) {
        return (
            <div className="h-full flex flex-col items-center justify-center text-center text-gray-500 dark:text-gray-400">
                <h3 className="text-xl font-semibold text-gray-800 dark:text-white">No Saved Reports</h3>
                <p className="mt-2">Run an analysis to start building your soil history.</p>
            </div>
        );
    }

    return (
        <motion.div
            className="space-y-6 h-full flex flex-col"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
        >
            <div className="flex justify-between items-center flex-shrink-0">
                <h3 className="text-xl font-bold text-gray-800 dark:text-gray-200">Historical Trends</h3>
                <Button onClick={onClearHistory} variant="danger" size="sm" leftIcon={<TrashIcon className="w-4 h-4" />}>
                    Clear History
                </Button>
            </div>

            <div className="p-4 bg-white dark:bg-gray-800 rounded-xl shadow-lg flex-grow flex flex-col">
                <div className="flex-shrink-0 mb-4 flex items-center justify-center gap-2 flex-wrap">
                    {(Object.keys(paramConfig) as PlottableKey[]).map(key => (
                        <Button
                            key={key}
                            onClick={() => setSelectedParam(key)}
                            className={`!transition-all ${selectedParam === key ? `${paramConfig[key].color.replace('text-', 'bg-')} !text-white shadow` : '!bg-gray-200 dark:!bg-gray-700 !text-gray-600 dark:!text-gray-300 hover:!bg-gray-300 dark:hover:!bg-gray-600'}`}
                            size="sm"
                        >
                            {paramConfig[key].label}
                        </Button>
                    ))}
                </div>
                <div className="flex-grow h-64 min-h-[250px]">
                    <AreaChart
                        data={chartData}
                        xKey="name"
                        yKey="value"
                        gradientColor={paramConfig[selectedParam].color}
                        // Modify the 'texts' prop to pass the correct label for the tooltip
                        texts={{ ...texts, detections: paramConfig[selectedParam].label }}
                    />
                </div>
            </div>
        </motion.div>
    );
};

export default SoilAnalysisHistory;
