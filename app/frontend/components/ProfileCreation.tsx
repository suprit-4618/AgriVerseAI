import React, { useState } from 'react';
import { UserProfile, UserRole, UserProfileDetails } from '../types';
import { db } from '../services/firebaseClient';
import { doc, setDoc } from 'firebase/firestore';
import { motion } from 'framer-motion';

interface ProfileCreationProps {
    user: UserProfile;
    onProfileComplete: (updatedUser: UserProfile) => void;
}

const ProfileCreation: React.FC<ProfileCreationProps> = ({ user, onProfileComplete }) => {
    const [fullName, setFullName] = useState(user.fullName || '');
    const [location, setLocation] = useState(user.location || '');
    const [details, setDetails] = useState<UserProfileDetails>(user.details || {});
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleDetailChange = (key: keyof UserProfileDetails, value: any) => {
        setDetails(prev => ({ ...prev, [key]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);

        try {
            const updatedUser: UserProfile = {
                ...user,
                fullName,
                location,
                details
            };

            await setDoc(doc(db, 'users', user.id), {
                first_name: fullName.split(' ')[0],
                last_name: fullName.split(' ').slice(1).join(' '),
                details: details,
                location: location
            }, { merge: true });

            onProfileComplete(updatedUser);
        } catch (err: any) {
            console.error('Error updating profile:', err);
            setError(err.message || 'Failed to update profile');
        } finally {
            setIsLoading(false);
        }
    };

    const renderFarmerFields = () => (
        <>
            <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Farm Size (Acres)</label>
                <input
                    type="text"
                    value={details.farmSize || ''}
                    onChange={(e) => handleDetailChange('farmSize', e.target.value)}
                    className="w-full p-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500"
                    placeholder="e.g. 5.5"
                />
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Main Crops</label>
                <input
                    type="text"
                    value={details.mainCrops?.join(', ') || ''}
                    onChange={(e) => handleDetailChange('mainCrops', e.target.value.split(',').map(s => s.trim()))}
                    className="w-full p-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500"
                    placeholder="e.g. Rice, Wheat, Sugarcane"
                />
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Experience (Years)</label>
                <input
                    type="text"
                    value={details.experience || ''}
                    onChange={(e) => handleDetailChange('experience', e.target.value)}
                    className="w-full p-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500"
                    placeholder="e.g. 10"
                />
            </div>
        </>
    );

    const renderBuyerFields = () => (
        <>
            <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Company Name</label>
                <input
                    type="text"
                    value={details.companyName || ''}
                    onChange={(e) => handleDetailChange('companyName', e.target.value)}
                    className="w-full p-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g. Fresh Foods Ltd."
                />
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">License Number</label>
                <input
                    type="text"
                    value={details.licenseNumber || ''}
                    onChange={(e) => handleDetailChange('licenseNumber', e.target.value)}
                    className="w-full p-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g. APMC-12345"
                />
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Preferred Crops</label>
                <input
                    type="text"
                    value={details.preferredCrops?.join(', ') || ''}
                    onChange={(e) => handleDetailChange('preferredCrops', e.target.value.split(',').map(s => s.trim()))}
                    className="w-full p-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g. Tomato, Potato"
                />
            </div>
        </>
    );

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 w-full max-w-md"
            >
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 text-center">Complete Your Profile</h2>

                {error && (
                    <div className="mb-4 p-3 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded-lg text-sm">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Full Name</label>
                        <input
                            type="text"
                            required
                            value={fullName}
                            onChange={(e) => setFullName(e.target.value)}
                            className="w-full p-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500"
                            placeholder="John Doe"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Location</label>
                        <input
                            type="text"
                            required
                            value={location}
                            onChange={(e) => setLocation(e.target.value)}
                            className="w-full p-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500"
                            placeholder="City, State"
                        />
                    </div>

                    {user.role === UserRole.USER && renderFarmerFields()}
                    {user.role === UserRole.BUYER && renderBuyerFields()}

                    <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full mt-6 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-bold py-3 px-4 rounded-xl shadow-lg transform transition hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isLoading ? 'Saving...' : 'Complete Profile'}
                    </button>
                </form>
            </motion.div>
        </div>
    );
};

export default ProfileCreation;
