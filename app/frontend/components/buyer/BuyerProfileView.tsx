import React, { useState } from 'react';
import { UserProfile, UserProfileDetails } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { userService } from '../../services/userService';
import { ShieldCheckIcon, CheckCircleIcon } from '../common/IconComponents';

interface BuyerProfileViewProps {
    user: UserProfile;
    isKannada: boolean;
    onUpdateUser?: (updated: UserProfile) => void;
}

const TRADER_TYPES = [
    'APMC Licensed Commission Agent (ಮಂಡಿ ಕಮಿಷನ್ ಏಜೆಂಟ್)',
    'Wholesale Grain Stockist (ಸಗಟು ಧಾನ್ಯ ದಾಸ್ತಾನುದಾರರು)',
    'Ginning & Pressing Mill (ಹತ್ತಿ ಜಿನ್ನಿಂಗ್ ಮಿಲ್)',
    'Agro Food Processor (ಕೃಷಿ ಆಹಾರ ಸಂಸ್ಕರಣಾ ಘಟಕ)',
    'Direct Institutional Exporter (ನೇರ ರಫ್ತುದಾರರು)',
    'Oilseed & Pulse Miller (ಎಣ್ಣೆಕಾಳು / ಬೇಳೆಕಾಳು ಗಿರಣಿ)'
];

const KARNATAKA_MANDIS = [
    'Hubballi APMC (ಹುಬ್ಬಳ್ಳಿ ಮಂಡಿ)',
    'Gadag APMC (ಗದಗ ಮಂಡಿ)',
    'Raichur Cotton Market (ರಾಯಚೂರು ಹತ್ತಿ ಮಾರುಕಟ್ಟೆ)',
    'Dharwad APMC (ಧಾರವಾಡ ಮಂಡಿ)',
    'Belagavi Mandi (ಬೆಳಗಾವಿ ಮಂಡಿ)',
    'Haveri APMC (ಹಾವೇರಿ ಮಂಡಿ)',
    'Davanagere APMC (ದಾವಣಗೆರೆ ಮಂಡಿ)',
    'Ballari APMC (ಬಳ್ಳಾರಿ ಮಂಡಿ)',
    'Kalaburagi Mandi (ಕಲಬುರಗಿ ಮಂಡಿ)',
    'Mysuru APMC (ಮೈಸೂರು ಮಂಡಿ)'
];

const TARGET_COMMODITIES = [
    'Cotton (ಹತ್ತಿ)', 'Maize (ಮೆಕ್ಕೆಜೋಳ)', 'Bengal Gram (ಕಡಲೆ)',
    'Soybean (ಸೋಯಾಬೀನ್)', 'Chilli (ಮೆಣಸಿನಕಾಯಿ)', 'Paddy (ಭತ್ತ)',
    'Groundnut (ಕಡಲೆಕಾಯಿ)', 'Sugarcane (ಕಬ್ಬು)', 'Wheat (ಗೋಧಿ)'
];

const PROCUREMENT_CAPACITIES = [
    '100 - 500 Quintals / Month',
    '500 - 2,000 Quintals / Month',
    '2,000 - 5,000 Quintals / Month',
    '5,000 - 10,000 Quintals / Month',
    '10,000+ Quintals / Month (Bulk Institutional)'
];

export const BuyerProfileView: React.FC<BuyerProfileViewProps> = ({ user, isKannada, onUpdateUser }) => {
    const { updateProfileDetails } = useAuth();

    // Legal & Business Identity
    const [companyName, setCompanyName] = useState(user.details?.companyName || 'Verified Mandi Trader');
    const [fullName, setFullName] = useState(user.fullName || '');
    const [traderType, setTraderType] = useState(user.details?.traderType || TRADER_TYPES[0]);
    const [licenseNumber, setLicenseNumber] = useState(user.details?.licenseNumber || '');
    const [gstNumber, setGstNumber] = useState(user.details?.gstNumber || '');
    const [panNumber, setPanNumber] = useState(user.details?.panNumber || '');

    // Operations & Location
    const [mandiLocation, setMandiLocation] = useState(user.details?.mandiLocation || KARNATAKA_MANDIS[0]);
    const [businessAddress, setBusinessAddress] = useState(user.details?.businessAddress || '');
    const [pincode, setPincode] = useState(user.details?.pincode || '');
    const [phone, setPhone] = useState(user.details?.phone || user.phone || '');
    const [capacity, setCapacity] = useState(user.details?.monthlyProcurementCapacity || PROCUREMENT_CAPACITIES[1]);
    const [preferredCrops, setPreferredCrops] = useState<string[]>(user.details?.preferredCrops || ['Cotton (ಹತ್ತಿ)', 'Maize (ಮೆಕ್ಕೆಜೋಳ)']);

    const [isSaving, setIsSaving] = useState(false);
    const [saveSuccess, setSaveSuccess] = useState(false);
    const [saveError, setSaveError] = useState<string | null>(null);

    // Sync form fields when user object changes or loads
    React.useEffect(() => {
        if (user) {
            setCompanyName(user.details?.companyName || 'Verified Mandi Trader');
            setFullName(user.fullName || '');
            if (user.details?.traderType) setTraderType(user.details.traderType);
            setLicenseNumber(user.details?.licenseNumber || '');
            setGstNumber(user.details?.gstNumber || '');
            setPanNumber(user.details?.panNumber || '');
            if (user.details?.mandiLocation) setMandiLocation(user.details.mandiLocation);
            setBusinessAddress(user.details?.businessAddress || '');
            setPincode(user.details?.pincode || '');
            setPhone(user.details?.phone || user.phone || '');
            if (user.details?.monthlyProcurementCapacity) setCapacity(user.details.monthlyProcurementCapacity);
            if (user.details?.preferredCrops && user.details.preferredCrops.length > 0) {
                setPreferredCrops(user.details.preferredCrops);
            }
        }
    }, [user]);

    const toggleCrop = (crop: string) => {
        setPreferredCrops(prev => 
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
                companyName: companyName.trim(),
                traderType,
                licenseNumber: licenseNumber.trim(),
                gstNumber: gstNumber.trim().toUpperCase(),
                panNumber: panNumber.trim().toUpperCase(),
                mandiLocation,
                businessAddress: businessAddress.trim(),
                pincode: pincode.trim(),
                phone: phone.trim(),
                monthlyProcurementCapacity: capacity,
                preferredCrops
            };

            const locationString = `${mandiLocation.split('(')[0].trim()}, Karnataka`;

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
            console.error("Error saving buyer profile:", err);
            setSaveError(err.message || (isKannada ? "ಪ್ರೊಫೈಲ್ ಉಳಿಸಲು ವಿಫಲವಾಗಿದೆ." : "Failed to update business profile."));
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
                        {companyName ? companyName.slice(0, 2).toUpperCase() : 'TR'}
                    </div>
                    <div>
                        <div className="flex items-center gap-2.5">
                            <h2 className="text-xl font-bold uppercase tracking-tight text-white font-mono">
                                {companyName || (isKannada ? "ಖರೀದಿದಾರರ ಪ್ರೊಫೈಲ್" : "Buyer Business Profile")}
                            </h2>
                            <span className="text-[10px] font-mono bg-neutral-800 text-neutral-200 border border-neutral-700 px-2.5 py-0.5 rounded-full font-bold flex items-center gap-1">
                                <ShieldCheckIcon className="w-3 h-3 text-neutral-300" />
                                {isKannada ? "ದೃಢೀಕರಿಸಿದ ಎಪಿಎಂಸಿ ವ್ಯಾಪಾರಿ" : "Verified APMC Trader"}
                            </span>
                        </div>
                        <p className="text-xs text-neutral-400 font-mono mt-1">
                            {fullName || 'Trader Representative'} • {user.email} • {mandiLocation.split('(')[0]}
                        </p>
                    </div>
                </div>

                <div className="bg-neutral-900 border border-neutral-800 rounded-2xl px-5 py-3 text-right shrink-0">
                    <div className="text-[10px] font-mono uppercase text-neutral-400 font-bold">
                        {isKannada ? "ಖರೀದಿ ಸಾಮರ್ಥ್ಯ" : "Procurement Target"}
                    </div>
                    <div className="text-sm font-bold text-white font-mono mt-0.5">
                        {capacity}
                    </div>
                </div>
            </div>

            {/* Form */}
            <form onSubmit={handleSaveProfile} className="space-y-6">
                {/* Save Feedback Alerts */}
                {saveSuccess && (
                    <div className="p-4 rounded-2xl bg-neutral-900 border border-neutral-700 text-white font-mono text-xs flex items-center gap-3">
                        <CheckCircleIcon className="w-5 h-5 text-white shrink-0" />
                        <span>{isKannada ? "ನಿಮ್ಮ ವ್ಯಾಪಾರ ಪ್ರೊಫೈಲ್ ಯಶಸ್ವಿಯಾಗಿ ನವೀಕರಿಸಲಾಗಿದೆ!" : "Mandi trading profile successfully updated in real-time."}</span>
                    </div>
                )}
                {saveError && (
                    <div className="p-4 rounded-2xl bg-neutral-900 border border-neutral-700 text-neutral-300 font-mono text-xs">
                        {saveError}
                    </div>
                )}

                {/* Section 1: Business Identity & Legal Credentials */}
                <div className="bg-neutral-950 border border-neutral-800 rounded-3xl p-6 sm:p-7 space-y-5">
                    <div className="border-b border-neutral-900 pb-3">
                        <h3 className="text-sm font-bold uppercase tracking-wider text-white font-mono">
                            {isKannada ? "೧. ವ್ಯಾಪಾರ ಮತ್ತು ಕಾನೂನು ವಿವರಗಳು" : "1. Business Identity & Legal Mandi Credentials"}
                        </h3>
                        <p className="text-xs text-neutral-500 font-mono mt-0.5">
                            {isKannada ? "ಈ ಹೆಸರು ರೈತರೊಂದಿಗೆ ಚಾಟ್ ಮಾಡುವಾಗ ಮತ್ತು ಬಿಲ್ ರಸೀದಿಯಲ್ಲಿ ಗೋಚರಿಸುತ್ತದೆ" : "This trade name is displayed directly to farmers during WhatsApp negotiations and on digital APMC bills"}
                        </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        <div>
                            <label className="block text-[11px] font-mono text-neutral-400 mb-1.5 uppercase font-bold">
                                {isKannada ? "ಸಂಸ್ಥೆ / ಕಂಪನಿಯ ಹೆಸರು *" : "Company / Firm Name *"}
                            </label>
                            <input
                                type="text"
                                required
                                value={companyName}
                                onChange={(e) => setCompanyName(e.target.value)}
                                placeholder="e.g. Sri Laxmi Cotton Traders"
                                className="w-full bg-neutral-900 border border-neutral-800 focus:border-neutral-500 text-white rounded-xl px-3.5 py-2.5 text-xs font-mono focus:outline-none transition-all"
                            />
                        </div>

                        <div>
                            <label className="block text-[11px] font-mono text-neutral-400 mb-1.5 uppercase font-bold">
                                {isKannada ? "ಪ್ರತಿನಿಧಿ / ಮಾಲೀಕರ ಹೆಸರು *" : "Authorized Representative *"}
                            </label>
                            <input
                                type="text"
                                required
                                value={fullName}
                                onChange={(e) => setFullName(e.target.value)}
                                placeholder="e.g. Ramesh Patil"
                                className="w-full bg-neutral-900 border border-neutral-800 focus:border-neutral-500 text-white rounded-xl px-3.5 py-2.5 text-xs font-mono focus:outline-none transition-all"
                            />
                        </div>

                        <div>
                            <label className="block text-[11px] font-mono text-neutral-400 mb-1.5 uppercase font-bold">
                                {isKannada ? "ವ್ಯಾಪಾರ ಪ್ರಕಾರ *" : "Business / Entity Type *"}
                            </label>
                            <select
                                value={traderType}
                                onChange={(e) => setTraderType(e.target.value)}
                                className="w-full bg-neutral-900 border border-neutral-800 focus:border-neutral-500 text-white rounded-xl px-3.5 py-2.5 text-xs font-mono focus:outline-none transition-all"
                            >
                                {TRADER_TYPES.map((tt) => (
                                    <option key={tt} value={tt}>{tt}</option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-[11px] font-mono text-neutral-400 mb-1.5 uppercase font-bold">
                                {isKannada ? "APMC ಪರವಾನಗಿ / ವ್ಯಾಪಾರ ಐಡಿ" : "APMC Mandi License / Trader ID"}
                            </label>
                            <input
                                type="text"
                                value={licenseNumber}
                                onChange={(e) => setLicenseNumber(e.target.value)}
                                placeholder="e.g. KA-APMC-HUB-2024-8841"
                                className="w-full bg-neutral-900 border border-neutral-800 focus:border-neutral-500 text-white rounded-xl px-3.5 py-2.5 text-xs font-mono focus:outline-none transition-all uppercase"
                            />
                        </div>

                        <div>
                            <label className="block text-[11px] font-mono text-neutral-400 mb-1.5 uppercase font-bold">
                                {isKannada ? "GSTIN ಸಂಖ್ಯೆ" : "GSTIN Number"}
                            </label>
                            <input
                                type="text"
                                value={gstNumber}
                                onChange={(e) => setGstNumber(e.target.value)}
                                placeholder="e.g. 29AAAAA0000A1Z5"
                                className="w-full bg-neutral-900 border border-neutral-800 focus:border-neutral-500 text-white rounded-xl px-3.5 py-2.5 text-xs font-mono focus:outline-none transition-all uppercase"
                            />
                        </div>

                        <div>
                            <label className="block text-[11px] font-mono text-neutral-400 mb-1.5 uppercase font-bold">
                                {isKannada ? "PAN ಸಂಖ್ಯೆ" : "PAN Card Number"}
                            </label>
                            <input
                                type="text"
                                value={panNumber}
                                onChange={(e) => setPanNumber(e.target.value)}
                                placeholder="e.g. ABCDE1234F"
                                className="w-full bg-neutral-900 border border-neutral-800 focus:border-neutral-500 text-white rounded-xl px-3.5 py-2.5 text-xs font-mono focus:outline-none transition-all uppercase"
                            />
                        </div>
                    </div>
                </div>

                {/* Section 2: Mandi Hub & Procurement Logistics */}
                <div className="bg-neutral-950 border border-neutral-800 rounded-3xl p-6 sm:p-7 space-y-5">
                    <div className="border-b border-neutral-900 pb-3">
                        <h3 className="text-sm font-bold uppercase tracking-wider text-white font-mono">
                            {isKannada ? "೨. ಮಂಡಿ ಕಾರ್ಯಾಚರಣೆ ಮತ್ತು ಖರೀದಿ ವ್ಯಾಪ್ತಿ" : "2. Mandi Operations & Procurement Hub"}
                        </h3>
                        <p className="text-xs text-neutral-500 font-mono mt-0.5">
                            {isKannada ? "ನಿಮ್ಮ ಪ್ರಾಥಮಿಕ ಮಾರುಕಟ್ಟೆ ಕೇಂದ್ರ ಮತ್ತು ಮಾಸಿಕ ಖರೀದಿ ಸಾಮರ್ಥ್ಯ" : "Identifies your physical mandi jurisdiction and volume capabilities"}
                        </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        <div>
                            <label className="block text-[11px] font-mono text-neutral-400 mb-1.5 uppercase font-bold">
                                {isKannada ? "ಪ್ರಾಥಮಿಕ APMC ಮಂಡಿ *" : "Primary APMC Hub *"}
                            </label>
                            <select
                                value={mandiLocation}
                                onChange={(e) => setMandiLocation(e.target.value)}
                                className="w-full bg-neutral-900 border border-neutral-800 focus:border-neutral-500 text-white rounded-xl px-3.5 py-2.5 text-xs font-mono focus:outline-none transition-all"
                            >
                                {KARNATAKA_MANDIS.map((m) => (
                                    <option key={m} value={m}>{m}</option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-[11px] font-mono text-neutral-400 mb-1.5 uppercase font-bold">
                                {isKannada ? "ವ್ಯಾಪಾರ ಮೊಬೈಲ್ (WhatsApp) *" : "Trade Phone / WhatsApp *"}
                            </label>
                            <input
                                type="tel"
                                required
                                value={phone}
                                onChange={(e) => setPhone(e.target.value)}
                                placeholder="e.g. 9845012345"
                                className="w-full bg-neutral-900 border border-neutral-800 focus:border-neutral-500 text-white rounded-xl px-3.5 py-2.5 text-xs font-mono focus:outline-none transition-all"
                            />
                        </div>

                        <div>
                            <label className="block text-[11px] font-mono text-neutral-400 mb-1.5 uppercase font-bold">
                                {isKannada ? "ಮಾಸಿಕ ಖರೀದಿ ಸಾಮರ್ಥ್ಯ" : "Monthly Procurement Capacity"}
                            </label>
                            <select
                                value={capacity}
                                onChange={(e) => setCapacity(e.target.value)}
                                className="w-full bg-neutral-900 border border-neutral-800 focus:border-neutral-500 text-white rounded-xl px-3.5 py-2.5 text-xs font-mono focus:outline-none transition-all"
                            >
                                {PROCUREMENT_CAPACITIES.map((cap) => (
                                    <option key={cap} value={cap}>{cap}</option>
                                ))}
                            </select>
                        </div>

                        <div className="sm:col-span-2">
                            <label className="block text-[11px] font-mono text-neutral-400 mb-1.5 uppercase font-bold">
                                {isKannada ? "ನೋಂದಾಯಿತ ಕಚೇರಿ ವಿಳಾಸ" : "Registered Business Address"}
                            </label>
                            <input
                                type="text"
                                value={businessAddress}
                                onChange={(e) => setBusinessAddress(e.target.value)}
                                placeholder="e.g. Plot No. 42, APMC Yard, Amargol, Hubballi"
                                className="w-full bg-neutral-900 border border-neutral-800 focus:border-neutral-500 text-white rounded-xl px-3.5 py-2.5 text-xs font-mono focus:outline-none transition-all"
                            />
                        </div>

                        <div>
                            <label className="block text-[11px] font-mono text-neutral-400 mb-1.5 uppercase font-bold">
                                {isKannada ? "ಪಿನ್‌ಕೋಡ್" : "Pincode"}
                            </label>
                            <input
                                type="text"
                                value={pincode}
                                onChange={(e) => setPincode(e.target.value)}
                                placeholder="e.g. 580025"
                                className="w-full bg-neutral-900 border border-neutral-800 focus:border-neutral-500 text-white rounded-xl px-3.5 py-2.5 text-xs font-mono focus:outline-none transition-all"
                            />
                        </div>
                    </div>

                    <div className="pt-2">
                        <label className="block text-[11px] font-mono text-neutral-400 mb-2 uppercase font-bold">
                            {isKannada ? "ಖರೀದಿಸುವ ಮುಖ್ಯ ಬೆಳೆಗಳು (ಆಯ್ಕೆಮಾಡಿ)" : "Primary Target Commodities (Click to select)"}
                        </label>
                        <div className="flex flex-wrap gap-2">
                            {TARGET_COMMODITIES.map((crop) => {
                                const isSelected = preferredCrops.includes(crop);
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
                            <span>{isKannada ? "ವ್ಯಾಪಾರ ವಿವರಗಳನ್ನು ಉಳಿಸಿ" : "Save Mandi Business Profile"}</span>
                        )}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default BuyerProfileView;
