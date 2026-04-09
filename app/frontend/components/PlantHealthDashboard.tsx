
import React from 'react';
import { motion, Variants } from 'framer-motion';
import { UIStringContent, Language } from '../types';
import * as healthData from '../data/plantHealthData';
import DashboardCard from './common/DashboardCard';
import { BarChartIcon, BugIcon, CheckBadgeIcon, SparklesIcon, ArrowLeftIcon } from './common/IconComponents';
import AreaChart from './common/charts/AreaChart';
import SimpleBarChart from './common/charts/SimpleBarChart';
import ScatterPlot from './common/charts/ScatterPlot';
import GaugeChart from './common/charts/GaugeChart';
import Button from './common/Button';
import CropDiseaseTable from './common/CropDiseaseTable';
import PriorityAlerts from './PriorityAlerts';

interface PlantHealthDashboardProps {
  texts: UIStringContent;
  onBack: () => void;
  language: Language;
}

const PlantHealthDashboard: React.FC<PlantHealthDashboardProps> = ({ texts, onBack, language }) => {
  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.05 } },
  };

  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' } },
  };
  
  const mostAffectedDistricts = [...healthData.karnatakaHeatmapData].sort((a,b) => b.value - a.value).slice(0, 7);

  return (
    <motion.div
      className="p-4 sm:p-6 space-y-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
       <div className="flex justify-between items-center">
        <h2 className="text-2xl sm:text-3xl font-bold text-gray-800 dark:text-white">{texts.plantHealthDashboardTitle}</h2>
        <Button onClick={onBack} variant="ghost" size="sm" leftIcon={<ArrowLeftIcon className="w-4 h-4" />}>
          {texts.backToAnalysis}
        </Button>
      </div>

      {/* Main Grid */}
      <motion.div 
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <DashboardCard
          icon={<BugIcon className="w-6 h-6" />}
          title={texts.totalDetections}
          value={healthData.kpiData.totalDetections.toLocaleString()}
          color="from-red-500 to-orange-500"
          index={0}
        />
        <DashboardCard
          icon={<SparklesIcon className="w-6 h-6" />}
          title={texts.activeAlerts}
          value={healthData.kpiData.activeAlerts.toLocaleString()}
          color="from-yellow-500 to-amber-500"
          index={1}
        />
        <DashboardCard
          icon={<CheckBadgeIcon className="w-6 h-6" />}
          title={texts.cropsAffected}
          value={healthData.kpiData.cropsAffected}
          color="from-green-500 to-emerald-500"
          index={2}
        />
        <motion.div variants={itemVariants} className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-md flex flex-col items-center justify-center text-center">
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">{texts.diseaseSeverityIndex}</h3>
            <GaugeChart value={healthData.diseaseSeverity.index} />
        </motion.div>
      </motion.div>
      
      <motion.div variants={itemVariants}>
        <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-4">{texts.priorityAlertsTitle}</h3>
        <PriorityAlerts alerts={healthData.priorityAlertsData} texts={texts} language={language} />
      </motion.div>

      <motion.div 
         className="grid grid-cols-1 lg:grid-cols-3 gap-4"
         variants={containerVariants}
         initial="hidden"
         animate="visible"
      >
        <motion.div variants={itemVariants} className="lg:col-span-2 bg-white dark:bg-gray-800 p-4 rounded-xl shadow-md">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-2">{texts.diseaseTrend}</h3>
            <div className="h-72">
                 <AreaChart 
                    data={healthData.diseaseTrendData}
                    xKey="name"
                    yKey="detections"
                    yKey2="temperature"
                    yKey3="humidity"
                    gradientColor="text-red-500"
                    line2Color="text-orange-400"
                    line3Color="text-blue-400"
                    texts={texts}
                 />
            </div>
        </motion.div>
        <motion.div variants={itemVariants} className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-md">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-2">{texts.cropDistribution}</h3>
            <div className="h-72">
                <SimpleBarChart data={healthData.cropDistributionData} />
            </div>
        </motion.div>
      </motion.div>

      <motion.div 
         className="grid grid-cols-1 lg:grid-cols-3 gap-4"
         variants={containerVariants}
         initial="hidden"
         animate="visible"
      >
        <motion.div variants={itemVariants} className="lg:col-span-2 bg-white dark:bg-gray-800 p-4 rounded-xl shadow-md">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-2">{texts.environmentalCorrelation}</h3>
             <div className="h-72">
                <ScatterPlot 
                    data={healthData.environmentalCorrelationData}
                    xLabel="Temperature (°C)"
                    yLabel="Humidity (%)"
                />
            </div>
        </motion.div>
         <motion.div variants={itemVariants} className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-md">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-2">{texts.mostAffectedDistricts}</h3>
            <div className="space-y-3 mt-4">
              {mostAffectedDistricts.map(d => (
                <div key={d.id} className="flex items-center text-sm">
                  <span className="w-2/3 truncate text-gray-600 dark:text-gray-300">{d.name}</span>
                  <div className="w-1/3 text-right font-bold text-gray-800 dark:text-white">{d.value.toLocaleString()}</div>
                </div>
              ))}
            </div>
        </motion.div>
      </motion.div>
      
      <motion.div variants={itemVariants} className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-md">
        <h3 className="font-semibold text-gray-900 dark:text-white mb-4">{texts.cropDiseaseHotspots}</h3>
        <CropDiseaseTable data={healthData.cropDiseaseData} texts={texts} language={language} />
      </motion.div>

    </motion.div>
  );
};

export default PlantHealthDashboard;
