
import React from 'react';

const StaticLogo: React.FC = () => {
    return (
        <div className="flex items-center">
            <svg
                width="44"
                height="44"
                viewBox="0 0 44 44"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
            >
                {/* Orbits */}
                <ellipse cx="22" cy="22" rx="20" ry="8" stroke="white" strokeWidth="1.5" transform="rotate(-30 22 22)" />
                <ellipse cx="22" cy="22" rx="20" ry="12" stroke="rgba(255,255,255,0.5)" strokeWidth="1" transform="rotate(20 22 22)" />
                
                {/* Leaf Icon */}
                <path
                    d="M22 14C24.3867 17.2267 27.6 22.0533 28 24C28.4 25.9467 26.6667 28.7333 24.5 29.5C22.3333 30.2667 19.6 28.5 19 26C18.4 23.5 20 18 22 14Z"
                    fill="#34d399"
                />
            </svg>
             <div className="ml-2">
                <span className="text-3xl font-bold tracking-wider text-white">
                    AgriVerse<span style={{ color: '#34d399' }}>AI</span>
                </span>
            </div>
        </div>
    );
};

export default StaticLogo;
