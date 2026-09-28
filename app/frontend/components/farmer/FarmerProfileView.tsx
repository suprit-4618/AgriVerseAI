import React, { useState } from 'react';
import { UserProfile, UserProfileDetails } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { userService } from '../../services/userService';
import { ShieldCheckIcon, CheckCircleIcon } from '../common/IconComponents';

interface FarmerProfileViewProps {
    user: UserProfile;
    isKannada: boolean;
    onUpdateUser?: (updated: UserProfile) => void;
}

const KARNATAKA_DISTRICTS = [
    'Bagalkote', 'Ballari', 'Belagavi', 'Bengaluru Rural', 'Bengaluru Urban',
    'Bidar', 'Chamarajanagar', 'Chikkaballapur', 'Chikkamagaluru', 'Chitradurga',
    'Dakshina Kannada', 'Davanagere', 'Dharwad', 'Gadag', 'Hassan',
    'Haveri', 'Kalaburagi', 'Kodagu', 'Kolar', 'Koppal',
    'Mandya', 'Mysuru', 'Raichur', 'Ramanagara', 'Shivamogga',
    'Tumakuru', 'Udupi', 'Uttara Kannada', 'Vijayanagara', 'Yadgir'
];

const SOIL_TYPES = [
    'Black Cotton Soil (ಕಪ್ಪು ಹತ್ತಿ ಮಣ್ಣು)',
    'Red Sandy Loam (ಕೆಂಪು ಮರಳು ಮಣ್ಣು)',
    'Alluvial Soil (ಮೆಕ್ಕಲು ಮಣ್ಣು)',
    'Clay Loam (ಜೇಡಿ ಮಣ್ಣು)',
    'Laterite Soil (ಲ್ಯಾಟರೈಟ್ ಮಣ್ಣು)'
];

const IRRIGATION_TYPES = [
    'Borewell + Drip Irrigation (ಬೋರ್‌ವೆಲ್ + ಹನಿ ನೀರಾವರಿ)',
    'Canal Irrigation (ಕಾಲುವೆ ನೀರಾವರಿ)',
    'Rainfed / Dryland (ಮಳೆ ಆಶ್ರಿತ)',
    'Sprinkler System (ತುಂತುರು ನೀರಾವರಿ)',
    'River Lift System (ನದಿಯ ನೀರು)'
];

const MAJOR_CROPS = [
    'Cotton (ಹತ್ತಿ)', 'Maize (ಮೆಕ್ಕೆಜೋಳ)', 'Bengal Gram (ಕಡಲೆ)',
    'Soybean (ಸೋಯಾಬೀನ್)', 'Sugarcane (ಕಬ್ಬು)', 'Chilli (ಮೆಣಸಿನಕಾಯಿ)',
    'Paddy (ಭತ್ತ)', 'Groundnut (ಕಡಲೆಕಾಯಿ)', 'Onion (ಈರುಳ್ಳಿ)', 'Wheat (ಗೋಧಿ)'
];

export const FarmerProfileView: React.FC<FarmerProfileViewProps> = ({ user, isKannada, onUpdateUser }) => {
    const { updateProfileDetails } = useAuth();

    const [fullName, setFullName] = useState(user.fullName || '');
    const [phone, setPhone] = useState(user.details?.phone || user.phone || '');
    const [village, setVillage] = useState(user.details?.village || '');
    const [taluk, setTaluk] = useState(user.details?.taluk || '');
    const [district, setDistrict] = useState(user.details?.district || 'Dharwad');
    const [pincode, setPincode] = useState(user.details?.pincode || '');

    // Farm Details
    const [farmName, setFarmName] = useState(user.details?.farmName || '');
    const [farmSize, setFarmSize] = useState(user.details?.farmSize || '');
    const [soilType, setSoilType] = useState(user.details?.soilType || SOIL_TYPES[0]);
    const [irrigationType, setIrrigationType] = useState(user.details?.irrigationType || IRRIGATION_TYPES[0]);
    const [selectedCrops, setSelectedCrops] = useState<string[]>(user.details?.mainCrops || ['Cotton (ಹತ್ತಿ)', 'Maize (ಮೆಕ್ಕೆಜೋಳ)']);
    const [kisanId, setKisanId] = useState(user.details?.kisanId || '');

    // Banking & Mandi Direct Settlement
    const [bankName, setBankName] = useState(user.details?.bankName || '');
    const [bankAccount, setBankAccount] = useState(user.details?.bankAccount || '');
    const [bankIfsc, setBankIfsc] = useState(user.details?.bankIfsc || '');
    const [upiId, setUpiId] = useState(user.details?.upiId || '');

    const [isSaving, setIsSaving] = useState(false);
    const [saveSuccess, setSaveSuccess] = useState(false);
    const [saveError, setSaveError] = useState<string | null>(null);

    // Sync form fields when user object changes or loads
    React.useEffect(() => {
        if (user) {
            setFullName(user.fullName || '');
            setPhone(user.details?.phone || user.phone || '');
            setVillage(user.details?.village || '');
            setTaluk(user.details?.taluk || '');
            setDistrict(user.details?.district || 'Dharwad');
            setPincode(user.details?.pincode || '');
            setFarmName(user.details?.farmName || '');
            setFarmSize(user.details?.farmSize || '');
            if (user.details?.soilType) setSoilType(user.details.soilType);
            if (user.details?.irrigationType) setIrrigationType(user.details.irrigationType);
            if (user.details?.mainCrops && user.details.mainCrops.length > 0) {
                setSelectedCrops(user.details.mainCrops);
            }
            setKisanId(user.details?.kisanId || '');
            setBankName(user.details?.bankName || '');
            setBankAccount(user.details?.bankAccount || '');
            setBankIfsc(user.details?.bankIfsc || '');
            setUpiId(user.details?.upiId || '');
        }
    }, [user]);

    const toggleCrop = (crop: string) => {
        setSelectedCrops(prev => 
            prev.includes(crop) ? prev.filter(c => c !== crop) : [...prev, crop]
        );
    };

    const handleSaveProfile = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        setSaveSuccess(false);
        setSaveError(null);

        try {
            const detailsPayload: Partial<UserProfileDetails> = {
                phone: phone.trim(),
                village: village.trim(),
                taluk: taluk.trim(),
                district: district.trim(),
                state: 'Karnataka',
                pincode: pincode.trim(),
                farmName: farmName.trim(),
                farmSize: farmSize.trim(),
                soilType,
                irrigationType,
                mainCrops: selectedCrops,
                kisanId: kisanId.trim(),
                bankName: bankName.trim(),
                bankAccount: bankAccount.trim(),
                bankIfsc: bankIfsc.trim().toUpperCase(),
                upiId: upiId.trim()
            };

            const locationString = `${village ? village + ', ' : ''}${district}, Karnataka`;

            // 1. Direct Firestore Persistence
            await userService.updateUserProfile(user.id, {
                fullName: fullName.trim(),
                phone: phone.trim(),
                location: locationString,
                details: { ...(user.details || {}), ...detailsPayload }
            });

            // 2. AuthContext state synchronization
            if (updateProfileDetails) {
                try {
                    await updateProfileDetails(detailsPayload, fullName.trim(), locationString);
                } catch (ctxErr) {
                    console.warn("AuthContext sync notice:", ctxErr);
                }
            }

            // 3. Parent View State update
            if (onUpdateUser) {
                onUpdateUser({
                    ...user,
                    fullName: fullName.trim(),
                    phone: phone.trim(),
                    location: locationString,
                    details: { ...(user.details || {}), ...detailsPayload }
                });
            }

            setSaveSuccess(true);
            setTimeout(() => setSaveSuccess(false), 4000);
        } catch (err: any) {
            console.error("Error saving farmer profile:", err);
            setSaveError(err.message || (isKannada ? "ಪ್ರೊಫೈಲ್ ಉಳಿಸಲು ವಿಫಲವಾಗಿದೆ." : "Failed to update profile."));
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="max-w-5xl mx-auto space-y-6 font-sans">
            {/* Header Card */}
            <div className="bg-neutral-950 border border-neutral-800 rounded-3xl p-6 sm:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-xl">
                <div className="flex items-center gap-5">
                    <div className="w-16 h-16 rounded-2xl bg-neutral-900 border border-neutral-700 text-white flex items-center justify-center font-mono font-bold text-xl shrink-0">
                        {fullName ? fullName.slice(0, 2).toUpperCase() : 'AG'}
                    </div>
                    <div>
                        <div className="flex items-center gap-2.5">
                            <h2 className="text-xl font-bold uppercase tracking-tight text-white font-mono">
                                {fullName || (isKannada ? "ರೈತರ ಪ್ರೊಫೈಲ್" : "Cultivator Profile")}
                            </h2>
                            <span className="text-[10px] font-mono bg-neutral-800 text-neutral-200 border border-neutral-700 px-2.5 py-0.5 rounded-full font-bold flex items-center gap-1">
                                <ShieldCheckIcon className="w-3 h-3 text-neutral-300" />
                                {isKannada ? "ದೃಢೀಕರಿಸಿದ ಕೃಷಿಕ" : "Verified Producer"}
                            </span>
                        </div>
                        <p className="text-xs text-neutral-400 font-mono mt-1">
                            {user.email} • {district}, Karnataka • {isKannada ? "ನೇರ ಮಂಡಿ ಮಾರಾಟಗಾರ" : "Direct APMC Seller"}
                        </p>
                    </div>
                </div>

                <div className="bg-neutral-900 border border-neutral-800 rounded-2xl px-5 py-3 text-right shrink-0">
                    <div className="text-[10px] font-mono uppercase text-neutral-400 font-bold">
                        {isKannada ? "ಸಕ್ರಿಯ ಜಮೀನು" : "Registered Holding"}
                    </div>
                    <div className="text-lg font-bold text-white font-mono mt-0.5">
                        {farmSize ? `${farmSize} Acres` : (isKannada ? "ದಾಖಲಾಗಿಲ್ಲ" : "Not Set")}
                    </div>
                </div>
            </div>

            {/* Form */}
            <form onSubmit={handleSaveProfile} className="space-y-6">
                {/* Save Feedback Alerts */}
                {saveSuccess && (
                    <div className="p-4 rounded-2xl bg-neutral-900 border border-neutral-700 text-white font-mono text-xs flex items-center gap-3">
                        <CheckCircleIcon className="w-5 h-5 text-white shrink-0" />
                        <span>{isKannada ? "ನಿಮ್ಮ ವಿವರಗಳನ್ನು ಯಶಸ್ವಿಯಾಗಿ ನವೀಕರಿಸಲಾಗಿದೆ!" : "Business profile successfully updated in real-time."}</span>
                    </div>
                )}
                {saveError && (
                    <div className="p-4 rounded-2xl bg-neutral-900 border border-neutral-700 text-neutral-300 font-mono text-xs">
                        {saveError}
                    </div>
                )}

                {/* Section 1: Personal & Contact Information */}
                <div className="bg-neutral-950 border border-neutral-800 rounded-3xl p-6 sm:p-7 space-y-5">
                    <div className="border-b border-neutral-900 pb-3">
                        <h3 className="text-sm font-bold uppercase tracking-wider text-white font-mono">
                            {isKannada ? "೧. ವೈಯಕ್ತಿಕ ಮತ್ತು ಸಂಪರ್ಕ ವಿವರಗಳು" : "1. Personal & Contact Details"}
                        </h3>
                        <p className="text-xs text-neutral-500 font-mono mt-0.5">
                            {isKannada ? "ಖರೀದಿದಾರರು ಮತ್ತು ಮಂಡಿ ಏಜೆಂಟ್‌ಗಳು ನಿಮ್ಮನ್ನು ಸಂಪರ್ಕಿಸಲು ಬಳಸುವ ಮಾಹಿತಿ" : "Used by verified buyers to identify and contact you for crop lots"}
                        </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        <div>
                            <label className="block text-[11px] font-mono text-neutral-400 mb-1.5 uppercase font-bold">
                                {isKannada ? "ಪೂರ್ಣ ಹೆಸರು *" : "Full Name *"}
                            </label>
                            <input
                                type="text"
                                required
                                value={fullName}
                                onChange={(e) => setFullName(e.target.value)}
                                placeholder="e.g. Suprit Lenkennavar"
                                className="w-full bg-neutral-900 border border-neutral-800 focus:border-neutral-500 text-white rounded-xl px-3.5 py-2.5 text-xs font-mono focus:outline-none transition-all"
                            />
                        </div>

                        <div>
                            <label className="block text-[11px] font-mono text-neutral-400 mb-1.5 uppercase font-bold">
                                {isKannada ? "ಮೊಬೈಲ್ ಸಂಖ್ಯೆ (WhatsApp) *" : "Mobile / WhatsApp *"}
                            </label>
                            <input
                                type="tel"
                                required
                                value={phone}
                                onChange={(e) => setPhone(e.target.value)}
                                placeholder="e.g. 9876543210"
                                className="w-full bg-neutral-900 border border-neutral-800 focus:border-neutral-500 text-white rounded-xl px-3.5 py-2.5 text-xs font-mono focus:outline-none transition-all"
                            />
                        </div>

                        <div>
                            <label className="block text-[11px] font-mono text-neutral-400 mb-1.5 uppercase font-bold">
                                {isKannada ? "ಗ್ರಾಮ / ಪಂಚಾಯತಿ" : "Village / Gram Panchayat"}
                            </label>
                            <input
                                type="text"
                                value={village}
                                onChange={(e) => setVillage(e.target.value)}
                                placeholder="e.g. Byahatti"
                                className="w-full bg-neutral-900 border border-neutral-800 focus:border-neutral-500 text-white rounded-xl px-3.5 py-2.5 text-xs font-mono focus:outline-none transition-all"
                            />
                        </div>

                        <div>
                            <label className="block text-[11px] font-mono text-neutral-400 mb-1.5 uppercase font-bold">
                                {isKannada ? "ತಾಲೂಕು" : "Taluk"}
                            </label>
                            <input
                                type="text"
                                value={taluk}
                                onChange={(e) => setTaluk(e.target.value)}
                                placeholder="e.g. Hubballi Rural"
                                className="w-full bg-neutral-900 border border-neutral-800 focus:border-neutral-500 text-white rounded-xl px-3.5 py-2.5 text-xs font-mono focus:outline-none transition-all"
                            />
                        </div>

                        <div>
                            <label className="block text-[11px] font-mono text-neutral-400 mb-1.5 uppercase font-bold">
                                {isKannada ? "ಜಿಲ್ಲೆ *" : "District (Karnataka) *"}
                            </label>
                            <select
                                value={district}
                                onChange={(e) => setDistrict(e.target.value)}
                                className="w-full bg-neutral-900 border border-neutral-800 focus:border-neutral-500 text-white rounded-xl px-3.5 py-2.5 text-xs font-mono focus:outline-none transition-all"
                            >
                                {KARNATAKA_DISTRICTS.map((dist) => (
                                    <option key={dist} value={dist}>{dist}</option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-[11px] font-mono text-neutral-400 mb-1.5 uppercase font-bold">
                                {isKannada ? "ಪಿನ್‌ಕೋಡ್" : "Pincode"}
                            </label>
                            <input
                                type="text"
                                value={pincode}
                                onChange={(e) => setPincode(e.target.value)}
                                placeholder="e.g. 580023"
                                className="w-full bg-neutral-900 border border-neutral-800 focus:border-neutral-500 text-white rounded-xl px-3.5 py-2.5 text-xs font-mono focus:outline-none transition-all"
                            />
                        </div>
                    </div>
                </div>

                {/* Section 2: Farm & Agricultural Assets */}
                <div className="bg-neutral-950 border border-neutral-800 rounded-3xl p-6 sm:p-7 space-y-5">
                    <div className="border-b border-neutral-900 pb-3">
                        <h3 className="text-sm font-bold uppercase tracking-wider text-white font-mono">
                            {isKannada ? "೨. ಕೃಷಿ ಭೂಮಿ ಮತ್ತು ಬೆಳೆ ವಿವರಗಳು" : "2. Farm Holdings & Agricultural Assets"}
                        </h3>
                        <p className="text-xs text-neutral-500 font-mono mt-0.5">
                            {isKannada ? "ನಿಮ್ಮ ಭೂಮಿ ಮತ್ತು ಮಣ್ಣಿನ ಪ್ರಕಾರವನ್ನು ಆಧರಿಸಿ ನಿಖರ ಬೆಲೆ ವಿಶ್ಲೇಷಣೆ ಒದಗಿಸಲಾಗುತ್ತದೆ" : "Helps AVA calibrate APMC rate benchmarks and crop diagnostic insights"}
                        </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        <div>
                            <label className="block text-[11px] font-mono text-neutral-400 mb-1.5 uppercase font-bold">
                                {isKannada ? "ತೋಟ / ಕೃಷಿ ಹೆಸರು" : "Farm / Holding Name"}
                            </label>
                            <input
                                type="text"
                                value={farmName}
                                onChange={(e) => setFarmName(e.target.value)}
                                placeholder="e.g. Lenkennavar Agri Farms"
                                className="w-full bg-neutral-900 border border-neutral-800 focus:border-neutral-500 text-white rounded-xl px-3.5 py-2.5 text-xs font-mono focus:outline-none transition-all"
                            />
                        </div>

                        <div>
                            <label className="block text-[11px] font-mono text-neutral-400 mb-1.5 uppercase font-bold">
                                {isKannada ? "ಒಟ್ಟು ಜಮೀನು (ಎಕರೆ)" : "Total Farm Land (Acres)"}
                            </label>
                            <input
                                type="text"
                                value={farmSize}
                                onChange={(e) => setFarmSize(e.target.value)}
                                placeholder="e.g. 5.5"
                                className="w-full bg-neutral-900 border border-neutral-800 focus:border-neutral-500 text-white rounded-xl px-3.5 py-2.5 text-xs font-mono focus:outline-none transition-all"
                            />
                        </div>

                        <div>
                            <label className="block text-[11px] font-mono text-neutral-400 mb-1.5 uppercase font-bold">
                                {isKannada ? "FRUITS / ಕಿಸಾನ್ ಐಡಿ" : "FRUITS / Farmer ID"}
                            </label>
                            <input
                                type="text"
                                value={kisanId}
                                onChange={(e) => setKisanId(e.target.value)}
                                placeholder="e.g. KA-FRUITS-2024-8841"
                                className="w-full bg-neutral-900 border border-neutral-800 focus:border-neutral-500 text-white rounded-xl px-3.5 py-2.5 text-xs font-mono focus:outline-none transition-all"
                            />
                        </div>

                        <div>
                            <label className="block text-[11px] font-mono text-neutral-400 mb-1.5 uppercase font-bold">
                                {isKannada ? "ಮಣ್ಣಿನ ಪ್ರಕಾರ" : "Soil Classification"}
                            </label>
                            <select
                                value={soilType}
                                onChange={(e) => setSoilType(e.target.value)}
                                className="w-full bg-neutral-900 border border-neutral-800 focus:border-neutral-500 text-white rounded-xl px-3.5 py-2.5 text-xs font-mono focus:outline-none transition-all"
                            >
                                {SOIL_TYPES.map((st) => (
                                    <option key={st} value={st}>{st}</option>
                                ))}
                            </select>
                        </div>

                        <div className="sm:col-span-2">
                            <label className="block text-[11px] font-mono text-neutral-400 mb-1.5 uppercase font-bold">
                                {isKannada ? "ನೀರಾವರಿ ವ್ಯವಸ್ಥೆ" : "Irrigation Infrastructure"}
                            </label>
                            <select
                                value={irrigationType}
                                onChange={(e) => setIrrigationType(e.target.value)}
                                className="w-full bg-neutral-900 border border-neutral-800 focus:border-neutral-500 text-white rounded-xl px-3.5 py-2.5 text-xs font-mono focus:outline-none transition-all"
                            >
                                {IRRIGATION_TYPES.map((it) => (
                                    <option key={it} value={it}>{it}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className="pt-2">
                        <label className="block text-[11px] font-mono text-neutral-400 mb-2 uppercase font-bold">
                            {isKannada ? "ಮುಖ್ಯವಾಗಿ ಬೆಳೆಯುವ ಬೆಳೆಗಳು (ಆಯ್ಕೆಮಾಡಿ)" : "Primary Cultivated Crops (Click to select)"}
                        </label>
                        <div className="flex flex-wrap gap-2">
                            {MAJOR_CROPS.map((crop) => {
                                const isSelected = selectedCrops.includes(crop);
                                return (
                                    <button
                                        key={crop}
                                        type="button"
                                        onClick={() => toggleCrop(crop)}
                                        className={`px-3 py-1.5 rounded-xl text-xs font-mono transition-all border ${
                                            isSelected
                                                ? 'bg-white text-black font-bold border-white'
                                                : 'bg-neutral-900 text-neutral-400 border-neutral-800 hover:text-white'
                                        }`}
                                    >
                                        {crop} {isSelected ? '✓' : '+'}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                </div>

                {/* Section 3: Mandi Direct Settlement & Payout */}
                <div className="bg-neutral-950 border border-neutral-800 rounded-3xl p-6 sm:p-7 space-y-5">
                    <div className="border-b border-neutral-900 pb-3">
                        <h3 className="text-sm font-bold uppercase tracking-wider text-white font-mono">
                            {isKannada ? "೩. ಮಂಡಿ ನೇರ ಪಾವತಿ ಖಾತೆ" : "3. Direct Mandi Payout Account"}
                        </h3>
                        <p className="text-xs text-neutral-500 font-mono mt-0.5">
                            {isKannada ? "ಖರೀದಿದಾರರಿಂದ 0% ಕಮಿಷನ್ ನೇರ ಬ್ಯಾಂಕ್ ವರ್ಗಾವಣೆ ಸ್ವೀಕರಿಸಲು" : "For instant 0% fee escrow settlements when deals are approved"}
                        </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div>
                            <label className="block text-[11px] font-mono text-neutral-400 mb-1.5 uppercase font-bold">
                                {isKannada ? "ಬ್ಯಾಂಕ್ ಹೆಸರು" : "Bank Name"}
                            </label>
                            <input
                                type="text"
                                value={bankName}
                                onChange={(e) => setBankName(e.target.value)}
                                placeholder="e.g. State Bank of India"
                                className="w-full bg-neutral-900 border border-neutral-800 focus:border-neutral-500 text-white rounded-xl px-3.5 py-2.5 text-xs font-mono focus:outline-none transition-all"
                            />
                        </div>

                        <div>
                            <label className="block text-[11px] font-mono text-neutral-400 mb-1.5 uppercase font-bold">
                                {isKannada ? "ಖಾತೆ ಸಂಖ್ಯೆ" : "Account Number"}
                            </label>
                            <input
                                type="password"
                                value={bankAccount}
                                onChange={(e) => setBankAccount(e.target.value)}
                                placeholder="•••• •••• ••••"
                                className="w-full bg-neutral-900 border border-neutral-800 focus:border-neutral-500 text-white rounded-xl px-3.5 py-2.5 text-xs font-mono focus:outline-none transition-all"
                            />
                        </div>

                        <div>
                            <label className="block text-[11px] font-mono text-neutral-400 mb-1.5 uppercase font-bold">
                                {isKannada ? "IFSC ಕೋಡ್" : "IFSC Code"}
                            </label>
                            <input
                                type="text"
                                value={bankIfsc}
                                onChange={(e) => setBankIfsc(e.target.value)}
                                placeholder="e.g. SBIN0040123"
                                className="w-full bg-neutral-900 border border-neutral-800 focus:border-neutral-500 text-white rounded-xl px-3.5 py-2.5 text-xs font-mono focus:outline-none transition-all uppercase"
                            />
                        </div>

                        <div>
                            <label className="block text-[11px] font-mono text-neutral-400 mb-1.5 uppercase font-bold">
                                {isKannada ? "UPI ಐಡಿ" : "UPI ID (Instant Advance)"}
                            </label>
                            <input
                                type="text"
                                value={upiId}
                                onChange={(e) => setUpiId(e.target.value)}
                                placeholder="e.g. 9876543210@upi"
                                className="w-full bg-neutral-900 border border-neutral-800 focus:border-neutral-500 text-white rounded-xl px-3.5 py-2.5 text-xs font-mono focus:outline-none transition-all"
                            />
                        </div>
                    </div>
                </div>

                {/* Submit Bar */}
                <div className="flex justify-end pt-2">
                    <button
                        type="submit"
                        disabled={isSaving}
                        className="bg-white hover:bg-neutral-200 text-black font-mono font-bold text-xs uppercase px-8 py-3.5 rounded-2xl transition-all shadow-lg flex items-center gap-2 disabled:opacity-50"
                    >
                        {isSaving ? (
                            <span>{isKannada ? "ಉಳಿಸಲಾಗುತ್ತಿದೆ..." : "Saving Profile..."}</span>
                        ) : (
                            <span>{isKannada ? "ವಿವರಗಳನ್ನು ಉಳಿಸಿ" : "Save Business Profile"}</span>
                        )}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default FarmerProfileView;
