import React from 'react';
import { motion } from 'framer-motion';
import { LeafIcon } from './IconComponents';

const FloatingLeaves: React.FC = () => {
    const leaves = Array.from({ length: 15 }).map((_, i) => {
        const size = Math.random() * 20 + 10; // 10px to 30px
        const duration = Math.random() * 15 + 10; // 10s to 25s
        const delay = Math.random() * 10;
        const initialX = Math.random() * 100;
        const initialY = Math.random() * 100;
        const finalY = initialY > 50 ? initialY - 70 - Math.random() * 30 : initialY + 70 + Math.random() * 30;

        return {
            id: i,
            size,
            duration,
            delay,
            initialX,
            initialY,
            finalY,
            rotate: Math.random() * 360,
        };
    });

    return (
        <div className="absolute inset-0 w-full h-full overflow-hidden pointer-events-none">
            {leaves.map(leaf => (
                <motion.div
                    key={leaf.id}
                    className="absolute text-green-400/20"
                    style={{
                        width: leaf.size,
                        height: leaf.size,
                        left: `${leaf.initialX}%`,
                        top: `${leaf.initialY}%`,
                    }}
                    animate={{
                        y: [`${leaf.initialY > 50 ? 0 : 0}%`, `${leaf.finalY - leaf.initialY}%`],
                        x: [0, Math.random() * 60 - 30],
                        rotate: [leaf.rotate, leaf.rotate + Math.random() * 180 - 90],
                    }}
                    transition={{
                        duration: leaf.duration,
                        delay: leaf.delay,
                        repeat: Infinity,
                        repeatType: 'reverse',
                        ease: 'easeInOut',
                    }}
                >
                    <LeafIcon className="w-full h-full" />
                </motion.div>
            ))}
        </div>
    );
};

export default FloatingLeaves;
