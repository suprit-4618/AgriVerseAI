import React from 'react';

const StaticLogo: React.FC = () => {
    return (
        <div className="flex items-center cursor-pointer select-none">
            <span className="text-lg sm:text-xl font-black uppercase tracking-[0.22em] text-white font-mono">
                AgriVerse<span className="text-neutral-400 font-normal ml-0.5">AI</span>
            </span>
        </div>
    );
};

export default StaticLogo;
