import React, { useState, useRef } from 'react';
import { motion, AnimatePresence, Variants } from 'framer-motion';
import { UIStringContent, UserProfile as UserProfileType, UserRole } from '../types';
import { UserCircleIcon, EnvelopeIcon, MapPinIcon, ShieldCheckIcon, PencilIcon, XCircleIcon, CameraIcon } from './common/IconComponents';

interface UserProfileProps {
    user: UserProfileType;
    onClose: () => void;
    texts: UIStringContent;
    onUpdateUser: (user: UserProfileType) => void;
}

const UserProfile: React.FC<UserProfileProps> = ({ user, onClose, texts, onUpdateUser }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [editedUser, setEditedUser] = useState<UserProfileType>(user);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setEditedUser(prev => ({ ...prev, profileImageUrl: reader.result as string }));
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSave = () => {
        onUpdateUser(editedUser);
        setIsEditing(false);
    };

    const handleCancel = () => {
        setEditedUser(user); // Reset changes
        setIsEditing(false);
    };

    const getRoleText = (role: UserRole) => {
        return role.charAt(0).toUpperCase() + role.slice(1);
    }

    const contentVariants: Variants = {
        hidden: { opacity: 0, height: 0, y: -10 },
        visible: { opacity: 1, height: 'auto', y: 0, transition: { duration: 0.3, ease: 'easeOut' } },
        exit: { opacity: 0, height: 0, y: 10, transition: { duration: 0.2, ease: 'easeIn' } }
    };

    return (
        <motion.div
            className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
        >
            <motion.div
                className="relative bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden"
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                transition={{ duration: 0.3, ease: 'easeOut' }}
                layout
            >
                <div className="bg-gradient-to-br from-green-400 to-blue-500 h-28"></div>

                <button
                    onClick={onClose}
                    className="absolute top-3 right-3 bg-black/30 p-2 rounded-full text-white hover:bg-black/50 transition-colors z-10"
                    aria-label="Close profile"
                >
                    <XCircleIcon className="w-6 h-6" />
                </button>

                <div className="p-6 pt-0">
                    <div className="relative -mt-16 flex justify-center">
                        <div className="relative w-32 h-32 rounded-full border-4 border-white dark:border-slate-800 bg-gray-200 dark:bg-gray-700 flex items-center justify-center overflow-hidden">
                            {editedUser.profileImageUrl ? (
                                <img src={editedUser.profileImageUrl} alt="Profile" className="w-full h-full object-cover" />
                            ) : (
                                <UserCircleIcon className="w-28 h-28 text-gray-500 dark:text-gray-400" />
                            )}
                            {isEditing && (
                                <>
                                    <input
                                        type="file"
                                        ref={fileInputRef}
                                        onChange={handleImageChange}
                                        className="hidden"
                                        accept="image/*"
                                    />
                                    <button
                                        onClick={() => fileInputRef.current?.click()}
                                        className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity cursor-pointer"
                                        aria-label="Change profile picture"
                                    >
                                        <div className="text-center text-white">
                                            <CameraIcon className="w-8 h-8 mx-auto" />
                                            <span className="text-xs mt-1">Change</span>
                                        </div>
                                    </button>
                                </>
                            )}
                        </div>
                    </div>

                    <div className="text-center mt-4">
                        {!isEditing ? (
                            <h2 className="text-2xl font-bold text-gradient-green-blue">{editedUser.fullName}</h2>
                        ) : (
                            <input
                                type="text"
                                name="fullName"
                                value={editedUser.fullName}
                                onChange={(e) => setEditedUser(prev => ({ ...prev, fullName: e.target.value }))}
                                className="profile-edit-input mt-1 text-2xl font-bold text-center !bg-transparent !border-0 focus:!ring-0 focus:!shadow-none p-0 text-gradient-green-blue"
                            />
                        )}
                        <p className="text-sm text-gray-500 dark:text-gray-400">{getRoleText(editedUser.role)}</p>
                    </div>

                    <div className="mt-6 border-t border-gray-200 dark:border-gray-700 pt-6">
                        <AnimatePresence mode="wait">
                            {isEditing ? (
                                <motion.div key="edit-mode" className="space-y-4" variants={contentVariants} initial="hidden" animate="visible" exit="exit">
                                    <div>
                                        <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 flex items-center gap-2"><MapPinIcon className="w-4 h-4" /> {texts.locationLabel}</label>
                                        <input
                                            type="text"
                                            name="location"
                                            value={editedUser.location}
                                            onChange={(e) => setEditedUser(prev => ({ ...prev, location: e.target.value }))}
                                            className="profile-edit-input mt-1"
                                        />
                                    </div>
                                    <div className="flex items-center text-sm pt-2">
                                        <EnvelopeIcon className="w-5 h-5 text-gray-400 dark:text-gray-500" />
                                        <span className="ml-4 text-gray-500 dark:text-gray-400 italic">Email cannot be changed</span>
                                    </div>
                                </motion.div>
                            ) : (
                                <motion.div key="view-mode" className="space-y-4" variants={contentVariants} initial="hidden" animate="visible" exit="exit">
                                    <div className="flex items-center text-sm">
                                        <EnvelopeIcon className="w-5 h-5 text-gray-400 dark:text-gray-500" />
                                        <span className="ml-4 text-gray-700 dark:text-gray-300">{user.email}</span>
                                    </div>
                                    <div className="flex items-center text-sm">
                                        <MapPinIcon className="w-5 h-5 text-gray-400 dark:text-gray-500" />
                                        <span className="ml-4 text-gray-700 dark:text-gray-300">{user.location}</span>
                                    </div>
                                    <div className="flex items-center text-sm">
                                        <ShieldCheckIcon className="w-5 h-5 text-gray-400 dark:text-gray-500" />
                                        <span className="ml-4 text-gray-700 dark:text-gray-300">{texts.accountVerified}</span>
                                    </div>

                                    {user.details && (
                                        <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                                            <h4 className="text-sm font-semibold text-gray-500 dark:text-gray-400 mb-2">Role Details</h4>
                                            <div className="grid grid-cols-1 gap-2 text-sm">
                                                {user.role === UserRole.USER && (
                                                    <>
                                                        <div className="flex justify-between"><span className="text-gray-500">Farm Size:</span> <span className="text-gray-300">{user.details.farmSize} Acres</span></div>
                                                        <div className="flex justify-between"><span className="text-gray-500">Experience:</span> <span className="text-gray-300">{user.details.experience} Years</span></div>
                                                        <div className="flex justify-between"><span className="text-gray-500">Crops:</span> <span className="text-gray-300">{user.details.mainCrops?.join(', ')}</span></div>
                                                    </>
                                                )}
                                                {user.role === UserRole.BUYER && (
                                                    <>
                                                        <div className="flex justify-between"><span className="text-gray-500">Company:</span> <span className="text-gray-300">{user.details.companyName}</span></div>
                                                        <div className="flex justify-between"><span className="text-gray-500">License:</span> <span className="text-gray-300">{user.details.licenseNumber}</span></div>
                                                        <div className="flex justify-between"><span className="text-gray-500">Interests:</span> <span className="text-gray-300">{user.details.preferredCrops?.join(', ')}</span></div>
                                                    </>
                                                )}
                                                {user.role === UserRole.ADMIN && (
                                                    <>
                                                        <div className="flex justify-between"><span className="text-gray-500">Dept:</span> <span className="text-gray-300">{user.details.department}</span></div>
                                                        <div className="flex justify-between"><span className="text-gray-500">ID:</span> <span className="text-gray-300">{user.details.employeeId}</span></div>
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    <div className="mt-8">
                        <AnimatePresence mode="wait">
                            {isEditing ? (
                                <motion.div key="edit-buttons" className="flex gap-4" variants={contentVariants} initial="hidden" animate="visible" exit="exit">
                                    <button onClick={handleCancel} className="w-full flex items-center justify-center py-2.5 px-4 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 font-semibold rounded-lg transition-all">
                                        {texts.cancelEdit}
                                    </button>
                                    <button onClick={handleSave} className="w-full flex items-center justify-center py-2.5 px-4 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg transition-all">
                                        {texts.saveChanges}
                                    </button>
                                </motion.div>
                            ) : (
                                <motion.div key="view-button" variants={contentVariants} initial="hidden" animate="visible" exit="exit">
                                    <button onClick={() => setIsEditing(true)} className="w-full flex items-center justify-center py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-all">
                                        <PencilIcon className="w-4 h-4 mr-2" />
                                        {texts.editProfile}
                                    </button>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>
            </motion.div>
        </motion.div>
    );
};

export default UserProfile;