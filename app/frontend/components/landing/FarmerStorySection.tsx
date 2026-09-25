import React from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { Language } from '../../types';

interface StoryBeat {
    id: string;
    index: string;
    location: string;
    crop: string;
    farmer: string;
    headline: string;
    quote: string;
    narrative: string;
    crisisImpact: string;
    karnatakaStatistic: { value: string; label: string };
    imageSrc: string;
    imageAlt: string;
}

const storiesEn: StoryBeat[] = [
    {
        id: 'haveri-cotton',
        index: '01',
        location: 'Haveri District, North Karnataka',
        crop: 'Bt-Cotton & Chilli',
        farmer: 'Basavaraj Patil (4.2 Acres)',
        headline: 'The 8-Day Diagnostic Gap That Wiped Out 60% of the Harvest',
        quote: 'I saw the squares dropping, but nobody in our village could tell if it was fungal rust or internal bollworm until it was too late.',
        narrative: 'When unusual leaf curling and boll drop appeared across his 4-acre field in Haveri, Basavaraj had to wait six days for a visiting extension officer. Without immediate microscopic or visual diagnosis, he applied generic pesticide sprays that had no effect on internal larvae. By the time the laboratory results returned from Dharwad, the infestation had spread across 70% of his crop.',
        crisisImpact: 'Suffered a net loss of ₹1.65 Lakhs in a single season, forcing him to pledge family jewellery to local informal lenders at 36% annual interest to buy seeds for the next cycle.',
        karnatakaStatistic: {
            value: '42.8%',
            label: 'of North Karnataka cotton acreage suffered pest damage due to diagnostic delays'
        },
        imageSrc: '/story-disease.jpg',
        imageAlt: 'Hands inspecting diseased cotton crop leaf'
    },
    {
        id: 'kolar-tomatoes',
        index: '02',
        location: 'Kolar APMC Mandi, South Karnataka',
        crop: 'Tomatoes & Vegetables',
        farmer: 'Ningappa Gowda (2.5 Acres)',
        headline: 'Sold for ₹3.50/kg at Mandi, Sold for ₹48/kg in Bengaluru',
        quote: 'After 90 days of backbreaking labor, I had to pay the commission agent and the loading truck more than what I took home for my family.',
        narrative: 'Ningappa drove 140 crates of fresh harvest to the Kolar APMC yard at 4 AM. Commission agents declared a sudden "oversupply glut" and fixed the spot price at ₹3.50/kg. With perishable produce and no refrigerated holding facility, Ningappa had no choice but to sell. Two hours away in Indiranagar, Bengaluru, retail consumers purchased the exact same harvest grade for ₹48 to ₹55 per kilogram.',
        crisisImpact: 'After commission deductions, unverified weighbridge cuts, and transport freight, Ningappa made a net margin of negative ₹4,200 on that day\'s dispatch.',
        karnatakaStatistic: {
            value: '84%',
            label: 'of smallholder farm income in Karnataka is captured by intermediate supply-chain cartels'
        },
        imageSrc: '/story-mandi.jpg',
        imageAlt: 'Stacked grain and produce sacks at wholesale mandi'
    },
    {
        id: 'mandya-sugarcane',
        index: '03',
        location: 'Mandya & Cauvery Basin',
        crop: 'Sugarcane & Paddy',
        farmer: 'Shanthamma & Ramesh (3 Acres)',
        headline: 'The Salinity Trap: Spending More on Fertilizer for Diminishing Yields',
        quote: 'Our borewell went from 300 feet to 850 feet deep, and the water turned saline. The soil feels like hard cement now.',
        narrative: 'Decades of unbalanced Urea (nitrogen) broadcasting without soil micronutrient testing left Shanthamma\'s 3-acre plot severely deficient in Zinc, Boron, and organic carbon. When monsoon rains delayed, deeper borewell water compounded soil alkalinity. Despite spending ₹28,000 on extra fertilizer bags hoping to stimulate growth, her sugarcane tonnage dropped from 44 tons/acre to just 21 tons/acre.',
        crisisImpact: 'Escalating input costs combined with a 50% yield contraction created chronic household cash-flow distress and unmanageable borewell drilling debts.',
        karnatakaStatistic: {
            value: '3.4 Million Ha',
            label: 'of agricultural land in Karnataka exhibits critical soil micronutrient depletion'
        },
        imageSrc: '/story-soil.jpg',
        imageAlt: 'Farmer hands holding cracked arid agricultural soil'
    }
];

const storiesKn: StoryBeat[] = [
    {
        id: 'haveri-cotton',
        index: '01',
        location: 'ಹಾವೇರಿ ಜಿಲ್ಲೆ, ಉತ್ತರ ಕರ್ನಾಟಕ',
        crop: 'ಬಿಟಿ-ಹತ್ತಿ ಮತ್ತು ಮೆಣಸಿನಕಾಯಿ',
        farmer: 'ಬಸವರಾಜ್ ಪಾಟೀಲ್ (೪.೨ ಎಕರೆ)',
        headline: '೮ ದಿನಗಳ ತಡವಾದ ರೋಗ ಪತ್ತೆಯಿಂದಾಗಿ ೬೦% ಬೆಳೆ ನಾಶವಾಯಿತು',
        quote: 'ಹೂವು ಮತ್ತು ಕಾಯಿಗಳು ಉದುರುತ್ತಿದ್ದವು, ಆದರೆ ನಮ್ಮ ಹಳ್ಳಿಯಲ್ಲಿ ಯಾರಿಗೂ ಇದು ಶಿಲೀಂಧ್ರ ರೋಗವೋ ಅಥವಾ ಕಾಯಿಕೊರಕ ಹುಳುವೋ ಎಂದು ತಿಳಿಯಲಿಲ್ಲ.',
        narrative: 'ಹಾವೇರಿಯ ತಮ್ಮ ೪ ಎಕರೆ ಜಮೀನಿನಲ್ಲಿ ಎಲೆ ಮುದುರುವ ರೋಗ ಕಾಣಿಸಿಕೊಂಡಾಗ, ಬಸವರಾಜ್ ಅವರು ಕೃಷಿ ಅಧಿಕಾರಿಯ ಭೇಟಿಗಾಗಿ ಆರು ದಿನಗಳ ಕಾಲ ಕಾಯಬೇಕಾಯಿತು. ತಕ್ಷಣದ ಎಐ ರೋಗ ಪತ್ತೆ ಇಲ್ಲದೆ, ಅವರು ಸಾಮಾನ್ಯ ಕೀಟನಾಶಕ ಸಿಂಪಡಿಸಿದರು, ಇದರಿಂದ ಯಾವುದೇ ಪ್ರಯೋಜನವಾಗಲಿಲ್ಲ. ಧಾರವಾಡದಿಂದ ಪರೀಕ್ಷಾ ವರದಿ ಬರುವಷ್ಟರಲ್ಲಿ ೭೦% ಬೆಳೆ ಹಾನಿಗೊಳಗಾಗಿತ್ತು.',
        crisisImpact: 'ಒಂದೇ ಋತುವಿನಲ್ಲಿ ₹೧.೬೫ ಲಕ್ಷ ನಷ್ಟ ಅನುಭವಿಸಿದರು, ಮುಂದಿನ ಬೆಳೆಗೆ ಬೀಜ ಖರೀದಿಸಲು ಕುಟುಂಬದ ಚಿನ್ನಾಭರಣವನ್ನು ೩೬% ಬಡ್ಡಿಗೆ ಗಿರವಿ ಇಡಬೇಕಾಯಿತು.',
        karnatakaStatistic: {
            value: '೪೨.೮%',
            label: 'ರೋಗ ಪತ್ತೆ ವಿಳಂಬದಿಂದಾಗಿ ಉತ್ತರ ಕರ್ನಾಟಕದ ಹತ್ತಿ ಬೆಳೆಗಾರರು ನಷ್ಟ ಅನುಭವಿಸಿದ್ದಾರೆ'
        },
        imageSrc: '/story-disease.jpg',
        imageAlt: 'ರೋಗಗ್ರಸ್ತ ಹತ್ತಿ ಎಲೆ ಪರಿಶೀಲಿಸುತ್ತಿರುವ ರೈತ'
    },
    {
        id: 'kolar-tomatoes',
        index: '02',
        location: 'ಕೋಲಾರ ಎಪಿಎಂಸಿ ಮಾರುಕಟ್ಟೆ, ದಕ್ಷಿಣ ಕರ್ನಾಟಕ',
        crop: 'ಟೊಮ್ಯಾಟೊ ಮತ್ತು ತರಕಾರಿಗಳು',
        farmer: 'ನಿಂಗಪ್ಪ ಗೌಡ (೨.೫ ಎಕರೆ)',
        headline: 'ಮಾರುಕಟ್ಟೆಯಲ್ಲಿ ಕೆಜಿಗೆ ₹೩.೫೦ ಕ್ಕೆ ಮಾರಾಟ, ಬೆಂಗಳೂರಿನಲ್ಲಿ ಕೆಜಿಗೆ ₹೪೮ ಕ್ಕೆ ಮಾರಾಟ',
        quote: '೯೦ ದಿನಗಳ ಕಠಿಣ ಪರಿಶ್ರಮದ ನಂತರ, ಕಮಿಷನ್ ಏಜೆಂಟ್‌ಗೆ ಮತ್ತು ಲಾರಿಯವರಿಗೆ ಕೊಟ್ಟ ದುಡ್ಡು ನನ್ನ ಮನೆಗೆ ತೆಗೆದುಕೊಂಡು ಹೋದ ದುಡ್ಡಿಗಿಂತ ಹೆಚ್ಚಾಗಿತ್ತು.',
        narrative: 'ನಿಂಗಪ್ಪ ಮುಂಜಾನೆ ೪ ಗಂಟೆಗೆ ೧೪೦ ಕ್ರೇಟ್ ತಾಜಾ ಟೊಮ್ಯಾಟೊವನ್ನು ಕೋಲಾರ ಮಾರುಕಟ್ಟೆಗೆ ತಂದರು. ಕಮಿಷನ್ ಏಜೆಂಟರು ದಿಢೀರ್ ಬೆಲೆ ಕುಸಿತ ಎಂದು ಘೋಷಿಸಿ ಕೆಜಿಗೆ ₹೩.೫೦ ದರ ನಿಗದಿಪಡಿಸಿದರು. ಶೀತಲೀಕರಣ ಗೋದಾಮು ಇಲ್ಲದ ಕಾರಣ ಅನಿವಾರ್ಯವಾಗಿ ಮಾರಾಟ ಮಾಡಬೇಕಾಯಿತು. ಆದರೆ ಅದೇ ಸಮಯದಲ್ಲಿ ಬೆಂಗಳೂರಿನಲ್ಲಿ ಅದೇ ದರ್ಜೆಯ ಟೊಮ್ಯಾಟೊ ಕೆಜಿಗೆ ₹೪೮ ರಿಂದ ₹೫೫ ಕ್ಕೆ ಮಾರಾಟವಾಗುತ್ತಿತ್ತು.',
        crisisImpact: 'ಕಮಿಷನ್ ಕಡಿತ, ತೂಕದ ಕಡಿತ ಮತ್ತು ಸಾರಿಗೆ ವೆಚ್ಚದ ನಂತರ, ನಿಂಗಪ್ಪ ಅವರಿಗೆ ಆ ದಿನದ ವ್ಯಾಪಾರದಲ್ಲಿ ₹೪,೨೦೦ ನಿವ್ವಳ ನಷ್ಟವಾಯಿತು.',
        karnatakaStatistic: {
            value: '೮೪%',
            label: 'ಕರ್ನಾಟಕದ ಸಣ್ಣ ರೈತರ ಆದಾಯವನ್ನು ಮಧ್ಯವರ್ತಿಗಳ ಜಾಲವೇ ಕಬಳಿಸುತ್ತಿದೆ'
        },
        imageSrc: '/story-mandi.jpg',
        imageAlt: 'ಮಾರುಕಟ್ಟೆಯಲ್ಲಿ ಸಂಗ್ರಹಿಸಲಾದ ತರಕಾರಿ ಮೂಟೆಗಳು'
    },
    {
        id: 'mandya-sugarcane',
        index: '03',
        location: 'ಮಂಡ್ಯ ಮತ್ತು ಕಾವೇರಿ ಕಣಿವೆ',
        crop: 'ಕಬ್ಬು ಮತ್ತು ಭತ್ತ',
        farmer: 'ಶಾಂತಮ್ಮ ಮತ್ತು ರಮೇಶ್ (೩ ಎಕರೆ)',
        headline: 'ರಸಗೊಬ್ಬರದ ವೆಚ್ಚ ಹೆಚ್ಚಾದರೂ ಇಳುವರಿ ಕುಸಿತ: ಲವಣಾಂಶದ ವಿಷವರ್ತುಲ',
        quote: 'ನಮ್ಮ ಕೊಳವೆಬಾವಿ ೩೦೦ ಅಡಿಯಿಂದ ೮೫೦ ಅಡಿಗೆ ಹೋಯಿತು, ನೀರು ಉಪ್ಪಾಯಿತು. ಮಣ್ಣು ಸಿಮೆಂಟ್‌ನಂತಾಗಿದೆ.',
        narrative: 'ಮಣ್ಣಿನ ಸೂಕ್ಷ್ಮ ಪೋಷಕಾಂಶ ಪರೀಕ್ಷೆ ಇಲ್ಲದೆ ವರ್ಷಗಳಿಂದ ಕೇವಲ ಯೂರಿಯಾ ಗೊಬ್ಬರ ಹಾಕಿದ್ದರಿಂದ ಶಾಂತಮ್ಮ ಅವರ ೩ ಎಕರೆ ಜಮೀನಿನಲ್ಲಿ ಸತು, ಬೋರಾನ್ ಮತ್ತು ಸಾವಯವ ಇಂಗಾಲದ ಕೊರತೆಯುಂಟಾಯಿತು. ಮಳೆ ತಡವಾದಾಗ, ಆಳವಾದ ಬೋರ್‌ವೆಲ್ ನೀರು ಮಣ್ಣಿನ ಸವಳುತನವನ್ನು ಹೆಚ್ಚಿಸಿತು. ಬೆಳವಣಿಗೆಗಾಗಿ ₹೨೮,೦೦೦ ಹೆಚ್ಚುವರಿ ರಸಗೊಬ್ಬರ ಹಾಕಿದರೂ ಕಬ್ಬಿನ ಇಳುವರಿ ಎಕರೆಗೆ ೪೪ ಟನ್‌ನಿಂದ ೨೧ ಟನ್‌ಗೆ ಕುಸಿಯಿತು.',
        crisisImpact: 'ಹೆಚ್ಚುತ್ತಿರುವ ಖರ್ಚು ಮತ್ತು ೫೦% ಇಳುವರಿ ಕುಸಿತವು ಸಾಲದ ಹೊರೆ ಮತ್ತು ತೀವ್ರ ಆರ್ಥಿಕ ಸಂಕಷ್ಟವನ್ನು ಸೃಷ್ಟಿಸಿತು.',
        karnatakaStatistic: {
            value: '೩.೪ ದಶಲಕ್ಷ ಹೆಕ್ಟೇರ್',
            label: 'ಕರ್ನಾಟಕದ ಕೃಷಿ ಭೂಮಿಯಲ್ಲಿ ಮಣ್ಣಿನ ಪ್ರಮುಖ ಪೋಷಕಾಂಶಗಳ ತೀವ್ರ ಕೊರತೆಯಿದೆ'
        },
        imageSrc: '/story-soil.jpg',
        imageAlt: 'ಒಣಗಿದ ಮಣ್ಣನ್ನು ಹಿಡಿದಿರುವ ರೈತರ ಕೈಗಳು'
    }
];

export const FarmerStorySection: React.FC<{ onEnterApp: () => void }> = ({ onEnterApp }) => {
    const { landingTexts: t, isKannada } = useLanguage();
    const stories = isKannada ? storiesKn : storiesEn;

    return (
        <section className="bg-black text-white py-28 border-t border-neutral-900 relative z-20">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                
                {/* Section Header */}
                <div className="text-center max-w-3xl mx-auto mb-28">
                    <span className="inline-block font-mono text-[11px] uppercase tracking-[0.3em] text-neutral-400 mb-4 border border-neutral-800 px-4 py-1.5 rounded-full bg-neutral-950">
                        {t.storyBadge}
                    </span>
                    <h2 className="text-3xl sm:text-5xl font-black uppercase tracking-tight text-white mb-6">
                        {t.storyTitle}
                    </h2>
                    <p className="text-neutral-400 text-sm sm:text-base leading-relaxed">
                        {t.storySubtitle}
                    </p>
                </div>

                {/* Alternating Personal Stories (Zig-Zag) */}
                <div className="space-y-36">
                    {stories.map((story, idx) => {
                        const isEven = idx % 2 === 1;

                        return (
                            <div
                                key={story.id}
                                className={`flex flex-col ${isEven ? 'lg:flex-row-reverse' : 'lg:flex-row'} items-center gap-12 lg:gap-16`}
                            >
                                {/* Personal Narrative Column */}
                                <div className="w-full lg:w-1/2 flex flex-col items-start">
                                    {/* Location & Farmer Tag */}
                                    <div className="flex flex-wrap items-center gap-2.5 mb-4">
                                        <span className="font-mono text-xs font-bold px-2.5 py-1 bg-neutral-900 border border-neutral-800 rounded text-white">
                                            {t.casePrefix}{story.index}
                                        </span>
                                        <span className="font-mono text-xs uppercase tracking-wider text-neutral-300">
                                            {story.location}
                                        </span>
                                    </div>

                                    <div className="text-xs font-mono uppercase tracking-widest text-neutral-400 mb-2">
                                        {t.farmerLabel}: <span className="text-white font-semibold">{story.farmer}</span> • {t.cropLabel}: <span className="text-neutral-300">{story.crop}</span>
                                    </div>

                                    <h3 className="text-2xl sm:text-3xl font-extrabold uppercase tracking-tight text-white mb-4 leading-snug">
                                        {story.headline}
                                    </h3>

                                    {/* Personal Quote */}
                                    <div className="bg-neutral-950 border-l-2 border-white pl-4 pr-3 py-3 my-2 rounded-r-xl">
                                        <p className="text-sm font-medium text-neutral-200 italic">
                                            "{story.quote}"
                                        </p>
                                    </div>

                                    {/* Detailed Ground Story */}
                                    <div className="mt-4 space-y-3.5 text-xs sm:text-sm text-neutral-400 leading-relaxed">
                                        <p>{story.narrative}</p>
                                        <div className="pt-2">
                                            <strong className="text-white uppercase font-mono text-[11px] tracking-wider block mb-1">
                                                {t.impactLabel}
                                            </strong>
                                            <p className="text-neutral-300 bg-neutral-950/80 p-3 rounded-lg border border-neutral-800/80">
                                                {story.crisisImpact}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Karnataka State Metric */}
                                    <div className="mt-6 pt-4 border-t border-neutral-900 w-full flex items-center justify-between bg-neutral-950 border border-neutral-900 px-5 py-3.5 rounded-xl">
                                        <div>
                                            <span className="text-2xl font-black font-mono text-white block">{story.karnatakaStatistic.value}</span>
                                            <span className="text-[11px] font-mono uppercase tracking-wider text-neutral-400">{story.karnatakaStatistic.label}</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Image Column with Smooth Faded Tone */}
                                <div className="w-full lg:w-1/2 relative">
                                    <div className="relative rounded-2xl overflow-hidden border border-neutral-800 bg-neutral-950 shadow-2xl group">
                                        <img
                                            src={story.imageSrc}
                                            alt={story.imageAlt}
                                            className="w-full h-[400px] sm:h-[490px] object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                                            loading="lazy"
                                        />
                                        
                                        {/* Smooth Faded Monochrome Gradients */}
                                        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-transparent opacity-80" />
                                        <div className="absolute inset-0 bg-gradient-to-r from-black/40 via-transparent to-black/40" />

                                        {/* Overlay Meta */}
                                        <div className="absolute bottom-6 left-6 right-6 flex justify-between items-end">
                                            <div className="bg-black/90 backdrop-blur-md px-3.5 py-1.5 rounded-lg border border-white/10 text-[10px] font-mono uppercase tracking-widest text-white">
                                                {story.crop}
                                            </div>
                                            <div className="text-neutral-400 font-mono text-xs">
                                                {t.fieldLog} #{story.index}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>

            </div>
        </section>
    );
};

export default FarmerStorySection;
