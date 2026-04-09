
import React from 'react';
import PageShell from '../common/PageShell';
import { ArrowRightIcon } from '../common/IconComponents';

interface CareersPageProps {
  onBack: () => void;
}

const jobOpenings = [
    {
        title: 'Senior AI/ML Engineer',
        location: 'Bengaluru, Karnataka',
        description: 'Lead the development of our core predictive models for crop yield, disease detection, and soil analysis. Experience with TensorFlow/PyTorch and computer vision is a must.'
    },
    {
        title: 'Lead Agronomist',
        location: 'Hubballi, Karnataka',
        description: 'Bridge the gap between our technology and on-the-ground farming practices. Work with farmers to gather data, validate models, and provide expert agricultural advice.'
    },
    {
        title: 'Full-Stack Developer (React & Node.js)',
        location: 'Remote/Bengaluru',
        description: 'Build and maintain our user-facing platform. You will work on everything from our AI assistant interface to our data visualization dashboards.'
    },
    {
        title: 'Kannada Language NLP Specialist',
        location: 'Mysuru, Karnataka',
        description: 'Enhance our AI assistant, Bhoomi, by improving its natural language understanding and generation capabilities in Kannada. Help us make technology truly accessible.'
    }
];

const CareersPage: React.FC<CareersPageProps> = ({ onBack }) => {
  return (
    <PageShell title="Join Our Team" onBack={onBack}>
      <div className="max-w-4xl mx-auto">
        <p className="text-center text-lg text-gray-300 mb-12">
            We're on a mission to revolutionize agriculture. If you're passionate about technology, sustainability, and making a real-world impact, we'd love to hear from you.
        </p>

        <div className="space-y-6">
            {jobOpenings.map((job, index) => (
                <div key={index} className="bg-gray-800/50 p-6 rounded-xl border border-gray-700 hover:border-green-500 transition-all duration-300 group">
                    <div className="flex justify-between items-start">
                        <div>
                            <h3 className="text-2xl font-bold text-white">{job.title}</h3>
                            <p className="text-md text-gray-400 mt-1">{job.location}</p>
                        </div>
                         <button className="bg-gray-700 group-hover:bg-green-600 text-white font-semibold px-4 py-2 rounded-lg transition-all flex items-center gap-2 transform group-hover:translate-x-1">
                            Apply <ArrowRightIcon className="w-4 h-4" />
                        </button>
                    </div>
                    <p className="text-gray-300 mt-4">
                        {job.description}
                    </p>
                </div>
            ))}
        </div>
      </div>
    </PageShell>
  );
};

export default CareersPage;
