
import React from 'react';
import { motion } from 'framer-motion';
import { PriorityAlert, UIStringContent, Language } from '../types';
import { SparklesIcon, MapPinIcon } from './common/IconComponents';

interface PriorityAlertsProps {
  alerts: PriorityAlert[];
  texts: UIStringContent;
  language: Language;
}

const getRiskStyles = (riskLevel: 'High' | 'Moderate' | 'Low') => {
    switch (riskLevel) {
        case 'High': return 'border-red-500 bg-red-500/10 text-red-400';
        case 'Moderate': return 'border-orange-500 bg-orange-500/10 text-orange-400';
        case 'Low': return 'border-yellow-500 bg-yellow-500/10 text-yellow-400';
    }
};

const PriorityAlerts: React.FC<PriorityAlertsProps> = ({ alerts, texts, language }) => {
  return (
    <div className="space-y-4">
      {alerts.map((alert, index) => (
        <motion.div
          key={index}
          className={`p-4 rounded-xl border-l-4 ${getRiskStyles(alert.riskLevel)}`}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: index * 0.15 }}
        >
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-3">
            <div>
              <h4 className={`text-xl font-bold ${language === 'kn' ? 'font-kannada' : ''}`}>
                {alert.disease[language]}
              </h4>
              <p className={`text-gray-400 ${language === 'kn' ? 'font-kannada' : ''}`}>
                Affecting: {alert.crop[language]}
              </p>
            </div>
            <div className={`mt-2 sm:mt-0 text-sm font-bold px-3 py-1 rounded-full ${getRiskStyles(alert.riskLevel).replace('border-', 'bg-').replace('/10', '/80')} !text-white`}>
                {alert.riskLevel === 'High' && texts.highRisk}
                {alert.riskLevel === 'Moderate' && texts.moderateRisk}
                {alert.riskLevel === 'Low' && texts.lowRisk}
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
                 <h5 className="font-semibold text-gray-300 flex items-center gap-2 mb-1">
                    <MapPinIcon className="w-4 h-4" />
                    {texts.affectedRegions}
                </h5>
                <p className="text-gray-400 pl-1">{alert.affectedDistricts.join(', ')}</p>
            </div>
             <div>
                <h5 className="font-semibold text-gray-300 flex items-center gap-2 mb-1">
                    <SparklesIcon className="w-4 h-4 text-blue-400" />
                    {texts.recommendedAction}
                </h5>
                <p className={`text-gray-300 pl-1 ${language === 'kn' ? 'font-kannada' : ''}`}>
                    {alert.primaryAction[language]}
                </p>
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
};

export default PriorityAlerts;
