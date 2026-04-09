
import React from 'react';
import PageShell from '../common/PageShell';
import { ShieldCheckIcon, SparklesIcon, LayersIcon } from '../common/IconComponents';

interface AboutPageProps {
  onBack: () => void;
}

const AboutPage: React.FC<AboutPageProps> = ({ onBack }) => {
  return (
    <PageShell title="About AgriVerseAI" onBack={onBack}>
      <div className="max-w-4xl mx-auto bg-gray-800/50 p-8 rounded-2xl border border-gray-700">
        <section className="mb-12 text-center">
            <h2 className="text-3xl font-bold mb-4 text-white">Our Mission</h2>
            <p className="text-lg text-gray-300">
                To empower farmers with cutting-edge AI technology, making sustainable and profitable agriculture accessible to everyone. We aim to bridge the gap between traditional farming wisdom and modern data-driven insights.
            </p>
        </section>
        
        <div className="grid md:grid-cols-3 gap-8 mb-12">
            <InfoCard icon={<LayersIcon className="w-8 h-8 text-green-400" />} title="Data-Driven" description="We leverage complex data to provide simple, actionable insights for your farm." />
            <InfoCard icon={<SparklesIcon className="w-8 h-8 text-blue-400" />} title="AI-Powered" description="Our custom-trained AI models are designed specifically for the agricultural challenges of Karnataka." />
            <InfoCard icon={<ShieldCheckIcon className="w-8 h-8 text-purple-400" />} title="Farmer-Focused" description="Every feature is built with the farmer's needs in mind, ensuring practicality and ease of use." />
        </div>

        <section>
          <h2 className="text-3xl font-bold mb-6 text-center text-white">Our Story</h2>
          <div className="space-y-4 text-gray-300">
            <p>
              AgriVerseAI was born from a simple idea: technology should serve humanity's most essential needs. Founded by a team of technologists, agronomists, and data scientists with roots in Karnataka's farming communities, we witnessed firsthand the challenges farmers face—unpredictable weather, soil degradation, and pest infestations.
            </p>
            <p>
              We believed that AI could be a powerful ally. By harnessing the power of machine learning, computer vision, and big data analytics, we could provide farmers with tools that were once only available to large agricultural corporations. Our journey began with developing a hyperlocal weather prediction model, and soon expanded to soil analysis, disease detection, and our bilingual AI assistant, Bhoomi.
            </p>
            <p>
              Today, AgriVerseAI is a comprehensive platform dedicated to enhancing the entire agricultural lifecycle. We are committed to continuous innovation and working hand-in-hand with farmers to cultivate a smarter, more resilient future for agriculture.
            </p>
          </div>
        </section>
      </div>
    </PageShell>
  );
};

const InfoCard = ({ icon, title, description }: { icon: React.ReactNode, title: string, description: string }) => (
    <div className="text-center">
        <div className="inline-block p-4 bg-gray-700 rounded-full mb-4">{icon}</div>
        <h3 className="text-xl font-bold text-white mb-2">{title}</h3>
        <p className="text-gray-400">{description}</p>
    </div>
);

export default AboutPage;
