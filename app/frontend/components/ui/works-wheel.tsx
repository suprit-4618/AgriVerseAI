import React, { useState, useRef, useEffect } from 'react';
import { motion, useScroll, useTransform, useSpring, useMotionValueEvent, AnimatePresence } from 'framer-motion';
import { useLanguage } from '../../context/LanguageContext';

export interface WorksWheelItem {
    id: string;
    title: string;
    subtitle?: string;
    imageSrc: string;
    actionKey: 'plant' | 'assistant' | 'soil' | 'weather' | 'market' | 'schemes';
}

interface WorksWheelProps {
    items?: WorksWheelItem[];
    onItemClick?: (actionKey: string) => void;
}

const defaultItemsEn: WorksWheelItem[] = [
    {
        id: 'plant-disease',
        title: 'Plant Disease Detection',
        subtitle: 'Sub-second leaf scan with organic and clinical remedy guides',
        imageSrc: '/story-disease.jpg',
        actionKey: 'plant'
    },
    {
        id: 'bhoomi-ai',
        title: 'Bhoomi AI',
        subtitle: 'Bilingual voice assistant in Kannada and English for farming advisory',
        imageSrc: '/wheel-voice.jpg',
        actionKey: 'assistant'
    },
    {
        id: 'soil-information',
        title: 'Soil Information by Region',
        subtitle: 'Regional soil health analysis, NPK balancing and crop suitability',
        imageSrc: '/story-soil.jpg',
        actionKey: 'soil'
    },
    {
        id: 'weather-report',
        title: 'Weather Report',
        subtitle: 'Hyperlocal microclimate forecasts and unseasonal rain alerts',
        imageSrc: '/wheel-weather.jpg',
        actionKey: 'weather'
    },
    {
        id: 'marketplace',
        title: 'Marketplace (Buy & Sell)',
        subtitle: 'Direct farmer-to-buyer trade with live APMC Mandi price benchmarks',
        imageSrc: '/story-mandi.jpg',
        actionKey: 'market'
    },
    {
        id: 'government-schemes',
        title: 'Government Schemes',
        subtitle: 'PM-KISAN, crop insurance, subsidies, and MSP price guidance',
        imageSrc: '/wheel-schemes.jpg',
        actionKey: 'schemes'
    }
];

const defaultItemsKn: WorksWheelItem[] = [
    {
        id: 'plant-disease',
        title: 'ಸಸ್ಯ ರೋಗ ಪತ್ತೆ',
        subtitle: 'ಎಐ ಎಲೆ ಸ್ಕ್ಯಾನ್ ಮತ್ತು ಸಾವಯವ ಹಾಗೂ ರಾಸಾಯನಿಕ ಚಿಕಿತ್ಸೆ ಪರಿಹಾರ',
        imageSrc: '/story-disease.jpg',
        actionKey: 'plant'
    },
    {
        id: 'bhoomi-ai',
        title: 'ಭೂಮಿ ಧ್ವನಿ ಎಐ',
        subtitle: 'ಕೃಷಿ ಸಲಹೆಗಾಗಿ ಕನ್ನಡ ಮತ್ತು ಇಂಗ್ಲಿಷ್‌ನಲ್ಲಿ ದ್ವಿಭಾಷಾ ಧ್ವನಿ ಸಹಾಯಕ',
        imageSrc: '/wheel-voice.jpg',
        actionKey: 'assistant'
    },
    {
        id: 'soil-information',
        title: 'ಪ್ರಾದೇಶಿಕ ಮಣ್ಣಿನ ಮಾಹಿತಿ',
        subtitle: 'ಮಣ್ಣಿನ ಆರೋಗ್ಯ ವಿಶ್ಲೇಷಣೆ, NPK ಸಮತೋಲನ ಮತ್ತು ಬೆಳೆ ಸೂಕ್ತತೆ',
        imageSrc: '/story-soil.jpg',
        actionKey: 'soil'
    },
    {
        id: 'weather-report',
        title: 'ಹವಾಮಾನ ವರದಿ',
        subtitle: 'ಸ್ಥಳೀಯ ಸೂಕ್ಷ್ಮ ಹವಾಮಾನ ಮುನ್ಸೂಚನೆ ಮತ್ತು ಅಕಾಲಿಕ ಮಳೆ ಎಚ್ಚರಿಕೆ',
        imageSrc: '/wheel-weather.jpg',
        actionKey: 'weather'
    },
    {
        id: 'marketplace',
        title: 'ಮಾರುಕಟ್ಟೆ (ಖರೀದಿ ಮತ್ತು ಮಾರಾಟ)',
        subtitle: 'ರೈತರು-ಖರೀದಿದಾರರ ನೇರ ವ್ಯಾಪಾರ ಮತ್ತು ನೈಜ ಎಪಿಎಂಸಿ ದರಗಳು',
        imageSrc: '/story-mandi.jpg',
        actionKey: 'market'
    },
    {
        id: 'government-schemes',
        title: 'ಸರ್ಕಾರಿ ಯೋಜನೆಗಳು',
        subtitle: 'ಪಿಎಂ-ಕಿಸಾನ್, ಬೆಳೆ ವಿಮೆ, ಸಬ್ಸಿಡಿಗಳು ಮತ್ತು ಎಂಎಸ್‌ಪಿ ಬೆಂಬಲ ಬೆಲೆ',
        imageSrc: '/wheel-schemes.jpg',
        actionKey: 'schemes'
    }
];

// Individual 3D Card that tracks continuous scroll progress
const WheelCard: React.FC<{
    item: WorksWheelItem;
    index: number;
    total: number;
    scrollProgress: any;
    isRingMode: boolean;
    activeIndex: number;
    onSelect: () => void;
}> = ({ item, index, total, scrollProgress, isRingMode, activeIndex, onSelect }) => {
    // Current virtual progress index (0 to total - 1)
    const progressIndex = useTransform(scrollProgress, [0, 1], [0, total - 1]);
    const smoothProgress = useSpring(progressIndex, { stiffness: 120, damping: 20, mass: 0.2 });

    // Continuous 3D transforms driven by scroll position
    const translateY = useTransform(smoothProgress, (p: number) => {
        const offset = index - p;
        return offset * 185;
    });

    const rotateX = useTransform(smoothProgress, (p: number) => {
        const offset = index - p;
        return -offset * 48; // Degrees tilt
    });

    const translateZ = useTransform(smoothProgress, (p: number) => {
        const offset = index - p;
        const dist = Math.abs(offset);
        return dist < 0.3 ? 30 : -dist * 140;
    });

    const opacity = useTransform(smoothProgress, (p: number) => {
        const offset = index - p;
        const dist = Math.abs(offset);
        if (dist > 1.8) return 0;
        return Math.max(0.15, 1 - dist * 0.45);
    });

    const scale = useTransform(smoothProgress, (p: number) => {
        const offset = index - p;
        const dist = Math.abs(offset);
        return Math.max(0.85, 1 - dist * 0.1);
    });

    // Ring Mode Circular Calculations
    const ringAngle = (index / total) * Math.PI * 2;
    const ringRadius = 260; // Radius in px
    const ringX = Math.cos(ringAngle) * ringRadius;
    const ringY = Math.sin(ringAngle) * ringRadius;

    if (isRingMode) {
        return (
            <motion.div
                onClick={onSelect}
                className="absolute w-[180px] sm:w-[220px] h-[110px] sm:h-[135px] rounded-xl overflow-hidden border border-neutral-800 bg-neutral-950 cursor-pointer shadow-2xl transition-all duration-500 hover:scale-110 hover:border-white"
                style={{
                    x: ringX,
                    y: ringY,
                    zIndex: 20
                }}
            >
                <img
                    src={item.imageSrc}
                    alt={item.title}
                    className="w-full h-full object-cover opacity-60 hover:opacity-100 transition-opacity"
                    loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/20" />
                <div className="absolute bottom-2 left-2.5 right-2.5 text-xs font-mono font-bold text-white uppercase tracking-wider truncate">
                    {item.title}
                </div>
            </motion.div>
        );
    }

    return (
        <motion.div
            onClick={onSelect}
            className="absolute w-[300px] sm:w-[440px] lg:w-[500px] h-[190px] sm:h-[270px] lg:h-[300px] rounded-2xl overflow-hidden border border-neutral-800 bg-neutral-950 shadow-2xl cursor-pointer will-change-transform"
            style={{
                translateY,
                rotateX,
                translateZ,
                opacity,
                scale,
                transformStyle: 'preserve-3d',
                backfaceVisibility: 'hidden'
            }}
        >
            <img
                src={item.imageSrc}
                alt={item.title}
                className="w-full h-full object-cover"
                loading="eager"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/30" />
            
            <div className="absolute bottom-3 left-4 right-4 flex justify-between items-center text-xs font-mono">
                <span className="text-white/90 font-medium tracking-wide">
                    {item.title}
                </span>
                <span className="text-neutral-400 text-[10px]">
                    #{String(index + 1).padStart(2, '0')}
                </span>
            </div>
        </motion.div>
    );
};

export const WorksWheel: React.FC<WorksWheelProps> = ({ 
    items: propItems, 
    onItemClick 
}) => {
    const { isKannada } = useLanguage();
    const items = propItems || (isKannada ? defaultItemsKn : defaultItemsEn);

    const [activeIndex, setActiveIndex] = useState<number>(0);
    const [isRingMode, setIsRingMode] = useState<boolean>(false);
    const containerRef = useRef<HTMLDivElement | null>(null);

    const total = items.length;

    // Hook standard page scroll to wheel progress
    const { scrollYProgress } = useScroll({
        target: containerRef,
        offset: ["start start", "end end"]
    });

    // Listen to scroll progress and update active index dynamically
    useMotionValueEvent(scrollYProgress, "change", (latest) => {
        const rawIndex = latest * (total - 1);
        const currentIndex = Math.min(Math.max(Math.round(rawIndex), 0), total - 1);
        if (currentIndex !== activeIndex) {
            setActiveIndex(currentIndex);
        }
    });

    // Scroll directly to a specific item when clicked from directory
    const scrollToItem = (index: number) => {
        if (!containerRef.current) return;
        const rect = containerRef.current.getBoundingClientRect();
        const scrollTop = window.scrollY || document.documentElement.scrollTop;
        const containerStart = rect.top + scrollTop;
        const totalScrollableHeight = containerRef.current.clientHeight - window.innerHeight;
        
        const targetProgress = index / (total - 1);
        const targetScroll = containerStart + targetProgress * totalScrollableHeight;

        window.scrollTo({
            top: targetScroll,
            behavior: 'smooth'
        });
        setActiveIndex(index);
    };

    const activeItem = items[activeIndex] || items[0];

    return (
        /* Outer tall scroll track to enable natural page scroll-driven rotation */
        <div 
            ref={containerRef}
            className="relative w-full h-[360vh] bg-black"
        >
            {/* Sticky 100vh Viewport pinned in place while user scrolls through the track */}
            <div className="sticky top-0 h-screen w-full bg-black text-white flex flex-col justify-between p-6 sm:p-10 lg:p-14 border-t border-neutral-900 select-none overflow-hidden">
                
                {/* Top-Left: Section Master Headline */}
                <div className="absolute top-20 sm:top-24 left-6 sm:left-12 lg:left-16 z-40 flex flex-col items-start font-mono">
                    <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black uppercase tracking-tight text-white font-sans">
                        {isKannada ? "ನಮ್ಮ ವೈಶಿಷ್ಟ್ಯಗಳು" : "Our Features"}
                    </h2>
                </div>

                {/* Top-Right: Clean Minimalist Vertical Directory */}
                <div className="absolute top-20 sm:top-24 right-6 sm:right-12 z-40 flex flex-col items-end space-y-1 font-sans">
                    {items.map((item, idx) => {
                        const isActive = idx === activeIndex;
                        return (
                            <button
                                key={item.id}
                                onClick={() => scrollToItem(idx)}
                                className={`text-[11px] sm:text-[12px] tracking-wide transition-colors py-0.5 text-right font-sans ${
                                    isActive 
                                        ? 'text-white font-semibold' 
                                        : 'text-neutral-500 hover:text-neutral-300'
                                }`}
                            >
                                {item.title}
                            </button>
                        );
                    })}
                </div>

                {/* Main Interactive Stage */}
                <div className="w-full flex-grow flex items-center justify-center relative z-10 my-auto min-h-[560px]">
                    
                    {/* Left Side: Large Active Item Name & Subtitle */}
                    {!isRingMode && (
                        <div className="absolute left-4 sm:left-12 lg:left-16 z-30 max-w-sm pointer-events-none mt-16">
                            <AnimatePresence mode="wait">
                                <motion.div
                                    key={activeItem.id}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -10 }}
                                    transition={{ duration: 0.2, ease: 'easeOut' }}
                                    className="space-y-2"
                                >
                                    <h3 className="text-3xl sm:text-5xl lg:text-6xl font-normal tracking-tight text-white leading-tight">
                                        {activeItem.title}
                                    </h3>
                                    {activeItem.subtitle && (
                                        <p className="text-xs text-neutral-400 font-mono max-w-xs leading-relaxed">
                                            {activeItem.subtitle}
                                        </p>
                                    )}
                                </motion.div>
                            </AnimatePresence>
                        </div>
                    )}

                    {/* Center 3D Revolving Stage */}
                    <div className="w-full flex items-center justify-center relative">
                        {!isRingMode ? (
                            /* 3D Vertical Cylinder Drum */
                            <div 
                                className="relative w-[340px] sm:w-[500px] lg:w-[580px] h-[340px] flex items-center justify-center"
                                style={{ 
                                    perspective: '1000px', 
                                    transformStyle: 'preserve-3d' 
                                }}
                            >
                                {items.map((item, idx) => (
                                    <WheelCard
                                        key={item.id}
                                        item={item}
                                        index={idx}
                                        total={total}
                                        scrollProgress={scrollYProgress}
                                        isRingMode={false}
                                        activeIndex={activeIndex}
                                        onSelect={() => {
                                            scrollToItem(idx);
                                        }}
                                    />
                                ))}
                            </div>
                        ) : (
                            /* 3D Circular Orbit Ring Overview */
                            <div 
                                className="relative w-[480px] sm:w-[560px] h-[480px] sm:h-[560px] flex items-center justify-center"
                                style={{ 
                                    perspective: '1200px', 
                                    transformStyle: 'preserve-3d' 
                                }}
                            >
                                <div className="absolute z-30 text-center font-sans pointer-events-none">
                                    <div className="text-2xl sm:text-3xl font-normal tracking-wide text-white">
                                        Works '26
                                    </div>
                                    <div className="text-[10px] font-mono uppercase tracking-[0.25em] text-neutral-400 mt-1">
                                        AgriVerse AI
                                    </div>
                                </div>

                                {items.map((item, idx) => (
                                    <WheelCard
                                        key={item.id}
                                        item={item}
                                        index={idx}
                                        total={total}
                                        scrollProgress={scrollYProgress}
                                        isRingMode={true}
                                        activeIndex={activeIndex}
                                        onSelect={() => {
                                            scrollToItem(idx);
                                            setIsRingMode(false);
                                        }}
                                    />
                                ))}
                            </div>
                        )}
                    </div>

                </div>

            </div>
        </div>
    );
};

export default WorksWheel;
