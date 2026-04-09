
import React, { useEffect, useRef } from 'react';

// anime.js is loaded from a script tag in index.html, so we declare it here.
declare const anime: any;

const AnimatedLogo: React.FC = () => {
    const logoRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!logoRef.current || typeof anime === 'undefined') {
            return;
        }

        const orbit1 = logoRef.current.querySelector('.orbit-1');
        const orbit2 = logoRef.current.querySelector('.orbit-2');
        const leaf = logoRef.current.querySelector('.leaf');
        const glow = logoRef.current.querySelector('.glow');
        const textWrapper = logoRef.current.querySelector('.text-wrapper');

        // Prepare text for animation
        if (textWrapper) {
            textWrapper.innerHTML = (textWrapper.textContent ?? '').replace(/\S/g, "<span class='letter' style='display:inline-block; opacity:0;'>$&</span>");
        }
        
        const letters = logoRef.current.querySelectorAll('.letter');

        // Reset initial states
        anime.set([orbit1, orbit2, leaf, glow, letters], { opacity: 0 });
        anime.set([leaf], { scale: 0.8 });
        anime.set([glow], { scale: 0 });


        const tl = anime.timeline({
            easing: 'easeInOutSine',
            duration: 1000
        });

        tl
        .add({
            targets: [orbit1, orbit2],
            strokeDashoffset: [anime.setDashoffset, 0],
            opacity: [0, 1],
            duration: 1200,
            delay: anime.stagger(200)
        })
        .add({
            targets: leaf,
            opacity: 1,
            scale: 1,
            duration: 800,
            easing: 'easeOutElastic(1, .6)'
        }, '-=800')
        .add({
            targets: glow,
            scale: [0, 1.2],
            opacity: [1, 0],
            duration: 1000,
            easing: 'easeOutExpo'
        }, '-=600')
        .add({
            targets: letters,
            opacity: [0, 1],
            translateX: [-10, 0],
            duration: 500,
            delay: anime.stagger(50),
            easing: 'easeOutQuad'
        }, '-=1200');

    }, []);

    return (
        <div ref={logoRef} className="flex items-center">
            <svg
                width="44"
                height="44"
                viewBox="0 0 44 44"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
            >
                <defs>
                    <radialGradient id="leafGlow" cx="50%" cy="50%" r="50%" fx="50%" fy="50%">
                        <stop offset="0%" stopColor="#a7f3d0" stopOpacity="0.8" />
                        <stop offset="100%" stopColor="#34d399" stopOpacity="0" />
                    </radialGradient>
                </defs>
                
                {/* Orbits */}
                <ellipse className="orbit-1" cx="22" cy="22" rx="20" ry="8" stroke="white" strokeWidth="1.5" transform="rotate(-30 22 22)" />
                <ellipse className="orbit-2" cx="22" cy="22" rx="20" ry="12" stroke="rgba(255,255,255,0.5)" strokeWidth="1" transform="rotate(20 22 22)" />
                
                {/* Glow Effect */}
                <circle className="glow" cx="22" cy="22" r="10" fill="url(#leafGlow)" />

                {/* Leaf Icon */}
                <path
                    className="leaf"
                    d="M22 14C24.3867 17.2267 27.6 22.0533 28 24C28.4 25.9467 26.6667 28.7333 24.5 29.5C22.3333 30.2667 19.6 28.5 19 26C18.4 23.5 20 18 22 14Z"
                    fill="#34d399"
                />
            </svg>
             <div className="ml-2">
                <span className="text-wrapper text-3xl font-bold tracking-wider text-white">
                    AgriVerse<span style={{ color: '#34d399' }}>AI</span>
                </span>
            </div>
        </div>
    );
};

export default AnimatedLogo;
