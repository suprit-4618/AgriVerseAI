
import React from 'react';
import PageShell from '../common/PageShell';

interface LegalPageProps {
  onBack: () => void;
  pageType: 'privacy' | 'terms';
}

const LegalPage: React.FC<LegalPageProps> = ({ onBack, pageType }) => {
    const content = {
        privacy: {
            title: 'Privacy Policy',
            body: (
                <div className="prose prose-invert prose-lg max-w-none text-gray-300">
                    <p>Last updated: {new Date().toLocaleDateString()}</p>
                    <p>AgriVerseAI ("us", "we", or "our") operates the AgriVerseAI application (the "Service"). This page informs you of our policies regarding the collection, use, and disclosure of personal data when you use our Service and the choices you have associated with that data.</p>
                    
                    <h3>Information Collection and Use</h3>
                    <p>We collect several different types of information for various purposes to provide and improve our Service to you. This includes, but is not limited to, your email address, location data, and images you upload for analysis.</p>

                    <h3>Use of Data</h3>
                    <p>AgriVerseAI uses the collected data for various purposes: to provide and maintain the Service, to notify you about changes to our Service, to allow you to participate in interactive features of our Service when you choose to do so, to provide customer care and support, and to provide analysis or valuable information so that we can improve the Service.</p>

                    <h3>Data Security</h3>
                    <p>The security of your data is important to us but remember that no method of transmission over the Internet or method of electronic storage is 100% secure. While we strive to use commercially acceptable means to protect your Personal Data, we cannot guarantee its absolute security.</p>
                </div>
            )
        },
        terms: {
            title: 'Terms of Service',
            body: (
                <div className="prose prose-invert prose-lg max-w-none text-gray-300">
                     <p>Last updated: {new Date().toLocaleDateString()}</p>
                     <p>Please read these Terms of Service ("Terms", "Terms of Service") carefully before using the AgriVerseAI application (the "Service") operated by AgriVerseAI ("us", "we", or "our"). Your access to and use of the Service is conditioned on your acceptance of and compliance with these Terms. These Terms apply to all visitors, users, and others who access or use the Service.</p>

                     <h3>1. Accounts</h3>
                     <p>When you create an account with us, you must provide us information that is accurate, complete, and current at all times. Failure to do so constitutes a breach of the Terms, which may result in immediate termination of your account on our Service. You are responsible for safeguarding the password that you use to access the Service and for any activities or actions under your password.</p>

                     <h3>2. User Content</h3>
                     <p>Our Service allows you to post, link, store, share and otherwise make available certain information, text, graphics, videos, or other material ("Content"), such as images of plants for analysis. You are responsible for the Content that you post to the Service, including its legality, reliability, and appropriateness. By posting Content to the Service, you grant us the right and license to use, modify, publicly perform, publicly display, reproduce, and distribute such Content on and through the Service for the purpose of operating and improving the service.</p>

                     <h3>3. Intellectual Property</h3>
                     <p>The Service and its original content (excluding Content provided by users), features and functionality are and will remain the exclusive property of AgriVerseAI and its licensors. The Service is protected by copyright, trademark, and other laws of both India and foreign countries.</p>

                     <h3>4. Disclaimer</h3>
                     <p>The Service is provided on an "AS IS" and "AS AVAILABLE" basis. The Service is provided without warranties of any kind, whether express or implied. The information and recommendations provided by our AI, including but not limited to crop recommendations, disease analysis, and treatment suggestions, are for informational purposes only and should not be considered as professional agricultural advice. AgriVerseAI does not guarantee the accuracy, completeness, or usefulness of any information on the Service and neither adopts nor endorses nor is responsible for the accuracy or reliability of any opinion, advice, or statement made. Always consult with a qualified professional before making any farming decisions.</p>

                     <h3>5. Limitation of Liability</h3>
                     <p>In no event shall AgriVerseAI, nor its directors, employees, partners, agents, suppliers, or affiliates, be liable for any indirect, incidental, special, consequential or punitive damages, including without limitation, loss of profits, data, use, goodwill, or other intangible losses, resulting from your access to or use of or inability to access or use the Service.</p>
                     
                     <h3>6. Changes</h3>
                     <p>We reserve the right, at our sole discretion, to modify or replace these Terms at any time. We will try to provide at least 30 days' notice prior to any new terms taking effect. By continuing to access or use our Service after those revisions become effective, you agree to be bound by the revised terms.</p>
                </div>
            )
        }
    };
    
    const { title, body } = content[pageType];

  return (
    <PageShell title={title} onBack={onBack}>
      <div className="max-w-4xl mx-auto bg-gray-800/50 p-8 rounded-2xl border border-gray-700">
          {body}
      </div>
    </PageShell>
  );
};

export default LegalPage;
