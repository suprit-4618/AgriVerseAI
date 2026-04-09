
import React from 'react';
import PageShell from '../common/PageShell';
import { EnvelopeIcon, PhoneIcon, MapPinIcon } from '../common/IconComponents';
import Button from '../common/Button';

interface ContactPageProps {
  onBack: () => void;
}

const ContactPage: React.FC<ContactPageProps> = ({ onBack }) => {
  return (
    <PageShell title="Get in Touch" onBack={onBack}>
      <div className="max-w-5xl mx-auto grid md:grid-cols-2 gap-12 bg-gray-800/50 p-8 rounded-2xl border border-gray-700">
        <div>
            <h2 className="text-3xl font-bold text-white mb-4">Contact Information</h2>
            <p className="text-gray-300 mb-8">
                Have a question or want to partner with us? Reach out through any of the methods below, or use the contact form.
            </p>
            <div className="space-y-6">
                <ContactInfo icon={<EnvelopeIcon className="w-6 h-6 text-green-400" />} title="Email" detail="contact@agriverse.ai" />
                <ContactInfo icon={<PhoneIcon className="w-6 h-6 text-green-400" />} title="Phone" detail="+91-9876543210" />
                <ContactInfo icon={<MapPinIcon className="w-6 h-6 text-green-400" />} title="Address" detail="123 AgriTech Park, Bengaluru, Karnataka, India" />
            </div>
        </div>

        <div>
            <h2 className="text-3xl font-bold text-white mb-4">Send Us a Message</h2>
            <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
                <div>
                    <label htmlFor="name" className="block text-sm font-medium text-gray-300">Full Name</label>
                    <input type="text" id="name" className="profile-edit-input mt-1" placeholder="Your Name" />
                </div>
                <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-300">Email Address</label>
                    <input type="email" id="email" className="profile-edit-input mt-1" placeholder="you@example.com" />
                </div>
                 <div>
                    <label htmlFor="subject" className="block text-sm font-medium text-gray-300">Subject</label>
                    <input type="text" id="subject" className="profile-edit-input mt-1" placeholder="Question about soil analysis" />
                </div>
                <div>
                    <label htmlFor="message" className="block text-sm font-medium text-gray-300">Message</label>
                    <textarea id="message" rows={4} className="profile-edit-input mt-1" placeholder="Your message here..."></textarea>
                </div>
                <div>
                    <Button type="submit" className="w-full !bg-green-600 hover:!bg-green-700">Send Message</Button>
                </div>
            </form>
        </div>
      </div>
    </PageShell>
  );
};

const ContactInfo = ({ icon, title, detail }: { icon: React.ReactNode, title: string, detail: string }) => (
    <div className="flex items-start gap-4">
        <div className="flex-shrink-0 mt-1">{icon}</div>
        <div>
            <h3 className="text-lg font-semibold text-white">{title}</h3>
            <p className="text-gray-300">{detail}</p>
        </div>
    </div>
);

export default ContactPage;
