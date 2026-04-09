import React from 'react';

const lineColors = ['#f55395', '#4a90e2', '#50e3c2'];
const numLines = 51; // Odd number for a center line

const ListeningAnimation: React.FC = () => {
    return (
        <div className="wave-visualizer">
            {Array.from({ length: numLines }).map((_, i) => {
                const center = Math.floor(numLines / 2);
                const distanceFromCenter = Math.abs(i - center);
                const delay = distanceFromCenter * 0.04; // Ripple from center
                
                return (
                    <div
                        key={i}
                        className="wave-line"
                        style={{
                            backgroundColor: lineColors[i % 3],
                            animationDelay: `${delay}s`,
                        }}
                    />
                );
            })}
        </div>
    );
};

export default ListeningAnimation;