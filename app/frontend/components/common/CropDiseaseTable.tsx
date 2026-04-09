
import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { CropDiseaseDataPoint, UIStringContent, Language } from '../../types';

const SortIcon: React.FC<{ direction: 'asc' | 'desc' | 'none' }> = ({ direction }) => {
    const iconMap = {
        asc: '▲',
        desc: '▼',
        none: '↕'
    };
    return <span className={`inline-block w-4 text-center transition-opacity ${direction === 'none' ? 'opacity-30' : 'opacity-80'}`}>{iconMap[direction]}</span>;
};

interface CropDiseaseTableProps {
  data: CropDiseaseDataPoint[];
  texts: UIStringContent;
  language: Language;
}

const CropDiseaseTable: React.FC<CropDiseaseTableProps> = ({ data, texts, language }) => {
    type SortKey = 'crop' | 'disease' | 'detections';
    const [sortConfig, setSortConfig] = useState<{ key: SortKey; direction: 'asc' | 'desc' }>({ key: 'detections', direction: 'desc' });

    const sortedData = useMemo(() => {
        const sortableData = [...data];
        if (sortConfig.key) {
            sortableData.sort((a, b) => {
                if (sortConfig.key === 'detections') {
                    return sortConfig.direction === 'asc' ? a.detections - b.detections : b.detections - a.detections;
                } else {
                    const aValue = a[sortConfig.key][language];
                    const bValue = b[sortConfig.key][language];
                    if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
                    if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
                    return 0;
                }
            });
        }
        return sortableData;
    }, [data, sortConfig, language]);

    const requestSort = (key: SortKey) => {
        let direction: 'asc' | 'desc' = 'asc';
        if (sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key, direction });
    };

    const tableHeaders: { key: SortKey; label: string }[] = [
        { key: 'crop', label: texts.crop },
        { key: 'disease', label: texts.disease },
        { key: 'detections', label: texts.detections },
    ];

    return (
        <div className="w-full overflow-x-auto dark-scrollbar">
            <table className="w-full min-w-[600px] text-left">
                <thead>
                    <tr className="border-b-2 border-gray-200 dark:border-gray-700">
                        {tableHeaders.map(({ key, label }) => (
                             <th key={key} className="p-3 text-sm font-semibold uppercase text-gray-500 dark:text-gray-400">
                                <button onClick={() => requestSort(key)} className="flex items-center gap-1 hover:text-white transition-colors">
                                    <span>{label}</span>
                                    <SortIcon direction={sortConfig.key === key ? sortConfig.direction : 'none'} />
                                </button>
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {sortedData.map((item, index) => (
                        <motion.tr
                            key={`${item.crop[language]}-${item.disease[language]}`}
                            className="border-b border-gray-200 dark:border-gray-700/50"
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.05, duration: 0.3 }}
                        >
                            <td className={`p-3 font-medium text-gray-900 dark:text-white ${language === 'kn' ? 'font-kannada' : ''}`}>
                                {item.crop[language]}
                            </td>
                            <td className={`p-3 text-gray-600 dark:text-gray-300 ${language === 'kn' ? 'font-kannada' : ''}`}>
                                {item.disease[language]}
                            </td>
                            <td className="p-3 font-bold text-lg text-gray-900 dark:text-white">
                                {item.detections}
                            </td>
                        </motion.tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export default CropDiseaseTable;
