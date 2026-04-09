
import React from 'react';
import { motion } from 'framer-motion';
import { SoilImageAnalysisReport } from '../types';
import Button from './common/Button';
import { ColorSwatchIcon, DropletIcon, SparklesIcon, ArrowLeftIcon, ExclamationTriangleIcon } from './common/IconComponents';

interface SoilImageAnalysisResultProps {
    report: SoilImageAnalysisReport;
    image: string;
    onReset: () => void;
}

const DetailCard: React.FC<{ icon: React.ReactNode, title: string, value: string, description: string, confidence?: number }> = ({ icon, title, value, description, confidence }) => (
    <div className="bg-gray-800 p-4 rounded-lg flex items-start gap-4">
        <div className="flex-shrink-0 text-blue-400">{icon}</div>
        <div>
            <h4 className="font-semibold text-gray-300">{title}</h4>
            <p className="text-xl font-bold text-white">{value}</p>
            {confidence && (
                 <p className="text-xs text-gray-400">Confidence: {(confidence * 100).toFixed(0)}%</p>
            )}
            <p className="text-sm text-gray-400 mt-1">{description}</p>
        </div>
    </div>
);

const SoilImageAnalysisResult: React.FC<SoilImageAnalysisResultProps> = ({ report, image, onReset }) => {
    return (
        <motion.div 
            className="space-y-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ staggerChildren: 0.1 }}
        >
            <div className="flex justify-between items-center">
                <h3 className="text-xl font-bold text-gray-800 dark:text-gray-200">Qualitative Soil Analysis</h3>
                <Button onClick={onReset} variant="ghost" size="sm" leftIcon={<ArrowLeftIcon className="w-4 h-4" />}>
                    Analyze Another Image
                </Button>
            </div>
            
            <div className="grid lg:grid-cols-2 gap-6">
                {/* Left Column: Image & Overall Assessment */}
                <div className="space-y-6">
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                        <img src={image} alt="Analyzed soil sample" className="rounded-xl shadow-lg w-full object-cover aspect-square" />
                    </motion.div>
                    <motion.div initial={{ opacity: 0, y:10 }} animate={{ opacity: 1, y:0, transition:{delay: 0.2} }} className="bg-gray-800/50 p-4 rounded-lg">
                        <h4 className="font-semibold text-white mb-2 flex items-center gap-2">
                           <SparklesIcon className="w-5 h-5 text-green-400" /> Overall Assessment
                        </h4>
                        <p className="text-gray-300 text-sm">{report.overallAssessment}</p>
                    </motion.div>
                </div>

                {/* Right Column: Detailed Analysis */}
                <div className="space-y-4">
                    <motion.div initial={{ opacity: 0, x:10 }} animate={{ opacity: 1, x:0, transition:{delay: 0.3} }}>
                        <DetailCard
                            icon={<ColorSwatchIcon className="w-8 h-8"/>}
                            title="Soil Color"
                            value={report.soilColor.colorName}
                            description={report.soilColor.interpretation}
                        />
                    </motion.div>
                     <motion.div initial={{ opacity: 0, x:10 }} animate={{ opacity: 1, x:0, transition:{delay: 0.4} }}>
                        <DetailCard
                            icon={<SparklesIcon className="w-8 h-8"/>}
                            title="Visual Texture"
                            value={report.visualTexture.dominantType}
                            description={report.visualTexture.description}
                            confidence={report.visualTexture.confidence}
                        />
                    </motion.div>
                     <motion.div initial={{ opacity: 0, x:10 }} animate={{ opacity: 1, x:0, transition:{delay: 0.5} }}>
                        <DetailCard
                            icon={<DropletIcon className="w-8 h-8"/>}
                            title="Moisture Level"
                            value={report.moistureLevel.level}
                            description={report.moistureLevel.description}
                            confidence={report.moistureLevel.confidence}
                        />
                    </motion.div>
                </div>
            </div>

            {/* Limitations */}
            <motion.div initial={{ opacity: 0, y:10 }} animate={{ opacity: 1, y:0, transition:{delay: 0.6} }} className="bg-yellow-500/10 border-l-4 border-yellow-500 p-4 rounded-r-lg">
                <h4 className="font-bold text-yellow-400 mb-2 flex items-center gap-2">
                    <ExclamationTriangleIcon className="w-5 h-5" /> Important Limitations
                </h4>
                <ul className="list-disc list-inside space-y-1 text-sm text-yellow-300">
                    {report.limitations.map((item, index) => <li key={index}>{item}</li>)}
                </ul>
            </motion.div>

        </motion.div>
    );
};

export default SoilImageAnalysisResult;
